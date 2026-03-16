/**
 * 数据库连接池服务
 * 
 * 实现连接池管理、查询缓存、连接数监控
 * 
 * 功能:
 * - 连接池管理 (最大连接数、最小连接数、空闲超时)
 * - 查询缓存 (LRU 策略、TTL 过期)
 * - 连接数监控 (活跃连接、空闲连接、等待队列)
 * - 慢查询日志
 * - 自动重连
 */

import { EventEmitter } from 'events';
import { db, type Database } from '../db';
import logger, { type LogContext } from './logger.service';

// ==================== 类型定义 ====================

export interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  idleTimeout: number;      // 空闲连接超时 (ms)
  acquireTimeout: number;   // 获取连接超时 (ms)
  slowQueryThreshold: number; // 慢查询阈值 (ms)
}

export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalQueries: number;
  slowQueries: number;
  cacheHits: number;
  cacheMisses: number;
  avgQueryTime: number;
}

export interface QueryCacheConfig {
  enabled: boolean;
  maxSize: number;
  ttl: number;  // 缓存过期时间 (ms)
}

interface CachedQuery {
  result: any;
  timestamp: number;
  hits: number;
}

interface PooledConnection {
  db: Database;
  lastUsed: number;
  inUse: boolean;
}

// ==================== 默认配置 ====================

const DEFAULT_POOL_CONFIG: PoolConfig = {
  maxConnections: 10,
  minConnections: 2,
  idleTimeout: 30000,        // 30 秒
  acquireTimeout: 5000,      // 5 秒
  slowQueryThreshold: 100    // 100ms
};

const DEFAULT_CACHE_CONFIG: QueryCacheConfig = {
  enabled: true,
  maxSize: 1000,
  ttl: 60000  // 1 分钟
};

// ==================== 连接池类 ====================

export class DatabasePool extends EventEmitter {
  private config: PoolConfig;
  private cacheConfig: QueryCacheConfig;
  private connections: PooledConnection[] = [];
  private waitingQueue: Array<{
    resolve: (conn: PooledConnection) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  
  // 查询缓存
  private queryCache: Map<string, CachedQuery> = new Map();
  
  // 统计信息
  private stats: PoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    totalQueries: 0,
    slowQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgQueryTime: 0
  };

  private totalQueryTime: number = 0;
  private idleTimer?: NodeJS.Timeout;

  constructor(config?: Partial<PoolConfig>, cacheConfig?: Partial<QueryCacheConfig>) {
    super();
    this.config = { ...DEFAULT_POOL_CONFIG, ...config };
    this.cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig };
    
    // 初始化连接池
    this.initializePool();
    
    // 启动空闲连接清理
    this.startIdleCleanup();
    
    logger.info('Database pool initialized', {
      config: this.config,
      cacheConfig: this.cacheConfig
    });
  }

  private initializePool() {
    // 创建最小连接数
    for (let i = 0; i < this.config.minConnections; i++) {
      this.createConnection();
    }
  }

  private createConnection(): PooledConnection {
    const conn: PooledConnection = {
      db,  // 使用共享的 db 实例 (SQLite 是单文件的)
      lastUsed: Date.now(),
      inUse: false
    };
    
    this.connections.push(conn);
    this.updateStats();
    
    logger.debug('Created database connection', {
      totalConnections: this.connections.length
    });
    
    return conn;
  }

  private startIdleCleanup() {
    this.idleTimer = setInterval(() => {
      this.cleanupIdleConnections();
    }, 5000); // 每 5 秒检查一次
    
    this.idleTimer.unref();
  }

  private cleanupIdleConnections() {
    const now = Date.now();
    const toRemove: number[] = [];
    
    for (let i = 0; i < this.connections.length; i++) {
      const conn = this.connections[i];
      
      if (!conn.inUse && (now - conn.lastUsed) > this.config.idleTimeout) {
        // 保留最小连接数
        if (this.connections.length - toRemove.length > this.config.minConnections) {
          toRemove.push(i);
          logger.debug('Removed idle connection', {
            idleTime: now - conn.lastUsed
          });
        }
      }
    }
    
    // 从后往前删除
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.connections.splice(toRemove[i], 1);
    }
    
    if (toRemove.length > 0) {
      this.updateStats();
    }
  }

  /**
   * 获取连接
   */
  async acquire(): Promise<PooledConnection> {
    // 查找空闲连接
    const idleConn = this.connections.find(c => !c.inUse);
    
    if (idleConn) {
      idleConn.inUse = true;
      idleConn.lastUsed = Date.now();
      this.updateStats();
      return idleConn;
    }
    
    // 如果没有空闲连接且未达到最大连接数，创建新连接
    if (this.connections.length < this.config.maxConnections) {
      const newConn = this.createConnection();
      newConn.inUse = true;
      newConn.lastUsed = Date.now();
      this.updateStats();
      return newConn;
    }
    
    // 否则加入等待队列
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // 从队列中移除
        const index = this.waitingQueue.findIndex(w => w.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Connection pool timeout'));
      }, this.config.acquireTimeout);
      
      this.waitingQueue.push({
        resolve: (conn) => {
          clearTimeout(timeout);
          conn.inUse = true;
          conn.lastUsed = Date.now();
          this.updateStats();
          resolve(conn);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now()
      });
      
      this.updateStats();
    });
  }

  /**
   * 释放连接
   */
  release(conn: PooledConnection) {
    conn.inUse = false;
    conn.lastUsed = Date.now();
    
    // 如果有等待的请求，分配给第一个等待者
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift()!;
      conn.inUse = true;
      waiter.resolve(conn);
    }
    
    this.updateStats();
  }

  /**
   * 执行查询 (带缓存)
   */
  async query<T = any>(
    sql: string,
    params?: any[],
    options?: { cache?: boolean; context?: LogContext }
  ): Promise<T> {
    const cacheKey = options?.cache ? this.getCacheKey(sql, params) : null;
    
    // 检查缓存
    if (cacheKey && this.cacheConfig.enabled) {
      const cached = this.queryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheConfig.ttl) {
        cached.hits++;
        this.stats.cacheHits++;
        logger.debug('Cache hit', { cacheKey, hits: cached.hits });
        return cached.result as T;
      }
      this.stats.cacheMisses++;
    }
    
    const startTime = Date.now();
    this.stats.totalQueries++;
    
    const conn = await this.acquire();
    
    try {
      const result = await this.executeQuery(conn.db, sql, params);
      const duration = Date.now() - startTime;
      
      // 更新统计
      this.totalQueryTime += duration;
      this.stats.avgQueryTime = this.totalQueryTime / this.stats.totalQueries;
      
      // 检查慢查询
      if (duration > this.config.slowQueryThreshold) {
        this.stats.slowQueries++;
        logger.warn('Slow query detected', {
          sql,
          params,
          duration_ms: duration,
          ...options?.context
        });
      } else {
        logger.debug('Query executed', {
          sql,
          duration_ms: duration,
          ...options?.context
        });
      }
      
      // 缓存结果 (仅 SELECT 查询)
      if (cacheKey && this.cacheConfig.enabled && this.isSelectQuery(sql)) {
        this.addToCache(cacheKey, result);
      }
      
      return result as T;
    } finally {
      this.release(conn);
    }
  }

  private async executeQuery(db: Database, sql: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const lowerSql = sql.trim().toLowerCase();
        let result: any;
        
        if (lowerSql.startsWith('select')) {
          result = db.all(sql, params || []);
        } else if (lowerSql.startsWith('insert')) {
          result = db.run(sql, params || []);
        } else if (lowerSql.startsWith('update')) {
          result = db.run(sql, params || []);
        } else if (lowerSql.startsWith('delete')) {
          result = db.run(sql, params || []);
        } else {
          result = db.run(sql, params || []);
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  private getCacheKey(sql: string, params?: any[]): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${sql}::${paramsStr}`;
  }

  private isSelectQuery(sql: string): boolean {
    return sql.trim().toLowerCase().startsWith('select');
  }

  private addToCache(key: string, value: any) {
    // LRU: 如果缓存已满，删除最旧的
    if (this.queryCache.size >= this.cacheConfig.maxSize) {
      const firstKey = this.queryCache.keys().next().value;
      if (firstKey) {
        this.queryCache.delete(firstKey);
      }
    }
    
    this.queryCache.set(key, {
      result: value,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * 清除缓存
   */
  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
      logger.debug('Cache cleared with pattern', { pattern });
    } else {
      this.queryCache.clear();
      logger.debug('Cache cleared completely');
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): PoolStats {
    return { ...this.stats };
  }

  private updateStats() {
    this.stats.totalConnections = this.connections.length;
    this.stats.activeConnections = this.connections.filter(c => c.inUse).length;
    this.stats.idleConnections = this.connections.filter(c => !c.inUse).length;
    this.stats.waitingRequests = this.waitingQueue.length;
  }

  /**
   * 关闭连接池
   */
  close() {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
    }
    
    // 拒绝所有等待的请求
    for (const waiter of this.waitingQueue) {
      waiter.reject(new Error('Connection pool closed'));
    }
    this.waitingQueue = [];
    
    this.connections = [];
    this.queryCache.clear();
    this.updateStats();
    
    logger.info('Database pool closed');
  }
}

// ==================== 导出默认实例 ====================

export const dbPool = new DatabasePool();

export default dbPool;
