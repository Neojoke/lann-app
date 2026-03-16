/**
 * 数据库模块
 * 
 * 导出 SQLite 数据库实例供服务层使用
 * 在测试环境中提供 mock 实现
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检查是否在测试环境
const isTest = process.env.NODE_ENV === 'test' || import.meta.url.includes('test');

// 数据库接口
export interface Database {
  get(sql: string, params?: any[]): any;
  all(sql: string, params?: any[]): any[];
  run(sql: string, params?: any[]): { changes: number; lastInsertRowid: number };
}

// Mock 数据库实现 (用于测试)
class MockDatabase implements Database {
  get(sql: string, params?: any[]): any {
    console.log('[MockDB] get:', sql, params);
    return null;
  }

  all(sql: string, params?: any[]): any[] {
    console.log('[MockDB] all:', sql, params);
    return [];
  }

  run(sql: string, params?: any[]): { changes: number; lastInsertRowid: number } {
    console.log('[MockDB] run:', sql, params);
    return { changes: 1, lastInsertRowid: 1 };
  }
}

// 导出数据库实例
export let db: Database;

if (isTest) {
  db = new MockDatabase() as any;
} else {
  // 生产环境使用 better-sqlite3
  try {
    const Database = require('better-sqlite3');
    const dbPath = path.join(__dirname, '../../local/dev.db');
    db = new Database(dbPath);
  } catch (error) {
    console.warn('Failed to initialize SQLite, using mock database');
    db = new MockDatabase() as any;
  }
}
