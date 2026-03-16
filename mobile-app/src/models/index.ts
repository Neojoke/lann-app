/**
 * 模型索引文件
 * Models Index
 */

// 导出用户相关类型
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// 导出借款简化类型
export interface Loan {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'rejected';
  dueDate: Date;
  remainingAmount: number;
}

// 导出信用信息简化类型
export interface CreditInfo {
  total: number;
  used: number;
  available: number;
}

// 导出信用服务完整类型
export * from './credit';

// 导出借款服务完整类型
export * from './loan';

// 导出还款服务完整类型
export * from './repay';
