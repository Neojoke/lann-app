/**
 * 逾期管理服务
 * 
 * 负责：
 * - 逾期检测 (每日批处理)
 * - 逾期阶段管理 (1-4 阶段)
 * - 催收动作触发
 * - 状态更新
 */

import { db } from '../db';

export interface OverdueStage {
  days: number;
  stage: number;
  action: string;
  penaltyRate: number;
  label: {
    en: string;
    th: string;
  };
}

export interface OverdueLoan {
  id: string;
  user_id: string;
  principal: number;
  remaining_amount: number;
  due_date: string;
  overdue_days: number;
  overdue_stage: number;
  penalty_amount: number;
  status: string;
}

/**
 * 逾期阶段配置
 */
export const OVERDUE_STAGES: OverdueStage[] = [
  {
    days: 1,
    stage: 1,
    action: 'sms_reminder',
    penaltyRate: 0.005,
    label: {
      en: 'Early Overdue',
      th: 'ค้างชำระเริ่มต้น',
    },
  },
  {
    days: 3,
    stage: 2,
    action: 'phone_call',
    penaltyRate: 0.005,
    label: {
      en: 'Short-term Overdue',
      th: 'ค้างชำระระยะสั้น',
    },
  },
  {
    days: 7,
    stage: 3,
    action: 'third_party_collection',
    penaltyRate: 0.007,
    label: {
      en: 'Medium-term Overdue',
      th: 'ค้างชำระระยะกลาง',
    },
  },
  {
    days: 30,
    stage: 4,
    action: 'legal_action',
    penaltyRate: 0.01,
    label: {
      en: 'Long-term Overdue',
      th: 'ค้างชำระระยะยาว',
    },
  },
];

/**
 * 检测逾期借款
 * 每日批处理使用
 */
export async function detectOverdueLoans(): Promise<OverdueLoan[]> {
  const today = new Date().toISOString().split('T')[0];

  const result = await db.all(`
    SELECT 
      l.id,
      l.user_id,
      l.principal,
      l.remaining_amount,
      l.due_date,
      l.penalty_amount,
      l.status,
      julianday(?) - julianday(l.due_date) as overdue_days
    FROM loans l
    WHERE l.due_date < ?
      AND l.status IN ('active', 'overdue')
      AND l.remaining_amount > 0
  `, [today, today]);

  const overdueLoans: OverdueLoan[] = result.map((row: any) => ({
    ...row,
    overdue_days: Math.floor(row.overdue_days),
    overdue_stage: getOverdueStage(Math.floor(row.overdue_days)),
  }));

  return overdueLoans;
}

/**
 * 获取逾期阶段
 * @param overdueDays 逾期天数
 * @returns 逾期阶段编号
 */
export function getOverdueStage(overdueDays: number): number {
  if (overdueDays >= 30) return 4;
  if (overdueDays >= 7) return 3;
  if (overdueDays >= 3) return 2;
  if (overdueDays >= 1) return 1;
  return 0;
}

/**
 * 获取逾期阶段配置
 * @param overdueDays 逾期天数
 * @returns 逾期阶段配置
 */
export function getOverdueStageConfig(overdueDays: number): OverdueStage {
  const stage = getOverdueStage(overdueDays);
  return OVERDUE_STAGES.find((s) => s.stage === stage) || OVERDUE_STAGES[0];
}

/**
 * 更新借款逾期状态
 * @param loanId 借款 ID
 * @param overdueDays 逾期天数
 */
export async function updateOverdueStatus(loanId: string, overdueDays: number): Promise<void> {
  const stage = getOverdueStage(overdueDays);
  const stageConfig = getOverdueStageConfig(overdueDays);

  await db.run(`
    UPDATE loans
    SET is_overdue = 1,
        overdue_days = ?,
        status = 'overdue',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [overdueDays, loanId]);

  // 触发催收动作
  await triggerCollectionAction(loanId, stageConfig);
}

/**
 * 触发催收动作
 * @param loanId 借款 ID
 * @param stageConfig 逾期阶段配置
 */
async function triggerCollectionAction(
  loanId: string,
  stageConfig: OverdueStage
): Promise<void> {
  const loan = await db.get(`SELECT * FROM loans WHERE id = ?`, [loanId]) as any;
  if (!loan) return;

  const user = await db.get(`SELECT * FROM users WHERE id = ?`, [loan.user_id]) as any;
  if (!user) return;

  // 记录催收动作
  await db.run(`
    INSERT INTO collection_actions (
      id, loan_id, user_id, action_type, stage, status, created_at
    ) VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
  `, [
    crypto.randomUUID(),
    loanId,
    loan.user_id,
    stageConfig.action,
    stageConfig.stage,
  ]);

  // TODO: 根据 action 类型执行具体催收动作
  // - sms_reminder: 发送短信提醒
  // - phone_call: 电话催收
  // - third_party_collection: 委托第三方催收
  // - legal_action: 法律程序

  console.log(`[Collection] Loan ${loanId}: ${stageConfig.action} (Stage ${stageConfig.stage})`);
}

/**
 * 批量处理逾期借款
 * 每日批处理任务
 */
export async function batchProcessOverdueLoans(): Promise<{
  total: number;
  updated: number;
  newOverdue: number;
}> {
  const overdueLoans = await detectOverdueLoans();
  let updated = 0;
  let newOverdue = 0;

  for (const loan of overdueLoans) {
    const previousStage = loan.status === 'overdue' ? loan.overdue_days : 0;
    
    if (previousStage === 0) {
      newOverdue++;
    }

    await updateOverdueStatus(loan.id, loan.overdue_days);
    updated++;
  }

  return {
    total: overdueLoans.length,
    updated,
    newOverdue,
  };
}

/**
 * 获取用户的逾期借款
 * @param userId 用户 ID
 * @returns 逾期借款列表
 */
export async function getUserOverdueLoans(userId: string): Promise<OverdueLoan[]> {
  const today = new Date().toISOString().split('T')[0];

  const result = await db.all(`
    SELECT 
      l.id,
      l.user_id,
      l.principal,
      l.remaining_amount,
      l.due_date,
      l.penalty_amount,
      l.status,
      julianday(?) - julianday(l.due_date) as overdue_days
    FROM loans l
    WHERE l.user_id = ?
      AND l.due_date < ?
      AND l.remaining_amount > 0
  `, [today, userId]);

  return result.map((row: any) => ({
    ...row,
    overdue_days: Math.floor(row.overdue_days),
    overdue_stage: getOverdueStage(Math.floor(row.overdue_days)),
  }));
}

/**
 * 清除逾期状态
 * 当用户还清所有逾期款项后调用
 * @param loanId 借款 ID
 */
export async function clearOverdueStatus(loanId: string): Promise<void> {
  await db.run(`
    UPDATE loans
    SET is_overdue = 0,
        overdue_days = 0,
        penalty_amount = 0,
        status = 'active',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [loanId]);
}

/**
 * 获取逾期统计数据
 * @returns 逾期统计数据
 */
export async function getOverdueStatistics(): Promise<{
  totalOverdue: number;
  byStage: Record<number, number>;
  totalPenalty: number;
}> {
  const today = new Date().toISOString().split('T')[0];

  const result = await db.all(`
    SELECT 
      COUNT(*) as count,
      SUM(penalty_amount) as total_penalty,
      CASE 
        WHEN julianday(?) - julianday(due_date) >= 30 THEN 4
        WHEN julianday(?) - julianday(due_date) >= 7 THEN 3
        WHEN julianday(?) - julianday(due_date) >= 3 THEN 2
        ELSE 1
      END as stage
    FROM loans
    WHERE due_date < ?
      AND status IN ('active', 'overdue')
      AND remaining_amount > 0
    GROUP BY stage
  `, [today, today, today, today]);

  const byStage: Record<number, number> = {};
  let totalPenalty = 0;

  for (const row of result) {
    byStage[row.stage] = row.count;
    totalPenalty += row.total_penalty || 0;
  }

  return {
    totalOverdue: Object.values(byStage).reduce((sum, count) => sum + count, 0),
    byStage,
    totalPenalty,
  };
}
