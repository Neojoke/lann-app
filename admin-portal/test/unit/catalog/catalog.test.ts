/**
 * Catalog 测试
 */

import { describe, it, expect } from "vitest";
import { components, actions, catalog } from "@/catalog";

describe("Component Catalog", () => {
  describe("components", () => {
    it("should have FormField component defined", () => {
      expect(components.FormField).toBeDefined();
      expect(components.FormField.props).toBeDefined();
      expect(components.FormField.description).toBeDefined();
    });

    it("should have MetricCard component defined", () => {
      expect(components.MetricCard).toBeDefined();
      expect(components.MetricCard.props).toBeDefined();
    });

    it("should have DataTable component defined", () => {
      expect(components.DataTable).toBeDefined();
      expect(components.DataTable.props).toBeDefined();
    });

    it("should have ProductConfig component defined", () => {
      expect(components.ProductConfig).toBeDefined();
      expect(components.ProductConfig.props).toBeDefined();
    });

    it("should have LoanReviewer component defined", () => {
      expect(components.LoanReviewer).toBeDefined();
      expect(components.LoanReviewer.props).toBeDefined();
    });

    it("should have CreditLimitAdjuster component defined", () => {
      expect(components.CreditLimitAdjuster).toBeDefined();
      expect(components.CreditLimitAdjuster.props).toBeDefined();
    });
  });

  describe("actions", () => {
    it("should have save_product action defined", () => {
      expect(actions.save_product).toBeDefined();
      expect(actions.save_product.input).toBeDefined();
      expect(actions.save_product.output).toBeDefined();
    });

    it("should have load_product action defined", () => {
      expect(actions.load_product).toBeDefined();
    });

    it("should have review_loan action defined", () => {
      expect(actions.review_loan).toBeDefined();
      expect(actions.review_loan.input).toBeDefined();
    });

    it("should have adjust_credit_limit action defined", () => {
      expect(actions.adjust_credit_limit).toBeDefined();
    });

    it("should have load_dashboard action defined", () => {
      expect(actions.load_dashboard).toBeDefined();
    });

    it("should have export_report action defined", () => {
      expect(actions.export_report).toBeDefined();
    });
  });

  describe("validation", () => {
    it("should validate FormField props correctly", () => {
      const validProps = {
        fieldId: "test_field",
        label: "Test Field",
        type: "text",
        valuePath: "/form/test"
      };
      
      const result = components.FormField.props.safeParse(validProps);
      expect(result.success).toBe(true);
    });

    it("should reject invalid FormField props", () => {
      const invalidProps = {
        fieldId: "test_field"
      };
      
      const result = components.FormField.props.safeParse(invalidProps);
      expect(result.success).toBe(false);
    });

    it("should validate save_product input correctly", () => {
      const validInput = {
        name: { en: "Payday Loan", th: "เงินด่วน" },
        type: "payday",
        interestRate: 0.01,
        termOptions: [7, 14, 30],
        status: "active"
      };
      
      const result = actions.save_product.input.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject invalid interest rate", () => {
      const invalidInput = {
        name: { en: "Loan", th: "กู้" },
        type: "payday",
        interestRate: 1.5,
        termOptions: [7],
        status: "active"
      };
      
      const result = actions.save_product.input.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should validate review_loan input correctly", () => {
      const validInput = {
        loanId: "loan_123",
        action: "approve"
      };
      
      const result = actions.review_loan.input.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe("catalog export", () => {
    it("should export catalog with components and actions", () => {
      expect(catalog.components).toBeDefined();
      expect(catalog.actions).toBeDefined();
      expect(Object.keys(catalog.components).length).toBe(8);
      expect(Object.keys(catalog.actions).length).toBe(6);
    });
  });
});
