# Lann 业务模型设计

**版本:** v1.0  
**创建日期:** 2026-03-16  
**状态:** 🟡 设计中

---

## 📋 目录

1. [双语支持 (i18n)](#1-双语支持-i18n)
2. [信用服务模型](#2-信用服务模型)
3. [借款产品模型](#3-借款产品模型)
4. [还款服务模型](#4-还款服务模型)
5. [债务与资产模型](#5-债务与资产模型)
6. [数据库设计](#6-数据库设计)
7. [API 设计](#7-api-设计)

---

## 1. 双语支持 (i18n)

### 1.1 架构设计

```
┌─────────────────┐    ┌─────────────────┐
│   Ionic React   │    │   Backend API   │
│     Client      │    │     Server      │
├─────────────────┤    ├─────────────────┤
│ i18next         │    │ Accept-Language │
│ - en.json       │───▶│ Header          │
│ - th.json       │    │                 │
└─────────────────┘    └─────────────────┘
       │                        │
       ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│  请求头携带     │    │  响应多语言      │
│  Accept-Language│    │  错误消息        │
└─────────────────┘    └─────────────────┘
```

### 1.2 语言标识传递

**客户端请求:**
```typescript
// HTTP 请求头
headers: {
  'Accept-Language': 'th-TH' // 或 'en-US'
}

// API 调用示例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept-Language': currentLanguage // 'th' | 'en'
  }
});
```

**后端处理:**
```typescript
// Hono middleware
app.use('*', async (c, next) => {
  const lang = c.req.header('Accept-Language') || 'en';
  c.set('language', lang.startsWith('th') ? 'th' : 'en');
  await next();
});

// 错误消息多语言
const messages = {
  en: { invalid_phone: 'Invalid phone number' },
  th: { invalid_phone: 'เบอร์โทรศัพท์ไม่ถูกต้อง' }
};
```

### 1.3 用户资料语言存储

```typescript
interface UserProfile {
  // ... 其他字段
  preferredLanguage: 'en' | 'th';  // 用户偏好语言
  submittedLanguage: 'en' | 'th';  // 提交资料时的语言
}
```

---

## 2. 信用服务模型

### 2.1 信用评估流程

```
┌─────────────────┐
│  用户提交资料   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  资料完整性检查 │
│  (Completeness) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  反欺诈筛查     │
│  (Fraud Check)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  信用评分计算   │
│  (Credit Score) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  额度决策       │
│  (Decision)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  授予额度       │
│  (Credit Limit) │
└─────────────────┘
```

### 2.2 信用评分模型

**评分维度:**

| 维度 | 权重 | 评分项 | 分值范围 |
|------|------|--------|---------|
| **基本信息** | 20% | 年龄、国籍、居住稳定性 | 0-200 |
| **工作信息** | 25% | 工作稳定性、收入水平、行业 | 0-250 |
| **联系方式** | 15% | 手机号使用时长、邮箱验证 | 0-150 |
| **社交关系** | 15% | 紧急联系人可信度 | 0-150 |
| **行为数据** | 25% | 设备指纹、申请行为 | 0-250 |
| **总计** | 100% | - | 0-1000 |

**评分计算公式:**
```typescript
creditScore = 
  (basicScore * 0.20) +
  (employmentScore * 0.25) +
  (contactScore * 0.15) +
  (socialScore * 0.15) +
  (behaviorScore * 0.25)
```

**评分等级:**

| 分数范围 | 等级 | 额度范围 | 利率 | 说明 |
|---------|------|---------|------|------|
| 750-1000 | A+ (优秀) | 30,000-50,000 THB | 0.8%/天 | 优先审批 |
| 650-749 | A (良好) | 20,000-30,000 THB | 1.0%/天 | 标准审批 |
| 550-649 | B (一般) | 10,000-20,000 THB | 1.2%/天 | 谨慎审批 |
| 450-549 | C (较差) | 5,000-10,000 THB | 1.5%/天 | 严格审批 |
| 300-449 | D (差) | 1,000-5,000 THB | 拒绝 | 拒绝或观察 |
| <300 | F (不合格) | 拒绝 | 拒绝 | 黑名单 |

### 2.3 信用额度管理

**额度属性:**
```typescript
interface CreditLimit {
  userId: string;
  
  // 额度信息
  totalLimit: number;      // 总额度
  availableLimit: number;  // 可用额度
  usedLimit: number;       // 已用额度
  frozenLimit: number;     // 冻结额度 (如有争议)
  
  // 有效期
  grantedAt: Date;         // 授予时间
  expiresAt: Date;         // 过期时间
  validityDays: number;    // 有效期天数 (默认 365 天)
  
  // 状态
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  
  // 调整历史
  adjustmentHistory: LimitAdjustment[];
  
  // 复审信息
  reviewAt: Date;          // 下次复审时间
  reviewScore: number;     // 复审评分
}
```

**额度有效期规则:**

| 场景 | 规则 | 处理方式 |
|------|------|---------|
| **正常到期** | 额度有效期届满 | 自动触发复审 |
| **额度用完** | 可用额度 = 0 | 可申请临时额度或还款后恢复 |
| **长期未用** | 90 天无借款 | 额度降为 50% 或冻结 |
| **逾期记录** | 出现逾期 | 冻结额度或降低额度 |
| **信用提升** | 按时还款 3 次+ | 自动提升额度 20-50% |

**额度到期处理流程:**
```
额度到期前 30 天 → 发送提醒通知
                ↓
额度到期前 7 天  → 再次提醒 + 引导复审
                ↓
额度到期日      → 自动触发复审流程
                ↓
复审通过        → 授予新额度 (可能调整)
复审不通过      → 额度冻结/降低
```

**临时额度:**
```typescript
interface TemporaryLimit {
  userId: string;
  baseLimit: number;       // 基础额度
  temporaryLimit: number;  // 临时额度
  totalLimit: number;      // 总额度 = base + temporary
  
  // 临时额度有效期
  temporaryExpiresAt: Date;
  
  // 使用条件
  minScore: number;        // 最低评分要求
  repaymentCount: number;  // 最少还款次数
}
```

---

## 3. 借款产品模型

### 3.1 产品抽象设计

**核心概念:**
```
借款产品 (Loan Product)
  ├── 产品类型 (Product Type)
  ├── 借款条件 (Loan Terms)
  ├── 费率配置 (Fee Configuration)
  └── 还款方式 (Repayment Methods)
```

**产品配置模型:**
```typescript
interface LoanProduct {
  id: string;
  name: { en: string; th: string };  // 产品名称 (双语)
  
  // 产品类型
  type: 'payday' | 'installment' | 'revolving';
  
  // 借款金额范围
  minAmount: number;       // 最低借款金额
  maxAmount: number;       // 最高借款金额
  
  // 借款期限配置
  terms: LoanTerm[];       // 支持的期限选项
  
  // 费率配置
  interestRate: InterestRate;
  fees: Fee[];
  
  // 还款方式
  repaymentMethods: RepaymentMethod[];
  
  // 资格要求
  requirements: Requirement[];
  
  // 状态
  status: 'active' | 'inactive' | 'deprecated';
  
  // 适用用户群
  targetSegment: 'new' | 'regular' | 'premium';
  
  // 创建/更新
  createdAt: Date;
  updatedAt: Date;
}

interface LoanTerm {
  days: number;            // 期限天数
  label: { en: string; th: string };
  minAmount: number;       // 该期限最低金额
  maxAmount: number;       // 该期限最高金额
  repaymentType: 'bullet' | 'installment';  // 到期一次性/分期
}

interface InterestRate {
  type: 'daily' | 'monthly' | 'annual';
  rate: number;            // 利率值
  calculationMethod: 'flat' | 'reducing';  // 固定/递减
}

interface Fee {
  type: 'processing' | 'late' | 'prepayment' | 'service';
  amount?: number;         // 固定金额
  percentage?: number;     // 百分比
  minAmount?: number;      // 最低收费
  maxAmount?: number;      // 最高收费
}
```

### 3.2 产品类型定义

#### 类型 1: 工资日贷款 (Payday Loan)

**特点:**
- 短期借款 (7-30 天)
- 到期一次性还本付息
- 小额度 (1,000-50,000 THB)
- 快速审批

**配置示例:**
```typescript
const paydayProduct: LoanProduct = {
  id: 'payday-standard',
  name: { en: 'Payday Loan', th: 'เงินด่วนรายวัน' },
  type: 'payday',
  minAmount: 1000,
  maxAmount: 50000,
  terms: [
    { days: 7, label: { en: '7 Days', th: '7 วัน' }, repaymentType: 'bullet' },
    { days: 14, label: { en: '14 Days', th: '14 วัน' }, repaymentType: 'bullet' },
    { days: 21, label: { en: '21 Days', th: '21 วัน' }, repaymentType: 'bullet' },
    { days: 30, label: { en: '30 Days', th: '30 วัน' }, repaymentType: 'bullet' },
  ],
  interestRate: {
    type: 'daily',
    rate: 0.01,  // 1%/天
    calculationMethod: 'flat',
  },
  fees: [
    { type: 'late', percentage: 0.005, minAmount: 50 },  // 逾期 0.5%/天，最低 50 THB
  ],
  repaymentMethods: ['bank_transfer', 'convenience_store', 'promptpay', 'truemoney'],
};
```

#### 类型 2: 分期贷款 (Installment Loan)

**特点:**
- 中期借款 (1-12 个月)
- 等额本息/等额本金
- 中额度 (5,000-100,000 THB)
- 需要更严格审核

**配置示例:**
```typescript
const installmentProduct: LoanProduct = {
  id: 'installment-standard',
  name: { en: 'Installment Loan', th: 'เงินผ่อนชำระ' },
  type: 'installment',
  minAmount: 5000,
  maxAmount: 100000,
  terms: [
    { days: 90, label: { en: '3 Months', th: '3 เดือน' }, repaymentType: 'installment' },
    { days: 180, label: { en: '6 Months', th: '6 เดือน' }, repaymentType: 'installment' },
    { days: 365, label: { en: '12 Months', th: '12 เดือน' }, repaymentType: 'installment' },
  ],
  interestRate: {
    type: 'monthly',
    rate: 0.02,  // 2%/月
    calculationMethod: 'reducing',
  },
  fees: [
    { type: 'processing', percentage: 0.02, maxAmount: 1000 },  // 手续费 2%，最高 1000 THB
    { type: 'late', percentage: 0.005 },
    { type: 'prepayment', percentage: 0.01 },  // 提前还款手续费 1%
  ],
  repaymentMethods: ['bank_transfer', 'promptpay'],
};
```

#### 类型 3: 循环额度 (Revolving Credit)

**特点:**
- 授信额度内随借随还
- 按日计息
- 还款后额度恢复
- 类似信用卡

**配置示例:**
```typescript
const revolvingProduct: LoanProduct = {
  id: 'revolving-premium',
  name: { en: 'Revolving Credit', th: 'วงเงินหมุนเวียน' },
  type: 'revolving',
  minAmount: 1000,
  maxAmount: 100000,
  terms: [
    { days: 30, label: { en: 'Monthly', th: 'รายเดือน' }, repaymentType: 'installment' },
  ],
  interestRate: {
    type: 'daily',
    rate: 0.008,  // 0.8%/天 (优质用户)
    calculationMethod: 'reducing',
  },
  fees: [
    { type: 'service', amount: 100 },  // 月服务费 100 THB
    { type: 'late', percentage: 0.005 },
  ],
  repaymentMethods: ['bank_transfer', 'promptpay', 'truemoney'],
  targetSegment: 'premium',
};
```

### 3.3 借款生命周期

```
┌─────────────┐
│  借款申请   │
│  (Apply)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  信用检查   │
│  (Check)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  审批决策   │
│  (Approve)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  电子签约   │
│  (Sign)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  放款       │
│  (Disburse) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  还款中     │
│  (Repaying) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  已结清     │
│  (Completed)│
└─────────────┘
```

**借款状态机:**
```typescript
type LoanStatus = 
  | 'pending'       // 待审批
  | 'approved'      // 已批准
  | 'rejected'      // 已拒绝
  | 'signing'       // 签约中
  | 'disbursing'    // 放款中
  | 'active'        // 还款中
  | 'overdue'       // 逾期
  | 'completed'     // 已结清
  | 'written_off';  // 已核销
```

---

## 4. 还款服务模型

### 4.1 还款方式配置

```typescript
interface RepaymentChannel {
  id: string;
  name: { en: string; th: string };
  type: RepaymentChannelType;
  
  // 渠道配置
  config: {
    bankCode?: string;      // 银行代码
    accountNumber?: string; // 账号
    promptPayId?: string;   // PromptPay ID
    storeCode?: string;     // 便利店代码
  };
  
  // 费用配置
  fees: {
    fixed?: number;         // 固定费用
    percentage?: number;    // 百分比
    payer: 'user' | 'platform';  // 谁承担费用
  };
  
  // 限制
  limits: {
    minAmount: number;
    maxAmount: number;
    dailyLimit?: number;
  };
  
  // 到账时间
  settlementTime: 'instant' | 'within_2h' | 'next_day';
  
  // 状态
  status: 'active' | 'inactive' | 'maintenance';
}

type RepaymentChannelType = 
  | 'bank_transfer'     // 银行转账
  | 'promptpay'         // PromptPay
  | 'convenience_store' // 便利店 (7-11, FamilyMart)
  | 'e_wallet'          // 电子钱包 (TrueMoney)
  | 'atm';              // ATM
```

### 4.2 还款分配逻辑

**还款顺序:**
```typescript
// 还款金额分配顺序
const repaymentAllocationOrder = [
  'penalty',      // 1. 罚息
  'late_fee',     // 2. 逾期费用
  'interest',     // 3. 利息
  'principal',    // 4. 本金
  'fee',          // 5. 其他费用
];

// 分配算法
function allocateRepayment(amount: number, dueItems: DueItem[]): Allocation[] {
  const allocations: Allocation[] = [];
  let remaining = amount;
  
  for (const item of dueItems) {
    if (remaining <= 0) break;
    
    const allocated = Math.min(remaining, item.amount);
    allocations.push({
      type: item.type,
      amount: allocated,
      originalAmount: item.amount,
    });
    
    remaining -= allocated;
  }
  
  return allocations;
}
```

### 4.3 逾期管理

**逾期阶段:**
```typescript
interface OverdueStage {
  days: number;        // 逾期天数
  stage: number;       // 逾期阶段 (1-4)
  action: string;      // 催收动作
  penaltyRate: number; // 罚息率
}

const overdueStages: OverdueStage[] = [
  { days: 1, stage: 1, action: 'sms_reminder', penaltyRate: 0.005 },
  { days: 3, stage: 2, action: 'phone_call', penaltyRate: 0.005 },
  { days: 7, stage: 3, action: 'third_party_collection', penaltyRate: 0.007 },
  { days: 30, stage: 4, action: 'legal_action', penaltyRate: 0.01 },
];
```

**罚息计算:**
```typescript
function calculatePenalty(
  principal: number,
  overdueDays: number,
  penaltyRate: number
): number {
  // 罚息 = 逾期本金 × 罚息率 × 逾期天数
  return principal * penaltyRate * overdueDays;
}

// 示例：逾期 10,000 THB，5 天，罚息率 0.5%/天
// 罚息 = 10,000 × 0.005 × 5 = 250 THB
```

### 4.4 提前还款处理

**提前还款类型:**
```typescript
type PrepaymentType = 'full' | 'partial';

interface PrepaymentConfig {
  allowed: boolean;           // 是否允许提前还款
  feeType: 'none' | 'fixed' | 'percentage';
  feeAmount?: number;         // 固定费用
  feePercentage?: number;     // 百分比费用
  minDaysBeforeDue?: number;  // 到期前最少天数
}

// Lann 政策：提前还款免费
const lannPrepaymentConfig: PrepaymentConfig = {
  allowed: true,
  feeType: 'none',
};
```

**提前还款利息计算:**
```typescript
// 按实际使用天数计算利息
function calculatePrepaymentAmount(
  principal: number,
  usedDays: number,
  dailyRate: number
): number {
  const interest = principal * dailyRate * usedDays;
  return principal + interest;
}

// 示例：借款 10,000 THB，30 天期，日息 1%
// 第 15 天提前还款
// 利息 = 10,000 × 0.01 × 15 = 150 THB
// 总还款 = 10,150 THB (而非原计划的 13,000 THB)
```

---

## 5. 债务与资产模型

### 5.1 债务模型

```typescript
interface Debt {
  id: string;
  userId: string;
  loanId: string;
  
  // 债务金额
  principal: number;         // 本金
  interest: number;          // 利息
  penalty: number;           // 罚息
  fees: number;              // 其他费用
  totalAmount: number;       // 总金额
  
  // 还款状态
  paidPrincipal: number;     // 已还本金
  paidInterest: number;      // 已还利息
  paidPenalty: number;       // 已还罚息
  paidFees: number;          // 已还费用
  
  // 剩余金额
  remainingPrincipal: number;
  remainingInterest: number;
  remainingTotal: number;
  
  // 到期信息
  dueDate: Date;
  isOverdue: boolean;
  overdueDays: number;
  
  // 状态
  status: 'active' | 'overdue' | 'completed' | 'written_off';
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 资产模型

```typescript
interface Asset {
  id: string;
  userId: string;
  
  // 资产类型
  type: 'wallet' | 'bank_account' | 'investment';
  
  // 资产信息
  balance: number;           // 余额
  currency: 'THB' | 'USD';
  
  // 银行账户信息
  bankInfo?: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountType: 'savings' | 'checking';
  };
  
  // 电子钱包信息
  walletInfo?: {
    provider: 'truemoney' | 'rabbit' | 'promptpay';
    walletId: string;
  };
  
  // 状态
  status: 'active' | 'frozen' | 'closed';
  isVerified: boolean;
  isPrimary: boolean;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.3 交易流水

```typescript
interface Transaction {
  id: string;
  userId: string;
  loanId?: string;
  
  // 交易类型
  type: 'disbursement' | 'repayment' | 'fee' | 'penalty' | 'refund';
  
  // 交易金额
  amount: number;
  currency: 'THB';
  
  // 交易方向
  direction: 'in' | 'out';  // in=入账，out=出账
  
  // 支付方式
  paymentMethod: RepaymentChannelType;
  paymentChannelId: string;
  
  // 交易状态
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  
  // 关联信息
  referenceId: string;       // 外部参考号
  description: string;
  
  // 时间戳
  createdAt: Date;
  completedAt?: Date;
}
```

---

## 6. 数据库设计

### 6.1 核心表结构

```sql
-- ========== 用户与信用 ==========

-- 用户表
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  status TEXT DEFAULT 'pending',  -- pending/active/suspended/banned
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 用户资料表
CREATE TABLE user_profiles (
  user_id TEXT PRIMARY KEY,
  
  -- 基本信息
  full_name_th TEXT,
  full_name_en TEXT,
  national_id TEXT UNIQUE,
  date_of_birth TEXT,
  gender TEXT,
  
  -- 联系信息
  email TEXT,
  address TEXT,
  province TEXT,
  district TEXT,
  subdistrict TEXT,
  postal_code TEXT,
  
  -- 工作信息
  company_name TEXT,
  position TEXT,
  monthly_income REAL,
  work_address TEXT,
  employment_type TEXT,  -- employee/self_employed/business_owner
  
  -- 紧急联系人
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  
  -- 语言偏好
  preferred_language TEXT DEFAULT 'th',
  
  -- 状态
  profile_completeness REAL DEFAULT 0,
  kyc_status TEXT DEFAULT 'pending',  -- pending/verified/rejected
  kyc_verified_at TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 信用额度表
CREATE TABLE credit_limits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- 额度信息
  total_limit REAL NOT NULL,
  available_limit REAL NOT NULL,
  used_limit REAL NOT NULL DEFAULT 0,
  frozen_limit REAL NOT NULL DEFAULT 0,
  
  -- 评分
  credit_score INTEGER,
  score_details TEXT,  -- JSON
  
  -- 有效期
  granted_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  validity_days INTEGER DEFAULT 365,
  
  -- 状态
  status TEXT DEFAULT 'active',  -- active/expired/suspended/revoked
  
  -- 复审信息
  review_at TEXT,
  last_review_score INTEGER,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ========== 借款产品 ==========

-- 借款产品表
CREATE TABLE loan_products (
  id TEXT PRIMARY KEY,
  
  -- 产品信息
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  type TEXT NOT NULL,  -- payday/installment/revolving
  
  -- 金额范围
  min_amount REAL NOT NULL,
  max_amount REAL NOT NULL,
  
  -- 费率配置
  interest_rate_type TEXT NOT NULL,  -- daily/monthly/annual
  interest_rate REAL NOT NULL,
  calculation_method TEXT NOT NULL,  -- flat/reducing
  
  -- 费用配置
  fee_config TEXT,  -- JSON
  
  -- 期限配置
  term_options TEXT,  -- JSON array of {days, label_th, label_en, repayment_type}
  
  -- 还款方式
  repayment_methods TEXT,  -- JSON array
  
  -- 状态
  status TEXT DEFAULT 'active',
  target_segment TEXT DEFAULT 'regular',  -- new/regular/premium
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 借款申请表
CREATE TABLE loan_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  
  -- 借款信息
  amount REAL NOT NULL,
  term_days INTEGER NOT NULL,
  purpose TEXT,
  
  -- 审批信息
  status TEXT DEFAULT 'pending',  -- pending/approved/rejected/cancelled
  approved_amount REAL,
  approved_term_days INTEGER,
  interest_rate REAL,
  rejection_reason TEXT,
  
  -- 审批人
  reviewed_by TEXT,
  reviewed_at TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES loan_products(id)
);

-- 借款表
CREATE TABLE loans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  application_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  
  -- 借款信息
  principal REAL NOT NULL,
  interest_rate REAL NOT NULL,
  term_days INTEGER NOT NULL,
  
  -- 金额计算
  total_interest REAL NOT NULL,
  total_repayment REAL NOT NULL,
  paid_amount REAL NOT NULL DEFAULT 0,
  remaining_amount REAL NOT NULL,
  
  -- 日期
  disbursed_at TEXT,
  due_date TEXT NOT NULL,
  completed_at TEXT,
  
  -- 状态
  status TEXT DEFAULT 'pending',  -- pending/disbursed/active/overdue/completed/written_off
  
  -- 逾期信息
  is_overdue INTEGER DEFAULT 0,
  overdue_days INTEGER DEFAULT 0,
  penalty_amount REAL DEFAULT 0,
  
  -- 合同
  contract_url TEXT,
  signed_at TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (application_id) REFERENCES loan_applications(id),
  FOREIGN KEY (product_id) REFERENCES loan_products(id)
);

-- ========== 还款 ==========

-- 还款计划表
CREATE TABLE repayment_schedules (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL,
  
  -- 期数信息
  installment_number INTEGER NOT NULL,
  total_installments INTEGER NOT NULL,
  
  -- 应还金额
  principal_amount REAL NOT NULL,
  interest_amount REAL NOT NULL,
  fee_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  
  -- 已还金额
  paid_principal REAL DEFAULT 0,
  paid_interest REAL DEFAULT 0,
  paid_fee REAL DEFAULT 0,
  paid_total REAL DEFAULT 0,
  
  -- 日期
  due_date TEXT NOT NULL,
  paid_at TEXT,
  
  -- 状态
  status TEXT DEFAULT 'pending',  -- pending/partial/paid/overdue
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (loan_id) REFERENCES loans(id)
);

-- 还款记录表
CREATE TABLE repayments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  loan_id TEXT NOT NULL,
  schedule_id TEXT,
  
  -- 还款金额
  amount REAL NOT NULL,
  
  -- 分配明细
  principal_paid REAL DEFAULT 0,
  interest_paid REAL DEFAULT 0,
  penalty_paid REAL DEFAULT 0,
  fee_paid REAL DEFAULT 0,
  
  -- 支付方式
  payment_method TEXT NOT NULL,
  payment_channel_id TEXT,
  transaction_ref TEXT,
  
  -- 状态
  status TEXT DEFAULT 'pending',  -- pending/processing/completed/failed
  
  -- 时间
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (loan_id) REFERENCES loans(id),
  FOREIGN KEY (schedule_id) REFERENCES repayment_schedules(id)
);

-- ========== 交易流水 ==========

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  loan_id TEXT,
  
  -- 交易信息
  type TEXT NOT NULL,  -- disbursement/repayment/fee/penalty/refund
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'THB',
  direction TEXT NOT NULL,  -- in/out
  
  -- 支付信息
  payment_method TEXT,
  payment_channel_id TEXT,
  
  -- 状态
  status TEXT DEFAULT 'pending',  -- pending/processing/completed/failed/refunded
  reference_id TEXT,
  description TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (loan_id) REFERENCES loans(id)
);

-- ========== 还款渠道 ==========

CREATE TABLE repayment_channels (
  id TEXT PRIMARY KEY,
  
  -- 渠道信息
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  type TEXT NOT NULL,  -- bank_transfer/promptpay/convenience_store/e_wallet/atm
  
  -- 配置
  config TEXT,  -- JSON
  fee_config TEXT,  -- JSON
  limits TEXT,  -- JSON
  
  -- 到账时间
  settlement_time TEXT NOT NULL,  -- instant/within_2h/next_day
  
  -- 状态
  status TEXT DEFAULT 'active',
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ========== 索引 ==========

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_user_profiles_kyc ON user_profiles(kyc_status);
CREATE INDEX idx_credit_limits_user ON credit_limits(user_id);
CREATE INDEX idx_credit_limits_status ON credit_limits(status);
CREATE INDEX idx_loan_applications_user ON loan_applications(user_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(due_date);
CREATE INDEX idx_repayment_schedules_loan ON repayment_schedules(loan_id);
CREATE INDEX idx_repayment_schedules_due ON repayment_schedules(due_date);
CREATE INDEX idx_repayments_loan ON repayments(loan_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_loan ON transactions(loan_id);
```

---

## 7. API 设计

### 7.1 信用服务 API

```typescript
// 申请信用额度
POST /api/credit/apply
Request:
{
  // 用户资料 (如果未填写)
  profile?: UserProfile,
  
  // 同意书
  consent: {
    credit_check: boolean,
    data_processing: boolean,
    terms_accepted: boolean,
  },
  
  // 语言
  language: 'en' | 'th',
}

Response:
{
  success: boolean,
  data?: {
    application_id: string,
    status: 'pending' | 'approved' | 'rejected',
    estimated_time: number,  // 预计审批时间 (分钟)
  },
  error?: {
    code: string,
    message: string,
    message_th?: string,
  },
}

// 查询信用状态
GET /api/credit/status

Response:
{
  success: boolean,
  data?: {
    application_status: 'pending' | 'approved' | 'rejected',
    credit_score?: number,
    credit_limit?: {
      total: number,
      available: number,
      used: number,
    },
    expires_at?: string,
    review_at?: string,
  },
}

// 查询可用额度
GET /api/credit/limit

Response:
{
  success: boolean,
  data?: {
    total_limit: number,
    available_limit: number,
    used_limit: number,
    frozen_limit: number,
    status: 'active' | 'expired' | 'suspended',
    expires_at: string,
    days_until_expiry: number,
  },
}
```

### 7.2 借款服务 API

```typescript
// 创建借款申请
POST /api/loan/apply
Request:
{
  product_id: string,
  amount: number,
  term_days: number,
  language: 'en' | 'th',
}

Response:
{
  success: boolean,
  data?: {
    application_id: string,
    loan_details: {
      principal: number,
      interest: number,
      total_repayment: number,
      due_date: string,
    },
    contract_url?: string,
  },
}

// 确认借款 (电子签约)
POST /api/loan/confirm
Request:
{
  application_id: string,
  signature: string,  // 电子签名
  language: 'en' | 'th',
}

// 查询借款状态
GET /api/loan/:loanId/status

// 获取借款详情
GET /api/loan/:loanId
```

### 7.3 还款服务 API

```typescript
// 获取还款计划
GET /api/repay/schedule?loan_id=xxx

Response:
{
  success: boolean,
  data?: {
    loan_id: string,
    total_due: number,
    next_due_date: string,
    installments: Array<{
      number: number,
      due_date: string,
      principal: number,
      interest: number,
      total: number,
      status: 'pending' | 'paid' | 'overdue',
    }>,
  },
}

// 创建还款
POST /api/repay/create
Request:
{
  loan_id: string,
  amount: number,
  payment_method: string,
  language: 'en' | 'th',
}

// 获取可用还款渠道
GET /api/repay/channels

// 提前还款试算
GET /api/repay/prepayment-calc?loan_id=xxx
```

---

## 8. 实施计划

### Phase 1: 基础框架 (1 周)
- [ ] i18n 国际化框架集成
- [ ] 数据库表创建和迁移
- [ ] 基础 API 框架搭建

### Phase 2: 信用服务 (1 周)
- [ ] 信用评分算法实现
- [ ] 额度管理逻辑
- [ ] 信用 API 完成

### Phase 3: 借款服务 (1 周)
- [ ] 借款产品配置化
- [ ] 借款流程实现
- [ ] 电子签约集成

### Phase 4: 还款服务 (1 周)
- [ ] 多渠道还款集成
- [ ] 逾期管理逻辑
- [ ] 罚息计算

### Phase 5: 测试与优化 (1 周)
- [ ] 单元测试
- [ ] E2E 测试
- [ ] 性能优化

---

**最后更新:** 2026-03-16  
**负责人:** 小满 (Orchestrator)  
**状态:** 设计中 → 待实施
