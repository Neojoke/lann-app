import { Component, ReactNode } from 'react';

// 错误类型定义
export interface AppError {
  name: string;
  message: string;
  stack?: string;
  timestamp: Date;
  url?: string;
  userAgent?: string;
  additionalInfo?: any;
}

// 错误级别
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// 全局错误处理类
class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private onErrorCallback?: (error: AppError, level: ErrorLevel) => void;
  private errorQueue: AppError[] = [];
  private maxQueueSize = 100;

  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
      GlobalErrorHandler.instance.initializeGlobalHandlers();
    }
    return GlobalErrorHandler.instance;
  }

  private initializeGlobalHandlers(): void {
    // 捕获 JavaScript 运行时错误
    window.addEventListener('error', (event) => {
      this.handleError({
        name: event.error?.name || 'JavaScript Error',
        message: event.error?.message || event.message,
        stack: event.error?.stack,
        timestamp: new Date(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }, ErrorLevel.ERROR);
    });

    // 捕获 Promise 拒绝错误
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      this.handleError({
        name: error?.name || 'Unhandled Promise Rejection',
        message: error?.message || String(error),
        stack: error?.stack,
        timestamp: new Date(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }, ErrorLevel.ERROR);
    });
  }

  public setErrorHandler(callback: (error: AppError, level: ErrorLevel) => void): void {
    this.onErrorCallback = callback;
  }

  public handleError(error: AppError, level: ErrorLevel = ErrorLevel.ERROR): void {
    // 添加到错误队列
    this.errorQueue.push(error);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // 移除最老的错误
    }

    // 执行回调处理
    if (this.onErrorCallback) {
      this.onErrorCallback(error, level);
    }

    // 控制台输出
    this.logToConsole(error, level);

    // 上报错误
    this.reportError(error, level);
  }

  private logToConsole(error: AppError, level: ErrorLevel): void {
    switch (level) {
      case ErrorLevel.INFO:
        console.info(`[INFO] ${error.name}: ${error.message}`, error);
        break;
      case ErrorLevel.WARNING:
        console.warn(`[WARN] ${error.name}: ${error.message}`, error);
        break;
      case ErrorLevel.ERROR:
        console.error(`[ERROR] ${error.name}: ${error.message}`, error);
        break;
      case ErrorLevel.CRITICAL:
        console.error(`[CRITICAL] ${error.name}: ${error.message}`, error);
        break;
    }
  }

  private async reportError(error: AppError, level: ErrorLevel): Promise<void> {
    // 这里可以集成错误上报服务，如 Sentry、Bugsnag 等
    // 示例：发送错误到后端服务
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...error,
          level,
          timestamp: error.timestamp.toISOString(),
        }),
      });
    } catch (reportError) {
      // 错误上报本身失败，记录但不抛出
      console.warn('Failed to report error:', reportError);
    }
  }

  public getErrorQueue(): AppError[] {
    return [...this.errorQueue];
  }

  public clearErrorQueue(): void {
    this.errorQueue = [];
  }

  public getLastError(): AppError | undefined {
    return this.errorQueue[this.errorQueue.length - 1];
  }
}

// 错误边界组件
interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: any) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error: {
        name: error.name || 'Unknown Error',
        message: error.message || 'An unknown error occurred',
        stack: error.stack,
        timestamp: new Date(),
        url: window.location.href,
        userAgent: navigator.userAgent
      } as AppError
    };
  }

  componentDidCatch(error: Error, errorInfo: any): void {
    const appError: AppError = {
      name: error.name || 'Component Error',
      message: error.message || 'An error occurred in a component',
      stack: error.stack,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      additionalInfo: errorInfo
    };

    // 使用全局错误处理器记录错误
    GlobalErrorHandler.getInstance().handleError(appError, ErrorLevel.ERROR);

    // 如果提供了自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了 fallback 组件，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误界面
      return (
        <div className="error-boundary-container">
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message && <div><strong>Error:</strong> {this.state.error.message}</div>}
            {this.state.error?.stack && <div><strong>Stack:</strong> {this.state.error.stack}</div>}
          </details>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 友好错误页面组件
interface FriendlyErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showReload?: boolean;
  showHomeLink?: boolean;
}

export const FriendlyErrorPage: React.FC<FriendlyErrorPageProps> = ({
  title = 'Something went wrong',
  message = 'We apologize, but an error occurred. Please try again.',
  onRetry,
  showReload = true,
  showHomeLink = true
}) => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="friendly-error-page">
      <div className="error-content">
        <h1>{title}</h1>
        <p>{message}</p>
        <div className="error-actions">
          {onRetry && (
            <button onClick={onRetry} className="retry-button">
              Try Again
            </button>
          )}
          {showReload && (
            <button onClick={handleReload} className="reload-button">
              Reload Page
            </button>
          )}
          {showHomeLink && (
            <button onClick={handleGoHome} className="home-button">
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 错误处理工具函数
export const withErrorHandler = <T extends (...args: any[]) => any>(
  fn: T,
  onError?: (error: any) => void
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((error) => {
          const appError: AppError = {
            name: error.name || 'Async Error',
            message: error.message || 'An asynchronous error occurred',
            stack: error.stack,
            timestamp: new Date(),
            url: window.location.href,
            userAgent: navigator.userAgent
          };

          GlobalErrorHandler.getInstance().handleError(appError, ErrorLevel.ERROR);

          if (onError) {
            onError(error);
          }

          throw error;
        });
      }
      return result;
    } catch (error) {
      const appError: AppError = {
        name: error.name || 'Sync Error',
        message: error.message || 'A synchronous error occurred',
        stack: error.stack,
        timestamp: new Date(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      GlobalErrorHandler.getInstance().handleError(appError, ErrorLevel.ERROR);

      if (onError) {
        onError(error);
      }

      throw error;
    }
  }) as T;
};

// 获取全局错误处理器实例
export const getGlobalErrorHandler = (): GlobalErrorHandler => {
  return GlobalErrorHandler.getInstance();
};

// 初始化全局错误处理器
export const initGlobalErrorHandler = (onError?: (error: AppError, level: ErrorLevel) => void): void => {
  const errorHandler = GlobalErrorHandler.getInstance();
  if (onError) {
    errorHandler.setErrorHandler(onError);
  }
};

// 使用示例：
// initGlobalErrorHandler((error, level) => {
//   console.log(`Error (${level}):`, error);
//   // 这里可以发送错误到你的错误收集服务
// });