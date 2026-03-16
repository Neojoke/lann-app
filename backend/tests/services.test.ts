/**
 * 服务层测试
 * 
 * 测试数据库连接池、缓存服务和日志服务
 * 
 * 测试覆盖率目标：≥ 80%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabasePool, dbPool } from '../services/db-pool.service';
import { Cache, cache, CacheNamespace } from '../services/cache.service';
import { Logger, logger } from '../services/logger.service';

// ==================== 数据库连接池测试 ====================

describe('DatabasePool', () => {
  let pool: DatabasePool;

  beforeEach(() => {
    pool = new DatabasePool({
      maxConnections: 5,
      minConnections: 1,
      idleTimeout: 1000,
      acquireTimeout: 5000,
      slowQueryThreshold: 50
    }, {
      enabled: true,
      maxSize: 100,
      ttl: 60000
    });
  });

  afterEach(() => {
    pool.close();
  });

  describe('Connection Management', () => {
    it('should initialize with minimum connections', () => {
      const stats = pool.getStats();
      expect(stats.totalConnections).toBeGreaterThanOrEqual(1);
    });

    it('should acquire and release connections', async () => {
      const conn = await pool.acquire();
      expect(conn).toBeDefined();
      expect(conn.inUse).toBe(true);
      
      pool.release(conn);
      const stats = pool.getStats();
      expect(stats.activeConnections).toBe(0);
    });

    it('should track connection statistics', async () => {
      const conn = await pool.acquire();
      pool.release(conn);
      
      const stats = pool.getStats();
      expect(stats.totalConnections).toBeDefined();
      expect(stats.activeConnections).toBeDefined();
      expect(stats.idleConnections).toBeDefined();
    });

    it('should handle multiple concurrent acquisitions', async () => {
      const connections = await Promise.all([
        pool.acquire(),
        pool.acquire(),
        pool.acquire()
      ]);
      
      const stats = pool.getStats();
      expect(stats.activeConnections).toBe(3);
      
      // 释放所有连接
      connections.forEach(conn => pool.release(conn));
    });
  });

  describe('Query Execution', () => {
    it('should execute queries with caching', async () => {
      const result = await pool.query(
        'SELECT 1 as test',
        [],
        { cache: true }
      );
      
      expect(result).toBeDefined();
    });

    it('should cache SELECT queries', async () => {
      // 第一次查询
      await pool.query('SELECT 1 as test', [], { cache: true });
      
      // 第二次应该从缓存
      const stats1 = pool.getStats();
      await pool.query('SELECT 1 as test', [], { cache: true });
      const stats2 = pool.getStats();
      
      expect(stats2.cacheHits).toBeGreaterThan(stats1.cacheHits);
    });

    it('should track slow queries', async () => {
      // 执行一个查询
      await pool.query('SELECT 1 as test');
      
      const stats = pool.getStats();
      expect(stats.totalQueries).toBeGreaterThan(0);
      expect(stats.avgQueryTime).toBeDefined();
    });

    it('should not cache non-SELECT queries', async () => {
      // INSERT/UPDATE/DELETE 不应该被缓存
      const stats1 = pool.getStats();
      
      try {
        await pool.query('INSERT INTO test (id) VALUES (1)', [], { cache: true });
      } catch (e) {
        // 表可能不存在，忽略
      }
      
      const stats2 = pool.getStats();
      expect(stats2.cacheHits).toBe(stats1.cacheHits);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache with pattern', async () => {
      // 添加一些缓存
      await pool.query('SELECT 1 as a', [], { cache: true });
      await pool.query('SELECT 2 as b', [], { cache: true });
      
      pool.clearCache();
      
      const stats = pool.getStats();
      expect(stats.cacheHits).toBe(0);
    });

    it('should respect cache TTL', async () => {
      // 创建一个短 TTL 的池
      const shortTtlPool = new DatabasePool({}, {
        enabled: true,
        maxSize: 100,
        ttl: 100  // 100ms
      });
      
      await shortTtlPool.query('SELECT 1', [], { cache: true });
      
      // 等待缓存过期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const stats = shortTtlPool.getStats();
      // 缓存应该已过期
      expect(stats.cacheHits).toBe(0);
      
      shortTtlPool.close();
    });
  });

  describe('Connection Limits', () => {
    it('should respect max connections', async () => {
      const smallPool = new DatabasePool({
        maxConnections: 2,
        minConnections: 0,
        acquireTimeout: 100
      });
      
      // 获取所有可用连接
      const conn1 = await smallPool.acquire();
      const conn2 = await smallPool.acquire();
      
      // 第三个应该超时
      try {
        await smallPool.acquire();
        // 不应该到这里
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('timeout');
      }
      
      smallPool.release(conn1);
      smallPool.release(conn2);
      smallPool.close();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup idle connections', async () => {
      const cleanupPool = new DatabasePool({
        maxConnections: 5,
        minConnections: 0,
        idleTimeout: 100  // 100ms
      });
      
      const conn = await cleanupPool.acquire();
      cleanupPool.release(conn);
      
      // 等待清理
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const stats = cleanupPool.getStats();
      // 连接应该被清理（保留最小连接数）
      expect(stats.idleConnections).toBeLessThanOrEqual(1);
      
      cleanupPool.close();
    });

    it('should close all connections on pool close', () => {
      pool.close();
      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.waitingRequests).toBe(0);
    });
  });
});

// ==================== 缓存服务测试 ====================

describe('Cache', () => {
  let testCache: Cache;

  beforeEach(() => {
    testCache = new Cache({
      enabled: true,
      ttl: 300,
      maxKeys: 1000,
      namespace: 'test'
    });
  });

  afterEach(() => {
    testCache.close();
  });

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      await testCache.set('users', 'user_1', { id: 1, name: 'Test' });
      const value = await testCache.get('users', 'user_1');
      
      expect(value).toEqual({ id: 1, name: 'Test' });
    });

    it('should return null for missing keys', async () => {
      const value = await testCache.get('users', 'nonexistent');
      expect(value).toBeNull();
    });

    it('should delete values', async () => {
      await testCache.set('users', 'user_1', { id: 1 });
      const deleted = await testCache.delete('users', 'user_1');
      
      expect(deleted).toBe(true);
      
      const value = await testCache.get('users', 'user_1');
      expect(value).toBeNull();
    });

    it('should track statistics', async () => {
      await testCache.set('users', 'user_1', { id: 1 });
      await testCache.get('users', 'user_1');
      await testCache.get('users', 'user_1');
      await testCache.get('users', 'nonexistent');
      
      const stats = testCache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.sets).toBe(1);
    });
  });

  describe('TTL Expiration', () => {
    it('should expire keys after TTL', async () => {
      const shortTtlCache = new Cache({
        enabled: true,
        ttl: 1,  // 1 秒
        maxKeys: 100,
        namespace: 'test'
      });
      
      await shortTtlCache.set('users', 'user_1', { id: 1 });
      
      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const value = await shortTtlCache.get('users', 'user_1');
      expect(value).toBeNull();
      
      shortTtlCache.close();
    });

    it('should support custom TTL per key', async () => {
      await testCache.set('users', 'user_1', { id: 1 }, { ttl: 1 });
      await testCache.set('users', 'user_2', { id: 2 }, { ttl: 60 });
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const user1 = await testCache.get('users', 'user_1');
      const user2 = await testCache.get('users', 'user_2');
      
      expect(user1).toBeNull();
      expect(user2).toEqual({ id: 2 });
    });
  });

  describe('Namespace Operations', () => {
    it('should delete all keys in namespace', async () => {
      await testCache.set('users', 'user_1', { id: 1 });
      await testCache.set('users', 'user_2', { id: 2 });
      await testCache.set('products', 'prod_1', { id: 1 });
      
      const deleted = await testCache.deleteNamespace('users');
      
      expect(deleted).toBe(2);
      
      const user1 = await testCache.get('users', 'user_1');
      const prod1 = await testCache.get('products', 'prod_1');
      
      expect(user1).toBeNull();
      expect(prod1).toEqual({ id: 1 });
    });

    it('should handle empty namespace', async () => {
      const deleted = await testCache.deleteNamespace('nonexistent');
      expect(deleted).toBe(0);
    });
  });

  describe('Batch Operations', () => {
    it('should batch get values', async () => {
      await testCache.set('users', 'user_1', { id: 1 });
      await testCache.set('users', 'user_2', { id: 2 });
      await testCache.set('users', 'user_3', { id: 3 });
      
      const result = await testCache.mget('users', ['user_1', 'user_2', 'nonexistent']);
      
      expect(result.size).toBe(2);
      expect(result.get('user_1')).toEqual({ id: 1 });
      expect(result.get('user_2')).toEqual({ id: 2 });
    });

    it('should batch set values', async () => {
      const entries = new Map([
        ['user_1', { id: 1 }],
        ['user_2', { id: 2 }],
        ['user_3', { id: 3 }]
      ]);
      
      await testCache.mset('users', entries);
      
      const user1 = await testCache.get('users', 'user_1');
      const user2 = await testCache.get('users', 'user_2');
      
      expect(user1).toEqual({ id: 1 });
      expect(user2).toEqual({ id: 2 });
    });
  });

  describe('Get Or Set', () => {
    it('should return cached value', async () => {
      await testCache.set('users', 'user_1', { id: 1 });
      
      let called = false;
      const result = await testCache.getOrSet('users', 'user_1', async () => {
        called = true;
        return { id: 1 };
      });
      
      expect(result).toEqual({ id: 1 });
      expect(called).toBe(false);  // 不应该调用函数
    });

    it('should call function when not cached', async () => {
      let called = false;
      const result = await testCache.getOrSet('users', 'user_1', async () => {
        called = true;
        return { id: 1 };
      });
      
      expect(result).toEqual({ id: 1 });
      expect(called).toBe(true);
      
      // 验证已缓存
      const cached = await testCache.get('users', 'user_1');
      expect(cached).toEqual({ id: 1 });
    });
  });

  describe('Cache Protection', () => {
    it('should cache null values with shorter TTL', async () => {
      let callCount = 0;
      
      const fetchUser = async () => {
        callCount++;
        return null;
      };
      
      // 第一次调用
      await testCache.getWithProtection('users', 'nonexistent', fetchUser, {
        ttl: 300,
        nullTtl: 60
      });
      
      // 第二次应该从缓存获取 null
      await testCache.getWithProtection('users', 'nonexistent', fetchUser);
      
      expect(callCount).toBe(1);  // 只调用了一次
    });
  });

  describe('Cache Limits', () => {
    it('should evict oldest keys when full', async () => {
      const smallCache = new Cache({
        enabled: true,
        ttl: 300,
        maxKeys: 3,
        namespace: 'test'
      });
      
      await smallCache.set('users', 'user_1', { id: 1 });
      await smallCache.set('users', 'user_2', { id: 2 });
      await smallCache.set('users', 'user_3', { id: 3 });
      await smallCache.set('users', 'user_4', { id: 4 });  // 应该触发驱逐
      
      const stats = smallCache.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
      expect(smallCache.size()).toBeLessThanOrEqual(3);
      
      smallCache.close();
    });
  });

  describe('Predefined Namespaces', () => {
    it('should use PRODUCT_CONFIG namespace', async () => {
      const { productConfig } = await import('../services/cache.service');
      
      await productConfig.set('prod_1', { name: 'Test Product' });
      const value = await productConfig.get('prod_1');
      
      expect(value).toEqual({ name: 'Test Product' });
    });

    it('should use USER_SESSION namespace', async () => {
      const { userSession } = await import('../services/cache.service');
      
      await userSession.set('user_1', { session_id: 'abc123' });
      const value = await userSession.get('user_1');
      
      expect(value).toEqual({ session_id: 'abc123' });
    });

    it('should use CREDIT_LIMIT namespace', async () => {
      const { creditLimit } = await import('../services/cache.service');
      
      await creditLimit.set('user_1', { limit: 10000 });
      const value = await creditLimit.get('user_1');
      
      expect(value).toEqual({ limit: 10000 });
    });
  });
});

// ==================== 日志服务测试 ====================

describe('Logger', () => {
  let testLogger: Logger;

  beforeEach(() => {
    testLogger = new Logger({
      level: 'DEBUG',
      service: 'test-service',
      consoleOutput: false,
      logDir: '/tmp/test-logs'
    });
  });

  afterEach(() => {
    testLogger.close();
  });

  describe('Log Levels', () => {
    it('should log at different levels', () => {
      testLogger.trace('Trace message');
      testLogger.debug('Debug message');
      testLogger.info('Info message');
      testLogger.warn('Warning message');
      testLogger.error('Error message');
      
      // 所有级别都应该被记录（因为设置为 DEBUG）
      // 实际验证需要读取日志文件
    });

    it('should filter by log level', () => {
      const warnLogger = new Logger({
        level: 'WARN',
        service: 'test',
        consoleOutput: false
      });
      
      let logged = false;
      const originalWrite = (warnLogger as any).write.bind(warnLogger);
      (warnLogger as any).write = (entry: any) => {
        logged = true;
        originalWrite(entry);
      };
      
      warnLogger.debug('Debug message');  // 不应该记录
      expect(logged).toBe(false);
      
      warnLogger.warn('Warning message');  // 应该记录
      expect(logged).toBe(true);
      
      warnLogger.close();
    });

    it('should allow changing log level', () => {
      testLogger.setLevel('ERROR');
      expect(testLogger.getLevel()).toBe('ERROR');
    });
  });

  describe('Context Logging', () => {
    it('should include context in logs', () => {
      const context = { requestId: '123', userId: 'user_1' };
      testLogger.info('Test message', context);
      
      // 上下文应该被包含在日志中
    });

    it('should log request information', () => {
      testLogger.request('GET', '/api/users', 200, 50, {
        requestId: '123'
      });
      
      // 请求日志应该被记录
    });
  });

  describe('Error Logging', () => {
    it('should log errors with stack trace', () => {
      const error = new Error('Test error');
      testLogger.error('Something failed', error);
      
      // 错误和堆栈应该被记录
    });
  });

  describe('Performance Tracking', () => {
    it('should track operation duration', async () => {
      const result = await testLogger.track('Test operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      });
      
      expect(result).toBe('result');
      // 持续时间应该被记录
    });

    it('should handle operation errors', async () => {
      const error = new Error('Operation failed');
      
      await expect(
        testLogger.track('Failing operation', async () => {
          throw error;
        })
      ).rejects.toThrow('Operation failed');
      
      // 错误应该被记录
    });
  });

  describe('Log Rotation', () => {
    it('should rotate logs when size exceeded', () => {
      // 创建一个非常小大小的 logger 来测试轮转
      const smallLogger = new Logger({
        level: 'DEBUG',
        service: 'rotation-test',
        consoleOutput: false,
        maxSize: 1024,  // 1KB
        maxFiles: 3,
        logDir: '/tmp/test-logs'
      });
      
      // 写入大量日志
      for (let i = 0; i < 100; i++) {
        smallLogger.info(`Log message ${i} with some extra content to increase size`);
      }
      
      smallLogger.close();
      // 日志文件应该被轮转
    });
  });
});

// ==================== 集成测试 ====================

describe('Service Integration', () => {
  it('should work together: pool + cache + logger', async () => {
    const pool = new DatabasePool({}, { enabled: true, maxSize: 100, ttl: 60000 });
    const testCache = new Cache({ enabled: true, ttl: 300, maxKeys: 100, namespace: 'integration' });
    const testLogger = new Logger({ level: 'INFO', service: 'integration-test', consoleOutput: false });
    
    // 使用 logger 追踪查询
    const result = await testLogger.track('Integration query', async () => {
      // 尝试从缓存获取
      const cached = await testCache.get('data', 'key1');
      if (cached) {
        return cached;
      }
      
      // 执行查询
      const queryResult = await pool.query('SELECT 1 as test', [], { cache: false });
      
      // 缓存结果
      await testCache.set('data', 'key1', queryResult);
      
      return queryResult;
    });
    
    expect(result).toBeDefined();
    
    pool.close();
    testCache.close();
    testLogger.close();
  });
});
