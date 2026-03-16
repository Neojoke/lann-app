import { environment } from '../environments/environment';
import i18next from 'i18next';

/**
 * API 客户端基类
 * API Client Base Class
 * 
 * 提供基础的 HTTP 请求方法，自动处理语言标识和错误
 */
export class ApiClient {
  protected readonly baseUrl: string = environment.apiBaseUrl;

  /**
   * 获取当前语言
   */
  protected getCurrentLanguage(): 'en' | 'th' {
    const lang = i18next.language || 'th';
    return lang.startsWith('th') ? 'th' : 'en';
  }

  /**
   * 获取请求头
   */
  protected getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept-Language': this.getCurrentLanguage(),
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * 获取认证 Token
   */
  protected getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * GET 请求
   */
  protected async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST 请求
   */
  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(new URL(endpoint, this.baseUrl).toString(), {
      method: 'POST',
      headers: this.getHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT 请求
   */
  protected async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(new URL(endpoint, this.baseUrl).toString(), {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE 请求
   */
  protected async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(new URL(endpoint, this.baseUrl).toString(), {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * 处理响应
   */
  protected async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw await this.handleError(response);
    }

    // 处理 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * 处理错误
   */
  protected async handleError(response: Response): Promise<Error> {
    let errorData: any;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }

    const errorCode = errorData?.code || this.mapStatusToErrorCode(response.status);
    const errorMessage = this.getErrorMessage(errorCode, errorData?.message, errorData?.message_th);

    const error = new Error(errorMessage);
    (error as any).code = errorCode;
    (error as any).status = response.status;
    (error as any).originalError = errorData;

    return error;
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
        return status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR';
    }
  }

  /**
   * 获取错误消息（多语言）
   */
  private getErrorMessage(errorCode: string, messageEn?: string, messageTh?: string): string {
    // 优先使用后端返回的消息
    const currentLang = this.getCurrentLanguage();
    if (currentLang === 'th' && messageTh) {
      return messageTh;
    }
    if (messageEn) {
      return messageEn;
    }

    // 使用预定义的错误消息
    const errorMessages: Record<string, { en: string; th: string }> = {
      UNAUTHORIZED: {
        en: 'Authentication required. Please log in again.',
        th: 'ต้องการการยืนยันตัวตน กรุณาเข้าสู่ระบบอีกครั้ง',
      },
      TOKEN_EXPIRED: {
        en: 'Your session has expired. Please log in again.',
        th: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
      },
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
    };

    const localizedError = errorMessages[errorCode];
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
}
