import React, { useState, useEffect } from 'react';
import './Loading.css'; // 我们稍后创建样式文件

export interface LoadingProps {
  type?: 'spinner' | 'skeleton' | 'progress' | 'custom';
  skeletonType?: 'text' | 'rect' | 'circle' | 'image';
  progress?: number;
  timeout?: number;
  retryCount?: number;
  onTimeout?: () => void;
  onRetry?: () => void;
  children?: React.ReactNode;
  className?: string;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const Loading: React.FC<LoadingProps> = ({
  type = 'spinner',
  skeletonType = 'rect',
  progress = 0,
  timeout = 30000, // 30秒超时
  retryCount = 3,
  onTimeout,
  onRetry,
  children,
  className = '',
  message = 'Loading...',
  size = 'medium',
  color
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const [progressValue, setProgressValue] = useState(progress);

  // 处理进度更新
  useEffect(() => {
    if (type === 'progress') {
      setProgressValue(progress);
    }
  }, [progress, type]);

  // 设置超时处理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (retryAttempt < retryCount) {
        setRetryAttempt(prev => prev + 1);
        if (onRetry) {
          onRetry();
        }
      } else {
        setShowTimeoutMessage(true);
        if (onTimeout) {
          onTimeout();
        }
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, retryAttempt, retryCount, onTimeout, onRetry]);

  // 重置加载状态
  const reset = () => {
    setIsLoading(true);
    setRetryAttempt(0);
    setShowTimeoutMessage(false);
  };

  // 渲染不同类型的加载指示器
  const renderLoader = () => {
    const sizeClass = `loading-${size}`;
    const baseClasses = `loading-component ${className} ${sizeClass}`;
    
    switch (type) {
      case 'spinner':
        return (
          <div className={`${baseClasses} loading-spinner`} style={{ color }}>
            <div className="spinner-circle"></div>
            {message && <span className="loading-message">{message}</span>}
          </div>
        );
      
      case 'skeleton':
        const skeletonClasses = `skeleton ${skeletonType} ${sizeClass}`;
        return (
          <div className={baseClasses}>
            <div className={skeletonClasses}></div>
            {message && <span className="loading-message">{message}</span>}
          </div>
        );
      
      case 'progress':
        return (
          <div className={`${baseClasses} loading-progress`}>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
              ></div>
            </div>
            <span className="progress-text">
              {Math.round(progressValue)}%
            </span>
            {message && <span className="loading-message">{message}</span>}
          </div>
        );
      
      case 'custom':
        return (
          <div className={baseClasses}>
            {children}
          </div>
        );
      
      default:
        return (
          <div className={`${baseClasses} loading-spinner`} style={{ color }}>
            <div className="spinner-circle"></div>
            {message && <span className="loading-message">{message}</span>}
          </div>
        );
    }
  };

  // 如果显示超时消息
  if (showTimeoutMessage) {
    return (
      <div className={`loading-component loading-timeout ${className}`}>
        <div className="timeout-content">
          <h3>加载超时</h3>
          <p>网络连接似乎出现了问题，请稍后再试。</p>
          <div className="timeout-actions">
            {onRetry && retryAttempt <= retryCount && (
              <button 
                className="retry-button" 
                onClick={() => {
                  setRetryAttempt(0);
                  setShowTimeoutMessage(false);
                  if (onRetry) onRetry();
                }}
              >
                重试
              </button>
            )}
            <button 
              className="refresh-button" 
              onClick={() => window.location.reload()}
            >
              刷新页面
            </button>
          </div>
        </div>
      </div>
    );
  }

  return renderLoader();
};

// 骨架屏组件
export const SkeletonScreen: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string; 
}> = ({ rows = 3, columns = 1, className = '' }) => {
  const skeletonRows = Array.from({ length: rows }, (_, rowIndex) => (
    <div key={rowIndex} className="skeleton-row">
      {Array.from({ length: columns }, (_, colIndex) => (
        <div key={colIndex} className="skeleton-col">
          <div className="skeleton skeleton-text skeleton-title"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text"></div>
        </div>
      ))}
    </div>
  ));

  return (
    <div className={`skeleton-screen ${className}`}>
      {skeletonRows}
    </div>
  );
};

// 全局加载状态管理
class GlobalLoadingManager {
  private loadingStates: Map<string, boolean> = new Map();
  private observers: Array<(state: { [key: string]: boolean }) => void> = [];

  public show(key: string): void {
    this.loadingStates.set(key, true);
    this.notifyObservers();
  }

  public hide(key: string): void {
    this.loadingStates.set(key, false);
    this.notifyObservers();
  }

  public isLoading(key: string): boolean {
    return this.loadingStates.get(key) ?? false;
  }

  public isAnyLoading(): boolean {
    for (const state of this.loadingStates.values()) {
      if (state) return true;
    }
    return false;
  }

  public subscribe(observer: (state: { [key: string]: boolean }) => void): () => void {
    this.observers.push(observer);
    observer(this.getState());
    
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers(): void {
    const state = this.getState();
    this.observers.forEach(observer => observer(state));
  }

  private getState(): { [key: string]: boolean } {
    const state: { [key: string]: boolean } = {};
    for (const [key, value] of this.loadingStates.entries()) {
      state[key] = value;
    }
    return state;
  }

  public getAllStates(): Map<string, boolean> {
    return new Map(this.loadingStates);
  }

  public clearAll(): void {
    this.loadingStates.clear();
    this.notifyObservers();
  }
}

export const globalLoadingManager = new GlobalLoadingManager();

// Hook for using global loading state
export const useGlobalLoading = (key: string): [boolean, (loading: boolean) => void] => {
  const [loading, setLoading] = useState(globalLoadingManager.isLoading(key));

  useEffect(() => {
    const unsubscribe = globalLoadingManager.subscribe((state) => {
      setLoading(state[key] ?? false);
    });

    return unsubscribe;
  }, [key]);

  const updateLoading = (isLoading: boolean) => {
    if (isLoading) {
      globalLoadingManager.show(key);
    } else {
      globalLoadingManager.hide(key);
    }
  };

  return [loading, updateLoading];
};

export default Loading;