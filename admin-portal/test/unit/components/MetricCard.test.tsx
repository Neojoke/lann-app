/**
 * MetricCard 组件测试
 */

import { describe, it, expect } from "vitest";
import { formatValue } from "@/renderer/components/MetricCard";

describe("MetricCard", () => {
  describe("formatValue", () => {
    it("should format currency correctly", () => {
      const result = formatValue(1000, "currency", "THB");
      expect(result).toContain("฿");
      expect(result).toContain("1,000.00");
    });

    it("should format percent correctly", () => {
      expect(formatValue(15.5, "percent")).toBe("15.5%");
      expect(formatValue(100, "percent")).toBe("100.0%");
    });

    it("should format number correctly", () => {
      expect(formatValue(1000, "number")).toBe("1,000");
      expect(formatValue(1000000, "number")).toBe("1,000,000");
    });

    it("should return string as-is", () => {
      expect(formatValue("test", "number")).toBe("test");
    });
  });
});
