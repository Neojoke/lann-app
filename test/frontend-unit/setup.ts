/**
 * 前端测试设置文件
 * 
 * 配置全局测试依赖和模拟
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 每个测试后清理 React Testing Library
afterEach(() => {
  cleanup();
});

// 全局模拟
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useLocation: () => ({ pathname: '/' }),
  };
});

// 模拟 Intl.NumberFormat 用于货币格式化
if (typeof global.Intl === 'undefined') {
  global.Intl = {
    NumberFormat: class {
      constructor(locale: string, options?: any) {
        this.locale = locale;
        this.options = options;
      }
      format(number: number) {
        return number.toLocaleString(this.locale);
      }
    },
    DateTimeFormat: class {
      constructor(locale: string, options?: any) {
        this.locale = locale;
        this.options = options;
      }
      format(date: Date) {
        return date.toLocaleString(this.locale);
      }
    },
  } as any;
}

// 模拟 window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 模拟 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

global.localStorage = localStorageMock as any;

// 模拟 fetch
global.fetch = vi.fn();

// 禁用控制台错误 (可选)
// global.console.error = vi.fn();
// global.console.warn = vi.fn();
