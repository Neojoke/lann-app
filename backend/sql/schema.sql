-- Lann Thailand Loan App - Database Schema
-- Version: 1.0
-- Created: 2026-03-16
-- Database: SQLite

-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- ============================================
-- 用户与信用 (Users & Credit)
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  status TEXT DEFAULT 'pending',  -- pending/active/suspended/banned
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
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
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 信用额度表
CREATE TABLE IF NOT EXISTS credit_limits (
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
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 借款产品 (Loan Products)
-- ============================================

-- 借款产品表
CREATE TABLE IF NOT EXISTS loan_products (
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
CREATE TABLE IF NOT EXISTS loan_applications (
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
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES loan_products(id) ON DELETE RESTRICT
);

-- 借款表
CREATE TABLE IF NOT EXISTS loans (
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
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES loan_applications(id) ON DELETE RESTRICT,
  FOREIGN KEY (product_id) REFERENCES loan_products(id) ON DELETE RESTRICT
);

-- ============================================
-- 还款 (Repayment)
-- ============================================

-- 还款计划表
CREATE TABLE IF NOT EXISTS repayment_schedules (
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
  
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

-- 还款记录表
CREATE TABLE IF NOT EXISTS repayments (
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
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES repayment_schedules(id) ON DELETE SET NULL
);

-- ============================================
-- 交易流水 (Transactions)
-- ============================================

CREATE TABLE IF NOT EXISTS transactions (
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
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL
);

-- ============================================
-- 还款渠道 (Repayment Channels)
-- ============================================

CREATE TABLE IF NOT EXISTS repayment_channels (
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

-- ============================================
-- 索引 (Indexes)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc ON user_profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_credit_limits_user ON credit_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_limits_status ON credit_limits(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_user ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
CREATE INDEX IF NOT EXISTS idx_repayment_schedules_loan ON repayment_schedules(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayment_schedules_due ON repayment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_repayments_loan ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_loan ON transactions(loan_id);
-- ============================================
-- 合同 (Contracts)
-- ============================================

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 合同信息
  contract_url TEXT,
  contract_type TEXT NOT NULL,  -- loan_agreement/terms_conditions/privacy_policy
  language TEXT NOT NULL,  -- en/th
  version TEXT NOT NULL,
  content TEXT,  -- 合同内容
  
  -- 签名信息
  signature_data TEXT,  -- JSON
  signed_at TEXT,
  completed_at TEXT,
  
  -- 状态
  status TEXT DEFAULT 'draft',  -- draft/pending_signature/signed/completed
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 合同模板表
CREATE TABLE IF NOT EXISTS contract_templates (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,  -- loan_agreement/terms_conditions/privacy_policy
  language TEXT NOT NULL,  -- en/th
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(type, language, version)
);

CREATE INDEX IF NOT EXISTS idx_contracts_loan ON contracts(loan_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contract_templates_type ON contract_templates(type, language);

CREATE INDEX IF NOT EXISTS idx_repayment_channels_type ON repayment_channels(type);
CREATE INDEX IF NOT EXISTS idx_repayment_channels_status ON repayment_channels(status);
