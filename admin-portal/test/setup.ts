/**
 * Vitest 测试设置文件
 */

import "@testing-library/jest-dom";
import { afterEach } from "vitest";

// 清理每个测试后的 DOM
afterEach(() => {
  document.body.innerHTML = "";
});

// 全局 Mock
global.fetch = vi.fn();
