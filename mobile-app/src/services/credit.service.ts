import { ApiClient } from './api.client';
import {
  ApplyCreditRequest,
  ApplyCreditResponse,
  CreditStatusResponse,
  CreditLimitResponse,
  RequestReviewRequest,
  ApiResponse,
  CreditGrade,
} from '../models/credit';

/**
 * 信用服务
 * Credit Service
 * 
 * 提供信用额度申请、状态查询、额度管理等功能
 */
export class CreditService extends ApiClient {
  private static instance: CreditService;

  private constructor() {
    super();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): CreditService {
    if (!CreditService.instance) {
      CreditService.instance = new CreditService();
    }
    return CreditService.instance;
  }

  /**
   * 申请信用额度
   * Apply for credit limit
   * 
   * @param request 申请请求
   * @returns 申请结果
   */
  async applyCredit(request: ApplyCreditRequest): Promise<ApiResponse<ApplyCreditResponse>> {
    const response = await fetch(`${this.baseUrl}/api/credit/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': request.language,
      },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * 查询信用状态
   * Get credit status
   * 
   * @returns 信用状态
   */
  async getCreditStatus(): Promise<ApiResponse<CreditStatusResponse>> {
    return this.get<ApiResponse<CreditStatusResponse>>('/api/credit/status');
  }

  /**
   * 查询可用额度
   * Get credit limit
   * 
   * @returns 额度信息
   */
  async getCreditLimit(): Promise<ApiResponse<CreditLimitResponse>> {
    return this.get<ApiResponse<CreditLimitResponse>>('/api/credit/limit');
  }

  /**
   * 申请复审
   * Request credit review
   * 
   * @param request 复审请求
   * @returns 复审结果
   */
  async requestReview(request: RequestReviewRequest): Promise<ApiResponse<void>> {
    return this.post<ApiResponse<void>>('/api/credit/review', request);
  }

  /**
   * 计算信用评分（前端工具方法）
   * Calculate credit score (client-side utility)
   * 
   * @param data 评分数据
   * @returns 评分结果
   */
  calculateCreditScore(data: CreditScoreData): CreditScoreResult {
    // 基础分：300 分
    const baseScore = 300;

    // 收入评分：最高 200 分
    let incomeScore = 0;
    if (data.monthlyIncome >= 50000) {
      incomeScore = 200;
    } else if (data.monthlyIncome >= 30000) {
      incomeScore = 150;
    } else if (data.monthlyIncome >= 20000) {
      incomeScore = 100;
    } else if (data.monthlyIncome >= 15000) {
      incomeScore = 75;
    } else if (data.monthlyIncome >= 10000) {
      incomeScore = 50;
    } else if (data.monthlyIncome >= 5000) {
      incomeScore = 25;
    }

    // 就业状态评分：最高 250 分
    let employmentScore = 0;
    switch (data.employmentStatus) {
      case 'employed_fulltime':
        employmentScore = 250;
        break;
      case 'employed_parttime':
        employmentScore = 150;
        break;
      case 'self_employed':
        employmentScore = 180;
        break;
      case 'business_owner':
        employmentScore = 200;
        break;
      case 'freelance':
        employmentScore = 120;
        break;
      case 'unemployed':
        employmentScore = 0;
        break;
      default:
        employmentScore = 50;
    }

    // 联系方式评分：最高 150 分
    let contactScore = 0;
    if (data.hasVerifiedPhone) contactScore += 50;
    if (data.hasVerifiedEmail) contactScore += 50;
    if (data.hasVerifiedAddress) contactScore += 50;

    // 社交关系评分：最高 150 分
    let socialScore = 0;
    if (data.hasEmergencyContact) socialScore += 75;
    if (data.verifiedEmergencyContact) socialScore += 75;

    // 行为数据评分：最高 250 分
    let behaviorScore = 0;
    if (data.hasStableDevice) behaviorScore += 100;
    if (data.completeProfile) behaviorScore += 100;
    if (data.previousGoodHistory) behaviorScore += 50;

    // 计算总分
    const totalScore = baseScore + incomeScore + employmentScore + contactScore + socialScore + behaviorScore;

    // 确定信用等级
    const grade = this.calculateGrade(totalScore);
    const creditLimit = this.calculateCreditLimit(grade);

    return {
      totalScore: Math.min(totalScore, 1000),
      grade,
      creditLimit,
      breakdown: {
        basicScore: baseScore,
        employmentScore,
        contactScore,
        socialScore,
        behaviorScore,
      },
    };
  }

  /**
   * 计算信用等级
   */
  private calculateGrade(score: number): CreditGrade {
    if (score >= 750) return 'A+';
    if (score >= 650) return 'A';
    if (score >= 550) return 'B';
    if (score >= 450) return 'C';
    if (score >= 300) return 'D';
    return 'F';
  }

  /**
   * 根据等级计算额度
   */
  private calculateCreditLimit(grade: CreditGrade): number {
    switch (grade) {
      case 'A+':
        return 50000;
      case 'A':
        return 30000;
      case 'B':
        return 20000;
      case 'C':
        return 10000;
      case 'D':
        return 5000;
      case 'F':
        return 0;
    }
  }

  /**
   * 获取信用等级说明
   * Get credit grade description
   * 
   * @param grade 信用等级
   * @param language 语言
   * @returns 等级说明
   */
  getGradeDescription(grade: CreditGrade, language: 'en' | 'th'): {
    title: string;
    description: string;
    color: string;
  } {
    const descriptions: Record<CreditGrade, { en: { title: string; description: string }; th: { title: string; description: string }; color: string }> = {
      'A+': {
        en: {
          title: 'Excellent',
          description: 'Your credit rating is excellent. You can enjoy the highest limit and best interest rates.',
        },
        th: {
          title: 'ยอดเยี่ยม',
          description: 'คะแนนเครดิตของคุณอยู่ในระดับยอดเยี่ยม คุณสามารถเพลิดเพลินกับวงเงินสูงสุดและอัตราดอกเบี้ยที่ดีที่สุด',
        },
        color: '#10B981',
      },
      'A': {
        en: {
          title: 'Good',
          description: 'Your credit rating is good. You can enjoy a high credit limit.',
        },
        th: {
          title: 'ดี',
          description: 'คะแนนเครดิตของคุณอยู่ในระดับดี คุณสามารถเพลิดเพลินกับวงเงินสูง',
        },
        color: '#3B82F6',
      },
      'B': {
        en: {
          title: 'Fair',
          description: 'Your credit rating is fair. Consider completing your profile to increase your limit.',
        },
        th: {
          title: 'ปานกลาง',
          description: 'คะแนนเครดิตของคุณอยู่ในระดับปานกลาง พิจารณากรอกข้อมูลให้ครบถ้วนเพื่อเพิ่มวงเงิน',
        },
        color: '#F59E0B',
      },
      'C': {
        en: {
          title: 'Poor',
          description: 'Your credit rating is poor. Consider improving your income or completing your information.',
        },
        th: {
          title: 'ต่ำ',
          description: 'คะแนนเครดิตของคุณอยู่ในระดับต่ำ พิจารณาเพิ่มรายได้หรือกรอกข้อมูลให้ครบถ้วน',
        },
        color: '#EF4444',
      },
      'D': {
        en: {
          title: 'Very Poor',
          description: 'Your credit rating is very poor. Please improve your conditions before reapplying.',
        },
        th: {
          title: 'ต่ำมาก',
          description: 'คะแนนเครดิตของคุณอยู่ในระดับต่ำมาก กรุณาปรับปรุงเงื่อนไขก่อนขอสมัครอีกครั้ง',
        },
        color: '#DC2626',
      },
      'F': {
        en: {
          title: 'Rejected',
          description: 'Unable to grant credit at this time. Please improve your credit conditions and reapply.',
        },
        th: {
          title: 'ถูกปฏิเสธ',
          description: 'ไม่สามารถให้วงเงินเครดิตในขณะนี้ กรุณาปรับปรุงเงื่อนไขเครดิตและสมัครใหม่',
        },
        color: '#6B7280',
      },
    };

    const desc = descriptions[grade];
    return {
      title: desc[language].title,
      description: desc[language].description,
      color: desc.color,
    };
  }
}

// ==================== 数据类型定义 ====================

/**
 * 信用评分数据
 */
export interface CreditScoreData {
  /** 月收入 */
  monthlyIncome: number;
  /** 就业状态 */
  employmentStatus: string;
  /** 已验证手机号 */
  hasVerifiedPhone: boolean;
  /** 已验证邮箱 */
  hasVerifiedEmail: boolean;
  /** 已验证地址 */
  hasVerifiedAddress: boolean;
  /** 有紧急联系人 */
  hasEmergencyContact: boolean;
  /** 紧急联系人已验证 */
  verifiedEmergencyContact: boolean;
  /** 设备稳定 */
  hasStableDevice: boolean;
  /** 资料完整 */
  completeProfile: boolean;
  /** 历史良好记录 */
  previousGoodHistory: boolean;
}

/**
 * 信用评分结果
 */
export interface CreditScoreResult {
  /** 总分 */
  totalScore: number;
  /** 等级 */
  grade: CreditGrade;
  /** 额度 */
  creditLimit: number;
  /** 评分详情 */
  breakdown: {
    /** 基本信息得分 */
    basicScore: number;
    /** 工作信息得分 */
    employmentScore: number;
    /** 联系方式得分 */
    contactScore: number;
    /** 社交关系得分 */
    socialScore: number;
    /** 行为数据得分 */
    behaviorScore: number;
  };
}

// 导出单例实例
export const creditService = CreditService.getInstance();
