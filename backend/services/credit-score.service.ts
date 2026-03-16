/**
 * 信用评分服务
 * 
 * 实现完整的信用评估算法，基于 5 个维度计算综合信用评分 (300-1000 分)
 * 
 * 评分维度及权重:
 * - 基本信息 (20%): 年龄、国籍、居住稳定性
 * - 工作信息 (25%): 工作稳定性、收入水平、行业
 * - 联系方式 (15%): 手机号使用时长、邮箱验证
 * - 社交关系 (15%): 紧急联系人可信度
 * - 行为数据 (25%): 设备指纹、申请行为
 */

// ==================== 类型定义 ====================

export interface UserProfile {
  // 基本信息
  dateOfBirth?: string;
  nationality?: string;
  address?: {
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  };
  residenceYears?: number; // 居住年限
  
  // 工作信息
  employment?: {
    company?: string;
    position?: string;
    type?: 'employee' | 'self_employed' | 'business_owner';
    industry?: string;
    monthlyIncome?: number;
    employmentYears?: number; // 工作年限
  };
  
  // 联系方式
  contact?: {
    phone?: string;
    phoneMonths?: number; // 手机号使用月数
    email?: string;
    emailVerified?: boolean;
  };
  
  // 社交关系
  social?: {
    emergencyContact?: {
      name?: string;
      relationship?: string;
      phone?: string;
    };
  };
  
  // 行为数据
  behavior?: {
    deviceId?: string;
    deviceTrustScore?: number;
    applicationCount?: number; // 申请次数
    lastApplicationDate?: string;
    ipRiskScore?: number;
  };
}

export interface CreditScoreResult {
  totalScore: number; // 总分 (300-1000)
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'; // 信用等级
  dimensions: {
    basic: { score: number; maxScore: number; weight: number };
    employment: { score: number; maxScore: number; weight: number };
    contact: { score: number; maxScore: number; weight: number };
    social: { score: number; maxScore: number; weight: number };
    behavior: { score: number; maxScore: number; weight: number };
  };
  details: {
    basic: string[];
    employment: string[];
    contact: string[];
    social: string[];
    behavior: string[];
  };
}

export interface CreditGrade {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  minScore: number;
  maxScore: number;
  limitRange: { min: number; max: number };
  interestRate: number;
  description: { en: string; th: string };
}

// ==================== 常量定义 ====================

const SCORE_RANGES: CreditGrade[] = [
  {
    grade: 'A+',
    minScore: 750,
    maxScore: 1000,
    limitRange: { min: 30000, max: 50000 },
    interestRate: 0.008,
    description: {
      en: 'Excellent - Priority approval',
      th: 'ยอดเยี่ยม - อนุมัติพิเศษ'
    }
  },
  {
    grade: 'A',
    minScore: 650,
    maxScore: 749,
    limitRange: { min: 20000, max: 30000 },
    interestRate: 0.01,
    description: {
      en: 'Good - Standard approval',
      th: 'ดี - อนุมัติมาตรฐาน'
    }
  },
  {
    grade: 'B',
    minScore: 550,
    maxScore: 649,
    limitRange: { min: 10000, max: 20000 },
    interestRate: 0.012,
    description: {
      en: 'Fair - Careful approval',
      th: 'ปานกลาง - อนุมัติอย่างระมัดระวัง'
    }
  },
  {
    grade: 'C',
    minScore: 450,
    maxScore: 549,
    limitRange: { min: 5000, max: 10000 },
    interestRate: 0.015,
    description: {
      en: 'Poor - Strict approval',
      th: 'ต่ำ - อนุมัติอย่างเข้มงวด'
    }
  },
  {
    grade: 'D',
    minScore: 300,
    maxScore: 449,
    limitRange: { min: 1000, max: 5000 },
    interestRate: 0,
    description: {
      en: 'Very Poor - Reject or observe',
      th: 'ต่ำมาก - ปฏิเสธหรือสังเกต'
    }
  },
  {
    grade: 'F',
    minScore: 0,
    maxScore: 299,
    limitRange: { min: 0, max: 0 },
    interestRate: 0,
    description: {
      en: 'Unqualified - Blacklist',
      th: 'ไม่มีคุณสมบัติ - รายชื่อสีดำ'
    }
  }
];

// 行业风险评分 (月利率风险系数)
const INDUSTRY_RISK: Record<string, number> = {
  'government': 1.0, // 政府/公务员 (低风险)
  'finance': 1.0,    // 金融
  'education': 1.0,  // 教育
  'healthcare': 1.0, // 医疗
  'technology': 1.1, // 科技
  'manufacturing': 1.1, // 制造业
  'retail': 1.2,     // 零售
  'hospitality': 1.3, // 酒店/餐饮
  'construction': 1.3, // 建筑
  'agriculture': 1.4, // 农业
  'freelance': 1.5,  // 自由职业 (高风险)
  'other': 1.2       // 其他
};

// ==================== 评分函数 ====================

/**
 * 计算基本信息评分 (0-200 分)
 * 
 * 评分项:
 * - 年龄 (60 分): 25-45 岁最佳
 * - 国籍 (40 分): 泰国公民
 * - 居住稳定性 (100 分): 居住年限
 */
function calculateBasicScore(profile: UserProfile): { score: number; details: string[] } {
  let score = 0;
  const details: string[] = [];
  
  // 1. 年龄评分 (60 分)
  if (profile.dateOfBirth) {
    const birthDate = new Date(profile.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age >= 25 && age <= 45) {
      score += 60;
      details.push(`Age ${age}: Optimal range (+60)`);
    } else if (age >= 20 && age < 25) {
      score += 40;
      details.push(`Age ${age}: Young adult (+40)`);
    } else if (age >= 46 && age <= 55) {
      score += 50;
      details.push(`Age ${age}: Mature adult (+50)`);
    } else if (age > 55) {
      score += 30;
      details.push(`Age ${age}: Senior (+30)`);
    } else {
      score += 10;
      details.push(`Age ${age}: Too young (+10)`);
    }
  } else {
    details.push('Age not provided (+0)');
  }
  
  // 2. 国籍评分 (40 分)
  if (profile.nationality) {
    if (profile.nationality.toLowerCase().includes('thai') || profile.nationality === 'TH') {
      score += 40;
      details.push('Thai national (+40)');
    } else if (['SG', 'MY', 'JP', 'KR', 'AU', 'US', 'UK'].includes(profile.nationality)) {
      score += 30;
      details.push('Low-risk foreign national (+30)');
    } else {
      score += 15;
      details.push('Other foreign national (+15)');
    }
  } else {
    details.push('Nationality not provided (+0)');
  }
  
  // 3. 居住稳定性评分 (100 分)
  const residenceYears = profile.residenceYears || 0;
  if (residenceYears >= 5) {
    score += 100;
    details.push(`Residence ${residenceYears}+ years: Very stable (+100)`);
  } else if (residenceYears >= 3) {
    score += 80;
    details.push(`Residence ${residenceYears} years: Stable (+80)`);
  } else if (residenceYears >= 1) {
    score += 50;
    details.push(`Residence ${residenceYears} year: Moderate (+50)`);
  } else if (residenceYears > 0) {
    score += 20;
    details.push(`Residence <1 year: Unstable (+20)`);
  } else {
    details.push('Residence duration not provided (+0)');
  }
  
  return { score: Math.min(score, 200), details };
}

/**
 * 计算工作信息评分 (0-250 分)
 * 
 * 评分项:
 * - 工作稳定性 (100 分): 工作年限
 * - 收入水平 (100 分): 月收入
 * - 行业风险 (50 分): 行业类型
 */
function calculateEmploymentScore(profile: UserProfile): { score: number; details: string[] } {
  let score = 0;
  const details: string[] = [];
  
  const employment = profile.employment;
  
  if (!employment) {
    details.push('Employment information not provided');
    return { score: 0, details };
  }
  
  // 1. 工作稳定性评分 (100 分)
  const employmentYears = employment.employmentYears || 0;
  if (employmentYears >= 5) {
    score += 100;
    details.push(`Employment ${employmentYears}+ years: Very stable (+100)`);
  } else if (employmentYears >= 3) {
    score += 80;
    details.push(`Employment ${employmentYears} years: Stable (+80)`);
  } else if (employmentYears >= 1) {
    score += 50;
    details.push(`Employment ${employmentYears} year: Moderate (+50)`);
  } else if (employmentYears > 0) {
    score += 20;
    details.push(`Employment <1 year: Unstable (+20)`);
  } else {
    details.push('Employment duration not provided (+0)');
  }
  
  // 2. 收入水平评分 (100 分)
  const monthlyIncome = employment.monthlyIncome || 0;
  if (monthlyIncome >= 50000) {
    score += 100;
    details.push(`Income ${monthlyIncome} THB: High income (+100)`);
  } else if (monthlyIncome >= 30000) {
    score += 80;
    details.push(`Income ${monthlyIncome} THB: Good income (+80)`);
  } else if (monthlyIncome >= 20000) {
    score += 60;
    details.push(`Income ${monthlyIncome} THB: Moderate income (+60)`);
  } else if (monthlyIncome >= 15000) {
    score += 40;
    details.push(`Income ${monthlyIncome} THB: Low income (+40)`);
  } else if (monthlyIncome > 0) {
    score += 20;
    details.push(`Income ${monthlyIncome} THB: Very low income (+20)`);
  } else {
    details.push('Income not provided (+0)');
  }
  
  // 3. 行业风险评分 (50 分)
  if (employment.industry) {
    const industryKey = employment.industry.toLowerCase();
    const riskMultiplier = INDUSTRY_RISK[industryKey] || INDUSTRY_RISK['other'];
    const industryScore = Math.round(50 / riskMultiplier);
    score += industryScore;
    details.push(`Industry ${employment.industry}: Risk factor ${riskMultiplier} (+${industryScore})`);
  } else {
    details.push('Industry not provided (+0)');
  }
  
  return { score: Math.min(score, 250), details };
}

/**
 * 计算联系方式评分 (0-150 分)
 * 
 * 评分项:
 * - 手机号时长 (100 分): 使用月数
 * - 邮箱验证 (50 分): 是否验证
 */
function calculateContactScore(profile: UserProfile): { score: number; details: string[] } {
  let score = 0;
  const details: string[] = [];
  
  const contact = profile.contact;
  
  if (!contact) {
    details.push('Contact information not provided');
    return { score: 0, details };
  }
  
  // 1. 手机号使用时长评分 (100 分)
  const phoneMonths = contact.phoneMonths || 0;
  if (phoneMonths >= 24) {
    score += 100;
    details.push(`Phone ${phoneMonths}+ months: Very stable (+100)`);
  } else if (phoneMonths >= 12) {
    score += 80;
    details.push(`Phone ${phoneMonths} months: Stable (+80)`);
  } else if (phoneMonths >= 6) {
    score += 50;
    details.push(`Phone ${phoneMonths} months: Moderate (+50)`);
  } else if (phoneMonths > 0) {
    score += 20;
    details.push(`Phone ${phoneMonths} months: Unstable (+20)`);
  } else {
    details.push('Phone duration not provided (+0)');
  }
  
  // 2. 邮箱验证评分 (50 分)
  if (contact.email) {
    if (contact.emailVerified) {
      score += 50;
      details.push('Email verified (+50)');
    } else {
      score += 20;
      details.push('Email provided but not verified (+20)');
    }
  } else {
    details.push('Email not provided (+0)');
  }
  
  return { score: Math.min(score, 150), details };
}

/**
 * 计算社交关系评分 (0-150 分)
 * 
 * 评分项:
 * - 紧急联系人完整性 (100 分)
 * - 关系可信度 (50 分)
 */
function calculateSocialScore(profile: UserProfile): { score: number; details: string[] } {
  let score = 0;
  const details: string[] = [];
  
  const social = profile.social?.emergencyContact;
  
  if (!social) {
    details.push('Emergency contact not provided');
    return { score: 0, details };
  }
  
  // 1. 紧急联系人完整性评分 (100 分)
  let completenessScore = 0;
  if (social.name) completenessScore += 40;
  if (social.relationship) completenessScore += 30;
  if (social.phone) completenessScore += 30;
  
  score += completenessScore;
  details.push(`Contact completeness: ${completenessScore}/100`);
  
  // 2. 关系可信度评分 (50 分)
  if (social.relationship) {
    const trustedRelations = ['spouse', 'parent', 'child', 'sibling'];
    const relationKey = social.relationship.toLowerCase();
    
    if (trustedRelations.some(r => relationKey.includes(r))) {
      score += 50;
      details.push(`Relationship ${social.relationship}: High trust (+50)`);
    } else if (['friend', 'colleague', 'relative'].some(r => relationKey.includes(r))) {
      score += 30;
      details.push(`Relationship ${social.relationship}: Medium trust (+30)`);
    } else {
      score += 10;
      details.push(`Relationship ${social.relationship}: Low trust (+10)`);
    }
  }
  
  return { score: Math.min(score, 150), details };
}

/**
 * 计算行为数据评分 (0-250 分)
 * 
 * 评分项:
 * - 设备指纹可信度 (100 分)
 * - 申请行为 (100 分)
 * - IP 风险评分 (50 分)
 */
function calculateBehaviorScore(profile: UserProfile): { score: number; details: string[] } {
  let score = 0;
  const details: string[] = [];
  
  const behavior = profile.behavior;
  
  if (!behavior) {
    details.push('Behavior data not provided');
    return { score: 100, details }; // 默认给基础分
  }
  
  // 1. 设备指纹可信度评分 (100 分)
  const deviceTrustScore = behavior.deviceTrustScore || 50;
  score += deviceTrustScore;
  details.push(`Device trust score: ${deviceTrustScore}/100`);
  
  // 2. 申请行为评分 (100 分)
  const applicationCount = behavior.applicationCount || 0;
  const lastApplicationDate = behavior.lastApplicationDate ? new Date(behavior.lastApplicationDate) : null;
  const daysSinceLastApplication = lastApplicationDate 
    ? Math.floor((Date.now() - lastApplicationDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  if (applicationCount === 0) {
    score += 100;
    details.push('First-time applicant (+100)');
  } else if (applicationCount === 1 && daysSinceLastApplication > 180) {
    score += 80;
    details.push(`One application, ${daysSinceLastApplication} days ago (+80)`);
  } else if (applicationCount <= 2 && daysSinceLastApplication > 90) {
    score += 60;
    details.push(`${applicationCount} applications, moderate frequency (+60)`);
  } else if (applicationCount <= 3) {
    score += 30;
    details.push(`${applicationCount} applications, high frequency (+30)`);
  } else {
    score += 0;
    details.push(`${applicationCount} applications, very high frequency (+0)`);
  }
  
  // 3. IP 风险评分 (50 分)
  const ipRiskScore = behavior.ipRiskScore || 0;
  const ipScore = 50 - ipRiskScore;
  score += ipScore;
  details.push(`IP risk score: ${ipRiskScore}/50 (+${ipScore})`);
  
  return { score: Math.max(0, Math.min(score, 250)), details };
}

/**
 * 获取信用等级
 */
export function getCreditGrade(score: number): CreditGrade {
  return SCORE_RANGES.find(range => score >= range.minScore && score <= range.maxScore) 
    || SCORE_RANGES[SCORE_RANGES.length - 1];
}

/**
 * 计算综合信用评分
 * 
 * @param profile 用户资料
 * @returns 信用评分结果
 */
export function calculateCreditScore(profile: UserProfile): CreditScoreResult {
  // 计算各维度原始分数
  const basicResult = calculateBasicScore(profile);
  const employmentResult = calculateEmploymentScore(profile);
  const contactResult = calculateContactScore(profile);
  const socialResult = calculateSocialScore(profile);
  const behaviorResult = calculateBehaviorScore(profile);
  
  // 各维度权重
  const weights = {
    basic: 0.20,
    employment: 0.25,
    contact: 0.15,
    social: 0.15,
    behavior: 0.25
  };
  
  // 各维度最大分数
  const maxScores = {
    basic: 200,
    employment: 250,
    contact: 150,
    social: 150,
    behavior: 250
  };
  
  // 计算加权分数 (转换为 1000 分制)
  const weightedScore = 
    (basicResult.score / maxScores.basic) * 1000 * weights.basic +
    (employmentResult.score / maxScores.employment) * 1000 * weights.employment +
    (contactResult.score / maxScores.contact) * 1000 * weights.contact +
    (socialResult.score / maxScores.social) * 1000 * weights.social +
    (behaviorResult.score / maxScores.behavior) * 1000 * weights.behavior;
  
  // 确保分数在 300-1000 范围内
  const totalScore = Math.max(300, Math.min(1000, Math.round(weightedScore)));
  
  // 获取信用等级
  const grade = getCreditGrade(totalScore);
  
  return {
    totalScore,
    grade: grade.grade,
    dimensions: {
      basic: {
        score: basicResult.score,
        maxScore: maxScores.basic,
        weight: weights.basic
      },
      employment: {
        score: employmentResult.score,
        maxScore: maxScores.employment,
        weight: weights.employment
      },
      contact: {
        score: contactResult.score,
        maxScore: maxScores.contact,
        weight: weights.contact
      },
      social: {
        score: socialResult.score,
        maxScore: maxScores.social,
        weight: weights.social
      },
      behavior: {
        score: behaviorResult.score,
        maxScore: maxScores.behavior,
        weight: weights.behavior
      }
    },
    details: {
      basic: basicResult.details,
      employment: employmentResult.details,
      contact: contactResult.details,
      social: socialResult.details,
      behavior: behaviorResult.details
    }
  };
}

/**
 * 根据信用等级获取推荐额度范围
 */
export function getRecommendedLimit(grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'): { min: number; max: number } {
  const gradeInfo = SCORE_RANGES.find(g => g.grade === grade);
  return gradeInfo ? gradeInfo.limitRange : { min: 0, max: 0 };
}

/**
 * 根据信用等级获取利率
 */
export function getInterestRate(grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'): number {
  const gradeInfo = SCORE_RANGES.find(g => g.grade === grade);
  return gradeInfo ? gradeInfo.interestRate : 0;
}

/**
 * 获取所有信用等级信息
 */
export function getAllCreditGrades(): CreditGrade[] {
  return [...SCORE_RANGES];
}
