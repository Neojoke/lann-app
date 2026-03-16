/**
 * 借款 API 端点 - Loan API Endpoints
 * 
 * 提供借款相关的 HTTP API 接口
 */

import { Hono } from 'hono';
import { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { LoanProductService } from '../services/loan-product.service';
import { LoanApplicationService, getApplicationErrorMessage } from '../services/loan-application.service';
import { ContractService, getContractErrorMessage } from '../services/contract.service';

// ============ 类型定义 ============

interface Env {
  DB: D1Database;
  R2_BUCKET?: R2Bucket;
}

interface UserContext {
  userId: string;
  language: 'en' | 'th';
}

// ============ API 响应类型 ============

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    message_th?: string;
  };
}

interface LoanApplyRequest {
  productId: string;
  amount: number;
  termDays: number;
  purpose?: string;
}

interface LoanConfirmRequest {
  applicationId: string;
  signature: string;
}

// ============ 创建贷款路由 ============

export function createLoanRoutes(env: Env) {
  const app = new Hono<{ Bindings: Env; Variables: { user?: UserContext } }>();

  // 初始化服务
  const productService = new LoanProductService(env.DB);
  const applicationService = new LoanApplicationService(env.DB, productService);
  const contractService = new ContractService(env.DB, env.R2_BUCKET);

  // ============ 中间件 ============

  // 语言检测中间件
  app.use('*', async (c, next) => {
    const acceptLanguage = c.req.header('Accept-Language') || 'en';
    const language: 'en' | 'th' = acceptLanguage.startsWith('th') ? 'th' : 'en';
    c.set('language', language);
    await next();
  });

  // 用户认证中间件 (简化版本，实际应使用 JWT 等)
  app.use('/api/loan/*', async (c, next) => {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID required',
          message_th: 'ต้องการรหัสผู้ใช้',
        },
      }, 401);
    }

    const language = (c.get('language') as 'en' | 'th') || 'en';
    c.set('user', { userId, language });
    await next();
  });

  // ============ 路由 ============

  /**
   * GET /api/loan/products
   * 获取可用产品列表
   */
  app.get('/api/loan/products', async (c) => {
    try {
      const language = (c.get('language') as 'en' | 'th') || 'en';
      const products = await productService.getAvailableProducts(language);

      return c.json<ApiResponse<typeof products>>({
        success: true,
        data: products.map(p => ({
          id: p.id,
          name: p.name[language],
          type: p.type,
          minAmount: p.minAmount,
          maxAmount: p.maxAmount,
          terms: p.terms.map(t => ({
            days: t.days,
            label: t.label[language],
            minAmount: t.minAmount,
            maxAmount: t.maxAmount,
            repaymentType: t.repaymentType,
          })),
          interestRate: {
            type: p.interestRate.type,
            rate: p.interestRate.rate * 100,
            calculationMethod: p.interestRate.calculationMethod,
          },
          fees: p.fees,
          repaymentMethods: p.repaymentMethods,
          targetSegment: p.targetSegment,
        })),
      });
    } catch (error) {
      console.error('Get products error:', error);
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch products',
          message_th: 'ไม่สามารถดึงข้อมูลผลิตภัณฑ์ได้',
        },
      }, 500);
    }
  });

  /**
   * POST /api/loan/apply
   * 创建借款申请
   */
  app.post('/api/loan/apply', async (c) => {
    try {
      const user = c.get('user')!;
      const body: LoanApplyRequest = await c.req.json();

      // 验证请求
      if (!body.productId || !body.amount || !body.termDays) {
        return c.json<ApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields',
            message_th: 'ขาดฟิลด์ที่จำเป็น',
          },
        }, 400);
      }

      // 创建申请
      const result = await applicationService.createApplication(
        user.userId,
        {
          productId: body.productId,
          amount: body.amount,
          termDays: body.termDays,
          purpose: body.purpose,
        },
        user.language
      );

      if (!result.success || !result.application) {
        return c.json<ApiResponse>({
          success: false,
          error: {
            code: result.error?.code || 'APPLICATION_FAILED',
            message: result.error?.message || 'Failed to create application',
            message_th: user.language === 'th' ? 'ไม่สามารถสร้างคำขอได้' : undefined,
          },
        }, 400);
      }

      return c.json<ApiResponse<typeof result.application>>({
        success: true,
        data: {
          applicationId: result.application.id,
          status: result.application.status,
          loanDetails: result.application.loanDetails ? {
            principal: result.application.loanDetails.principal,
            interest: result.application.loanDetails.interest,
            totalRepayment: result.application.loanDetails.totalRepayment,
            dailyPayment: result.application.loanDetails.dailyPayment,
            monthlyPayment: result.application.loanDetails.monthlyPayment,
          } : undefined,
          nextStep: 'Wait for approval or proceed to confirm if auto-approved',
        },
      });
    } catch (error) {
      console.error('Apply loan error:', error);
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process application',
          message_th: 'ไม่สามารถประมวลผลคำขอได้',
        },
      }, 500);
    }
  });

  /**
   * POST /api/loan/confirm
   * 确认借款/电子签约
   */
  app.post('/api/loan/confirm', async (c) => {
    try {
      const user = c.get('user')!;
      const body: LoanConfirmRequest = await c.req.json();

      if (!body.applicationId || !body.signature) {
        return c.json<ApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields',
            message_th: 'ขาดฟิลด์ที่จำเป็น',
          },
        }, 400);
      }

      // 1. 获取申请
      const application = await applicationService.getApplication(body.applicationId);
      if (!application) {
        return c.json<ApiResponse>({
          success: false,
          error: {
            code: 'APPLICATION_NOT_FOUND',
            message: 'Application not found',
            message_th: 'ไม่พบคำขอสินเชื่อ',
          },
        }, 404);
      }

      // 2. 审批申请 (如果是待审批状态)
      let loan = await applicationService.getLoan(application.id);
      if (!loan) {
        const approvalResult = await applicationService.approveApplication(
          body.applicationId,
          user.userId,
          user.language
        );

        if (!approvalResult.success || !approvalResult.loan) {
          return c.json<ApiResponse>({
            success: false,
            error: {
              code: 'APPROVAL_FAILED',
              message: approvalResult.error?.message || 'Approval failed',
              message_th: user.language === 'th' ? 'การอนุมัติล้มเหลว' : undefined,
            },
          }, 400);
        }

        loan = approvalResult.loan;
      }

      // 3. 获取用户信息 (用于合同)
      const userProfile = await getUserProfile(env.DB, user.userId);
      if (!userProfile) {
        return c.json<ApiResponse>({
          success: false,
          error: {
            code: 'USER_PROFILE_NOT_FOUND',
            message: 'User profile not found',
            message_th: 'ไม่พบข้อมูลผู้ใช้',
          },
        }, 404);
      }

      // 4. 生成合同
      const contractResult = await contractService.generateContract(
        loan,
        {
          name: userProfile.full_name_th || userProfile.full_name_en || 'Unknown',
          nationalId: userProfile.national_id || '',
          address: userProfile.address || '',
          phone: userProfile.phone || '',
        },
        user.language
      );

      if (!contractResult.success || !contractResult.contract) {
        return c.json<ApiResponse>({
          success: false,
          error: {
            code: 'CONTRACT_GENERATION_FAILED',
            message: contractResult.error?.message || 'Failed to generate contract',
            message_th: user.language === 'th' ? 'ไม่สามารถสร้างสัญญาได้' : undefined,
          },
        }, 500);
      }

      // 5. 签署合同
      const signResult = await contractService.signContract(
        contractResult.contract.id,
        body.signature,
        {
          ipAddress: c.req.header('X-Forwarded-For') || 'unknown',
          userAgent: c.req.header('User-Agent') || 'unknown',
        },
        user.language
      );

      if (!signResult.success || !signResult.contract) {
        return c.json<ApiResponse>({
          success: false,
          error: {
            code: 'SIGNING_FAILED',
            message: signResult.error?.message || 'Failed to sign contract',
            message_th: user.language === 'th' ? 'ไม่สามารถลงนามสัญญาได้' : undefined,
          },
        }, 400);
      }

      // 6. 完成合同 (模拟放款)
      await contractService.completeContract(signResult.contract.id);

      // 7. 获取最新借款状态
      const updatedLoan = await applicationService.getLoan(loan.id);

      return c.json<ApiResponse>({
        success: true,
        data: {
          loanId: updatedLoan?.id,
          status: updatedLoan?.status,
          contractUrl: signResult.contract.contractUrl,
          principal: updatedLoan?.principal,
          totalRepayment: updatedLoan?.totalRepayment,
          dueDate: updatedLoan?.dueDate,
          message: user.language === 'th' 
            ? 'การกู้เงินสำเร็จ! เงินจะถูกโอนภายใน 1 วันทำการ'
            : 'Loan successful! Funds will be transferred within 1 business day',
        },
      });
    } catch (error) {
      console.error('Confirm loan error:', error);
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to confirm loan',
          message_th: 'ไม่สามารถยืนยันเงินกู้ได้',
        },
      }, 500);
    }
  });

  /**
   * GET /api/loan/:id/status
   * 查询借款状态
   */
  app.get('/api/loan/:id/status', async (c) => {
    try {
      const loanId = c.req.param('id');
      const loan = await applicationService.getLoan(loanId);

      if (!loan) {
        return c.json<ApiResponse>({
          success: false,
          error: {
            code: 'LOAN_NOT_FOUND',
            message: 'Loan not found',
            message_th: 'ไม่พบเงินกู้',
          },
        }, 404);
      }

      return c.json<ApiResponse>({
        success: true,
        data: {
          loanId: loan.id,
          status: loan.status,
          statusText: getLoanStatusText(loan.status, (c.get('language') as 'en' | 'th') || 'en'),
          remainingAmount: loan.remainingAmount,
          dueDate: loan.dueDate,
          isOverdue: loan.isOverdue,
          overdueDays: loan.overdueDays,
        },
      });
    } catch (error) {
      console.error('Get loan status error:', error);
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get loan status',
          message_th: 'ไม่สามารถดึงสถานะเงินกู้ได้',
        },
      }, 500);
    }
  });

  /**
   * GET /api/loan/:id
   * 获取借款详情
   */
  app.get('/api/loan/:id', async (c) => {
    try {
      const loanId = c.req.param('id');
      const language = (c.get('language') as 'en' | 'th') || 'en';
      const loan = await applicationService.getLoan(loanId);

      if (!loan) {
        return c.json<ApiResponse>({
          success: false,
          error: {
            code: 'LOAN_NOT_FOUND',
            message: 'Loan not found',
            message_th: 'ไม่พบเงินกู้',
          },
        }, 404);
      }

      // 获取产品信息
      const product = await productService.getById(loan.productId, language);

      return c.json<ApiResponse>({
        success: true,
        data: {
          loanId: loan.id,
          applicationId: loan.applicationId,
          product: product ? {
            id: product.id,
            name: product.name[language],
            type: product.type,
          } : null,
          principal: loan.principal,
          interestRate: loan.interestRate * 100,
          termDays: loan.termDays,
          totalInterest: loan.totalInterest,
          totalRepayment: loan.totalRepayment,
          paidAmount: loan.paidAmount,
          remainingAmount: loan.remainingAmount,
          status: loan.status,
          statusText: getLoanStatusText(loan.status, language),
          dueDate: loan.dueDate,
          disbursedAt: loan.disbursedAt,
          isOverdue: loan.isOverdue,
          overdueDays: loan.overdueDays,
          penaltyAmount: loan.penaltyAmount,
          contractUrl: loan.contractUrl,
          signedAt: loan.signedAt,
          createdAt: loan.createdAt,
        },
      });
    } catch (error) {
      console.error('Get loan details error:', error);
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get loan details',
          message_th: 'ไม่สามารถดึงรายละเอียดเงินกู้ได้',
        },
      }, 500);
    }
  });

  /**
   * POST /api/loan/cancel
   * 取消借款申请
   */
  app.post('/api/loan/cancel', async (c) => {
    try {
      const user = c.get('user')!;
      const { applicationId } = await c.req.json();

      if (!applicationId) {
        return c.json<ApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Application ID required',
            message_th: 'ต้องการรหัสคำขอ',
          },
        }, 400);
      }

      const result = await applicationService.cancelApplication(applicationId, user.language);

      if (!result.success) {
        return c.json<ApiResponse>({
          success: false,
          error: {
            code: result.error?.code || 'CANCEL_FAILED',
            message: result.error?.message || 'Failed to cancel application',
            message_th: user.language === 'th' ? 'ไม่สามารถยกเลิกคำขอได้' : undefined,
          },
        }, 400);
      }

      return c.json<ApiResponse>({
        success: true,
        data: {
          applicationId,
          status: 'cancelled',
          message: user.language === 'th'
            ? 'ยกเลิกคำขอเรียบร้อยแล้ว'
            : 'Application cancelled successfully',
        },
      });
    } catch (error) {
      console.error('Cancel loan error:', error);
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to cancel application',
          message_th: 'ไม่สามารถยกเลิกคำขอได้',
        },
      }, 500);
    }
  });

  return app;
}

// ============ 辅助函数 ============

/**
 * 获取用户资料
 */
async function getUserProfile(db: D1Database, userId: string): Promise<any> {
  const result = await db.execute(
    'SELECT * FROM user_profiles WHERE user_id = ?',
    [userId]
  );

  if (!result.results || result.results.length === 0) {
    return null;
  }

  const row = result.results[0] as any;
  
  // 获取用户手机号
  const userResult = await db.execute(
    'SELECT phone FROM users WHERE id = ?',
    [userId]
  );

  return {
    ...row,
    phone: userResult.results?.[0]?.phone || '',
  };
}

/**
 * 获取借款状态文本 (多语言)
 */
function getLoanStatusText(status: string, language: 'en' | 'th'): string {
  const statusMap: Record<string, { en: string; th: string }> = {
    pending: { en: 'Pending Approval', th: 'รอการอนุมัติ' },
    approved: { en: 'Approved', th: 'อนุมัติแล้ว' },
    rejected: { en: 'Rejected', th: 'ถูกปฏิเสธ' },
    signing: { en: 'Signing Contract', th: 'กำลังลงนามสัญญา' },
    disbursing: { en: 'Disbursing', th: 'กำลังโอนเงิน' },
    active: { en: 'Active (Repaying)', th: 'อยู่ระหว่างชำระ' },
    overdue: { en: 'Overdue', th: 'ค้างชำระ' },
    completed: { en: 'Completed', th: 'ชำระเสร็จสิ้น' },
    written_off: { en: 'Written Off', th: 'ตัดจำหน่าย' },
    cancelled: { en: 'Cancelled', th: 'ยกเลิกแล้ว' },
  };

  const statusText = statusMap[status] || { en: 'Unknown', th: 'ไม่ทราบ' };
  return language === 'th' ? statusText.th : statusText.en;
}
