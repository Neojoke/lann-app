import { Injectable } from '@ionic/react';

/**
 * 信用评分计算服务
 * 
 * 评分规则：
 * - 基础分：300 分
 * - 收入评分：最高 200 分
 * - 就业状态评分：最高 150 分
 * - 信息完整度：最高 100 分
 * - 其他因素：最高 250 分
 * 
 * 总分：1000 分
 * 
 * 信用等级：
 * - A (750-1000): 优秀，额度 50000฿
 * - B (650-749): 良好，额度 30000฿
 * - C (550-649): 一般，额度 15000฿
 * - D (450-549): 较差，额度 5000฿
 * - E (<450): 拒绝
 */

export interface CreditScoreData {
  monthly_income: number;
  employment_status: string;
  has_id_card: boolean;
  has_address: boolean;
  has_employer_info: boolean;
  income_verified: boolean;
}

export interface CreditScoreResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  credit_limit: number;
  breakdown: {
    base_score: number;
    income_score: number;
    employment_score: number;
    completeness_score: number;
    other_score: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CreditService {
  constructor() {}

  /**
   * 计算信用评分
   */
  calculateCreditScore(data: CreditScoreData): CreditScoreResult {
    // 基础分：300 分
    const base_score = 300;

    // 收入评分：最高 200 分
    let income_score = 0;
    if (data.monthly_income >= 50000) {
      income_score = 200;
    } else if (data.monthly_income >= 30000) {
      income_score = 150;
    } else if (data.monthly_income >= 20000) {
      income_score = 100;
    } else if (data.monthly_income >= 15000) {
      income_score = 75;
    } else if (data.monthly_income >= 10000) {
      income_score = 50;
    } else if (data.monthly_income >= 5000) {
      income_score = 25;
    }

    // 就业状态评分：最高 150 分
    let employment_score = 0;
    switch (data.employment_status) {
      case 'employed_fulltime':
        employment_score = 150;
        break;
      case 'employed_parttime':
        employment_score = 100;
        break;
      case 'self_employed':
        employment_score = 120;
        break;
      case 'business_owner':
        employment_score = 130;
        break;
      case 'freelance':
        employment_score = 80;
        break;
      default:
        employment_score = 0;
    }

    // 信息完整度评分：最高 100 分
    let completeness_score = 0;
    if (data.has_id_card) completeness_score += 30;
    if (data.has_address) completeness_score += 30;
    if (data.has_employer_info) completeness_score += 20;
    if (data.income_verified) completeness_score += 20;

    // 其他因素：最高 250 分（预留扩展）
    const other_score = 100; // 默认给 100 分作为基础

    // 计算总分
    const total_score = base_score + income_score + employment_score + completeness_score + other_score;

    // 确定信用等级和额度
    let grade: 'A' | 'B' | 'C' | 'D' | 'E';
    let credit_limit: number;

    if (total_score >= 750) {
      grade = 'A';
      credit_limit = 50000;
    } else if (total_score >= 650) {
      grade = 'B';
      credit_limit = 30000;
    } else if (total_score >= 550) {
      grade = 'C';
      credit_limit = 15000;
    } else if (total_score >= 450) {
      grade = 'D';
      credit_limit = 5000;
    } else {
      grade = 'E';
      credit_limit = 0;
    }

    return {
      score: Math.min(total_score, 1000),
      grade,
      credit_limit,
      breakdown: {
        base_score,
        income_score,
        employment_score,
        completeness_score,
        other_score,
      },
    };
  }

  /**
   * 获取信用等级说明
   */
  getGradeDescription(grade: string): { title: string; description: string; color: string } {
    switch (grade) {
      case 'A':
        return {
          title: '优秀',
          description: '您的信用评级优秀，可享受最高额度和最优利率',
          color: '#10B981',
        };
      case 'B':
        return {
          title: '良好',
          description: '您的信用评级良好，可享受较高额度',
          color: '#3B82F6',
        };
      case 'C':
        return {
          title: '一般',
          description: '您的信用评级一般，建议完善个人信息以提高额度',
          color: '#F59E0B',
        };
      case 'D':
        return {
          title: '较差',
          description: '您的信用评级较差，建议提高收入或完善信息',
          color: '#EF4444',
        };
      case 'E':
        return {
          title: '未通过',
          description: '暂时无法授予额度，请改善信用条件后重新申请',
          color: '#6B7280',
        };
      default:
        return {
          title: '未评估',
          description: '请先完成个人信息填写',
          color: '#9CA3AF',
        };
    }
  }
}
