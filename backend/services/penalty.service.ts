/**
 * 罚息计算服务
 * 
 * 负责：
 * - 罚息计算 (本金×费率×天数)
 * - 阶梯罚息率
 * - 罚息上限
 */

import { getOverdueStageConfig } from './overdue.service';

export interface PenaltyConfig {
  baseRate: number;        // 基础罚息率 (日)
  tieredRates: Array<{
    minDays: number;
    maxDays?: number;
    rate: number;
  }>;
  maxPenalty: number;      // 罚息上限 (占本金百分比)
  minPenalty: number;      // 最低罚息金额
}

/**
 * Lann 罚息配置
 * 
 * 根据业务模型设计：
 * - 逾期 1-3 天：0.5%/天
 * - 逾期 4-7 天：0.5%/天
 * - 逾期 8-30 天：0.7%/天
 * - 逾期 30 天以上：1%/天
 * - 罚息上限：本金的 20%
 * - 最低罚息：50 THB
 */
export const LANN_PENALTY_CONFIG: PenaltyConfig = {
  baseRate: 0.005, // 0.5%/天
  tieredRates: [
    { minDays: 1, maxDays: 7, rate: 0.005 },    // 0.5%/天
    { minDays: 8, maxDays: 30, rate: 0.007 },   // 0.7%/天
    { minDays: 31, rate: 0.01 },                 // 1%/天
  ],
  maxPenalty: 0.20, // 本金的 20%
  minPenalty: 50,   // 最低 50 THB
};

/**
 * 计算罚息
 * 
 * 公式：罚息 = 逾期本金 × 罚息率 × 逾期天数
 * 
 * @param principal 逾期本金
 * @param overdueDays 逾期天数
 * @param config 罚息配置
 * @returns 罚息金额
 */
export function calculatePenalty(
  principal: number,
  overdueDays: number,
  config: PenaltyConfig = LANN_PENALTY_CONFIG
): number {
  if (overdueDays <= 0 || principal <= 0) {
    return 0;
  }

  let penalty = 0;

  // 使用阶梯罚息率计算
  for (const tier of config.tieredRates) {
    if (overdueDays >= tier.minDays) {
      const daysInTier = tier.maxDays 
        ? Math.min(overdueDays, tier.maxDays) - tier.minDays + 1
        : overdueDays - tier.minDays + 1;
      
      if (daysInTier > 0) {
        penalty += principal * tier.rate * daysInTier;
      }
    }
  }

  // 应用罚息上限
  const maxPenaltyAmount = principal * config.maxPenalty;
  penalty = Math.min(penalty, maxPenaltyAmount);

  // 应用最低罚息
  if (penalty > 0 && penalty < config.minPenalty) {
    penalty = config.minPenalty;
  }

  // 保留两位小数
  return Math.round(penalty * 100) / 100;
}

/**
 * 计算简单罚息 (单一费率)
 * @param principal 本金
 * @param overdueDays 逾期天数
 * @param penaltyRate 罚息率
 * @returns 罚息金额
 */
export function calculateSimplePenalty(
  principal: number,
  overdueDays: number,
  penaltyRate: number
): number {
  if (overdueDays <= 0 || principal <= 0) {
    return 0;
  }

  const penalty = principal * penaltyRate * overdueDays;
  return Math.round(penalty * 100) / 100;
}

/**
 * 获取当前适用的罚息率
 * @param overdueDays 逾期天数
 * @returns 罚息率
 */
export function getCurrentPenaltyRate(
  overdueDays: number,
  config: PenaltyConfig = LANN_PENALTY_CONFIG
): number {
  if (overdueDays <= 0) {
    return 0;
  }

  for (const tier of config.tieredRates) {
    if (overdueDays >= tier.minDays && (!tier.maxDays || overdueDays <= tier.maxDays)) {
      return tier.rate;
    }
  }

  return config.baseRate;
}

/**
 * 计算累计罚息
 * 
 * 从逾期开始到当前的累计罚息
 * 
 * @param principal 本金
 * @param overdueStartDate 逾期开始日期
 * @param endDate 结束日期 (默认今天)
 * @param config 罚息配置
 * @returns 累计罚息
 */
export function calculateAccumulatedPenalty(
  principal: number,
  overdueStartDate: Date,
  endDate: Date = new Date(),
  config: PenaltyConfig = LANN_PENALTY_CONFIG
): number {
  const overdueDays = Math.floor(
    (endDate.getTime() - overdueStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return calculatePenalty(principal, overdueDays, config);
}

/**
 * 预测未来罚息
 * 
 * 预测到未来某个日期的罚息总额
 * 
 * @param principal 本金
 * @param currentOverdueDays 当前逾期天数
 * @param futureDays 未来天数
 * @param config 罚息配置
 * @returns 预测罚息
 */
export function predictFuturePenalty(
  principal: number,
  currentOverdueDays: number,
  futureDays: number,
  config: PenaltyConfig = LANN_PENALTY_CONFIG
): number {
  const totalDays = currentOverdueDays + futureDays;
  const currentPenalty = calculatePenalty(principal, currentOverdueDays, config);
  const totalPenalty = calculatePenalty(principal, totalDays, config);

  return Math.round((totalPenalty - currentPenalty) * 100) / 100;
}

/**
 * 获取罚息详情
 * @param principal 本金
 * @param overdueDays 逾期天数
 * @param config 罚息配置
 * @returns 罚息详情
 */
export function getPenaltyBreakdown(
  principal: number,
  overdueDays: number,
  config: PenaltyConfig = LANN_PENALTY_CONFIG
): {
  totalPenalty: number;
  byTier: Array<{
    tier: number;
    days: number;
    rate: number;
    amount: number;
  }>;
  maxPenaltyCap: number;
  isCapped: boolean;
} {
  const byTier: Array<{
    tier: number;
    days: number;
    rate: number;
    amount: number;
  }> = [];

  let penalty = 0;
  let remainingDays = overdueDays;

  for (let i = 0; i < config.tieredRates.length; i++) {
    const tier = config.tieredRates[i];
    
    if (remainingDays <= 0) break;

    const daysInTier = tier.maxDays
      ? Math.min(remainingDays, tier.maxDays - tier.minDays + 1)
      : remainingDays;

    if (daysInTier > 0) {
      const tierPenalty = principal * tier.rate * daysInTier;
      penalty += tierPenalty;

      byTier.push({
        tier: i + 1,
        days: daysInTier,
        rate: tier.rate,
        amount: Math.round(tierPenalty * 100) / 100,
      });

      remainingDays -= daysInTier;
    }
  }

  const maxPenaltyCap = principal * config.maxPenalty;
  const isCapped = penalty > maxPenaltyCap;
  const totalPenalty = isCapped ? maxPenaltyCap : penalty;

  // 应用最低罚息
  let finalPenalty = totalPenalty;
  if (finalPenalty > 0 && finalPenalty < config.minPenalty) {
    finalPenalty = config.minPenalty;
  }

  return {
    totalPenalty: Math.round(finalPenalty * 100) / 100,
    byTier,
    maxPenaltyCap: Math.round(maxPenaltyCap * 100) / 100,
    isCapped,
  };
}

/**
 * 更新借款罚息
 * @param loanId 借款 ID
 * @param db 数据库实例
 */
export async function updateLoanPenalty(loanId: string, db: any): Promise<number> {
  const loan = await db.get(`SELECT * FROM loans WHERE id = ?`, [loanId]);
  if (!loan) {
    throw new Error('Loan not found');
  }

  const today = new Date();
  const dueDate = new Date(loan.due_date);
  const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  if (overdueDays <= 0) {
    return 0;
  }

  const penalty = calculatePenalty(loan.remaining_amount, overdueDays);

  await db.run(`
    UPDATE loans
    SET penalty_amount = ?,
        overdue_days = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [penalty, overdueDays, loanId]);

  return penalty;
}
