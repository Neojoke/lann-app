# 数据库迁移状态

**迁移日期:** 2026-03-16  
**状态:** ✅ 完成  
**数据库:** SQLite (`local/dev.db`)

---

## 📊 迁移结果

### 表结构 (10 张表)

| 表名 | 说明 | 记录数 |
|------|------|--------|
| `users` | 用户表 | 3 |
| `user_profiles` | 用户资料表 | 3 |
| `credit_limits` | 信用额度表 | 3 |
| `loan_products` | 借款产品表 | 3 |
| `loan_applications` | 借款申请表 | 0 |
| `loans` | 借款表 | 0 |
| `repayment_schedules` | 还款计划表 | 0 |
| `repayments` | 还款记录表 | 0 |
| `transactions` | 交易流水表 | 0 |
| `repayment_channels` | 还款渠道表 | 5 |

### 索引 (16 个)

所有关键查询字段已创建索引：
- 用户手机号、KYC 状态
- 信用额度用户 ID、状态
- 借款申请用户 ID、状态
- 借款用户 ID、状态、到期日
- 还款计划贷款 ID、到期日
- 还款记录贷款 ID
- 交易流水用户 ID、贷款 ID
- 还款渠道类型、状态

### 外键约束

所有外键已正确配置，启用级联删除：
- `user_profiles.user_id` → `users.id` (CASCADE)
- `credit_limits.user_id` → `users.id` (CASCADE)
- `loan_applications.user_id` → `users.id` (CASCADE)
- `loan_applications.product_id` → `loan_products.id` (RESTRICT)
- `loans.user_id` → `users.id` (CASCADE)
- `loans.application_id` → `loan_applications.id` (RESTRICT)
- `loans.product_id` → `loan_products.id` (RESTRICT)
- `repayment_schedules.loan_id` → `loans.id` (CASCADE)
- `repayments.user_id` → `users.id` (CASCADE)
- `repayments.loan_id` → `loans.id` (CASCADE)
- `repayments.schedule_id` → `repayment_schedules.id` (SET NULL)
- `transactions.user_id` → `users.id` (CASCADE)
- `transactions.loan_id` → `loans.id` (SET NULL)

---

## 🌱 种子数据

### 测试用户 (3 个)

| 用户 | 信用分 | 额度 | 等级 |
|------|--------|------|------|
| Somchai Jaidee (สมชาย ใจดี) | 850 | 50,000 THB | A+ (优秀) |
| Wichai Rakdee (วิชัย รักดี) | 680 | 25,000 THB | A (良好) |
| Manee Meesang (มานี มีเงิน) | 580 | 15,000 THB | B (一般) |

### 借款产品 (3 种)

| 产品 | 类型 | 金额范围 | 利率 |
|------|------|---------|------|
| Payday Loan (เงินด่วนรายวัน) | payday | 1,000-50,000 THB | 1%/天 |
| Installment Loan (เงินผ่อนชำระ) | installment | 5,000-100,000 THB | 2%/月 |
| Revolving Credit (วงเงินหมุนเวียน) | revolving | 1,000-100,000 THB | 0.8%/天 |

### 还款渠道 (5 种)

| 渠道 | 类型 | 到账时间 | 费用 |
|------|------|---------|------|
| Bank Transfer | bank_transfer | 次日 | 免费 |
| PromptPay | promptpay | 即时 | 免费 |
| Convenience Store (7-11) | convenience_store | 2 小时内 | 20 THB |
| TrueMoney Wallet | e_wallet | 即时 | 1% |
| ATM | atm | 次日 | 15 THB |

---

## 📁 文件清单

```
backend/
├── sql/
│   ├── schema.sql              # 完整数据库结构
│   ├── seeds.sql               # 种子数据
│   └── migrations/
│       └── 001_initial.sql     # 初始迁移脚本
├── scripts/
│   └── init-db.ts              # 数据库初始化脚本
└── local/
    └── dev.db                  # SQLite 数据库文件
```

---

## 🚀 使用方法

### 初始化数据库
```bash
cd backend
npm install better-sqlite3 @types/better-sqlite3
npx tsx scripts/init-db.ts
```

### 重置数据库
```bash
rm local/dev.db
npx tsx scripts/init-db.ts
```

### 连接数据库
```bash
# 使用 Node.js
import Database from 'better-sqlite3';
const db = new Database('local/dev.db');

# 或使用 SQLite 客户端 (如已安装)
sqlite3 local/dev.db
```

---

## ✅ 验证清单

- [x] 所有表创建成功，无语法错误
- [x] 外键约束正确配置
- [x] 索引已创建 (16 个)
- [x] 种子数据可查询
- [x] 数据库文件位于 `local/dev.db`
- [x] 启用外键支持 (PRAGMA foreign_keys = ON)

---

**下一步:**
- 创建数据库访问层 (Repository)
- 实现数据迁移工具
- 编写单元测试
