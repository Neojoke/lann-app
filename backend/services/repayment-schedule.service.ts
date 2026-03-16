/**
 * 还款计划服务
 * 
 * 负责：
 * - 还款计划生成 (一次性/分期)
 * - 每期应还金额计算
 * - 还款日期计算
 * - 还款状态更新
 */

import { db } from '../db';

export interface RepaymentSchedule {
  id: string;
  loan_id: string;
  installment_number: number;
  total_installments: number;
  principal_amount: number;
  interest_amount: number;
  fee_amount: number;
  total_amount: number;
  paid_principal: number;
  paid_interest: number;
  paid_fee: number;
  paid_total: number;
  due_date: string;
  paid_at: string | null;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  created_at: string;
}

export interface RepaymentPlan {
  loan_id: string;
  principal: number;
  total_interest: number;
  total_repayment: number;
  term_days: number;
  repayment_type: 'bullet' | 'installment';
  installments: RepaymentScheduleItem[];
}

export interface RepaymentScheduleItem {
  number: number;
  due_date: string;
  principal: number;
  interest: number;
  fee?: number;
  total: number;
}

/**
 * 生成还款计划
 * @param loanId 借款 ID
 * @param principal 本金
 * @param interestRate 利率 (日利率或月利率)
 * @param termDays 借款期限 (天)
 * @param repaymentType 还款类型：bullet(一次性还本付息) | installment(分期)
 * @param installments 分期期数 (仅分期类型需要)
 * @param disbursedAt 放款日期
 * @returns 还款计划
 */
export function generateRepaymentPlan(
  loanId: string,
  principal: number,
  interestRate: number,
  termDays: number,
  repaymentType: 'bullet' | 'installment',
  installments: number = 1,
  disbursedAt: Date = new Date()
): RepaymentPlan {
  const scheduleItems: RepaymentScheduleItem[] = [];
  let totalInterest = 0;

  if (repaymentType === 'bullet') {
    // 一次性还本付息
    totalInterest = principal * interestRate * termDays;
    const dueDate = new Date(disbursedAt);
    dueDate.setDate(dueDate.getDate() + termDays);

    scheduleItems.push({
      number: 1,
      due_date: dueDate.toISOString().split('T')[0],
      principal: principal,
      interest: totalInterest,
      total: principal + totalInterest,
    });
  } else {
    // 分期还款 (等额本息)
    const monthlyRate = interestRate * 30; // 日利率转月利率
    const numPayments = installments;
    
    // 等额本息计算公式
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    totalInterest = monthlyPayment * numPayments - principal;

    let remainingPrincipal = principal;
    for (let i = 1; i <= installments; i++) {
      const interestForPeriod = remainingPrincipal * monthlyRate;
      const principalForPeriod = monthlyPayment - interestForPeriod;
      
      const dueDate = new Date(disbursedAt);
      dueDate.setDate(dueDate.getDate() + (termDays / installments) * i);

      scheduleItems.push({
        number: i,
        due_date: dueDate.toISOString().split('T')[0],
        principal: Math.round(principalForPeriod * 100) / 100,
        interest: Math.round(interestForPeriod * 100) / 100,
        total: Math.round(monthlyPayment * 100) / 100,
      });

      remainingPrincipal -= principalForPeriod;
    }
  }

  return {
    loan_id: loanId,
    principal,
    total_interest: Math.round(totalInterest * 100) / 100,
    total_repayment: Math.round((principal + totalInterest) * 100) / 100,
    term_days: termDays,
    repayment_type: repaymentType,
    installments: scheduleItems,
  };
}

/**
 * 计算每期应还金额
 * @param principal 本金
 * @param interestRate 利率
 * @param termDays 期限
 * @param installmentNumber 期数
 * @returns 每期金额
 */
export function calculateInstallmentAmount(
  principal: number,
  interestRate: number,
  termDays: number,
  installmentNumber: number
): { principal: number; interest: number; total: number } {
  const monthlyRate = interestRate * 30;
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, installmentNumber)) / 
    (Math.pow(1 + monthlyRate, installmentNumber) - 1);
  
  const totalInterest = monthlyPayment * installmentNumber - principal;
  
  return {
    principal: Math.round((principal / installmentNumber) * 100) / 100,
    interest: Math.round((totalInterest / installmentNumber) * 100) / 100,
    total: Math.round(monthlyPayment * 100) / 100,
  };
}

/**
 * 计算还款日期
 * @param startDate 开始日期
 * @param termDays 总期限
 * @param installments 分期数
 * @returns 还款日期数组
 */
export function calculateDueDates(
  startDate: Date,
  termDays: number,
  installments: number = 1
): string[] {
  const dates: string[] = [];
  const interval = Math.floor(termDays / installments);

  for (let i = 1; i <= installments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + interval * i);
    dates.push(dueDate.toISOString().split('T')[0]);
  }

  return dates;
}

/**
 * 保存还款计划到数据库
 * @param plan 还款计划
 * @returns 保存的还款计划 ID 列表
 */
export async function saveRepaymentSchedule(plan: RepaymentPlan): Promise<string[]> {
  const scheduleIds: string[] = [];

  for (const installment of plan.installments) {
    const id = crypto.randomUUID();
    
    await db.run(`
      INSERT INTO repayment_schedules (
        id, loan_id, installment_number, total_installments,
        principal_amount, interest_amount, fee_amount, total_amount,
        due_date, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `, [
      id,
      plan.loan_id,
      installment.number,
      plan.installments.length,
      installment.principal,
      installment.interest,
      installment.fee || 0,
      installment.total,
      installment.due_date,
    ]);

    scheduleIds.push(id);
  }

  return scheduleIds;
}

/**
 * 获取借款的还款计划
 * @param loanId 借款 ID
 * @returns 还款计划列表
 */
export async function getRepaymentSchedule(loanId: string): Promise<RepaymentSchedule[]> {
  const result = await db.all(`
    SELECT * FROM repayment_schedules
    WHERE loan_id = ?
    ORDER BY installment_number ASC
  `, [loanId]);

  return result as RepaymentSchedule[];
}

/**
 * 更新还款计划状态
 * @param scheduleId 还款计划 ID
 * @param status 新状态
 * @param paidAmount 已还金额
 */
export async function updateScheduleStatus(
  scheduleId: string,
  status: 'pending' | 'partial' | 'paid' | 'overdue',
  paidAmount: number = 0
): Promise<void> {
  if (status === 'paid') {
    await db.run(`
      UPDATE repayment_schedules
      SET status = 'paid', paid_at = CURRENT_TIMESTAMP, paid_total = ?
      WHERE id = ?
    `, [paidAmount, scheduleId]);
  } else {
    await db.run(`
      UPDATE repayment_schedules
      SET status = ?, paid_total = ?
      WHERE id = ?
    `, [status, paidAmount, scheduleId]);
  }
}

/**
 * 获取即将到期的还款计划
 * @param days 未来多少天内
 * @returns 即将到期的还款计划列表
 */
export async function getUpcomingSchedules(days: number = 7): Promise<RepaymentSchedule[]> {
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const result = await db.all(`
    SELECT * FROM repayment_schedules
    WHERE due_date BETWEEN ? AND ?
    AND status IN ('pending', 'partial')
    ORDER BY due_date ASC
  `, [today, futureDateStr]);

  return result as RepaymentSchedule[];
}
