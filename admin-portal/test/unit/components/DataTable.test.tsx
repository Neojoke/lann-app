/**
 * DataTable 组件测试
 */

import { describe, it, expect } from "vitest";
import { formatCellValue } from "@/renderer/components/DataTable";

describe("DataTable", () => {
  describe("formatCellValue", () => {
    it("should format currency correctly", () => {
      const result = formatCellValue(1000, "currency", "THB");
      expect(result).toContain("฿");
    });

    it("should format date correctly", () => {
      const result = formatCellValue("2026-03-17", "date");
      expect(result).toBeTruthy();
    });

    it("should handle null/undefined", () => {
      expect(formatCellValue(null, "text")).toBe("-");
      expect(formatCellValue(undefined, "text")).toBe("-");
    });

    it("should format number correctly", () => {
      const result = formatCellValue(1234567, "number");
      expect(result).toBe("1,234,567");
    });

    it("should format text correctly", () => {
      expect(formatCellValue("Hello", "text")).toBe("Hello");
      expect(formatCellValue(123, "text")).toBe("123");
    });
  });
});
