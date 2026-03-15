/**
 * Lann Backend API - 本地开发模式 (纯内存版)
 * 无需任何外部依赖，开箱即用
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// 创建 Hono 应用
const app = new Hono();

// 启用 CORS
app.use('/*', cors());

// ========== Mock 数据 ==========
const users = [
  { id: 'user_001', phone: '+66812345678', name: 'Test User', kyc_status: 'verified', credit_limit: 20000 },
  { id: 'user_002', phone: '+66898765432', name: 'Demo User', kyc_status: 'verified', credit_limit: 15000 },
];

const loans = [
  { id: 'loan_001', user_id: 'user_001', amount: 5000, days: 14, interest_rate: 0.01, interest: 700, total_repayment: 5700, status: 'active', created_at: new Date().toISOString(), due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() },
];

const repayments = [];
let currentUserId = 'user_001';

// OTP 存储 (Map)
const otpStore = new Map<string, { code: string; expires: number; phone: string }>();

// ========== 健康检查 ==========
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: 'development',
    message: 'Local development server running',
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
  const otp = '123456'; // 开发环境固定 OTP
  
  // 存储 OTP (5 分钟过期)
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
  
  // 验证 OTP
  const otpRecord = otpStore.get(phone);
  if (!otpRecord || otpRecord.code !== otp || otpRecord.expires < Date.now()) {
    return c.json({ success: false, error: 'Invalid or expired OTP' }, 400);
  }
  
  // 查找或创建用户
  let user = users.find(u => u.phone === phone);
  if (!user) {
    user = {
      id: `user_${Date.now()}`,
      phone,
      name: 'User',
      kyc_status: 'pending',
      credit_limit: 5000,
    };
    users.push(user);
  }
  
  // 清除 OTP
  // @ts-ignore
  global.otpStore.delete(phone);
  
  // 设置当前用户
  currentUserId = user.id;
  
  return c.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      kycStatus: user.kyc_status,
      creditLimit: user.credit_limit,
    },
    token: `mock_jwt_token_${user.id}`,
  });
});

// ========== 借款相关 ==========

// 获取用户可用额度
app.get('/api/user/credit', async (c) => {
  const user = users.find(u => u.id === currentUserId);
  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }
  
  const used = loans.filter(l => l.user_id === user.id && l.status === 'active')
    .reduce((sum, l) => sum + l.amount, 0);
  
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
  
  const loan = {
    id: loanId,
    user_id: currentUserId,
    amount,
    days,
    interest_rate: interestRate,
    interest,
    total_repayment: totalRepayment,
    status: 'approved',
    created_at: new Date().toISOString(),
    due_date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
  };
  
  loans.push(loan);
  
  return c.json({
    success: true,
    loan,
    message: 'Loan approved instantly (development mode)',
  });
});

// 获取借款记录
app.get('/api/loans', async (c) => {
  const userLoans = loans.filter(l => l.user_id === currentUserId);
  return c.json({
    success: true,
    loans: userLoans,
  });
});

// ========== 还款相关 ==========

// 创建还款
app.post('/api/repayments', async (c) => {
  const { loanId, method } = await c.req.json();
  
  const loanIndex = loans.findIndex(l => l.id === loanId);
  if (loanIndex === -1) {
    return c.json({ success: false, error: 'Loan not found' }, 404);
  }
  
  const loan = loans[loanIndex];
  const repaymentId = `repayment_${Date.now()}`;
  
  repayments.push({
    id: repaymentId,
    loan_id: loanId,
    amount: loan.total_repayment,
    method,
    status: 'completed',
    created_at: new Date().toISOString(),
  });
  
  // 更新借款状态
  loans[loanIndex].status = 'repaid';
  
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
  const pending = loans.filter(l => l.user_id === currentUserId && l.status === 'active');
  
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
app.get('/api/user/profile', async (c) => {
  const user = users.find(u => u.id === currentUserId);
  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }
  
  return c.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: null,
      kycStatus: user.kyc_status,
      creditLimit: user.credit_limit,
      createdAt: new Date().toISOString(),
    },
  });
});

// 更新用户信息
app.put('/api/user/profile', async (c) => {
  const { name, email } = await c.req.json();
  const user = users.find(u => u.id === currentUserId);
  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }
  
  user.name = name || user.name;
  
  return c.json({
    success: true,
    message: 'Profile updated',
    user,
  });
});

// 启动服务器
console.log('🦞 Lann Backend API - Development Mode');
console.log('📍 Server: http://localhost:8787');
console.log('🧪 Test phone: +66812345678');
console.log('🔑 Test OTP: 123456');
console.log('');

export default {
  port: 8787,
  fetch: app.fetch,
};
