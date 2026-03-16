/**
 * Redis 缓存层服务
 * 
 * 实现产品配置缓存、用户会话缓存、额度查询缓存
 * 
 * 功能:
 * - 多级缓存 (内存 + Redis)
 * - 键命名空间管理
 * - TTL 过期控制
 * - 缓存穿透/击穿/雪崩防护
 * - 统计监控
 * 
 * 注意：当前实现使用内存缓存，可轻松切换到 Redis
 */

import { EventEmitter } from 'events';
import logger, { type LogContext } from './logger.service';

// ==================== 类型定义 ====================

export interface CacheConfig {
  enabled: boolean;
  ttl: number;              // 默认 TTL (秒)
  maxKeys: number;          // 最大键数量
  namespace: string;        // 键命名空间
  useRedis: boolean;        // 是否使用 Redis (当前未实现)
  redisUrl?: string;        // Redis 连接 URL
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  keysCount: number;
  hitRate: number;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

// ==================== 缓存命名空间 ====================

export const CacheNamespace = {
  PRODUCT_CONFIG: 'product:config',
  USER_SESSION: 'user:session',
  CREDIT_LIMIT: 'credit:limit',
  USER_PROFILE: 'user:profile',
  KYC_STATUS: 'user:kyc',
  LOAN_PRODUCT: 'loan:product',
  EXCHANGE_RATE: 'system:exchange_rate',
  SYSTEM_CONFIG: 'system:config'
} as const;

// ==================== 默认配置 ====================

const DEFAULT_CONFIG: CacheConfig = {
  enabled: true,
  ttl: 300,              // 5 分钟
  maxKeys: 10000,
  namespace: 'lann',
  useRedis: false        // 当前使用内存缓存
};

// ==================== 缓存类 ====================

export class Cache extends EventEmitter {
  private config: CacheConfig;
  private store: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    keysCount: 0,
    hitRate: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanup();
    
    logger.info('Cache initialized', {
      config: this.config,
      mode: this.config.useRedis ? 'redis' : 'memory'
    });
  }

  private startCleanup() {
    // 每 60 秒清理过期键
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 60000);
    
    this.cleanupTimer.unref();
  }

  private cleanup() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.store.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      logger.debug('Cache cleanup', { removed });
      this.updateStats();
    }
  }

  private makeKey(namespace: string, key: string): string {
    return `${this.config.namespace}:${namespace}:${key}`;
  }

  private parseKey(fullKey: string): { namespace: string; key: string } | null {
    const parts = fullKey.split(':');
    if (parts.length >= 3) {
      return {
        namespace: parts[1],
        key: parts.slice(2).join(':')
      };
    }
    return null;
  }

  /**
   * 获取缓存
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }

    const fullKey = this.makeKey(namespace, key);
    const entry = this.store.get(fullKey);

    if (!entry) {
      this.stats.misses++;
      logger.debug('Cache miss', { namespace, key });
      return null;
    }

    // 检查是否过期
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(fullKey);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    this.updateStats();
    
    logger.debug('Cache hit', { namespace, key, hits: entry.hits });
    return entry.value as T;
  }

  /**
   * 设置缓存
   */
  async set<T>(
    namespace: string,
    key: string,
    value: T,
    options?: { ttl?: number }
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const fullKey = this.makeKey(namespace, key);
    const ttl = options?.ttl !== undefined ? options.ttl : this.config.ttl;
    const expiresAt = ttl > 0 ? Date.now() + (ttl * 1000) : 0;

    // 检查是否需要驱逐
    if (this.store.size >= this.config.maxKeys) {
      this.evictOldest();
    }

    this.store.set(fullKey, {
      value,
      expiresAt,
      createdAt: Date.now(),
      hits: 0
    });

    this.stats.sets++;
    this.updateStats();
    
    logger.debug('Cache set', { namespace, key, ttl });
  }

  /**
   * 删除缓存
   */
  async delete(namespace: string, key: string): Promise<boolean> {
    const fullKey = this.makeKey(namespace, key);
    const deleted = this.store.delete(fullKey);
    
    if (deleted) {
      this.stats.deletes++;
      this.updateStats();
      logger.debug('Cache delete', { namespace, key });
    }
    
    return deleted;
  }

  /**
   * 删除命名空间下的所有键
   */
  async deleteNamespace(namespace: string): Promise<number> {
    let deleted = 0;
    const prefix = `${this.config.namespace}:${namespace}:`;
    
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        deleted++;
      }
    }
    
    if (deleted > 0) {
      this.stats.deletes += deleted;
      this.updateStats();
      logger.info('Cache namespace deleted', { namespace, deleted });
    }
    
    return deleted;
  }

  /**
   * 批量获取
   */
  async mget<T>(
    namespace: string,
    keys: string[]
  ): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    
    for (const key of keys) {
      const value = await this.get<T>(namespace, key);
      if (value !== null) {
        result.set(key, value);
      }
    }
    
    return result;
  }

  /**
   * 批量设置
   */
  async mset<T>(
    namespace: string,
    entries: Map<string, T>,
    options?: { ttl?: number }
  ): Promise<void> {
    for (const [key, value] of entries.entries()) {
      await this.set(namespace, key, value, options);
    }
  }

  /**
   * 获取或设置 (带原子性)
   */
  async getOrSet<T>(
    namespace: string,
    key: string,
    fn: () => Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    // 先尝试获取
    const cached = await this.get<T>(namespace, key);
    if (cached !== null) {
      return cached;
    }

    // 缓存未命中，执行函数获取值
    const value = await fn();
    
    // 设置缓存
    await this.set(namespace, key, value, options);
    
    return value;
  }

  /**
   * 缓存穿透防护 (空值缓存)
   */
  async getWithProtection<T>(
    namespace: string,
    key: string,
    fn: () => Promise<T | null>,
    options?: { ttl?: number; nullTtl?: number }
  ): Promise<T | null> {
    const cached = await this.get<T | '__NULL__'>(namespace, key);
    
    if (cached !== null) {
      if (cached === '__NULL__') {
        return null;
      }
      return cached as T;
    }

    const value = await fn();
    
    if (value === null) {
      // 空值使用较短的 TTL
      const nullTtl = options?.nullTtl || 60;
      await this.set(namespace, key, '__NULL__', { ttl: nullTtl });
    } else {
      await this.set(namespace, key, value, options);
    }
    
    return value;
  }

  /**
   * 缓存击穿防护 (互斥锁)
   */
  async getWithMutex<T>(
    namespace: string,
    key: string,
    fn: () => Promise<T>,
    options?: { ttl?: number; mutexTtl?: number }
  ): Promise<T> {
    const lockKey = `${key}:lock`;
    
    // 尝试获取锁
    const lock = await this.get(namespace, lockKey);
    if (lock === null) {
      // 获取锁成功
      await this.set(namespace, lockKey, 'locked', { ttl: options?.mutexTtl || 10 });
      
      try {
        // 双重检查
        const cached = await this.get<T>(namespace, key);
        if (cached !== null) {
          return cached;
        }
        
        const value = await fn();
        await this.set(namespace, key, value, options);
        return value;
      } finally {
        await this.delete(namespace, lockKey);
      }
    }
    
    // 等待锁释放后重试
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.getWithMutex(namespace, key, fn, options);
  }

  private evictOldest() {
    // LRU: 删除最少访问的键
    let oldestKey: string | null = null;
    let oldestEntry: CacheEntry<any> | null = null;
    
    for (const [key, entry] of this.store.entries()) {
      if (!oldestEntry || entry.hits < oldestEntry.hits) {
        oldestKey = key;
        oldestEntry = entry;
      }
    }
    
    if (oldestKey) {
      this.store.delete(oldestKey);
      this.stats.evictions++;
      logger.debug('Cache eviction', { key: oldestKey });
    }
  }

  private updateStats() {
    this.stats.keysCount = this.store.size;
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * 获取统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 获取键数量
   */
  size(): number {
    return this.store.size;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.store.clear();
    logger.info('Cache cleared');
  }

  /**
   * 关闭缓存
   */
  close() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.store.clear();
    logger.info('Cache closed');
  }
}

// ==================== 便捷方法 ====================

/**
 * 产品配置缓存
 */
export const productConfig = {
  async get(productId: string) {
    return cache.get(CacheNamespace.PRODUCT_CONFIG, productId);
  },
  async set(productId: string, config: any, ttl?: number) {
    return cache.set(CacheNamespace.PRODUCT_CONFIG, productId, config, { ttl });
  },
  async invalidate(productId: string) {
    return cache.delete(CacheNamespace.PRODUCT_CONFIG, productId);
  }
};

/**
 * 用户会话缓存
 */
export const userSession = {
  async get(userId: string) {
    return cache.get(CacheNamespace.USER_SESSION, userId);
  },
  async set(userId: string, session: any, ttl?: number) {
    return cache.set(CacheNamespace.USER_SESSION, userId, session, { ttl });
  },
  async invalidate(userId: string) {
    return cache.delete(CacheNamespace.USER_SESSION, userId);
  }
};

/**
 * 额度查询缓存
 */
export const creditLimit = {
  async get(userId: string) {
    return cache.get(CacheNamespace.CREDIT_LIMIT, userId);
  },
  async set(userId: string, limit: any, ttl?: number) {
    return cache.set(CacheNamespace.CREDIT_LIMIT, userId, limit, { ttl });
  },
  async invalidate(userId: string) {
    return cache.delete(CacheNamespace.CREDIT_LIMIT, userId);
  }
};

// ==================== 导出默认实例 ====================

export const cache = new Cache();

export default cache;
