/**
 * 还款处理服务
 * 
 * 负责：
 * - 还款创建
 * - 还款金额分配 (罚息→费用→利息→本金)
 * - 多渠道支持 (银行/PromptPay/便利店/电子钱包)
 * - 还款确认
 * - 额度恢复
 */

import { db } from '../db';
import { getRepaymentSchedule, updateScheduleStatus } from './repayment-schedule.service';

export type RepaymentChannelType = 
  | 'bank_transfer'
  | 'promptpay'
  | 'convenience_store'
  | 'e_wallet'
  | 'atm';

export interface RepaymentChannel {
  id: string;
  name: { en: string; th: string };
  type: RepaymentChannelType;
  config: {
    bankCode?: string;
    accountNumber?: string;
    promptPayId?: string;
    storeCode?: string;
  };
  fees: {
    fixed?: number;
    percentage?: number;
    payer: 'user' | 'platform';
  };
  limits: {
    minAmount: number;
    maxAmount: number;
    dailyLimit?: number;
  };
  settlementTime: 'instant' | 'within_2h' | 'next_day';
  status: 'active' | 'inactive' | 'maintenance';
}

export interface Repayment {
  id: string;
  user_id: string;
  loan_id: string;
  schedule_id: string | null;
  amount: number;
  principal_paid: number;
  interest_paid: number;
  penalty_paid: number;
  fee_paid: number;
  payment_method: RepaymentChannelType;
  payment_channel_id: string;
  transaction_ref: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
}

export interface RepaymentAllocation {
  type: 'penalty' | 'fee' | 'interest' | 'principal';
  amount: number;
  originalAmount: number;
}

export interface CreateRepaymentRequest {
  loan_id: string;
  amount: number;
  payment_method: RepaymentChannelType;
  payment_channel_id: string;
  transaction_ref?: string;
}

/**
 * 还款金额分配顺序
 */
const ALLOCATION_ORDER: Array<'penalty' | 'fee' | 'interest' | 'principal'> = [
  'penalty',
  'fee',
  'interest',
  'principal',
];

/**
 * 分配还款金额
 * @param amount 还款金额
 * @param dueItems 应还项目列表
 * @returns 分配结果
 */
export function allocateRepayment(
  amount: number,
  dueItems: Array<{ type: string; amount: number }>
): RepaymentAllocation[] {
  const allocations: RepaymentAllocation[] = [];
  let remaining = amount;

  // 按照分配顺序处理
  for (const orderType of ALLOCATION_ORDER) {
    if (remaining <= 0) break;

    const item = dueItems.find((i) => i.type === orderType);
    if (!item || item.amount <= 0) continue;

    const allocated = Math.min(remaining, item.amount);
    allocations.push({
      type: orderType,
      amount: allocated,
      originalAmount: item.amount,
    });

    remaining -= allocated;
  }

  return allocations;
}

/**
 * 创建还款记录
 * @param request 还款请求
 * @returns 还款记录
 */
export async function createRepayment(
  request: CreateRepaymentRequest & { user_id: string }
): Promise<Repayment> {
  const id = crypto.randomUUID();
  const transactionRef = request.transaction_ref || `TXN${Date.now()}${crypto.randomUUID().substring(0, 8)}`;

  // 获取借款信息
  const loan = await db.get(`SELECT * FROM loans WHERE id = ?`, [request.loan_id]) as any;
  if (!loan) {
    throw new Error('Loan not found');
  }

  // 获取还款计划
  const schedules = await getRepaymentSchedule(request.loan_id);
  const pendingSchedules = schedules.filter((s) => s.status !== 'paid');

  // 计算应还项目
  const dueItems = [
    { type: 'penalty', amount: loan.penalty_amount || 0 },
    { type: 'fee', amount: 0 }, // TODO: 从费用表获取
    { type: 'interest', amount: calculateTotalInterest(schedules) },
    { type: 'principal', amount: calculateRemainingPrincipal(schedules) },
  ];

  // 分配还款金额
  const allocations = allocateRepayment(request.amount, dueItems);

  // 创建还款记录
  const allocationMap = Object.fromEntries(allocations.map((a) => [a.type, a.amount]));

  await db.run(`
    INSERT INTO repayments (
      id, user_id, loan_id, schedule_id, amount,
      principal_paid, interest_paid, penalty_paid, fee_paid,
      payment_method, payment_channel_id, transaction_ref,
      status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', CURRENT_TIMESTAMP)
  `, [
    id,
    request.user_id,
    request.loan_id,
    pendingSchedules[0]?.id || null,
    request.amount,
    allocationMap['principal'] || 0,
    allocationMap['interest'] || 0,
    allocationMap['penalty'] || 0,
    allocationMap['fee'] || 0,
    request.payment_method,
    request.payment_channel_id,
    transactionRef,
  ]);

  return {
    id,
    user_id: request.user_id,
    loan_id: request.loan_id,
    schedule_id: pendingSchedules[0]?.id || null,
    amount: request.amount,
    principal_paid: allocationMap['principal'] || 0,
    interest_paid: allocationMap['interest'] || 0,
    penalty_paid: allocationMap['penalty'] || 0,
    fee_paid: allocationMap['fee'] || 0,
    payment_method: request.payment_method,
    payment_channel_id: request.payment_channel_id,
    transaction_ref: transactionRef,
    status: 'processing',
    created_at: new Date().toISOString(),
    completed_at: null,
  };
}

/**
 * 确认还款
 * @param repaymentId 还款 ID
 */
export async function confirmRepayment(repaymentId: string): Promise<void> {
  const repayment = await db.get(`SELECT * FROM repayments WHERE id = ?`, [repaymentId]) as any;
  if (!repayment) {
    throw new Error('Repayment not found');
  }

  // 更新还款状态
  await db.run(`
    UPDATE repayments
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [repaymentId]);

  // 更新借款状态
  await db.run(`
    UPDATE loans
    SET paid_amount = paid_amount + ?,
        remaining_amount = remaining_amount - ?,
        penalty_amount = penalty_amount - ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    repayment.amount,
    repayment.amount,
    repayment.penalty_paid,
    repayment.loan_id,
  ]);

  // 更新还款计划状态
  const schedule = await db.get(
    `SELECT * FROM repayment_schedules WHERE id = ?`,
    [repayment.schedule_id]
  ) as any;

  if (schedule) {
    const newPaidTotal = schedule.paid_total + repayment.amount;
    const newStatus = newPaidTotal >= schedule.total_amount ? 'paid' : 'partial';

    await updateScheduleStatus(repayment.schedule_id!, newStatus, newPaidTotal);
  }

  // 如果借款已结清，更新借款状态
  const loan = await db.get(`SELECT * FROM loans WHERE id = ?`, [repayment.loan_id]) as any;
  if (loan && loan.remaining_amount <= 0) {
    await db.run(`
      UPDATE loans
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [repayment.loan_id]);

    // 恢复用户额度
    await restoreCreditLimit(loan.user_id, loan.principal);
  }
}

/**
 * 恢复信用额度
 * @param userId 用户 ID
 * @param amount 恢复金额
 */
export async function restoreCreditLimit(userId: string, amount: number): Promise<void> {
  await db.run(`
    UPDATE credit_limits
    SET available_limit = available_limit + ?,
        used_limit = used_limit - ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `, [amount, amount, userId]);
}

/**
 * 获取可用还款渠道
 * @returns 可用渠道列表
 */
export async function getRepaymentChannels(): Promise<RepaymentChannel[]> {
  const result = await db.all(`
    SELECT * FROM repayment_channels
    WHERE status = 'active'
    ORDER BY type
  `);

  return result.map((row: any) => ({
    ...row,
    config: JSON.parse(row.config || '{}'),
    fees: JSON.parse(row.fee_config || '{}'),
    limits: JSON.parse(row.limits || '{}'),
  }));
}

/**
 * 处理渠道回调
 * @param channelType 渠道类型
 * @param transactionRef 交易参考号
 * @param status 状态
 * @param amount 金额
 */
export async function handleChannelCallback(
  channelType: RepaymentChannelType,
  transactionRef: string,
  status: 'success' | 'failed',
  amount: number
): Promise<void> {
  const repayment = await db.get(
    `SELECT * FROM repayments WHERE transaction_ref = ?`,
    [transactionRef]
  ) as any;

  if (!repayment) {
    throw new Error('Repayment not found');
  }

  if (status === 'success') {
    await confirmRepayment(repayment.id);
  } else {
    await db.run(`
      UPDATE repayments
      SET status = 'failed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [repayment.id]);
  }
}

/**
 * 计算总利息
 */
function calculateTotalInterest(schedules: any[]): number {
  return schedules
    .filter((s) => s.status !== 'paid')
    .reduce((sum, s) => sum + (s.interest_amount - s.paid_interest), 0);
}

/**
 * 计算剩余本金
 */
function calculateRemainingPrincipal(schedules: any[]): number {
  return schedules
    .filter((s) => s.status !== 'paid')
    .reduce((sum, s) => sum + (s.principal_amount - s.paid_principal), 0);
}
