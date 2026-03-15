-- Lann 数据库初始化脚本
-- 包含测试数据

-- 插入测试用户
INSERT OR IGNORE INTO users (id, phone, name, kyc_status, credit_limit) VALUES 
  ('user_test_001', '+66812345678', 'Test User', 'verified', 20000),
  ('user_test_002', '+66898765432', 'Demo User', 'verified', 15000);

-- 插入测试借款记录
INSERT OR IGNORE INTO loans (id, user_id, amount, days, interest_rate, interest, total_repayment, status, due_date) VALUES
  ('loan_test_001', 'user_test_001', 5000, 14, 0.01, 700, 5700, 'active', datetime('now', '+14 days')),
  ('loan_test_002', 'user_test_001', 10000, 30, 0.01, 3000, 13000, 'repaid', datetime('now', '-10 days')),
  ('loan_test_003', 'user_test_002', 3000, 7, 0.01, 210, 3210, 'active', datetime('now', '+7 days'));

-- 插入测试还款记录
INSERT OR IGNORE INTO repayments (id, loan_id, amount, method, status) VALUES
  ('repayment_test_001', 'loan_test_002', 13000, 'bank', 'completed');

-- 插入测试 OTP (用于开发测试)
INSERT OR IGNORE INTO otp_codes (id, phone, code, expires_at, verified) VALUES
  ('otp_test_001', '+66812345678', '123456', datetime('now', '+1 hour'), 0),
  ('otp_test_002', '+66898765432', '654321', datetime('now', '+1 hour'), 0);

-- 插入测试用户行为日志
INSERT OR IGNORE INTO user_events (id, user_id, event_type, event_data) VALUES
  ('event_001', 'user_test_001', 'login', '{"method": "otp", "timestamp": "2026-03-15T00:00:00Z"}'),
  ('event_002', 'user_test_001', 'loan_created', '{"loan_id": "loan_test_001", "amount": 5000}'),
  ('event_003', 'user_test_002', 'login', '{"method": "otp", "timestamp": "2026-03-15T00:00:00Z"}');
