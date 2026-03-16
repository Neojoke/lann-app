/**
 * 提前还款服务
 * 
 * 负责：
 * - 提前还款试算
 * - 利息重新计算 (按实际天数)
 * - 提前还款费用 (Lann 免费)
 */

import { db } from '../db';
import { getRepaymentSchedule } from './repayment-schedule.service';

export interface PrepaymentCalculation {
  loan_id: string;
  principal: number;
  remaining_principal: number;
  used_days: number;
  original_term_days: number;
  daily_rate: number;
  
  // 利息计算
  original_interest: number;
  recalculated_interest: number;
  interest_saved: number;
  
  // 费用
  prepayment_fee: number;
  penalty: number;
  
  // 总金额
  total_due: number;
  original_total_due: number;
  total_saved: number;
  
  // 详情
  breakdown: {
    principal: number;
    interest: number;
    fee: number;
    penalty: number;
  };
}

export interface PrepaymentConfig {
  allowed: boolean;
  feeType: 'none' | 'fixed' | 'percentage';
  feeAmount?: number;
  feePercentage?: number;
  minDaysBeforeDue?: number;
}

/**
 * Lann 提前还款配置
 * 
 * 根据业务模型：
 * - 允许提前还款
 * - 提前还款免费
 * - 按实际使用天数计算利息
 */
export const LANN_PREPAYMENT_CONFIG: PrepaymentConfig = {
  allowed: true,
  feeType: 'none',
};

/**
 * 提前还款试算
 * 
 * @param loanId 借款 ID
 * @returns 提前还款计算结果
 */
export async function calculatePrepayment(loanId: string): Promise<PrepaymentCalculation> {
  const loan = await db.get(`SELECT * FROM loans WHERE id = ?`, [loanId]) as any;
  if (!loan) {
    throw new Error('Loan not found');
  }

  const today = new Date();
  const disbursedDate = new Date(loan.disbursed_at);
  const dueDate = new Date(loan.due_date);

  // 计算已使用天数
  const usedDays = Math.floor((today.getTime() - disbursedDate.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // 计算日利率
  const dailyRate = loan.interest_rate;

  // 原始利息 (按原定期限)
  const originalInterest = loan.total_interest;

  // 重新计算利息 (按实际使用天数)
  const recalculatedInterest = loan.principal * dailyRate * usedDays;

  // 节省的利息
  const interestSaved = originalInterest - recalculatedInterest;

  // 提前还款费用 (Lann 免费)
  const prepaymentFee = 0;

  // 罚息 (如果有逾期)
  const penalty = loan.penalty_amount || 0;

  // 总应还金额
  const totalDue = loan.remaining_amount + recalculatedInterest + prepaymentFee + penalty;

  // 原始总应还金额
  const originalTotalDue = loan.remaining_amount + (originalInterest * (remainingDays / loan.term_days));

  // 总节省金额
  const totalSaved = originalTotalDue - totalDue;

  return {
    loan_id: loanId,
    principal: loan.principal,
    remaining_principal: loan.remaining_amount,
    used_days: usedDays,
    original_term_days: loan.term_days,
    daily_rate: dailyRate,
    
    original_interest: Math.round(originalInterest * 100) / 100,
    recalculated_interest: Math.round(recalculatedInterest * 100) / 100,
    interest_saved: Math.round(interestSaved * 100) / 100,
    
    prepayment_fee: prepaymentFee,
    penalty: Math.round(penalty * 100) / 100,
    
    total_due: Math.round(totalDue * 100) / 100,
    original_total_due: Math.round(originalTotalDue * 100) / 100,
    total_saved: Math.round(totalSaved * 100) / 100,
    
    breakdown: {
      principal: loan.remaining_amount,
      interest: Math.round(recalculatedInterest * 100) / 100,
      fee: prepaymentFee,
      penalty: Math.round(penalty * 100) / 100,
    },
  };
}

/**
 * 执行提前还款
 * 
 * @param loanId 借款 ID
 * @param userId 用户 ID
 * @param paymentMethod 支付方式
 * @param paymentChannelId 支付渠道 ID
 * @returns 还款记录 ID
 */
export async function executePrepayment(
  loanId: string,
  userId: string,
  paymentMethod: string,
  paymentChannelId: string
): Promise<string> {
  // 计算提前还款金额
  const calculation = await calculatePrepayment(loanId);

  // 创建还款记录
  const repaymentId = crypto.randomUUID();
  const transactionRef = `PREPAY${Date.now()}${crypto.randomUUID().substring(0, 8)}`;

  await db.run(`
    INSERT INTO repayments (
      id, user_id, loan_id, amount,
      principal_paid, interest_paid, penalty_paid, fee_paid,
      payment_method, payment_channel_id, transaction_ref,
      status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', CURRENT_TIMESTAMP)
  `, [
    repaymentId,
    userId,
    loanId,
    calculation.total_due,
    calculation.remaining_principal,
    calculation.recalculated_interest,
    calculation.penalty,
    calculation.prepayment_fee,
    paymentMethod,
    paymentChannelId,
    transactionRef,
  ]);

  return repaymentId;
}

/**
 * 检查是否允许提前还款
 * 
 * @param loanId 借款 ID
 * @returns 是否允许及原因
 */
export async function checkPrepaymentEligibility(
  loanId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const loan = await db.get(`SELECT * FROM loans WHERE id = ?`, [loanId]) as any;
  if (!loan) {
    return { allowed: false, reason: 'Loan not found' };
  }

  // 检查借款状态
  if (loan.status === 'completed') {
    return { allowed: false, reason: 'Loan already completed' };
  }

  if (loan.status === 'written_off') {
    return { allowed: false, reason: 'Loan written off' };
  }

  // 检查是否已逾期 (Lann 允许逾期后提前还款)
  // 如果需要限制，可以添加：
  // if (loan.is_overdue) {
  //   return { allowed: false, reason: 'Cannot prepay overdue loan' };
  // }

  // 检查最少借款天数 (可选)
  const today = new Date();
  const disbursedDate = new Date(loan.disbursed_at);
  const daysSinceDisbursal = Math.floor(
    (today.getTime() - disbursedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceDisbursal < 1) {
    return { allowed: false, reason: 'Must wait at least 1 day after disbursement' };
  }

  return { allowed: true };
}

/**
 * 计算部分提前还款
 * 
 * @param loanId 借款 ID
 * @param partialAmount 部分还款金额
 * @returns 计算结果
 */
export async function calculatePartialPrepayment(
  loanId: string,
  partialAmount: number
): Promise<{
  loan_id: string;
  partial_amount: number;
  principal_reduction: number;
  interest_portion: number;
  new_remaining_principal: number;
  new_total_interest: number;
}> {
  const calculation = await calculatePrepayment(loanId);

  // 分配还款金额：先还利息，再还本金
  const interestPortion = Math.min(partialAmount, calculation.recalculated_interest);
  const principalReduction = partialAmount - interestPortion;

  const newRemainingPrincipal = calculation.remaining_principal - principalReduction;

  // 重新计算剩余期限的利息
  const today = new Date();
  const dueDate = new Date(new Date().toISOString()); // 从原借款对象获取
  const remainingDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const newTotalInterest = newRemainingPrincipal * calculation.daily_rate * remainingDays;

  return {
    loan_id: loanId,
    partial_amount: partialAmount,
    principal_reduction: Math.round(principalReduction * 100) / 100,
    interest_portion: Math.round(interestPortion * 100) / 100,
    new_remaining_principal: Math.round(newRemainingPrincipal * 100) / 100,
    new_total_interest: Math.round(newTotalInterest * 100) / 100,
  };
}

/**
 * 获取提前还款节省分析
 * 
 * @param loanId 借款 ID
 * @param prepaymentDate 计划提前还款日期
 * @returns 节省分析
 */
export async function getPrepaymentSavingsAnalysis(
  loanId: string,
  prepaymentDate: Date = new Date()
): Promise<{
  current_date: string;
  planned_date: string;
  days_difference: number;
  interest_saved: number;
  effective_annual_rate: number;
}> {
  const calculation = await calculatePrepayment(loanId);

  const today = new Date();
  const daysDifference = Math.floor(
    (prepaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 计算有效年化收益率 (节省的利息 / 本金 / 天数 * 365)
  const effectiveAnnualRate = daysDifference > 0
    ? (calculation.interest_saved / calculation.remaining_principal / daysDifference) * 365
    : 0;

  return {
    current_date: today.toISOString().split('T')[0],
    planned_date: prepaymentDate.toISOString().split('T')[0],
    days_difference: daysDifference,
    interest_saved: calculation.interest_saved,
    effective_annual_rate: Math.round(effectiveAnnualRate * 10000) / 100,
  };
}
