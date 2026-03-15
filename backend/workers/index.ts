/**
 * Lann Backend API
 * Cloudflare Workers - 泰国借款应用后端
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// 创建 Hono 应用
const app = new Hono();

// 启用 CORS
app.use('/*', cors());

// ========== 健康检查 ==========
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== 用户认证 ==========

// 发送 OTP
app.post('/api/auth/send-otp', async (c) => {
  const { phone } = await c.req.json();
  
  // TODO: 验证手机号格式（+66 开头）
  // TODO: 生成 6 位 OTP
  // TODO: 通过短信服务发送
  
  return c.json({ 
    success: true, 
    message: 'OTP sent successfully',
    expiresIn: 300 // 5 分钟
  });
});

// 验证 OTP 并登录/注册
app.post('/api/auth/verify-otp', async (c) => {
  const { phone, otp } = await c.req.json();
  
  // TODO: 验证 OTP
  // TODO: 创建或更新用户
  // TODO: 生成 JWT token
  
  return c.json({
    success: true,
    user: {
      id: 'user_123',
      phone: phone,
      name: 'User',
      createdAt: new Date().toISOString(),
    },
    token: 'jwt_token_here',
  });
});

// ========== 借款相关 ==========

// 获取用户可用额度
app.get('/api/user/credit', async (c) => {
  // TODO: 从数据库获取用户信用额度
  
  return c.json({
    success: true,
    credit: {
      available: 20000,
      total: 50000,
      used: 0,
    },
  });
});

// 创建借款申请
app.post('/api/loans', async (c) => {
  const { amount, days } = await c.req.json();
  
  // TODO: 验证借款金额和期限
  // TODO: 计算利息
  // TODO: 创建借款记录
  
  const interestRate = 0.01; // 1% 日利率
  const interest = amount * interestRate * days;
  const totalRepayment = amount + interest;
  
  return c.json({
    success: true,
    loan: {
      id: 'loan_' + Date.now(),
      amount,
      days,
      interest,
      totalRepayment,
      status: 'approved',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
});

// 获取借款记录
app.get('/api/loans', async (c) => {
  // TODO: 从数据库获取用户借款记录
  
  return c.json({
    success: true,
    loans: [
      {
        id: 'loan_123',
        amount: 5000,
        days: 14,
        interest: 700,
        totalRepayment: 5700,
        status: 'active',
        createdAt: '2026-03-01T00:00:00Z',
        dueDate: '2026-03-15T00:00:00Z',
      },
    ],
  });
});

// ========== 还款相关 ==========

// 创建还款
app.post('/api/repayments', async (c) => {
  const { loanId, method } = await c.req.json();
  
  // TODO: 处理还款
  // TODO: 更新借款状态
  // TODO: 生成还款凭证
  
  return c.json({
    success: true,
    repayment: {
      id: 'repayment_' + Date.now(),
      loanId,
      method,
      status: 'completed',
      createdAt: new Date().toISOString(),
    },
  });
});

// 获取待还款信息
app.get('/api/repayments/pending', async (c) => {
  // TODO: 获取待还款记录
  
  return c.json({
    success: true,
    pending: [
      {
        loanId: 'loan_123',
        amount: 5000,
        interest: 700,
        total: 5700,
        dueDate: '2026-03-15T00:00:00Z',
        daysRemaining: 0,
      },
    ],
  });
});

// ========== 用户信息 ==========

// 获取用户信息
app.get('/api/user/profile', async (c) => {
  // TODO: 从数据库获取用户信息
  
  return c.json({
    success: true,
    user: {
      id: 'user_123',
      phone: '+66812345678',
      name: 'Test User',
      email: null,
      kycStatus: 'verified',
      createdAt: '2026-03-01T00:00:00Z',
    },
  });
});

// 更新用户信息
app.put('/api/user/profile', async (c) => {
  const { name, email } = await c.req.json();
  
  // TODO: 更新用户信息
  
  return c.json({
    success: true,
    message: 'Profile updated',
  });
});

// 导出 Worker
export default app;
