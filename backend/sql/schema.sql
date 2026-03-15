-- Lann Database Schema
-- Cloudflare D1 (SQLite)

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  kyc_status TEXT DEFAULT 'pending', -- pending, verified, rejected
  credit_limit INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- OTP 验证码表
CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 借款记录表
CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  days INTEGER NOT NULL,
  interest_rate REAL NOT NULL,
  interest INTEGER NOT NULL,
  total_repayment INTEGER NOT NULL,
  status TEXT NOT NULL, -- pending, approved, rejected, active, repaid, overdue
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_date DATETIME NOT NULL,
  repaid_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 还款记录表
CREATE TABLE IF NOT EXISTS repayments (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL, -- bank, convenience, promptpay, truemoney
  status TEXT NOT NULL, -- pending, completed, failed
  transaction_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id)
);

-- 用户行为日志表
CREATE TABLE IF NOT EXISTS user_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
CREATE INDEX IF NOT EXISTS idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);

-- 插入测试数据
INSERT INTO users (id, phone, name, kyc_status, credit_limit) VALUES 
  ('user_test_001', '+66812345678', 'Test User', 'verified', 20000);

INSERT INTO loans (id, user_id, amount, days, interest_rate, interest, total_repayment, status, due_date) VALUES
  ('loan_test_001', 'user_test_001', 5000, 14, 0.01, 700, 5700, 'active', datetime('now', '+14 days'));
