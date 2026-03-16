/**
 * Jest 后端测试配置
 * 
 * 用于运行 Bun/Node.js 后端服务测试
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配
  testMatch: [
    '**/test/backend-unit/**/*.test.ts',
    '**/test/api/**/*.test.ts',
    '**/test/database-logic/**/*.test.ts',
  ],
  
  // 排除目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/e2e/',
  ],
  
  // TypeScript 支持
  preset: 'ts-jest',
  
  // 覆盖率配置
  collectCoverageFrom: [
    'backend/src/**/*.{ts,tsx}',
    '!backend/src/**/*.d.ts',
    '!backend/src/**/index.ts',
  ],
  
  coverageReporters: [
    'text',
    'json',
    'html',
    'lcov',
  ],
  
  coverageDirectory: 'test/reports/backend/coverage',
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // 设置文件
  setupFilesAfterEnv: ['./test/backend-unit/setup.ts'],
  
  // 全局超时
  testTimeout: 30000,
  
  // 模拟
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // 报告器
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Lann Backend Test Report',
      outputPath: 'test/reports/backend/index.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
    }],
    ['jest-junit', {
      outputDirectory: 'test/reports/backend',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      suiteNameTemplate: '{filename}',
    }],
  ],
  
  // 模块名映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/backend/src/$1',
    '^@services/(.*)$': '<rootDir>/backend/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/backend/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/backend/src/types/$1',
    '^@db/(.*)$': '<rootDir>/backend/src/db/$1',
    '^@workers/(.*)$': '<rootDir>/backend/src/workers/$1',
    '^@middleware/(.*)$': '<rootDir>/backend/src/middleware/$1',
  },
  
  // 转换配置
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'commonjs',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          skipLibCheck: true,
          moduleResolution: 'node',
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          types: ['jest', 'node'],
        },
      },
    ],
  },
  
  // 扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // _verbose_
  verbose: true,
  
  // 显示测试详情
  collectCoverage: true,
  
  // 失败时继续
  passWithNoTests: true,
  
  // 并发测试
  maxWorkers: '50%',
  
  // 缓存
  cache: true,
  cacheDirectory: 'node_modules/.cache/jest',
};
