/**
 * Lann Backend API - 本地开发模式
 * 使用 SQLite + MinIO + MailHog
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import Database from 'better-sqlite3';
import Minio from 'minio';
import nodemailer from 'nodemailer';

// 创建 Hono 应用
const app = new Hono();

// 启用 CORS
app.use('/*', cors());

// ========== 本地服务初始化 ==========

// SQLite 数据库连接
const db = new Database(process.env.DATABASE_PATH || './local/dev.db');

// MinIO 客户端
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT?.split(':')[0] || 'localhost',
  port: parseInt(process.env.MINIO_ENDPOINT?.split(':')[1] || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'lann-dev',
  secretKey: process.env.MINIO_SECRET_KEY || 'lann-secret',
});

// MailHog SMTP 配置
const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false,
  auth: undefined,
});

// ========== 中间件 ==========

// JWT 认证（可选）
const optionalJwt = (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return jwt({ secret: process.env.JWT_SECRET || 'lann-local-dev-secret' })(c, next);
};

// ========== 健康检查 ==========
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      minio: 'connected',
      mailhog: 'connected',
    }
  });
});

// ========== 用户认证 ==========

// 发送 OTP
app.post('/api/auth/send-otp', async (c) => {
  const { phone } = await c.req.json();
  
  // 验证手机号格式
  if (!phone.match(/^\+66\d{9}$/)) {
    return c.json({ success: false, error: 'Invalid phone number' }, 400);
  }
  
  // 生成 6 位 OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpId = `otp_${Date.now()}`;
  const expiresAt = new Date(Date.now() + 300000); // 5 分钟
  
  // 存储 OTP 到数据库
  db.prepare(`
    INSERT INTO otp_codes (id, phone, code, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(otpId, phone, otp, expiresAt.toISOString());
  
  // 通过 MailHog 发送"短信"
  await smtpTransport.sendMail({
    from: 'Lann <noreply@lann.local>',
    to: phone,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`,
    html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
  });
  
  return c.json({ 
    success: true, 
    message: 'OTP sent successfully',
    expiresIn: 300,
    otpId, // 开发环境返回 OTP ID 便于测试
  });
});

// 验证 OTP 并登录/注册
app.post('/api/auth/verify-otp', async (c) => {
  const { phone, otp, otpId } = await c.req.json();
  
  // 验证 OTP
  const otpRecord = db.prepare(`
    SELECT * FROM otp_codes 
    WHERE id = ? AND phone = ? AND code = ? AND expires_at > datetime('now')
  `).get(otpId, phone, otp);
  
  if (!otpRecord) {
    return c.json({ success: false, error: 'Invalid or expired OTP' }, 400);
  }
  
  // 标记 OTP 为已使用
  db.prepare(`
    UPDATE otp_codes SET verified = 1 WHERE id = ?
  `).run(otpId);
  
  // 查找或创建用户
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
  
  if (!user) {
    const userId = `user_${Date.now()}`;
    db.prepare(`
      INSERT INTO users (id, phone, kyc_status, credit_limit)
      VALUES (?, ?, 'pending', 5000)
    `).run(userId, phone);
    user = { id: userId, phone, kyc_status: 'pending', credit_limit: 5000 };
  }
  
  // 生成 JWT token
  const token = await jwt.sign(
    { userId: user.id, phone: user.phone },
    process.env.JWT_SECRET || 'lann-local-dev-secret',
    { expiresIn: '7d' }
  );
  
  return c.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name || 'User',
      kycStatus: user.kyc_status,
      creditLimit: user.credit_limit,
    },
    token,
  });
});

// ========== 借款相关 ==========

// 获取用户可用额度
app.get('/api/user/credit', optionalJwt, async (c) => {
  const userId = c.get('userId') || 'user_test_001'; // 开发环境 fallback
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  
  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }
  
  // 计算已用额度
  const used = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM loans
    WHERE user_id = ? AND status IN ('active', 'approved')
  `).get(userId) as any;
  
  return c.json({
    success: true,
    credit: {
      available: user.credit_limit - (used?.total || 0),
      total: user.credit_limit,
      used: used?.total || 0,
    },
  });
});

// 创建借款申请
app.post('/api/loans', optionalJwt, async (c) => {
  const { amount, days } = await c.req.json();
  const userId = c.get('userId') || 'user_test_001';
  
  // 验证借款金额
  if (amount < 1000 || amount > 50000) {
    return c.json({ success: false, error: 'Amount must be between 1,000 and 50,000' }, 400);
  }
  
  // 验证借款期限
  if (![7, 14, 21, 30].includes(days)) {
    return c.json({ success: false, error: 'Days must be 7, 14, 21, or 30' }, 400);
  }
  
  const interestRate = 0.01; // 1% 日利率
  const interest = amount * interestRate * days;
  const totalRepayment = amount + interest;
  const loanId = `loan_${Date.now()}`;
  const dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  
  // 创建借款记录
  db.prepare(`
    INSERT INTO loans (id, user_id, amount, days, interest_rate, interest, total_repayment, status, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?)
  `).run(loanId, userId, amount, days, interestRate, interest, totalRepayment, dueDate.toISOString());
  
  return c.json({
    success: true,
    loan: {
      id: loanId,
      amount,
      days,
      interest,
      totalRepayment,
      status: 'approved',
      createdAt: new Date().toISOString(),
      dueDate: dueDate.toISOString(),
    },
  });
});

// 获取借款记录
app.get('/api/loans', optionalJwt, async (c) => {
  const userId = c.get('userId') || 'user_test_001';
  
  const loans = db.prepare(`
    SELECT * FROM loans
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId);
  
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
app.post('/api/repayments', optionalJwt, async (c) => {
  const { loanId, method } = await c.req.json();
  const repaymentId = `repayment_${Date.now()}`;
  
  // 获取借款信息
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId) as any;
  
  if (!loan) {
    return c.json({ success: false, error: 'Loan not found' }, 404);
  }
  
  // 创建还款记录
  db.prepare(`
    INSERT INTO repayments (id, loan_id, amount, method, status)
    VALUES (?, ?, ?, ?, 'completed')
  `).run(repaymentId, loanId, loan.total_repayment, method);
  
  // 更新借款状态
  db.prepare(`
    UPDATE loans SET status = 'repaid', repaid_at = datetime('now')
    WHERE id = ?
  `).run(loanId);
  
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
app.get('/api/repayments/pending', optionalJwt, async (c) => {
  const userId = c.get('userId') || 'user_test_001';
  
  const pending = db.prepare(`
    SELECT * FROM loans
    WHERE user_id = ? AND status = 'active'
    ORDER BY due_date ASC
  `).all(userId) as any[];
  
  return c.json({
    success: true,
    pending: pending.map(loan => ({
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
app.get('/api/user/profile', optionalJwt, async (c) => {
  const userId = c.get('userId') || 'user_test_001';
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  
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

// 更新用户信息
app.put('/api/user/profile', optionalJwt, async (c) => {
  const userId = c.get('userId') || 'user_test_001';
  const { name, email } = await c.req.json();
  
  db.prepare(`
    UPDATE users SET name = ?, email = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(name, email, userId);
  
  return c.json({
    success: true,
    message: 'Profile updated',
  });
});

// 导出应用
export default app;
