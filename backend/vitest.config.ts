import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/loan.test.ts', 'tests/repay.test.ts'],  // 排除旧的 bun 测试
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['services/**/*.ts', 'workers/**/*.ts'],
      exclude: ['tests/**/*.test.ts'],
      thresholds: {
        global: {
          branches: 70,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': './',
      '@/services': './services',
    },
    extensions: ['.ts', '.js', '.tsx', '.jsx']
  }
});
