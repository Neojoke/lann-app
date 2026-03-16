-- Migration: 001_initial
-- Description: Initial database schema creation
-- Created: 2026-03-16

-- This migration creates all core tables for the Lann loan application system

-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- ============================================
-- 用户与信用 (Users & Credit)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  full_name_th TEXT,
  full_name_en TEXT,
  national_id TEXT UNIQUE,
  date_of_birth TEXT,
  gender TEXT,
  email TEXT,
  address TEXT,
  province TEXT,
  district TEXT,
  subdistrict TEXT,
  postal_code TEXT,
  company_name TEXT,
  position TEXT,
  monthly_income REAL,
  work_address TEXT,
  employment_type TEXT,
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  preferred_language TEXT DEFAULT 'th',
  profile_completeness REAL DEFAULT 0,
  kyc_status TEXT DEFAULT 'pending',
  kyc_verified_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS credit_limits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  total_limit REAL NOT NULL,
  available_limit REAL NOT NULL,
  used_limit REAL NOT NULL DEFAULT 0,
  frozen_limit REAL NOT NULL DEFAULT 0,
  credit_score INTEGER,
  score_details TEXT,
  granted_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  validity_days INTEGER DEFAULT 365,
  status TEXT DEFAULT 'active',
  review_at TEXT,
  last_review_score INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 借款产品 (Loan Products)
-- ============================================

CREATE TABLE IF NOT EXISTS loan_products (
  id TEXT PRIMARY KEY,
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  type TEXT NOT NULL,
  min_amount REAL NOT NULL,
  max_amount REAL NOT NULL,
  interest_rate_type TEXT NOT NULL,
  interest_rate REAL NOT NULL,
  calculation_method TEXT NOT NULL,
  fee_config TEXT,
  term_options TEXT,
  repayment_methods TEXT,
  status TEXT DEFAULT 'active',
  target_segment TEXT DEFAULT 'regular',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  amount REAL NOT NULL,
  term_days INTEGER NOT NULL,
  purpose TEXT,
  status TEXT DEFAULT 'pending',
  approved_amount REAL,
  approved_term_days INTEGER,
  interest_rate REAL,
  rejection_reason TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES loan_products(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  application_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  principal REAL NOT NULL,
  interest_rate REAL NOT NULL,
  term_days INTEGER NOT NULL,
  total_interest REAL NOT NULL,
  total_repayment REAL NOT NULL,
  paid_amount REAL NOT NULL DEFAULT 0,
  remaining_amount REAL NOT NULL,
  disbursed_at TEXT,
  due_date TEXT NOT NULL,
  completed_at TEXT,
  status TEXT DEFAULT 'pending',
  is_overdue INTEGER DEFAULT 0,
  overdue_days INTEGER DEFAULT 0,
  penalty_amount REAL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS repayment_schedules (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL,
  installment_number INTEGER NOT NULL,
  total_installments INTEGER NOT NULL,
  principal_amount REAL NOT NULL,
  interest_amount REAL NOT NULL,
  fee_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  paid_principal REAL DEFAULT 0,
  paid_interest REAL DEFAULT 0,
  paid_fee REAL DEFAULT 0,
  paid_total REAL DEFAULT 0,
  due_date TEXT NOT NULL,
  paid_at TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS repayments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  loan_id TEXT NOT NULL,
  schedule_id TEXT,
  amount REAL NOT NULL,
  principal_paid REAL DEFAULT 0,
  interest_paid REAL DEFAULT 0,
  penalty_paid REAL DEFAULT 0,
  fee_paid REAL DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_channel_id TEXT,
  transaction_ref TEXT,
  status TEXT DEFAULT 'pending',
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
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'THB',
  direction TEXT NOT NULL,
  payment_method TEXT,
  payment_channel_id TEXT,
  status TEXT DEFAULT 'pending',
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
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  type TEXT NOT NULL,
  config TEXT,
  fee_config TEXT,
  limits TEXT,
  settlement_time TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_repayment_channels_type ON repayment_channels(type);
CREATE INDEX IF NOT EXISTS idx_repayment_channels_status ON repayment_channels(status);
