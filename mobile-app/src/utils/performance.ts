import { lazy, useState, useEffect, useRef, useCallback } from 'react';

// 代码分割 (lazy loading) 工具函数
export const lazyLoad = <T extends Record<string, unknown>>(
  importFunc: () => Promise<T>,
  componentName?: keyof T
): React.LazyExoticComponent<React.ComponentType<any>> => {
  return lazy(() => 
    importFunc().then(module => ({
      default: componentName ? module[componentName] as React.ComponentType<any> : module.default as React.ComponentType<any>
    }))
  );
};

// 图片懒加载 Hook
export const useImageLazyLoad = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setLoading(false);
      setError(false);
    };
    
    img.onerror = () => {
      setLoading(false);
      setError(true);
      if (placeholder) {
        setImageSrc(placeholder);
      }
    };
    
    img.src = src;
  }, [src]);

  return { imageSrc, loading, error };
};

// 虚拟列表组件
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
}

export const VirtualList = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算可视区域的起始和结束索引
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight)
  );

  // 计算上方填充高度
  const paddingTop = startIndex * itemHeight;

  // 计算下方填充高度
  const paddingBottom = (items.length - endIndex - 1) * itemHeight;

  // 计算可视区域内的项目
  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      {paddingTop > 0 && <div style={{ height: paddingTop }} />}
      {visibleItems.map((item, index) => {
        const actualIndex = startIndex + index;
        return (
          <div key={keyExtractor(item, actualIndex)} style={{ height: itemHeight }}>
            {renderItem(item, actualIndex)}
          </div>
        );
      })}
      {paddingBottom > 0 && <div style={{ height: paddingBottom }} />}
    </div>
  );
};

// 缓存工具类
class CacheManager {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  set<T>(key: string, data: T, ttl: number = 300000): void { // 默认5分钟ttl
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();

// 内存清理函数
export const cleanupResources = () => {
  cacheManager.cleanup();
  // 清理其他临时资源
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.startsWith('temp-')) {
          caches.delete(name);
        }
      });
    });
  }
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};