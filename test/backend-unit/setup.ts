/**
 * 后端测试设置文件
 * 
 * 配置全局测试依赖和模拟
 */

import { jest } from '@jest/globals';

// 增加测试超时时间
jest.setTimeout(30000);

// 全局模拟
const mockDb = {
  execute: jest.fn(),
  prepare: jest.fn(),
  transaction: jest.fn(),
};

// 模拟 D1Database
global.D1Database = mockDb;

// 模拟环境变量
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite://test.db';
process.env.API_KEY = 'test-api-key';

// 模拟 console
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// 清理每个测试后的模拟
afterEach(() => {
  jest.clearAllMocks();
});
