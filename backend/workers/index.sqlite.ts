/**
 * Lann Backend API - 本地开发模式 (SQLite 版本)
 * 使用 better-sqlite3 数据库
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建 Hono 应用
const app = new Hono();

// 启用 CORS
app.use('/*', cors());

// 初始化 SQLite 数据库
const dbPath = path.join(__dirname, '../../local/dev.db');
const db = new Database(dbPath);

// ========== Mock 全局变量 ==========
const otpStore = new Map<string, { code: string; expires: number; phone: string }>();

// ========== 健康检查 ==========
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: 'development-sqlite',
    message: 'Local development server running with SQLite',
  });
});

// ========== 用户认证 ==========

// 发送 OTP
app.post('/api/auth/send-otp', async (c) => {
  const { phone } = await c.req.json();

  // 验证手机号格式
  if (!phone.match(/^\+66\d{9}$/)) {
    return c.json({ success: false, error: 'Invalid phone number. Format: +66XXXXXXXXX' }, 400);
  }

  // 生成 6 位 OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpId = `otp_${Date.now()}`;
  const expiresAt = new Date(Date.now() + 300000); // 5 分钟

  // 存储 OTP 到数据库
  try {
    db.prepare(`
      INSERT INTO otp_codes (id, phone, code, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(otpId, phone, otp, expiresAt.toISOString());
  } catch (error) {
    console.error('Failed to insert OTP:', error);
  }

  // 同时存储到内存（开发环境显示 OTP）
  otpStore.set(phone, {
    code: otp,
    expires: Date.now() + 300000,
    phone,
  });

  console.log(`📱 OTP for ${phone}: ${otp} (expires in 5 min)`);

  return c.json({
    success: true,
    message: 'OTP sent successfully',
    expiresIn: 300,
    debug: { otp, note: 'Development mode - OTP shown in console' },
  });
});

// 验证 OTP 并登录/注册
app.post('/api/auth/verify-otp', async (c) => {
  const { phone, otp } = await c.req.json();

  // 先从数据库验证
  let otpRecord: any = null;
  try {
    otpRecord = db.prepare(`
      SELECT * FROM otp_codes
      WHERE phone = ? AND code = ? AND expires_at > datetime('now')
    `).get(phone, otp);
  } catch (error) {
    console.error('Failed to query OTP:', error);
  }

  // 如果数据库没有，从内存验证（开发环境兼容）
  if (!otpRecord) {
    const memOtp = otpStore.get(phone);
    if (memOtp && memOtp.code === otp && memOtp.expires > Date.now()) {
      otpRecord = memOtp;
    }
  }

  if (!otpRecord) {
    return c.json({ success: false, error: 'Invalid or expired OTP' }, 400);
  }

  // 标记 OTP 为已使用
  try {
    db.prepare(`
      UPDATE otp_codes SET verified = 1 WHERE id = ?
    `).run(otpRecord.id);
  } catch (error) {
    console.error('Failed to update OTP:', error);
  }

  // 查找或创建用户
  let user: any = null;
  try {
    user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  } catch (error) {
    console.error('Failed to query user:', error);
  }

  if (!user) {
    const userId = `user_${Date.now()}`;
    try {
      db.prepare(`
        INSERT INTO users (id, phone, kyc_status, credit_limit)
        VALUES (?, ?, 'pending', 5000)
      `).run(userId, phone);
      user = {
        id: userId,
        phone,
        kyc_status: 'pending',
        credit_limit: 5000,
      };
    } catch (error) {
      console.error('Failed to create user:', error);
      return c.json({ success: false, error: 'Failed to create user' }, 500);
    }
  }

  // 清除 OTP
  otpStore.delete(phone);

  return c.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name || 'User',
      kycStatus: user.kyc_status,
      creditLimit: user.credit_limit,
    },
    token: `mock_jwt_token_${user.id}`,
  });
});

// ========== 借款相关 ==========

// 获取用户可用额度
app.get('/api/user/credit', async (c) => {
  const userId = 'user_001'; // 开发环境固定用户

  let user: any = null;
  try {
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  } catch (error) {
    console.error('Failed to query user:', error);
    user = { id: userId, credit_limit: 20000 };
  }

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  // 计算已用额度
  let used = 0;
  try {
    const result: any = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM loans
      WHERE user_id = ? AND status IN ('active', 'approved')
    `).get(userId);
    used = result?.total || 0;
  } catch (error) {
    console.error('Failed to query loans:', error);
  }

  return c.json({
    success: true,
    credit: {
      available: user.credit_limit - used,
      total: user.credit_limit,
      used,
    },
  });
});

// 创建借款申请
app.post('/api/loans', async (c) => {
  const { amount, days } = await c.req.json();

  // 验证借款金额
  if (amount < 1000 || amount > 50000) {
    return c.json({ success: false, error: 'Amount must be between 1,000 and 50,000 THB' }, 400);
  }

  // 验证借款期限
  if (![7, 14, 21, 30].includes(days)) {
    return c.json({ success: false, error: 'Days must be 7, 14, 21, or 30' }, 400);
  }

  const interestRate = 0.01;
  const interest = amount * interestRate * days;
  const totalRepayment = amount + interest;
  const loanId = `loan_${Date.now()}`;
  const userId = 'user_001'; // 开发环境固定用户
  const dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  try {
    db.prepare(`
      INSERT INTO loans (id, user_id, amount, days, interest_rate, interest, total_repayment, status, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?)
    `).run(loanId, userId, amount, days, interestRate, interest, totalRepayment, dueDate.toISOString());
  } catch (error) {
    console.error('Failed to create loan:', error);
    return c.json({ success: false, error: 'Failed to create loan' }, 500);
  }

  return c.json({
    success: true,
    loan: {
      id: loanId,
      user_id: userId,
      amount,
      days,
      interest_rate: interestRate,
      interest,
      total_repayment: totalRepayment,
      status: 'approved',
      created_at: new Date().toISOString(),
      due_date: dueDate.toISOString(),
    },
    message: 'Loan approved instantly (development mode)',
  });
});

// 获取借款记录
app.get('/api/loans', async (c) => {
  const userId = 'user_001'; // 开发环境固定用户

  let loans = [];
  try {
    loans = db.prepare(`
      SELECT * FROM loans
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);
  } catch (error) {
    console.error('Failed to query loans:', error);
  }

  return c.json({
    success: true,
    loans: loans.map((loan: any) => ({
      ...loan,
      dueDate: loan.due_date,
      createdAt: loan.created_at,
    })),
  });
});

// ========== 还款相关 ==========

// 创建还款
app.post('/api/repayments', async (c) => {
  const { loanId, method } = await c.req.json();

  let loan: any = null;
  try {
    loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId);
  } catch (error) {
    console.error('Failed to query loan:', error);
  }

  if (!loan) {
    return c.json({ success: false, error: 'Loan not found' }, 404);
  }

  const repaymentId = `repayment_${Date.now()}`;

  try {
    db.prepare(`
      INSERT INTO repayments (id, loan_id, amount, method, status)
      VALUES (?, ?, ?, ?, 'completed')
    `).run(repaymentId, loanId, loan.total_repayment, method);

    // 更新借款状态
    db.prepare(`
      UPDATE loans SET status = 'repaid', repaid_at = datetime('now')
      WHERE id = ?
    `).run(loanId);
  } catch (error) {
    console.error('Failed to create repayment:', error);
    return c.json({ success: false, error: 'Failed to create repayment' }, 500);
  }

  return c.json({
    success: true,
    repayment: {
      id: repaymentId,
      loanId,
      amount: loan.total_repayment,
      method,
      status: 'completed',
      createdAt: new Date().toISOString(),
    },
  });
});

// 获取待还款信息
app.get('/api/repayments/pending', async (c) => {
  const userId = 'user_001'; // 开发环境固定用户

  let pending = [];
  try {
    pending = db.prepare(`
      SELECT * FROM loans
      WHERE user_id = ? AND status = 'active'
      ORDER BY due_date ASC
    `).all(userId);
  } catch (error) {
    console.error('Failed to query pending loans:', error);
  }

  return c.json({
    success: true,
    pending: pending.map((loan: any) => ({
      loanId: loan.id,
      amount: loan.amount,
      interest: loan.interest,
      total: loan.total_repayment,
      dueDate: loan.due_date,
      daysRemaining: Math.ceil((new Date(loan.due_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    })),
  });
});

// ========== 用户信息 ==========

// 获取用户信息
app.get('/api/user/profile', async (c) => {
  const userId = 'user_001'; // 开发环境固定用户

  let user: any = null;
  try {
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  } catch (error) {
    console.error('Failed to query user:', error);
    user = { id: userId, phone: '+66812345678', name: 'Test User' };
  }

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  return c.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name || 'User',
      email: user.email,
      kycStatus: user.kyc_status,
      creditLimit: user.credit_limit,
      createdAt: user.created_at,
    },
  });
});

// 导出应用
console.log('🦞 Lann Backend API - Development Mode (SQLite)');
console.log('📍 Server: http://localhost:8787');
console.log('🗄️  Database:', dbPath);
console.log('🧪 Test phone: +66812345678');
console.log('🔑 Test OTP: 123456');
console.log('');

export default {
  port: 8787,
  fetch: app.fetch,
};
