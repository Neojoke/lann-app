/**
 * Lann 管理后台 - Component Catalog
 * 
 * 使用 Zod 定义类型安全的组件和 Actions
 * 
 * @version 1.0.0
 * @date 2026-03-17
 */

import { z } from "zod";

// ============================================================================
// 基础组件 Props 定义
// ============================================================================

/**
 * FormField - 通用表单字段组件
 */
const FormFieldProps = z.object({
  fieldId: z.string().describe("字段唯一标识"),
  label: z.string().describe("字段标签"),
  type: z.enum([
    "text",
    "number",
    "email",
    "tel",
    "date",
    "select",
    "textarea",
    "checkbox",
    "radio"
  ]).describe("字段类型"),
  valuePath: z.string().describe("数据绑定路径，如 /form/interestRate"),
  required: z.boolean().optional().default(false).describe("是否必填"),
  placeholder: z.string().optional().describe("占位符"),
  helpText: z.string().optional().describe("帮助文本"),
  checks: z.array(z.object({
    fn: z.enum(["required", "email", "min", "max", "pattern"]),
    value: z.union([z.string(), z.number()]).optional(),
    message: z.string()
  })).optional().describe("验证规则"),
  validateOn: z.enum(["blur", "change", "submit"]).optional().default("blur").describe("验证触发时机"),
  disabled: z.boolean().optional().default(false).describe("是否禁用"),
  visible: z.boolean().optional().default(true).describe("是否可见"),
  options: z.array(z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()])
  })).optional().describe("选项列表（select/radio 类型使用）")
});

/**
 * MetricCard - 指标卡片组件
 */
const MetricCardProps = z.object({
  title: z.string().describe("指标标题"),
  value: z.union([z.string(), z.number()]).describe("指标值"),
  valuePath: z.string().optional().describe("数据绑定路径"),
  format: z.enum(["currency", "percent", "number", "date"]).optional().default("number").describe("格式化方式"),
  currency: z.string().optional().default("THB").describe("货币单位"),
  trend: z.object({
    value: z.number(),
    direction: z.enum(["up", "down"]),
    label: z.string().optional()
  }).optional().describe("趋势"),
  icon: z.string().optional().describe("图标名称"),
  color: z.string().optional().describe("颜色主题"),
  action: z.object({
    label: z.string(),
    actionId: z.string()
  }).optional().describe("操作按钮")
});

/**
 * DataTable - 数据表格组件
 */
const DataTableProps = z.object({
  tableId: z.string().describe("表格唯一标识"),
  dataPath: z.string().describe("数据路径，如 /users/list"),
  columns: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(["text", "number", "currency", "date", "status", "action"]),
    format: z.string().optional(),
    sortable: z.boolean().optional().default(true),
    filterable: z.boolean().optional().default(false),
    width: z.string().optional()
  })).describe("列定义"),
  pagination: z.object({
    enabled: z.boolean().optional().default(true),
    pageSize: z.number().optional().default(20),
    pageSizeOptions: z.array(z.number()).optional().default([10, 20, 50, 100])
  }).optional().describe("分页配置"),
  rowActions: z.array(z.object({
    label: z.string(),
    actionId: z.string(),
    icon: z.string().optional(),
    visible: z.string().optional().describe("可见性条件表达式")
  })).optional().describe("行操作")
});

/**
 * Card - 卡片容器组件
 */
const CardProps = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  children: z.array(z.any()).describe("子组件 JSON"),
  actions: z.array(z.object({
    label: z.string(),
    actionId: z.string(),
    variant: z.enum(["primary", "secondary", "danger"]).optional()
  })).optional()
});

/**
 * Tabs - 标签页容器组件
 */
const TabsProps = z.object({
  tabs: z.array(z.object({
    id: z.string(),
    label: z.string(),
    icon: z.string().optional(),
    content: z.array(z.any()).describe("标签页内容 JSON")
  }))
});

// ============================================================================
// 业务组件 Props 定义
// ============================================================================

/**
 * ProductConfig - 借款产品配置组件
 */
const ProductConfigProps = z.object({
  productId: z.string().optional().describe("产品 ID，编辑时必需"),
  mode: z.enum(["create", "edit", "view"]).optional().default("create").describe("模式"),
  valuePath: z.string().optional().default("/form/product").describe("数据绑定路径"),
  onSave: z.string().describe("保存动作 ID"),
  onCancel: z.string().describe("取消动作 ID")
});

/**
 * LoanReviewer - 借款审核组件
 */
const LoanReviewerProps = z.object({
  loanId: z.string().describe("借款申请 ID"),
  valuePath: z.string().optional().default("/form/review").describe("数据绑定路径"),
  onSubmit: z.string().describe("提交审核动作 ID"),
  allowedActions: z.array(z.enum(["approve", "reject", "request_more_info"])).describe("允许的审核操作")
});

/**
 * CreditLimitAdjuster - 信用额度调整组件
 */
const CreditLimitAdjusterProps = z.object({
  userId: z.string().describe("用户 ID"),
  currentLimit: z.number().describe("当前额度"),
  valuePath: z.string().optional().default("/form/adjustment").describe("数据绑定路径"),
  onSubmit: z.string().describe("提交调整动作 ID")
});

// ============================================================================
// Actions 定义
// ============================================================================

/**
 * 产品管理 Actions
 */
const SaveProductAction = z.object({
  productId: z.string().optional(),
  name: z.object({ en: z.string(), th: z.string() }),
  type: z.enum(["payday", "installment", "revolving"]),
  interestRate: z.number().min(0).max(1),
  termOptions: z.array(z.number()).min(1),
  status: z.enum(["active", "inactive"])
});

const LoadProductAction = z.object({
  productId: z.string()
});

/**
 * 借款审核 Actions
 */
const ReviewLoanAction = z.object({
  loanId: z.string(),
  action: z.enum(["approve", "reject", "request_more_info"]),
  reason: z.string().optional(),
  approvedAmount: z.number().optional(),
  approvedTerm: z.number().optional()
});

/**
 * 额度调整 Actions
 */
const AdjustCreditLimitAction = z.object({
  userId: z.string(),
  newLimit: z.number(),
  reason: z.string(),
  effectiveDate: z.string()
});

/**
 * 数据加载 Actions
 */
const LoadDashboardAction = z.object({
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }).optional()
});

/**
 * 导出报表 Actions
 */
const ExportReportAction = z.object({
  reportType: z.enum(["loan_summary", "repayment_report", "overdue_report"]),
  format: z.enum(["pdf", "excel"]),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  })
});

// ============================================================================
// Catalog 导出
// ============================================================================

/**
 * 组件目录
 */
export const components = {
  FormField: {
    props: FormFieldProps,
    description: "通用表单字段组件，支持多种输入类型和验证规则"
  },
  
  MetricCard: {
    props: MetricCardProps,
    description: "指标数据卡片，支持货币、百分比等格式化"
  },
  
  DataTable: {
    props: DataTableProps,
    description: "数据表格组件，支持分页、排序和行操作"
  },
  
  Card: {
    props: CardProps,
    description: "卡片容器组件"
  },
  
  Tabs: {
    props: TabsProps,
    description: "标签页容器组件"
  },
  
  ProductConfig: {
    props: ProductConfigProps,
    description: "借款产品配置表单"
  },
  
  LoanReviewer: {
    props: LoanReviewerProps,
    description: "借款申请审核组件"
  },
  
  CreditLimitAdjuster: {
    props: CreditLimitAdjusterProps,
    description: "信用额度调整组件"
  }
};

/**
 * Actions 目录
 */
export const actions = {
  save_product: {
    description: "保存借款产品配置",
    input: SaveProductAction,
    output: z.object({
      success: z.boolean(),
      productId: z.string(),
      message: z.string()
    })
  },
  
  load_product: {
    description: "加载产品配置",
    input: LoadProductAction,
    output: z.object({
      product: z.any()
    })
  },
  
  review_loan: {
    description: "审核借款申请",
    input: ReviewLoanAction,
    output: z.object({
      success: z.boolean(),
      reviewId: z.string()
    })
  },
  
  adjust_credit_limit: {
    description: "调整用户信用额度",
    input: AdjustCreditLimitAction,
    output: z.object({
      success: z.boolean(),
      previousLimit: z.number(),
      newLimit: z.number()
    })
  },
  
  load_dashboard: {
    description: "加载数据看板",
    input: LoadDashboardAction,
    output: z.object({
      metrics: z.any(),
      charts: z.any()
    })
  },
  
  export_report: {
    description: "导出报表为 PDF/Excel",
    input: ExportReportAction,
    output: z.object({
      downloadUrl: z.string()
    })
  }
};

/**
 * Catalog 导出
 */
export const catalog = {
  components,
  actions
};

// ============================================================================
// 类型导出
// ============================================================================

export type Catalog = typeof catalog;

// 组件 Props 类型
export type FormFieldProps = z.infer<typeof FormFieldProps>;
export type MetricCardProps = z.infer<typeof MetricCardProps>;
export type DataTableProps = z.infer<typeof DataTableProps>;
export type CardProps = z.infer<typeof CardProps>;
export type TabsProps = z.infer<typeof TabsProps>;
export type ProductConfigProps = z.infer<typeof ProductConfigProps>;
export type LoanReviewerProps = z.infer<typeof LoanReviewerProps>;
export type CreditLimitAdjusterProps = z.infer<typeof CreditLimitAdjusterProps>;

// Action 输入类型
export type SaveProductInput = z.infer<typeof SaveProductAction>;
export type LoadProductInput = z.infer<typeof LoadProductAction>;
export type ReviewLoanInput = z.infer<typeof ReviewLoanAction>;
export type AdjustCreditLimitInput = z.infer<typeof AdjustCreditLimitAction>;
export type LoadDashboardInput = z.infer<typeof LoadDashboardAction>;
export type ExportReportInput = z.infer<typeof ExportReportAction>;

// Action 输出类型
export interface SaveProductOutput {
  success: boolean;
  productId: string;
  message: string;
}

export interface LoadProductOutput {
  product: any;
}

export interface ReviewLoanOutput {
  success: boolean;
  reviewId: string;
}

export interface AdjustCreditLimitOutput {
  success: boolean;
  previousLimit: number;
  newLimit: number;
}

export interface LoadDashboardOutput {
  metrics: any;
  charts: any;
}

export interface ExportReportOutput {
  downloadUrl: string;
}
