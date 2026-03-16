import i18next from 'i18next';

/**
 * 语言拦截器/工具类
 * Language Interceptor/Utility
 * 
 * 功能:
 * 1. 读取当前语言设置
 * 2. 在请求头中添加 Accept-Language
 * 3. 处理多语言错误响应
 * 
 * 注意：在 React 中，这不是 HTTP 拦截器，而是工具类
 * HTTP 请求由 api.client.ts 统一处理语言标识
 */

export class LanguageInterceptor {
  private static instance: LanguageInterceptor;

  // 多语言错误消息
  private errorMessages: Record<string, { en: string; th: string }> = {
    // 认证错误
    UNAUTHORIZED: {
      en: 'Authentication required. Please log in again.',
      th: 'ต้องการการยืนยันตัวตน กรุณาเข้าสู่ระบบอีกครั้ง',
    },
    TOKEN_EXPIRED: {
      en: 'Your session has expired. Please log in again.',
      th: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
    },
    INVALID_TOKEN: {
      en: 'Invalid authentication token.',
      th: 'โทเค็นการยืนยันไม่ถูกต้อง',
    },

    // 信用服务错误
    CREDIT_APPLICATION_PENDING: {
      en: 'Your credit application is still under review.',
      th: 'คำขอสินเชื่อของคุณอยู่ระหว่างการพิจารณา',
    },
    CREDIT_APPLICATION_REJECTED: {
      en: 'Your credit application was rejected.',
      th: 'คำขอสินเชื่อของคุณถูกปฏิเสธ',
    },
    INSUFFICIENT_CREDIT_LIMIT: {
      en: 'Insufficient credit limit for this transaction.',
      th: 'วงเงินเครดิตไม่เพียงพอสำหรับรายการนี้',
    },
    CREDIT_LIMIT_EXPIRED: {
      en: 'Your credit limit has expired. Please apply for review.',
      th: 'วงเงินเครดิตหมดอายุแล้ว กรุณาขอตรวจสอบอีกครั้ง',
    },

    // 借款服务错误
    LOAN_APPLICATION_FAILED: {
      en: 'Loan application failed. Please try again.',
      th: 'การขอสินเชื่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    },
    LOAN_AMOUNT_EXCEEDS_LIMIT: {
      en: 'Loan amount exceeds your available credit limit.',
      th: 'จำนวนเงินกู้เกินวงเงินเครดิตที่มีอยู่',
    },
    LOAN_ALREADY_EXISTS: {
      en: 'You already have an active loan application.',
      th: 'คุณมีคำขอสินเชื่อที่ใช้งานอยู่แล้ว',
    },
    LOAN_NOT_FOUND: {
      en: 'Loan record not found.',
      th: 'ไม่พบข้อมูลเงินกู้',
    },
    LOAN_CANNOT_BE_CANCELLED: {
      en: 'This loan cannot be cancelled at this stage.',
      th: 'ไม่สามารถยกเลิกเงินกู้นี้ได้ในขั้นตอนปัจจุบัน',
    },

    // 还款服务错误
    REPAYMENT_FAILED: {
      en: 'Repayment failed. Please try again.',
      th: 'การชำระเงินล้มเหลว กรุณาลองใหม่อีกครั้ง',
    },
    REPAYMENT_AMOUNT_INVALID: {
      en: 'Invalid repayment amount.',
      th: 'จำนวนเงินชำระไม่ถูกต้อง',
    },
    REPAYMENT_CHANNEL_UNAVAILABLE: {
      en: 'Selected repayment channel is currently unavailable.',
      th: 'ช่องทางการชำระเงินที่เลือกไม่พร้อมใช้งานในขณะนี้',
    },
    LOAN_NOT_DUE_YET: {
      en: 'This loan is not due for repayment yet.',
      th: 'เงินกู้นี้ยังไม่ถึงกำหนดชำระ',
    },

    // 通用错误
    NETWORK_ERROR: {
      en: 'Network error. Please check your connection and try again.',
      th: 'ข้อผิดพลาดของเครือข่าย กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง',
    },
    SERVER_ERROR: {
      en: 'Server error. Please try again later.',
      th: 'ข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้งในภายหลัง',
    },
    VALIDATION_ERROR: {
      en: 'Validation error. Please check your input.',
      th: 'ข้อผิดพลาดในการตรวจสอบ กรุณาตรวจสอบข้อมูลของคุณ',
    },
    RESOURCE_NOT_FOUND: {
      en: 'The requested resource was not found.',
      th: 'ไม่พบทรัพยากรที่ขอ',
    },
    PERMISSION_DENIED: {
      en: 'You do not have permission to perform this action.',
      th: 'คุณไม่ได้รับอนุญาตให้ดำเนินการนี้',
    },
    DUPLICATE_REQUEST: {
      en: 'Duplicate request. Please wait a moment.',
      th: 'คำขอซ้ำ กรุณารอสักครู่',
    },
  };

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): LanguageInterceptor {
    if (!LanguageInterceptor.instance) {
      LanguageInterceptor.instance = new LanguageInterceptor();
    }
    return LanguageInterceptor.instance;
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage(): 'en' | 'th' {
    const lang = i18next.language || 'th';
    return lang.startsWith('th') ? 'th' : 'en';
  }

  /**
   * 设置语言
   * @param language 语言
   */
  async setLanguage(language: 'en' | 'th'): Promise<void> {
    await i18next.changeLanguage(language);
  }

  /**
   * 获取请求头（包含语言标识）
   */
  getHeaders(includeAuth: boolean = false, token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept-Language': this.getCurrentLanguage(),
    };

    if (includeAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * 从错误响应中提取多语言错误消息
   */
  extractErrorMessage(error: any): string {
    const currentLang = this.getCurrentLanguage();

    // 优先使用后端返回的多语言消息
    if (error?.message) {
      const backendMessage = error.message;
      const backendMessageTh = error.message_th;

      if (currentLang === 'th' && backendMessageTh) {
        return backendMessageTh;
      }
      if (backendMessage) {
        return backendMessage;
      }
    }

    // 使用错误码查找预定义的多语言消息
    const errorCode = error?.code || this.mapStatusToErrorCode(error?.status);
    const localizedError = this.errorMessages[errorCode];

    if (localizedError) {
      return currentLang === 'th' ? localizedError.th : localizedError.en;
    }

    // 默认错误消息
    const defaultMessage = {
      en: 'An unexpected error occurred. Please try again.',
      th: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง',
    };

    return currentLang === 'th' ? defaultMessage.th : defaultMessage.en;
  }

  /**
   * 将 HTTP 状态码映射到错误码
   */
  private mapStatusToErrorCode(status: number): string {
    switch (status) {
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'PERMISSION_DENIED';
      case 404:
        return 'RESOURCE_NOT_FOUND';
      case 409:
        return 'DUPLICATE_REQUEST';
      case 422:
        return 'VALIDATION_ERROR';
      case 0:
        return 'NETWORK_ERROR';
      default:
        return status >= 500 ? 'SERVER_ERROR' : 'VALIDATION_ERROR';
    }
  }

  /**
   * 显示错误消息（使用 Toast）
   * 注意：需要在 UI 层调用，此处仅返回消息
   */
  showError(error: any): string {
    return this.extractErrorMessage(error);
  }
}

// 导出单例实例
export const languageInterceptor = LanguageInterceptor.getInstance();
