-- Lann Thailand Loan App - Seed Data
-- Version: 1.0
-- Created: 2026-03-16
-- Description: 测试数据，包含用户、借款产品、还款渠道

-- ============================================
-- 测试用户 (3 个，不同信用等级)
-- ============================================

-- 用户 1: 优质用户 (A+ 等级)
INSERT INTO users (id, phone, password_hash, status) 
VALUES ('user_001', '+66812345678', '$2b$10$test_hash_premium_user', 'active');

INSERT INTO user_profiles (
  user_id, full_name_th, full_name_en, national_id, date_of_birth, gender,
  email, address, province, district, subdistrict, postal_code,
  company_name, position, monthly_income, work_address, employment_type,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
  preferred_language, profile_completeness, kyc_status, kyc_verified_at
) VALUES (
  'user_001',
  'สมชาย ใจดี', 'Somchai Jaidee', '1234567890123', '1990-05-15', 'male',
  'somchai@example.com', '123/4 ถนนสุขุมวิท', 'Bangkok', 'Watthana', 'Khlong Tan', '10110',
  'ABC Company Ltd.', 'Senior Manager', 80000, '123 Silom Road, Bangkok', 'employee',
  'สมหญิง ใจดี', 'spouse', '+66823456789',
  'th', 100, 'verified', datetime('now')
);

INSERT INTO credit_limits (
  id, user_id, total_limit, available_limit, used_limit, frozen_limit,
  credit_score, score_details, granted_at, expires_at, validity_days,
  status, review_at, last_review_score
) VALUES (
  'credit_001', 'user_001', 50000, 50000, 0, 0,
  850, '{"basic": 180, "employment": 230, "contact": 140, "social": 140, "behavior": 230}',
  datetime('now'), datetime('now', '+365 days'), 365,
  'active', datetime('now', '+335 days'), 850
);

-- 用户 2: 良好用户 (A 等级)
INSERT INTO users (id, phone, password_hash, status) 
VALUES ('user_002', '+66823456789', '$2b$10$test_hash_good_user', 'active');

INSERT INTO user_profiles (
  user_id, full_name_th, full_name_en, national_id, date_of_birth, gender,
  email, address, province, district, subdistrict, postal_code,
  company_name, position, monthly_income, work_address, employment_type,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
  preferred_language, profile_completeness, kyc_status, kyc_verified_at
) VALUES (
  'user_002',
  'วิชัย รักดี', 'Wichai Rakdee', '2345678901234', '1988-08-20', 'male',
  'wichai@example.com', '456 ถนนพหลโยธิน', 'Bangkok', 'Phaya Thai', 'Sam Sen Nai', '10400',
  'XYZ Corporation', 'Engineer', 50000, '456 Phahonyothin Road, Bangkok', 'employee',
  'วิไล รักดี', 'spouse', '+66834567890',
  'th', 85, 'verified', datetime('now')
);

INSERT INTO credit_limits (
  id, user_id, total_limit, available_limit, used_limit, frozen_limit,
  credit_score, score_details, granted_at, expires_at, validity_days,
  status, review_at, last_review_score
) VALUES (
  'credit_002', 'user_002', 25000, 25000, 0, 0,
  680, '{"basic": 160, "employment": 200, "contact": 120, "social": 110, "behavior": 180}',
  datetime('now'), datetime('now', '+365 days'), 365,
  'active', datetime('now', '+335 days'), 680
);

-- 用户 3: 一般用户 (B 等级)
INSERT INTO users (id, phone, password_hash, status) 
VALUES ('user_003', '+66834567890', '$2b$10$test_hash_regular_user', 'active');

INSERT INTO user_profiles (
  user_id, full_name_th, full_name_en, national_id, date_of_birth, gender,
  email, address, province, district, subdistrict, postal_code,
  company_name, position, monthly_income, work_address, employment_type,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
  preferred_language, profile_completeness, kyc_status, kyc_verified_at
) VALUES (
  'user_003',
  'มานี มีเงิน', 'Manee Meesang', '3456789012345', '1995-03-10', 'female',
  'manee@example.com', '789 ถนนรามคำแหง', 'Bangkok', 'Bang Kapi', 'Hua Mak', '10240',
  'Self Employed', 'Freelancer', 30000, '789 Ramkhamhaeng Road, Bangkok', 'self_employed',
  'มานี มีสุข', 'parent', '+66845678901',
  'th', 70, 'verified', datetime('now')
);

INSERT INTO credit_limits (
  id, user_id, total_limit, available_limit, used_limit, frozen_limit,
  credit_score, score_details, granted_at, expires_at, validity_days,
  status, review_at, last_review_score
) VALUES (
  'credit_003', 'user_003', 15000, 15000, 0, 0,
  580, '{"basic": 140, "employment": 150, "contact": 100, "social": 90, "behavior": 120}',
  datetime('now'), datetime('now', '+365 days'), 365,
  'active', datetime('now', '+335 days'), 580
);

-- ============================================
-- 借款产品 (3 种类型)
-- ============================================

-- 产品 1: 工资日贷款 (Payday Loan)
INSERT INTO loan_products (
  id, name_th, name_en, type, min_amount, max_amount,
  interest_rate_type, interest_rate, calculation_method,
  fee_config, term_options, repayment_methods,
  status, target_segment
) VALUES (
  'product_payday',
  'เงินด่วนรายวัน', 'Payday Loan', 'payday',
  1000, 50000,
  'daily', 0.01, 'flat',
  '{"late": {"percentage": 0.005, "minAmount": 50}}',
  '[{"days": 7, "label_th": "7 วัน", "label_en": "7 Days", "repayment_type": "bullet"}, {"days": 14, "label_th": "14 วัน", "label_en": "14 Days", "repayment_type": "bullet"}, {"days": 21, "label_th": "21 วัน", "label_en": "21 Days", "repayment_type": "bullet"}, {"days": 30, "label_th": "30 วัน", "label_en": "30 Days", "repayment_type": "bullet"}]',
  '["bank_transfer", "convenience_store", "promptpay", "truemoney"]',
  'active', 'regular'
);

-- 产品 2: 分期贷款 (Installment Loan)
INSERT INTO loan_products (
  id, name_th, name_en, type, min_amount, max_amount,
  interest_rate_type, interest_rate, calculation_method,
  fee_config, term_options, repayment_methods,
  status, target_segment
) VALUES (
  'product_installment',
  'เงินผ่อนชำระ', 'Installment Loan', 'installment',
  5000, 100000,
  'monthly', 0.02, 'reducing',
  '{"processing": {"percentage": 0.02, "maxAmount": 1000}, "late": {"percentage": 0.005}, "prepayment": {"percentage": 0.01}}',
  '[{"days": 90, "label_th": "3 เดือน", "label_en": "3 Months", "repayment_type": "installment"}, {"days": 180, "label_th": "6 เดือน", "label_en": "6 Months", "repayment_type": "installment"}, {"days": 365, "label_th": "12 เดือน", "label_en": "12 Months", "repayment_type": "installment"}]',
  '["bank_transfer", "promptpay"]',
  'active', 'regular'
);

-- 产品 3: 循环额度 (Revolving Credit)
INSERT INTO loan_products (
  id, name_th, name_en, type, min_amount, max_amount,
  interest_rate_type, interest_rate, calculation_method,
  fee_config, term_options, repayment_methods,
  status, target_segment
) VALUES (
  'product_revolving',
  'วงเงินหมุนเวียน', 'Revolving Credit', 'revolving',
  1000, 100000,
  'daily', 0.008, 'reducing',
  '{"service": {"amount": 100}, "late": {"percentage": 0.005}}',
  '[{"days": 30, "label_th": "รายเดือน", "label_en": "Monthly", "repayment_type": "installment"}]',
  '["bank_transfer", "promptpay", "truemoney"]',
  'active', 'premium'
);

-- ============================================
-- 还款渠道 (5 种方式)
-- ============================================

-- 渠道 1: 银行转账
INSERT INTO repayment_channels (
  id, name_th, name_en, type, config, fee_config, limits,
  settlement_time, status
) VALUES (
  'channel_bank_transfer',
  'โอนเงินธนาคาร', 'Bank Transfer', 'bank_transfer',
  '{"bankCode": "SCB", "bankName": "Siam Commercial Bank", "accountNumber": "123-456-7890", "accountName": "Lann Company Ltd."}',
  '{"fixed": 0, "payer": "platform"}',
  '{"minAmount": 100, "maxAmount": 100000, "dailyLimit": 200000}',
  'next_day', 'active'
);

-- 渠道 2: PromptPay
INSERT INTO repayment_channels (
  id, name_th, name_en, type, config, fee_config, limits,
  settlement_time, status
) VALUES (
  'channel_promptpay',
  'พร้อมเพย์', 'PromptPay', 'promptpay',
  '{"promptPayId": "081-234-5678", "type": "phone"}',
  '{"fixed": 0, "payer": "platform"}',
  '{"minAmount": 10, "maxAmount": 50000, "dailyLimit": 100000}',
  'instant', 'active'
);

-- 渠道 3: 便利店 (7-11)
INSERT INTO repayment_channels (
  id, name_th, name_en, type, config, fee_config, limits,
  settlement_time, status
) VALUES (
  'channel_convenience_store',
  'ร้านสะดวกซื้อ (7-11)', 'Convenience Store (7-11)', 'convenience_store',
  '{"storeCode": "7ELEVEN", "counterServiceCode": "LANN"}',
  '{"fixed": 20, "payer": "user"}',
  '{"minAmount": 100, "maxAmount": 50000, "dailyLimit": 50000}',
  'within_2h', 'active'
);

-- 渠道 4: TrueMoney 电子钱包
INSERT INTO repayment_channels (
  id, name_th, name_en, type, config, fee_config, limits,
  settlement_time, status
) VALUES (
  'channel_truemoney',
  'ทรูมันนี่ วอลเล็ต', 'TrueMoney Wallet', 'e_wallet',
  '{"provider": "truemoney", "merchantId": "LANN_TH"}',
  '{"percentage": 0.01, "minAmount": 5, "payer": "user"}',
  '{"minAmount": 50, "maxAmount": 30000, "dailyLimit": 50000}',
  'instant', 'active'
);

-- 渠道 5: ATM
INSERT INTO repayment_channels (
  id, name_th, name_en, type, config, fee_config, limits,
  settlement_time, status
) VALUES (
  'channel_atm',
  'เครื่อง ATM', 'ATM', 'atm',
  '{"bankCode": "SCB", "accountNumber": "123-456-7890"}',
  '{"fixed": 15, "payer": "user"}',
  '{"minAmount": 100, "maxAmount": 50000, "dailyLimit": 100000}',
  'next_day', 'active'
);
