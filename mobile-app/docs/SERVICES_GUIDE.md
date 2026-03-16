# Lann 前端服务层使用指南

**版本:** v1.0  
**创建日期:** 2026-03-17  
**状态:** ✅ 已完成

---

## 📋 目录

1. [概述](#1-概述)
2. [服务架构](#2-服务架构)
3. [使用示例](#3-使用示例)
4. [API 参考](#4-api-参考)
5. [错误处理](#5-错误处理)

---

## 1. 概述

前端服务层提供与后端 API 的交互功能，支持双语（英语/泰语）错误消息和自动语言标识传递。

### 特性

- ✅ 自动语言标识传递（Accept-Language 请求头）
- ✅ 多语言错误消息处理
- ✅ 统一的 API 客户端基类
- ✅ 完整的 TypeScript 类型定义
- ✅ 单例模式，方便使用

---

## 2. 服务架构

```
mobile-app/src/
├── services/
│   ├── api.client.ts          # API 客户端基类
│   ├── credit.service.ts      # 信用服务
│   ├── loan.service.ts        # 借款服务
│   ├── repay.service.ts       # 还款服务
│   └── index.ts               # 服务导出
├── models/
│   ├── credit.ts              # 信用类型定义
│   ├── loan.ts                # 借款类型定义
│   ├── repay.ts               # 还款类型定义
│   └── index.ts               # 类型导出
└── interceptors/
    └── language.interceptor.ts # 语言工具类
```

---

## 3. 使用示例

### 3.1 导入服务

```typescript
import { creditService, loanService, repayService } from './services';
// 或
import { CreditService } from './services/credit.service';
```

### 3.2 信用服务示例

```typescript
import { creditService } from './services';

// 申请信用额度
const applyCredit = async () => {
  try {
    const response = await creditService.applyCredit({
      consent: {
        credit_check: true,
        data_processing: true,
        terms_accepted: true,
      },
      language: 'th',
    });
    
    if (response.success) {
      console.log('申请成功:', response.data);
    } else {
      console.error('申请失败:', response.error);
    }
  } catch (error) {
    console.error('错误:', error);
  }
};

// 查询信用状态
const checkCreditStatus = async () => {
  const response = await creditService.getCreditStatus();
  if (response.success && response.data) {
    console.log('信用状态:', response.data);
  }
};

// 查询可用额度
const checkCreditLimit = async () => {
  const response = await creditService.getCreditLimit();
  if (response.success && response.data) {
    console.log('可用额度:', response.data.available_limit);
  }
};

// 计算信用评分（前端工具）
const scoreData = {
  monthlyIncome: 30000,
  employmentStatus: 'employed_fulltime',
  hasVerifiedPhone: true,
  hasVerifiedEmail: true,
  hasVerifiedAddress: true,
  hasEmergencyContact: true,
  verifiedEmergencyContact: false,
  hasStableDevice: true,
  completeProfile: true,
  previousGoodHistory: false,
};

const scoreResult = creditService.calculateCreditScore(scoreData);
console.log('信用评分:', scoreResult.totalScore);
console.log('信用等级:', scoreResult.grade);
console.log('可批额度:', scoreResult.creditLimit);
```

### 3.3 借款服务示例

```typescript
import { loanService } from './services';

// 借款申请
const applyLoan = async () => {
  const response = await loanService.applyLoan({
    product_id: 'payday-standard',
    amount: 10000,
    term_days: 30,
    language: 'th',
  });
  
  if (response.success && response.data) {
    console.log('借款申请成功:', response.data);
  }
};

// 确认借款（电子签约）
const confirmLoan = async (applicationId: string, signature: string) => {
  const response = await loanService.confirmLoan({
    application_id: applicationId,
    signature: signature,
    language: 'th',
  });
  
  if (response.success) {
    console.log('借款确认成功');
  }
};

// 查询借款状态
const checkLoanStatus = async (loanId: string) => {
  const response = await loanService.getLoanStatus(loanId);
  if (response.success && response.data) {
    console.log('借款状态:', response.data.status);
  }
};

// 获取借款详情
const getLoanDetails = async (loanId: string) => {
  const response = await loanService.getLoanDetails(loanId);
  if (response.success && response.data) {
    console.log('借款详情:', response.data);
  }
};

// 获取产品列表
const getProducts = async () => {
  const response = await loanService.getProducts();
  if (response.success && response.data) {
    console.log('产品列表:', response.data.products);
  }
};

// 取消借款申请
const cancelLoan = async (applicationId: string) => {
  const response = await loanService.cancelLoan(applicationId);
  if (response.success) {
    console.log('取消成功');
  }
};

// 计算利息（前端工具）
const interest = loanService.calculateInterest(10000, 30, 0.01);
console.log('利息:', interest.interest);
console.log('总还款:', interest.totalRepayment);
```

### 3.4 还款服务示例

```typescript
import { repayService } from './services';

// 获取还款计划
const getRepaymentSchedule = async (loanId: string) => {
  const response = await repayService.getRepaymentSchedule(loanId);
  if (response.success && response.data) {
    console.log('还款计划:', response.data);
  }
};

// 创建还款
const createRepayment = async (loanId: string, amount: number, method: string) => {
  const response = await repayService.createRepayment({
    loan_id: loanId,
    amount: amount,
    payment_method: method,
    language: 'th',
  });
  
  if (response.success && response.data) {
    console.log('还款成功:', response.data);
  }
};

// 获取还款渠道
const getRepaymentChannels = async () => {
  const response = await repayService.getRepaymentChannels();
  if (response.success && response.data) {
    console.log('还款渠道:', response.data.channels);
  }
};

// 提前还款试算
const prepaymentCalc = async (loanId: string) => {
  const response = await repayService.getPrepaymentCalc(loanId, 'full');
  if (response.success && response.data) {
    console.log('提前还款试算:', response.data);
  }
};

// 计算罚息（前端工具）
const penalty = repayService.calculatePenalty(10000, 5, 0.005);
console.log('罚息:', penalty); // 10000 × 0.005 × 5 = 250 THB

// 计算提前还款金额（前端工具）
const prepayment = repayService.calculatePrepaymentAmount(10000, 15, 0.01);
console.log('提前还款总额:', prepayment.total);
console.log('节省金额:', prepayment.savings);
```

---

## 4. API 参考

### 4.1 信用服务 (CreditService)

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `applyCredit(request)` | 申请信用额度 | ApplyCreditRequest | ApiResponse<ApplyCreditResponse> |
| `getCreditStatus()` | 查询信用状态 | - | ApiResponse<CreditStatusResponse> |
| `getCreditLimit()` | 查询可用额度 | - | ApiResponse<CreditLimitResponse> |
| `requestReview(request)` | 申请复审 | RequestReviewRequest | ApiResponse<void> |
| `calculateCreditScore(data)` | 计算信用评分 | CreditScoreData | CreditScoreResult |

### 4.2 借款服务 (LoanService)

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `applyLoan(request)` | 借款申请 | ApplyLoanRequest | ApiResponse<ApplyLoanResponse> |
| `confirmLoan(request)` | 确认借款 | ConfirmLoanRequest | ApiResponse<void> |
| `getLoanStatus(loanId)` | 查询借款状态 | string | ApiResponse<LoanStatusResponse> |
| `getLoanDetails(loanId)` | 获取借款详情 | string | ApiResponse<LoanDetailsResponse> |
| `getProducts()` | 获取产品列表 | - | ApiResponse<GetProductsResponse> |
| `cancelLoan(applicationId)` | 取消借款申请 | string | ApiResponse<void> |
| `calculateInterest(...)` | 计算利息 | (principal, days, rate, method) | {interest, totalRepayment, dailyInterest} |

### 4.3 还款服务 (RepayService)

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `getRepaymentSchedule(loanId)` | 获取还款计划 | string | ApiResponse<RepaymentScheduleResponse> |
| `createRepayment(request)` | 创建还款 | CreateRepaymentRequest | ApiResponse<CreateRepaymentResponse> |
| `getRepaymentChannels()` | 获取还款渠道 | - | ApiResponse<GetRepaymentChannelsResponse> |
| `getPrepaymentCalc(...)` | 提前还款试算 | (loanId, type, amount?) | ApiResponse<PrepaymentCalcResponse> |
| `calculatePenalty(...)` | 计算罚息 | (principal, overdueDays, penaltyRate) | number |
| `calculatePrepaymentAmount(...)` | 计算提前还款 | (principal, usedDays, dailyRate, feePercentage) | {principal, interest, fee, total, savings} |

---

## 5. 错误处理

### 5.1 错误响应结构

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;        // 英文错误消息
    message_th?: string;    // 泰文错误消息
  };
}
```

### 5.2 错误处理示例

```typescript
import { creditService } from './services';

const handleCreditApply = async () => {
  try {
    const response = await creditService.applyCredit({
      consent: {
        credit_check: true,
        data_processing: true,
        terms_accepted: true,
      },
      language: 'th',
    });
    
    if (!response.success) {
      // 处理业务错误
      const errorCode = response.error?.code;
      const errorMessage = response.error?.message_th || response.error?.message;
      
      switch (errorCode) {
        case 'CREDIT_APPLICATION_PENDING':
          alert('您的申请正在审核中');
          break;
        case 'INSUFFICIENT_CREDIT_LIMIT':
          alert('额度不足');
          break;
        default:
          alert(errorMessage || '申请失败');
      }
      return;
    }
    
    // 处理成功
    console.log('申请成功:', response.data);
    
  } catch (error) {
    // 处理网络错误或其他异常
    console.error('网络错误:', error);
    alert('网络错误，请检查连接后重试');
  }
};
```

### 5.3 常见错误码

| 错误码 | 英文说明 | 泰文说明 |
|--------|---------|---------|
| `UNAUTHORIZED` | Authentication required | ต้องการการยืนยันตัวตน |
| `CREDIT_APPLICATION_PENDING` | Application under review | คำขออยู่ระหว่างการพิจารณา |
| `INSUFFICIENT_CREDIT_LIMIT` | Insufficient credit limit | วงเงินเครดิตไม่เพียงพอ |
| `LOAN_APPLICATION_FAILED` | Loan application failed | การขอสินเชื่อไม่สำเร็จ |
| `REPAYMENT_FAILED` | Repayment failed | การชำระเงินล้มเหลว |
| `NETWORK_ERROR` | Network error | ข้อผิดพลาดของเครือข่าย |
| `SERVER_ERROR` | Server error | ข้อผิดพลาดของเซิร์ฟเวอร์ |

---

## 6. 语言切换

服务会自动使用当前 i18next 配置的语言。如需手动切换：

```typescript
import i18next from 'i18next';

// 切换为泰语
await i18next.changeLanguage('th');

// 切换为英语
await i18next.changeLanguage('en');
```

所有后续 API 请求会自动携带新的语言标识。

---

**最后更新:** 2026-03-17  
**负责人:** 小满 (Subagent)  
**状态:** ✅ 已完成
