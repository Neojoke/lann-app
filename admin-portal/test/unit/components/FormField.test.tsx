/**
 * FormField 组件测试
 */

import { describe, it, expect } from "vitest";
import { validateField } from "@/renderer/components/FormField";

describe("FormField", () => {
  describe("validateField", () => {
    it("should pass required validation", () => {
      const checks = [{ fn: "required" as const, message: "Required" }];
      expect(validateField("test", checks)).toBeNull();
      expect(validateField("", checks)).toBe("Required");
      expect(validateField(null, checks)).toBe("Required");
      expect(validateField(undefined, checks)).toBe("Required");
    });

    it("should pass email validation", () => {
      const checks = [{ fn: "email" as const, message: "Invalid email" }];
      expect(validateField("test@example.com", checks)).toBeNull();
      expect(validateField("invalid", checks)).toBe("Invalid email");
      expect(validateField("", checks)).toBeNull();
    });

    it("should pass min validation", () => {
      const checks = [{ fn: "min" as const, value: 10, message: "Too small" }];
      expect(validateField(15, checks)).toBeNull();
      expect(validateField(5, checks)).toBe("Too small");
    });

    it("should pass max validation", () => {
      const checks = [{ fn: "max" as const, value: 100, message: "Too large" }];
      expect(validateField(50, checks)).toBeNull();
      expect(validateField(150, checks)).toBe("Too large");
    });

    it("should pass pattern validation", () => {
      const checks = [{ fn: "pattern" as const, value: "^\\d{3}$", message: "Invalid format" }];
      expect(validateField("123", checks)).toBeNull();
      expect(validateField("abc", checks)).toBe("Invalid format");
    });

    it("should handle multiple checks", () => {
      const checks = [
        { fn: "required" as const, message: "Required" },
        { fn: "email" as const, message: "Invalid email" }
      ];
      expect(validateField("", checks)).toBe("Required");
      expect(validateField("invalid", checks)).toBe("Invalid email");
      expect(validateField("test@example.com", checks)).toBeNull();
    });
  });
});
