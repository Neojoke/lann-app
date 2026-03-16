/**
 * 借款产品服务 - Loan Product Service
 * 
 * 负责借款产品的 CRUD 操作、产品类型定义、费率配置、期限配置和产品状态管理
 */

import { D1Database } from '@cloudflare/workers-types';

// ============ 类型定义 ============

export type ProductType = 'payday' | 'installment' | 'revolving';
export type ProductStatus = 'active' | 'inactive' | 'deprecated';
export type TargetSegment = 'new' | 'regular' | 'premium';
export type InterestRateType = 'daily' | 'monthly' | 'annual';
export type CalculationMethod = 'flat' | 'reducing';
export type RepaymentMethod = 'bank_transfer' | 'promptpay' | 'convenience_store' | 'e_wallet' | 'atm' | 'truemoney';

export interface LoanTerm {
  days: number;
  label: { en: string; th: string };
  minAmount: number;
  maxAmount: number;
  repaymentType: 'bullet' | 'installment';
}

export interface InterestRate {
  type: InterestRateType;
  rate: number;
  calculationMethod: CalculationMethod;
}

export interface Fee {
  type: 'processing' | 'late' | 'prepayment' | 'service';
  amount?: number;
  percentage?: number;
  minAmount?: number;
  maxAmount?: number;
}

export interface LoanProduct {
  id: string;
  name: { en: string; th: string };
  type: ProductType;
  minAmount: number;
  maxAmount: number;
  terms: LoanTerm[];
  interestRate: InterestRate;
  fees: Fee[];
  repaymentMethods: RepaymentMethod[];
  status: ProductStatus;
  targetSegment: TargetSegment;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: { en: string; th: string };
  type: ProductType;
  minAmount: number;
  maxAmount: number;
  terms: LoanTerm[];
  interestRate: InterestRate;
  fees: Fee[];
  repaymentMethods: RepaymentMethod[];
  targetSegment?: TargetSegment;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  status?: ProductStatus;
}

// ============ 默认产品配置 ============

export const DEFAULT_PRODUCTS: Omit<LoanProduct, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'payday-standard',
    name: { en: 'Payday Loan', th: 'เงินด่วนรายวัน' },
    type: 'payday',
    minAmount: 1000,
    maxAmount: 50000,
    terms: [
      { days: 7, label: { en: '7 Days', th: '7 วัน' }, minAmount: 1000, maxAmount: 10000, repaymentType: 'bullet' },
      { days: 14, label: { en: '14 Days', th: '14 วัน' }, minAmount: 1000, maxAmount: 20000, repaymentType: 'bullet' },
      { days: 21, label: { en: '21 Days', th: '21 วัน' }, minAmount: 5000, maxAmount: 30000, repaymentType: 'bullet' },
      { days: 30, label: { en: '30 Days', th: '30 วัน' }, minAmount: 5000, maxAmount: 50000, repaymentType: 'bullet' },
    ],
    interestRate: {
      type: 'daily',
      rate: 0.01,
      calculationMethod: 'flat',
    },
    fees: [
      { type: 'late', percentage: 0.005, minAmount: 50 },
    ],
    repaymentMethods: ['bank_transfer', 'convenience_store', 'promptpay', 'truemoney'],
    status: 'active',
    targetSegment: 'regular',
  },
  {
    id: 'installment-standard',
    name: { en: 'Installment Loan', th: 'เงินผ่อนชำระ' },
    type: 'installment',
    minAmount: 5000,
    maxAmount: 100000,
    terms: [
      { days: 90, label: { en: '3 Months', th: '3 เดือน' }, minAmount: 5000, maxAmount: 30000, repaymentType: 'installment' },
      { days: 180, label: { en: '6 Months', th: '6 เดือน' }, minAmount: 10000, maxAmount: 60000, repaymentType: 'installment' },
      { days: 365, label: { en: '12 Months', th: '12 เดือน' }, minAmount: 20000, maxAmount: 100000, repaymentType: 'installment' },
    ],
    interestRate: {
      type: 'monthly',
      rate: 0.02,
      calculationMethod: 'reducing',
    },
    fees: [
      { type: 'processing', percentage: 0.02, maxAmount: 1000 },
      { type: 'late', percentage: 0.005 },
      { type: 'prepayment', percentage: 0.01 },
    ],
    repaymentMethods: ['bank_transfer', 'promptpay'],
    status: 'active',
    targetSegment: 'regular',
  },
  {
    id: 'revolving-premium',
    name: { en: 'Revolving Credit', th: 'วงเงินหมุนเวียน' },
    type: 'revolving',
    minAmount: 1000,
    maxAmount: 100000,
    terms: [
      { days: 30, label: { en: 'Monthly', th: 'รายเดือน' }, minAmount: 1000, maxAmount: 100000, repaymentType: 'installment' },
    ],
    interestRate: {
      type: 'daily',
      rate: 0.008,
      calculationMethod: 'reducing',
    },
    fees: [
      { type: 'service', amount: 100 },
      { type: 'late', percentage: 0.005 },
    ],
    repaymentMethods: ['bank_transfer', 'promptpay', 'truemoney'],
    status: 'active',
    targetSegment: 'premium',
  },
];

// ============ 多语言错误消息 ============

const ERROR_MESSAGES: Record<string, { en: string; th: string }> = {
  PRODUCT_NOT_FOUND: {
    en: 'Product not found',
    th: 'ไม่พบผลิตภัณฑ์',
  },
  INVALID_AMOUNT: {
    en: 'Invalid loan amount',
    th: 'จำนวนเงินกู้ไม่ถูกต้อง',
  },
  INVALID_TERM: {
    en: 'Invalid loan term',
    th: 'ระยะเวลากู้ไม่ถูกต้อง',
  },
  PRODUCT_INACTIVE: {
    en: 'Product is currently inactive',
    th: 'ผลิตภัณฑ์ไม่เปิดใช้งาน',
  },
  AMOUNT_OUT_OF_RANGE: {
    en: 'Amount is out of allowed range',
    th: 'จำนวนเงินอยู่นอกช่วงที่กำหนด',
  },
};

export class LoanProductService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * 初始化默认产品
   */
  async initializeDefaults(): Promise<void> {
    for (const product of DEFAULT_PRODUCTS) {
      await this.create(product);
    }
  }

  /**
   * 创建借款产品
   */
  async create(input: CreateProductInput): Promise<LoanProduct> {
    const id = input.type + '-' + Date.now().toString(36);
    const now = new Date().toISOString();

    await this.db.execute(`
      INSERT INTO loan_products (
        id, name_en, name_th, type, min_amount, max_amount,
        interest_rate_type, interest_rate, calculation_method,
        fee_config, term_options, repayment_methods,
        status, target_segment, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      input.name.en,
      input.name.th,
      input.type,
      input.minAmount,
      input.maxAmount,
      input.interestRate.type,
      input.interestRate.rate,
      input.interestRate.calculationMethod,
      JSON.stringify(input.fees),
      JSON.stringify(input.terms),
      JSON.stringify(input.repaymentMethods),
      'active',
      input.targetSegment || 'regular',
      now,
      now,
    ]);

    return {
      id,
      name: input.name,
      type: input.type,
      minAmount: input.minAmount,
      maxAmount: input.maxAmount,
      terms: input.terms,
      interestRate: input.interestRate,
      fees: input.fees,
      repaymentMethods: input.repaymentMethods,
      status: 'active',
      targetSegment: input.targetSegment || 'regular',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  /**
   * 获取产品详情
   */
  async getById(id: string, lang: 'en' | 'th' = 'en'): Promise<LoanProduct | null> {
    const result = await this.db.execute(
      'SELECT * FROM loan_products WHERE id = ? AND status != ?',
      [id, 'deprecated']
    );

    if (!result.results || result.results.length === 0) {
      return null;
    }

    const row = result.results[0] as any;
    return this.mapToProduct(row, lang);
  }

  /**
   * 获取所有可用产品
   */
  async getAvailableProducts(lang: 'en' | 'th' = 'en'): Promise<LoanProduct[]> {
    const result = await this.db.execute(
      'SELECT * FROM loan_products WHERE status = ? ORDER BY type, min_amount',
      ['active']
    );

    if (!result.results) {
      return [];
    }

    return result.results.map(row => this.mapToProduct(row as any, lang));
  }

  /**
   * 更新产品
   */
  async update(id: string, input: UpdateProductInput): Promise<LoanProduct | null> {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...input,
      updatedAt: new Date(now),
    };

    await this.db.execute(`
      UPDATE loan_products SET
        name_en = ?, name_th = ?, type = ?,
        min_amount = ?, max_amount = ?,
        interest_rate_type = ?, interest_rate = ?, calculation_method = ?,
        fee_config = ?, term_options = ?, repayment_methods = ?,
        status = ?, target_segment = ?, updated_at = ?
      WHERE id = ?
    `, [
      updated.name.en,
      updated.name.th,
      updated.type,
      updated.minAmount,
      updated.maxAmount,
      updated.interestRate.type,
      updated.interestRate.rate,
      updated.interestRate.calculationMethod,
      JSON.stringify(updated.fees),
      JSON.stringify(updated.terms),
      JSON.stringify(updated.repaymentMethods),
      updated.status,
      updated.targetSegment,
      now,
      id,
    ]);

    return updated;
  }

  /**
   * 删除产品 (软删除，设置为 deprecated)
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      return false;
    }

    await this.db.execute(
      'UPDATE loan_products SET status = ?, updated_at = ? WHERE id = ?',
      ['deprecated', new Date().toISOString(), id]
    );

    return true;
  }

  /**
   * 验证借款金额和期限
   */
  validateLoanParams(
    product: LoanProduct,
    amount: number,
    termDays: number
  ): { valid: boolean; error?: { code: string; message: { en: string; th: string } } } {
    // 检查产品状态
    if (product.status !== 'active') {
      return {
        valid: false,
        error: { code: 'PRODUCT_INACTIVE', message: ERROR_MESSAGES.PRODUCT_INACTIVE },
      };
    }

    // 检查金额范围
    if (amount < product.minAmount || amount > product.maxAmount) {
      return {
        valid: false,
        error: { code: 'AMOUNT_OUT_OF_RANGE', message: ERROR_MESSAGES.AMOUNT_OUT_OF_RANGE },
      };
    }

    // 检查期限
    const term = product.terms.find(t => t.days === termDays);
    if (!term) {
      return {
        valid: false,
        error: { code: 'INVALID_TERM', message: ERROR_MESSAGES.INVALID_TERM },
      };
    }

    // 检查该期限的金额范围
    if (amount < term.minAmount || amount > term.maxAmount) {
      return {
        valid: false,
        error: { code: 'AMOUNT_OUT_OF_RANGE', message: ERROR_MESSAGES.AMOUNT_OUT_OF_RANGE },
      };
    }

    return { valid: true };
  }

  /**
   * 计算利息
   */
  calculateInterest(
    principal: number,
    rate: InterestRate,
    termDays: number
  ): number {
    const { type, rate: rateValue, calculationMethod } = rate;

    // 转换为日利率
    let dailyRate: number;
    if (type === 'daily') {
      dailyRate = rateValue;
    } else if (type === 'monthly') {
      dailyRate = rateValue / 30;
    } else { // annual
      dailyRate = rateValue / 365;
    }

    if (calculationMethod === 'flat') {
      // 固定利率：利息 = 本金 × 日利率 × 天数
      return principal * dailyRate * termDays;
    } else {
      // 递减利率：简单估算 (实际应按月计算)
      // 利息 = 本金 × 月利率 × 月数 × 0.5 (递减)
      const months = termDays / 30;
      return principal * (dailyRate * 30) * months * 0.5;
    }
  }

  /**
   * 计算费用
   */
  calculateFee(
    principal: number,
    fee: Fee
  ): number {
    let amount = 0;

    if (fee.percentage !== undefined) {
      amount = principal * fee.percentage;
    } else if (fee.amount !== undefined) {
      amount = fee.amount;
    }

    if (fee.minAmount !== undefined) {
      amount = Math.max(amount, fee.minAmount);
    }

    if (fee.maxAmount !== undefined) {
      amount = Math.min(amount, fee.maxAmount);
    }

    return amount;
  }

  /**
   * 映射数据库行到产品对象
   */
  private mapToProduct(row: any, lang: 'en' | 'th'): LoanProduct {
    return {
      id: row.id,
      name: {
        en: row.name_en,
        th: row.name_th,
      },
      type: row.type as ProductType,
      minAmount: row.min_amount,
      maxAmount: row.max_amount,
      terms: JSON.parse(row.term_options),
      interestRate: {
        type: row.interest_rate_type as InterestRateType,
        rate: row.interest_rate,
        calculationMethod: row.calculation_method as CalculationMethod,
      },
      fees: JSON.parse(row.fee_config),
      repaymentMethods: JSON.parse(row.repayment_methods),
      status: row.status as ProductStatus,
      targetSegment: row.target_segment as TargetSegment,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// ============ 工具函数 ============

/**
 * 格式化金额 (多语言)
 */
export function formatAmount(amount: number, lang: 'en' | 'th'): string {
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);
}

/**
 * 获取错误消息 (多语言)
 */
export function getErrorMessage(code: string, lang: 'en' | 'th'): string {
  const error = ERROR_MESSAGES[code];
  if (!error) {
    return lang === 'en' ? 'Unknown error' : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  }
  return lang === 'en' ? error.en : error.th;
}
