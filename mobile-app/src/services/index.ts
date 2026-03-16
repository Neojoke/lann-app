/**
 * 服务层索引文件
 * Services Index
 * 
 * 导出所有业务服务，方便统一导入
 */

// API 客户端基类
export { ApiClient } from './api.client';

// 核心服务
export { ApiService } from './api.service';
export { AuthService } from './auth.service';

// 业务服务（React 版本，单例模式）
export { CreditService, creditService } from './credit.service';
export type { CreditScoreData, CreditScoreResult } from './credit.service';

export { LoanService, loanService } from './loan.service';
export { RepayService, repayService } from './repay.service';
export { UserService } from './user.service';
