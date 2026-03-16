/**
 * 还款服务 API
 * 
 * 端点:
 * - GET /api/repay/schedule (还款计划)
 * - POST /api/repay/create (创建还款)
 * - GET /api/repay/channels (还款渠道)
 * - GET /api/repay/prepayment-calc (提前还款试算)
 * - POST /api/repay/channel/webhook (渠道回调)
 */

import { Hono } from 'hono';
import { getRepaymentSchedule } from '../services/repayment-schedule.service';
import {
  createRepayment,
  getRepaymentChannels,
  handleChannelCallback,
  type RepaymentChannelType,
} from '../services/repayment.service';
import { calculatePrepayment, checkPrepaymentEligibility } from '../services/prepayment.service';
import { calculatePenalty, getPenaltyBreakdown } from '../services/penalty.service';

export const repayApi = new Hono();

/**
 * 多语言支持中间件
 */
repayApi.use('*', async (c, next) => {
  const lang = c.req.header('Accept-Language') || 'en';
  const language = lang.startsWith('th') ? 'th' : 'en';
  c.set('language', language);
  await next();
});

/**
 * 错误响应辅助函数
 */
function errorResponse(c: any, code: string, message: string, status: number = 400) {
  const language = c.get('language') || 'en';
  
  const messages: Record<string, Record<string, string>> = {
    en: {
      loan_not_found: 'Loan not found',
      invalid_amount: 'Invalid amount',
      payment_method_required: 'Payment method is required',
      calculation_failed: 'Calculation failed',
      prepayment_not_allowed: 'Prepayment is not allowed for this loan',
    },
    th: {
      loan_not_found: 'ไม่พบข้อมูลการกู้ยืม',
      invalid_amount: 'จำนวนเงินไม่ถูกต้อง',
      payment_method_required: 'กรุณาเลือกวิธีการชำระเงิน',
      calculation_failed: 'การคำนวณล้มเหลว',
      prepayment_not_allowed: 'ไม่อนุญาตให้ชำระก่อนกำหนดสำหรับเงินกู้นี้',
    },
  };

  return c.json(
    {
      success: false,
      error: {
        code,
        message: messages[language]?.[code] || message,
        message_th: messages['th']?.[code],
      },
    },
    status
  );
}

/**
 * 成功响应辅助函数
 */
function successResponse(c: any, data: any) {
  return c.json({
    success: true,
    data,
  });
}

// ========== API 端点 ==========

/**
 * GET /api/repay/schedule
 * 获取还款计划
 * 
 * Query Parameters:
 * - loan_id: 借款 ID
 */
repayApi.get('/schedule', async (c) => {
  try {
    const loanId = c.req.query('loan_id');
    
    if (!loanId) {
      return errorResponse(c, 'loan_id_required', 'Loan ID is required');
    }

    const schedules = await getRepaymentSchedule(loanId);
    
    if (!schedules || schedules.length === 0) {
      return errorResponse(c, 'loan_not_found', 'Loan not found', 404);
    }

    const language = c.get('language') || 'en';
    
    // 格式化响应
    const formattedSchedules = schedules.map((schedule) => ({
      number: schedule.installment_number,
      total_installments: schedule.total_installments,
      due_date: schedule.due_date,
      principal: schedule.principal_amount,
      interest: schedule.interest_amount,
      fee: schedule.fee_amount,
      total: schedule.total_amount,
      paid: schedule.paid_total,
      remaining: schedule.total_amount - schedule.paid_total,
      status: schedule.status,
      status_label: language === 'th' 
        ? getThaiStatusLabel(schedule.status)
        : schedule.status,
    }));

    const totalDue = formattedSchedules.reduce((sum, s) => sum + s.remaining, 0);
    const nextDue = formattedSchedules.find((s) => s.status !== 'paid');

    return successResponse(c, {
      loan_id: loanId,
      total_due: totalDue,
      next_due_date: nextDue?.due_date || null,
      installments: formattedSchedules,
    });
  } catch (error) {
    console.error('[Repay API] Get schedule error:', error);
    return errorResponse(c, 'calculation_failed', 'Failed to get repayment schedule', 500);
  }
});

/**
 * POST /api/repay/create
 * 创建还款
 * 
 * Request Body:
 * - loan_id: 借款 ID
 * - amount: 还款金额
 * - payment_method: 支付方式
 * - payment_channel_id: 支付渠道 ID (可选)
 */
repayApi.post('/create', async (c) => {
  try {
    const body = await c.req.json();
    const { loan_id, amount, payment_method, payment_channel_id } = body;

    // 验证必填字段
    if (!loan_id) {
      return errorResponse(c, 'loan_id_required', 'Loan ID is required');
    }
    
    if (!amount || amount <= 0) {
      return errorResponse(c, 'invalid_amount', 'Invalid amount');
    }
    
    if (!payment_method) {
      return errorResponse(c, 'payment_method_required', 'Payment method is required');
    }

    // 获取用户 ID (从认证上下文)
    const userId = c.get('user_id');
    if (!userId) {
      return errorResponse(c, 'unauthorized', 'User not authenticated', 401);
    }

    // 创建还款记录
    const repayment = await createRepayment({
      user_id: userId,
      loan_id,
      amount,
      payment_method: payment_method as RepaymentChannelType,
      payment_channel_id: payment_channel_id || 'default',
    });

    return successResponse(c, {
      repayment_id: repayment.id,
      transaction_ref: repayment.transaction_ref,
      amount: repayment.amount,
      status: repayment.status,
      allocation: {
        principal: repayment.principal_paid,
        interest: repayment.interest_paid,
        penalty: repayment.penalty_paid,
        fee: repayment.fee_paid,
      },
    });
  } catch (error) {
    console.error('[Repay API] Create repayment error:', error);
    return errorResponse(c, 'create_failed', 'Failed to create repayment', 500);
  }
});

/**
 * GET /api/repay/channels
 * 获取可用还款渠道
 */
repayApi.get('/channels', async (c) => {
  try {
    const channels = await getRepaymentChannels();
    
    const language = c.get('language') || 'en';
    
    const formattedChannels = channels.map((channel) => ({
      id: channel.id,
      name: language === 'th' ? channel.name.th : channel.name.en,
      type: channel.type,
      fees: channel.fees,
      limits: channel.limits,
      settlement_time: channel.settlementTime,
      status: channel.status,
      icon: getChannelIcon(channel.type),
    }));

    return successResponse(c, {
      channels: formattedChannels,
    });
  } catch (error) {
    console.error('[Repay API] Get channels error:', error);
    return errorResponse(c, 'fetch_failed', 'Failed to get repayment channels', 500);
  }
});

/**
 * GET /api/repay/prepayment-calc
 * 提前还款试算
 * 
 * Query Parameters:
 * - loan_id: 借款 ID
 */
repayApi.get('/prepayment-calc', async (c) => {
  try {
    const loanId = c.req.query('loan_id');
    
    if (!loanId) {
      return errorResponse(c, 'loan_id_required', 'Loan ID is required');
    }

    // 检查是否允许提前还款
    const eligibility = await checkPrepaymentEligibility(loanId);
    if (!eligibility.allowed) {
      return errorResponse(c, 'prepayment_not_allowed', eligibility.reason || '');
    }

    // 计算提前还款金额
    const calculation = await calculatePrepayment(loanId);
    
    const language = c.get('language') || 'en';

    return successResponse(c, {
      loan_id: loanId,
      eligible: true,
      calculation: {
        remaining_principal: calculation.remaining_principal,
        interest: calculation.recalculated_interest,
        fee: calculation.prepayment_fee,
        penalty: calculation.penalty,
        total_due: calculation.total_due,
        original_total: calculation.original_total_due,
        total_saved: calculation.total_saved,
        interest_saved: calculation.interest_saved,
        used_days: calculation.used_days,
        breakdown: {
          principal: calculation.breakdown.principal,
          interest: calculation.breakdown.interest,
          fee: calculation.breakdown.fee,
          penalty: calculation.breakdown.penalty,
        },
        fee_policy: language === 'th'
          ? 'ฟรี! ไม่มีค่าธรรมเนียมการชำระก่อนกำหนด'
          : 'Free! No prepayment fee',
      },
    });
  } catch (error) {
    console.error('[Repay API] Prepayment calculation error:', error);
    return errorResponse(c, 'calculation_failed', 'Failed to calculate prepayment', 500);
  }
});

/**
 * POST /api/repay/channel/webhook
 * 支付渠道回调
 * 
 * Request Body:
 * - channel_type: 渠道类型
 * - transaction_ref: 交易参考号
 * - status: 状态 (success/failed)
 * - amount: 金额
 */
repayApi.post('/channel/webhook', async (c) => {
  try {
    const body = await c.req.json();
    const { channel_type, transaction_ref, status, amount } = body;

    if (!transaction_ref) {
      return errorResponse(c, 'transaction_ref_required', 'Transaction reference is required');
    }

    if (!status || !['success', 'failed'].includes(status)) {
      return errorResponse(c, 'invalid_status', 'Invalid status');
    }

    // 处理回调
    await handleChannelCallback(
      channel_type as RepaymentChannelType,
      transaction_ref,
      status as 'success' | 'failed',
      amount
    );

    return successResponse(c, {
      processed: true,
      transaction_ref,
      status,
    });
  } catch (error) {
    console.error('[Repay API] Webhook error:', error);
    return errorResponse(c, 'webhook_failed', 'Failed to process webhook', 500);
  }
});

/**
 * GET /api/repay/penalty-calc
 * 罚息计算 (额外端点)
 * 
 * Query Parameters:
 * - principal: 本金
 * - overdue_days: 逾期天数
 */
repayApi.get('/penalty-calc', async (c) => {
  try {
    const principal = parseFloat(c.req.query('principal') || '0');
    const overdueDays = parseInt(c.req.query('overdue_days') || '0');

    if (!principal || principal <= 0) {
      return errorResponse(c, 'invalid_principal', 'Invalid principal amount');
    }

    const penalty = calculatePenalty(principal, overdueDays);
    const breakdown = getPenaltyBreakdown(principal, overdueDays);

    return successResponse(c, {
      principal,
      overdue_days: overdueDays,
      penalty,
      breakdown: {
        by_tier: breakdown.byTier,
        max_cap: breakdown.maxPenaltyCap,
        is_capped: breakdown.isCapped,
      },
    });
  } catch (error) {
    console.error('[Repay API] Penalty calculation error:', error);
    return errorResponse(c, 'calculation_failed', 'Failed to calculate penalty', 500);
  }
});

// ========== 辅助函数 ==========

function getThaiStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'รอชำระ',
    partial: 'ชำระบางส่วน',
    paid: 'ชำระแล้ว',
    overdue: 'ค้างชำระ',
  };
  return labels[status] || status;
}

function getChannelIcon(type: RepaymentChannelType): string {
  const icons: Record<string, string> = {
    bank_transfer: '🏦',
    promptpay: '💳',
    convenience_store: '🏪',
    e_wallet: '📱',
    atm: '🏧',
  };
  return icons[type] || '💰';
}
