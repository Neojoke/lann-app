# 🦞 Lann 用户进件流程设计

**版本:** 1.0  
**创建日期:** 2026-03-16  
**状态:** 待开发

---

## 📋 业务流程

### 完整用户旅程

```
用户注册 → 填写资料 → 信用评估 → 授予额度 → 借款 → 还款
   ↓          ↓          ↓          ↓       ↓      ↓
 OTP 验证   个人信息   自动审批   额度生效  放款   扣款
```

---

## 🎯 进件流程详细设计

### Phase 1: 用户注册 (已完成)
- [x] 手机号输入 (+66 格式)
- [x] OTP 验证
- [x] 登录/注册

### Phase 2: 填写资料 (新增) ⭐
- [ ] **基本信息**
  - [ ] 姓名 (泰文 + 英文)
  - [ ] 出生日期
  - [ ] 性别
  - [ ] 婚姻状况
  - [ ] 抚养人数

- [ ] **联系信息**
  - [ ] 居住地址 (府/区/街道)
  - [ ] 居住类型 (自有/租房/与父母同住)
  - [ ] 居住时长
  - [ ] 紧急联系人 (姓名/关系/电话)

- [ ] **工作信息**
  - [ ] 工作状态 (雇员/自雇/无业)
  - [ ] 公司名称
  - [ ] 职位
  - [ ] 月收入 (泰铢)
  - [ ] 工作时长 (月)
  - [ ] 公司电话

- [ ] **财务信息**
  - [ ] 银行账号 (PromptPay)
  - [ ] 其他贷款 (是/否)
  - [ ] 月收入支出比

- [ ] **身份验证**
  - [ ] 身份证上传 (正面/反面)
  - [ ] 人脸识别 (活体检测)
  - [ ] 手持身份证照片

### Phase 3: 信用评估 (新增) ⭐
- [ ] **自动审批规则**
  ```
  准入条件:
  - 年龄：20-60 岁
  - 月收入：≥ 15,000 THB
  - 工作时长：≥ 3 个月
  - 无黑名单记录
  
  额度计算:
  - 基础额度 = 月收入 × 2
  - 上限：50,000 THB
  - 下限：1,000 THB
  
  风险定价:
  - 优质客户：日利率 0.8%
  - 普通客户：日利率 1.0%
  - 高风险：拒绝
  ```

- [ ] **审批结果**
  - [ ] 通过 → 授予额度 → 进入借款流程
  - [ ] 拒绝 → 发送短信通知
  - [ ] 人工审核 → 1 个工作日内反馈

### Phase 4: 借款流程 (已存在，需优化)
- [x] 选择金额和期限
- [ ] 额度检查 (不能超过授予额度)
- [x] 利息计算
- [x] 确认借款

---

## 📱 页面设计

### 新增页面列表

| 页面 | 路由 | 说明 |
|------|------|------|
| ProfileSetup | `/profile-setup` | 基本信息填写 |
| ContactInfo | `/contact-info` | 联系信息 |
| WorkInfo | `/work-info` | 工作信息 |
| FinancialInfo | `/financial-info` | 财务信息 |
| IdentityVerify | `/identity-verify` | 身份验证 |
| CreditResult | `/credit-result` | 信用评估结果 |

### 页面流程

```
首页
  ↓
点击"申请额度"
  ↓
ProfileSetup (基本信息)
  ↓
ContactInfo (联系信息)
  ↓
WorkInfo (工作信息)
  ↓
FinancialInfo (财务信息)
  ↓
IdentityVerify (身份验证)
  ↓
提交审核
  ↓
CreditResult (审批结果)
  ↓
通过 → 首页 (显示额度)
拒绝 → 首页 (显示原因)
```

---

## 🗄️ 数据库设计

### 新增数据表

```sql
-- 用户资料表
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  first_name_th TEXT,
  last_name_th TEXT,
  first_name_en TEXT,
  last_name_en TEXT,
  birth_date TEXT,
  gender TEXT,
  marital_status TEXT,
  dependents INTEGER,
  address_text TEXT,
  province TEXT,
  district TEXT,
  subdistrict TEXT,
  postal_code TEXT,
  residence_type TEXT,
  residence_duration INTEGER,
  employment_status TEXT,
  company_name TEXT,
  position TEXT,
  monthly_income REAL,
  employment_duration INTEGER,
  company_phone TEXT,
  bank_account TEXT,
  bank_name TEXT,
  has_other_loans INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 紧急联系人表
CREATE TABLE emergency_contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  relationship TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 信用评估表
CREATE TABLE credit_assessments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  credit_score INTEGER,
  credit_limit REAL,
  interest_rate REAL,
  status TEXT, -- pending, approved, rejected, manual_review
  rejection_reason TEXT,
  assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assessed_by TEXT, -- system 或 人工审核员 ID
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 用户上传文档表
CREATE TABLE user_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  document_type TEXT, -- id_card_front, id_card_back, selfie, holding_id
  document_url TEXT,
  verification_status TEXT, -- pending, verified, rejected
  verified_at DATETIME,
  verified_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔧 技术方案

### 前端技术栈

```
Ionic 8 + React 19 + TypeScript
├── 表单验证：react-hook-form + yup
├── 图片上传：@capacitor/camera
├── 图片压缩：compressorjs
├── 文件存储：@capacitor/filesystem
└── 状态管理：Zustand
```

### 后端技术栈

```
Cloudflare Workers + Hono + SQLite
├── 表单验证：zod
├── 图片存储：Cloudflare R2
├── 人脸识别：第三方 API (如 Face++/AWS Rekognition)
├── 信用评估：自动审批引擎
└── 短信通知：第三方 SMS 服务
```

### 服务层设计

```typescript
// 新增服务
- profile.service.ts - 用户资料管理
- credit.service.ts - 信用评估
- document.service.ts - 文档上传和管理

// 现有服务更新
- auth.service.ts - 添加资料完成状态检查
- loan.service.ts - 添加额度检查
```

### API 端点设计

```
# 用户资料
POST   /api/profile - 创建/更新资料
GET    /api/profile - 获取资料
POST   /api/profile/submit - 提交资料审核

# 紧急联系人
POST   /api/emergency-contacts - 添加联系人
GET    /api/emergency-contacts - 获取联系人

# 文档上传
POST   /api/documents/upload - 上传图片
GET    /api/documents - 获取文档列表
POST   /api/documents/verify - 验证文档

# 信用评估
POST   /api/credit/assess - 申请信用评估
GET    /api/credit/result - 获取评估结果
GET    /api/credit/limit - 获取可用额度
```

---

## 🔐 安全和合规

### 数据保护
- [ ] 敏感数据加密存储 (AES-256)
- [ ] 传输加密 (TLS 1.3)
- [ ] 图片水印处理
- [ ] 定期数据备份

### 合规要求
- [ ] 用户同意书 (PDPA 合规)
- [ ] 隐私政策
- [ ] 数据使用授权
- [ ] 第三方数据共享同意

---

## 📊 审批引擎规则

### 自动审批流程

```
1. 基础验证
   - 年龄验证 (20-60 岁)
   - 手机号验证 (实名登记)
   - 身份证验证 (OCR + 人脸比对)

2. 信用评分
   - 收入评分 (月收入/15000)
   - 工作稳定性评分 (工作时长/3)
   - 负债评分 (其他贷款数量)
   - 居住稳定性评分 (居住时长/6)

3. 额度计算
   基础额度 = 月收入 × 系数
   系数:
   - 收入 15k-30k: 1.5
   - 收入 30k-50k: 2.0
   - 收入 50k+: 2.5
   
   最终额度 = MIN(基础额度，50000)

4. 利率定价
   - 评分 ≥ 80: 0.8%/天
   - 评分 60-79: 1.0%/天
   - 评分 < 60: 拒绝
```

---

## 📝 开发计划

### Phase 1: 资料填写 (2 天)
- Day 1: 基本信息 + 联系信息页面
- Day 2: 工作信息 + 财务信息页面

### Phase 2: 身份验证 (2 天)
- Day 3: 身份证上传 + OCR 识别
- Day 4: 人脸识别 + 活体检测

### Phase 3: 信用评估 (2 天)
- Day 5: 审批引擎开发
- Day 6: 额度计算 + 结果页面

### Phase 4: 联调测试 (1 天)
- Day 7: 前后端联调 + Bug 修复

**总计：7 天完成进件流程开发**

---

## 🎯 下一步

1. 使用 OpenCode 开始开发
2. 创建 ProfileSetup 页面
3. 创建 profile.service.ts
4. 实现后端 API
