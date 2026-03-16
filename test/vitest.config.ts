/**
 * Vitest 前端测试配置
 * 
 * 用于运行 React/Vue 前端组件测试
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // 测试环境
    environment: 'jsdom',
    
    // 测试文件匹配
    include: [
      'test/frontend-unit/**/*.{test,spec}.{ts,tsx}',
    ],
    
    // 排除目录
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
    ],
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'mobile-app/src/**/*.{ts,tsx}',
      ],
      exclude: [
        'mobile-app/src/**/*.d.ts',
        'mobile-app/src/**/*.stories.{ts,tsx}',
        'mobile-app/src/**/index.ts',
      ],
      thresholds: {
        global: {
          statements: 70,
          branches: 70,
          functions: 70,
          lines: 70,
        },
      },
    },
    
    // 设置文件
    setupFiles: ['./test/frontend-unit/setup.ts'],
    
    // 全局测试超时
    testTimeout: 10000,
    
    // 钩子超时
    hookTimeout: 10000,
    
    // 模拟
    mockReset: true,
    clearMocks: true,
    
    // 报告器
    reporters: ['default', 'html'],
    
    // 输出目录
    outputFile: {
      html: 'test/reports/frontend/index.html',
      json: 'test/reports/frontend/results.json',
      junit: 'test/reports/frontend/junit.xml',
    },
    
    // 并发测试
    maxConcurrency: 4,
    
    // 隔离测试
    isolate: true,
    
    // 失败时继续
    passWithNoTests: true,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../mobile-app/src'),
      '@components': path.resolve(__dirname, '../mobile-app/src/components'),
      '@pages': path.resolve(__dirname, '../mobile-app/src/pages'),
      '@services': path.resolve(__dirname, '../mobile-app/src/services'),
      '@utils': path.resolve(__dirname, '../mobile-app/src/utils'),
      '@contexts': path.resolve(__dirname, '../mobile-app/src/contexts'),
      '@hooks': path.resolve(__dirname, '../mobile-app/src/hooks'),
      '@types': path.resolve(__dirname, '../mobile-app/src/types'),
    },
  },
  
  // CSS 处理
  css: {
    modules: {
      classNameStrategy: 'non-scoped',
    },
  },
  
  // 定义全局常量
  define: {
    __DEV__: true,
    __TEST__: true,
  },
});
