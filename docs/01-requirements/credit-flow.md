# 用户进件流程 - 功能设计和技术方案

**版本:** v1.0  
**创建日期:** 2026-03-16  
**状态:** 🟡 待开发

> 📚 **相关文档:** [文档索引](../README.md) | [业务模型](./business-model.md) | [前端实现](../03-implementation/frontend.md) | [信用 API](../03-implementation/credit-api.md)

---

## 📋 业务流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  注册/登录  │ →  │  填写资料  │ →  │  提交审核  │ →  │  信用评估  │ →  │  授予额度  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                                    │
                                                                                    ↓
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  完成借款  │ ←  │  确认借款  │ ←  │  可借款额度 │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 📱 前端页面设计

### 1. Profile.tsx - 用户资料页面

**功能:**
- 展示用户基本信息
- 编辑和更新资料
- 资料完整度提示

**字段:**
| 分组 | 字段 | 类型 | 必填 | 验证 |
|------|------|------|------|------|
| **基本信息** | 姓名 (泰文) | text | ✅ | 2-50 字符 |
| | 身份证号 | text | ✅ | 13 位数字 |
| | 出生日期 | date | ✅ | ≥18 岁 |
| | 性别 | select | ✅ | 男/女/其他 |
| **联系信息** | 手机号 | tel | ✅ | +66 开头 |
| | 邮箱 | email | ⬜ | 邮箱格式 |
| | 居住地址 | textarea | ✅ | 最小 10 字符 |
| **工作信息** | 公司名称 | text | ✅ | 2-100 字符 |
| | 职位 | text | ✅ | 2-50 字符 |
| | 月收入 | number | ✅ | 10,000-500,000 THB |
| | 工作地址 | textarea | ✅ | 最小 10 字符 |
| **紧急联系人** | 姓名 | text | ✅ | 2-50 字符 |
| | 关系 | select | ✅ | 配偶/父母/子女/朋友 |
| | 手机号 | tel | ✅ | +66 开头 |
| **银行账户** | 银行名称 | select | ✅ | 泰国主要银行列表 |
| | 账号 | text | ✅ | 10-15 位数字 |
| | PromptPay | text | ⬜ | 手机号或身份证号 |

**UI 组件:**
- 分步表单（4 步）
- 进度条展示
- 实时验证
- 保存草稿功能

---

### 2. CreditApply.tsx - 信用申请页面

**功能:**
- 展示信用评估说明
- 用户授权同意书
- 提交信用评估申请

**内容:**
- 评估流程说明（10 分钟自动审批）
- 授权条款（查询信用信息）
- 隐私政策确认
- 提交按钮

**状态:**
- 未申请 → 可申请
- 审核中 → 等待结果
- 已通过 → 显示额度
- 已拒绝 → 显示原因（可重新申请）

---

### 3. CreditStatus.tsx - 审核状态页面

**功能:**
- 实时展示审核进度
- 显示授信额度
- 额度有效期

**展示内容:**
```
┌─────────────────────────────────┐
│  审核状态：✅ 已通过            │
│  授信额度：10,000 THB          │
│  可用额度：10,000 THB          │
│  额度有效期：2027-03-16        │
│                                 │
│  [立即借款]  [提升额度]        │
└─────────────────────────────────┘
```

**额度提升路径:**
- 首次借款：1,000-5,000 THB
- 按时还款 1 次：提升至 10,000 THB
- 按时还款 3 次：提升至 20,000 THB
- 按时还款 6 次：提升至 50,000 THB

---

## 🔧 服务层设计

### user.service.ts

```typescript
interface UserProfile {
  userId: string;
  // 基本信息
  fullName: string;
  nationalId: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  
  // 联系信息
  phone: string;
  email?: string;
  address: string;
  
  // 工作信息
  companyName: string;
  position: string;
  monthlyIncome: number;
  workAddress: string;
  
  // 紧急联系人
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // 银行账户
  bankAccount: {
    bankName: string;
    accountNumber: string;
    promptPay?: string;
  };
  
  // 状态
  profileComplete: boolean;
  completedAt?: string;
  updatedAt: string;
}

// API 方法
async function submitProfile(profile: UserProfile): Promise<Result>
async function getProfile(userId: string): Promise<UserProfile>
async function updateProfile(profile: Partial<UserProfile>): Promise<Result>
async function getProfileCompleteness(): Promise<number> // 返回 0-100
```

---

### credit.service.ts

```typescript
interface CreditApplication {
  applicationId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedAt?: string;
  
  // 评估结果
  creditScore?: number; // 300-850
  approvedLimit?: number; // 授信额度
  interestRate?: number; // 个性化利率
  reason?: string; // 拒绝原因
}

interface CreditLimit {
  userId: string;
  totalLimit: number; // 总额度
  availableLimit: number; // 可用额度
  usedLimit: number; // 已用额度
  expiresAt: string; // 额度有效期
}

// API 方法
async function applyCredit(userId: string): Promise<CreditApplication>
async function getCreditStatus(userId: string): Promise<CreditApplication>
async function getCreditLimit(userId: string): Promise<CreditLimit>
async function calculateCreditScore(profile: UserProfile): Promise<number>
```

---

## 🏗️ 后端 API 设计

### API 端点

```
POST   /api/user/profile          # 提交用户资料
GET    /api/user/profile          # 获取用户资料
PUT    /api/user/profile          # 更新用户资料
GET    /api/user/profile/completeness  # 获取资料完整度

POST   /api/credit/apply          # 申请信用额度
GET    /api/credit/status         # 查询审核状态
GET    /api/credit/limit          # 查询可用额度
POST   /api/credit/increase       # 申请提升额度
```

### 数据库表设计

```sql
-- 用户资料表
CREATE TABLE user_profiles (
  user_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  national_id TEXT NOT NULL UNIQUE,
  date_of_birth TEXT NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  monthly_income INTEGER NOT NULL,
  work_address TEXT NOT NULL,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_relationship TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  prompt_pay TEXT,
  profile_complete INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 信用申请表
CREATE TABLE credit_applications (
  application_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL, -- pending/approved/rejected
  credit_score INTEGER,
  approved_limit INTEGER,
  interest_rate REAL,
  reject_reason TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
);

-- 用户额度表
CREATE TABLE user_credit_limits (
  user_id TEXT PRIMARY KEY,
  total_limit INTEGER NOT NULL DEFAULT 0,
  available_limit INTEGER NOT NULL DEFAULT 0,
  used_limit INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
);
```

---

## 🎯 信用评估逻辑

### 评分模型（简化版 MVP）

```typescript
function calculateCreditScore(profile: UserProfile): number {
  let score = 500; // 基础分
  
  // 年龄评分 (25-45 岁最佳)
  const age = calculateAge(profile.dateOfBirth);
  if (age >= 25 && age <= 45) score += 50;
  else if (age >= 18 && age < 25) score += 20;
  else if (age > 45) score += 30;
  
  // 收入评分
  if (profile.monthlyIncome >= 50000) score += 80;
  else if (profile.monthlyIncome >= 30000) score += 50;
  else if (profile.monthlyIncome >= 15000) score += 30;
  
  // 工作稳定性（职位长度）
  if (profile.position.includes('经理') || profile.position.includes('主管')) {
    score += 40;
  }
  
  // 资料完整度
  if (profile.email) score += 20;
  if (profile.promptPay) score += 20;
  
  // 限制在 300-850 范围
  return Math.min(850, Math.max(300, score));
}

function determineCreditLimit(creditScore: number): number {
  if (creditScore >= 750) return 50000;  // 优秀
  if (creditScore >= 650) return 20000;  // 良好
  if (creditScore >= 550) return 10000;  // 一般
  if (creditScore >= 450) return 5000;   // 较差
  return 1000;  // 拒绝或最低
}
```

---

## 📋 借款前置条件检查

```typescript
function canApplyLoan(user: User): Result {
  // 1. 检查资料完整性
  if (!user.profileComplete) {
    return { ok: false, reason: '请先完善个人资料' };
  }
  
  // 2. 检查信用审核状态
  if (user.creditStatus !== 'approved') {
    return { ok: false, reason: '请先申请信用额度' };
  }
  
  // 3. 检查可用额度
  if (user.availableLimit <= 0) {
    return { ok: false, reason: '暂无可用额度' };
  }
  
  // 4. 检查是否有逾期未还
  if (user.hasOverdue) {
    return { ok: false, reason: '有逾期未还借款' };
  }
  
  return { ok: true };
}
```

---

## 🚀 开发任务分解

### Phase 1: 用户资料模块 (P0)
- [ ] 创建 Profile.tsx 页面（分步表单）
- [ ] 创建 user.service.ts 服务
- [ ] 实现资料提交 API
- [ ] 实现资料完整度计算
- [ ] 添加表单验证规则

### Phase 2: 信用评估模块 (P0)
- [ ] 创建 CreditApply.tsx 页面
- [ ] 创建 CreditStatus.tsx 页面
- [ ] 创建 credit.service.ts 服务
- [ ] 实现信用评分逻辑
- [ ] 实现额度管理 API

### Phase 3: 借款流程集成 (P0)
- [ ] 修改 Borrow.tsx 添加额度检查
- [ ] 修改 loan.service.ts 添加额度验证
- [ ] 实现借款前置条件检查
- [ ] 更新借款额度占用逻辑

### Phase 4: 数据库迁移 (P0)
- [ ] 创建 user_profiles 表
- [ ] 创建 credit_applications 表
- [ ] 创建 user_credit_limits 表
- [ ] 编写数据库迁移脚本

---

## ✅ 验收标准

1. **功能完整性:**
   - 用户可填写并保存完整资料
   - 资料完整度实时展示
   - 信用评估 10 分钟内完成（MVP 可改为自动通过）
   - 授信额度准确计算
   - 借款前强制检查额度和资料

2. **用户体验:**
   - 资料填写流程 < 5 分钟
   - 分步表单，每步 < 1 分钟
   - 实时验证，错误即时提示
   - 支持保存草稿

3. **数据安全:**
   - 敏感信息加密存储（身份证号、银行账号）
   - API 请求身份验证
   - 防止重复提交

---

**文档状态:** 待开发  
**负责人:** 小满 (Orchestrator)  
**执行 Agent:** oh-my-opencode (visual-engineering + deep)
