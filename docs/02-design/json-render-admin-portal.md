# Lann 管理后台 - json-render 实现方案

**版本:** v1.0  
**创建日期:** 2026-03-17  
**技术选型:** [@vercel-labs/json-render](https://github.com/vercel-labs/json-render)

---

## 📋 概述

### 什么是 json-render

**json-render** 是 Vercel Labs 开源的**生成式 UI 框架**，支持：
- AI → JSON → UI 的完整链路
- Schema 驱动的组件目录 (Catalog)
- 动态表单和配置界面
- 服务端动作 (Actions) 集成
- React 渲染器

### 为什么选择 json-render

**核心优势:**
1. **Schema 驱动** - 使用 Zod 定义类型安全的组件目录
2. **动态渲染** - AI 或后端可动态生成 UI JSON
3. **配置化** - 管理后台配置无需重新编译
4. **可扩展** - 自定义组件和动作
5. **类型安全** - 完整的 TypeScript 支持

**适用场景:**
- ✅ 管理后台配置界面
- ✅ 动态表单生成
- ✅ 数据看板配置
- ✅ 工作流配置
- ✅ 产品配置化

---

## 🏗️ 架构设计

### 整体架构

```
┌─────────────────┐     ┌─────────────────┐
│  管理后台用户   │     │      AI         │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │    JSON UI Config     │
         ▼                       ▼
┌─────────────────────────────────────────┐
│         json-render Renderer            │
│  ┌─────────────────────────────────┐   │
│  │        Component Catalog        │   │
│  │  - FormField                    │   │
│  │  - ProductConfig                │   │
│  │  - LoanReviewer                 │   │
│  │  - MetricCard                   │   │
│  │  - DataTable                    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         │
         │    Actions (API Calls)
         ▼
┌─────────────────────────────────────────┐
│         Backend API Layer               │
│  - Product Service                      │
│  - Loan Review Service                  │
│  - Config Service                       │
└─────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **UI 渲染** | @json-render/react | React 渲染器 |
| **Schema 定义** | @json-render/core + Zod | 类型定义 |
| **前端框架** | React 19 + Ionic 8 | 现有框架 |
| **状态管理** | React Context | json-render Provider |
| **API 通信** | fetch/axios | Actions 调用 |
| **后端** | Hono + Cloudflare | 现有后端 |

---

## 📦 Component Catalog 设计

### 1. 基础组件

#### FormField - 表单字段

```typescript
// catalog.ts
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

const catalog = defineCatalog(schema, {
  components: {
    FormField: {
      props: z.object({
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
          "radio",
          "file"
        ]).describe("字段类型"),
        valuePath: z.string().describe("数据绑定路径，如 /form/interestRate"),
        required: z.boolean().optional().default(false),
        placeholder: z.string().optional(),
        helpText: z.string().optional(),
        checks: z.array(z.object({
          fn: z.enum(["required", "email", "min", "max", "pattern"]),
          value: z.union([z.string(), z.number()]).optional(),
          message: z.string()
        })).optional().describe("验证规则"),
        validateOn: z.enum(["blur", "change", "submit"]).optional().default("blur"),
        disabled: z.boolean().optional().default(false),
        visible: z.boolean().optional().default(true)
      }),
      description: "通用表单字段组件"
    },
    
    SelectField: {
      props: z.object({
        fieldId: z.string(),
        label: z.string(),
        valuePath: z.string(),
        options: z.array(z.object({
          label: z.string(),
          value: z.union([z.string(), z.number()])
        })).describe("选项列表"),
        multiple: z.boolean().optional().default(false),
        searchable: z.boolean().optional().default(false)
      }),
      description: "下拉选择字段"
    },
    
    CurrencyField: {
      props: z.object({
        fieldId: z.string(),
        label: z.string(),
        valuePath: z.string(),
        currency: z.string().optional().default("THB"),
        min: z.number().optional(),
        max: z.number().optional(),
        step: z.number().optional().default(0.01)
      }),
      description: "金额输入字段"
    }
  }
});
```

#### MetricCard - 指标卡片

```typescript
MetricCard: {
  props: z.object({
    title: z.string().describe("指标标题"),
    value: z.union([z.string(), z.number()]).describe("指标值"),
    valuePath: z.string().optional().describe("数据绑定路径"),
    format: z.enum(["currency", "percent", "number", "date"]).optional().default("number"),
    currency: z.string().optional().default("THB"),
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
  }),
  description: "指标数据卡片"
}
```

#### DataTable - 数据表格

```typescript
DataTable: {
  props: z.object({
    tableId: z.string(),
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
    }).optional(),
    rowActions: z.array(z.object({
      label: z.string(),
      actionId: z.string(),
      icon: z.string().optional(),
      visible: z.string().optional().describe("可见性条件表达式")
    })).optional().describe("行操作")
  }),
  description: "数据表格组件"
}
```

---

### 2. 业务组件

#### ProductConfig - 借款产品配置

```typescript
ProductConfig: {
  props: z.object({
    productId: z.string().optional().describe("产品 ID，编辑时必需"),
    mode: z.enum(["create", "edit", "view"]).optional().default("create"),
    valuePath: z.string().optional().default("/form/product"),
    onSave: z.string().describe("保存动作 ID"),
    onCancel: z.string().describe("取消动作 ID")
  }),
  description: "借款产品配置表单"
}

// 渲染的 JSON 示例
{
  "type": "ProductConfig",
  "props": {
    "mode": "edit",
    "productId": "payday-standard",
    "onSave": "save_product",
    "onCancel": "cancel_edit"
  }
}
```

#### LoanReviewer - 借款审核组件

```typescript
LoanReviewer: {
  props: z.object({
    loanId: z.string(),
    valuePath: z.string().optional().default("/form/review"),
    onSubmit: z.string().describe("提交审核动作 ID"),
    allowedActions: z.array(z.enum(["approve", "reject", "request_more_info"])).describe("允许的审核操作")
  }),
  description: "借款申请审核组件"
}
```

#### CreditLimitAdjuster - 额度调整组件

```typescript
CreditLimitAdjuster: {
  props: z.object({
    userId: z.string(),
    currentLimit: z.number(),
    valuePath: z.string().optional().default("/form/adjustment"),
    onSubmit: z.string().describe("提交调整动作 ID")
  }),
  description: "信用额度调整组件"
}
```

---

### 3. 布局组件

```typescript
Card: {
  props: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    children: z.array(z.any()).describe("子组件 JSON"),
    actions: z.array(z.object({
      label: z.string(),
      actionId: z.string(),
      variant: z.enum(["primary", "secondary", "danger"]).optional()
    })).optional()
  }),
  description: "卡片容器"
}

Tabs: {
  props: z.object({
    tabs: z.array(z.object({
      id: z.string(),
      label: z.string(),
      icon: z.string().optional(),
      content: z.array(z.any()).describe("标签页内容 JSON")
    }))
  }),
  description: "标签页容器"
}

Modal: {
  props: z.object({
    modalId: z.string(),
    title: z.string(),
    size: z.enum(["small", "medium", "large", "full"]).optional().default("medium"),
    children: z.array(z.any()),
    onClose: z.string().optional()
  }),
  description: "模态框"
}
```

---

## 🔧 Actions 设计

### Action 定义

```typescript
const catalog = defineCatalog(schema, {
  // ... components
  
  actions: {
    // 产品管理
    save_product: {
      description: "保存借款产品配置",
      input: z.object({
        productId: z.string().optional(),
        name: z.object({ en: z.string(), th: z.string() }),
        type: z.enum(["payday", "installment", "revolving"]),
        interestRate: z.number(),
        termOptions: z.array(z.number()),
        status: z.enum(["active", "inactive"])
      }),
      output: z.object({
        success: z.boolean(),
        productId: z.string(),
        message: z.string()
      })
    },
    
    load_product: {
      description: "加载产品配置",
      input: z.object({
        productId: z.string()
      }),
      output: z.object({
        product: z.any()
      })
    },
    
    // 借款审核
    review_loan: {
      description: "审核借款申请",
      input: z.object({
        loanId: z.string(),
        action: z.enum(["approve", "reject", "request_more_info"]),
        reason: z.string().optional(),
        approvedAmount: z.number().optional(),
        approvedTerm: z.number().optional()
      }),
      output: z.object({
        success: z.boolean(),
        reviewId: z.string()
      })
    },
    
    // 额度调整
    adjust_credit_limit: {
      description: "调整用户信用额度",
      input: z.object({
        userId: z.string(),
        newLimit: z.number(),
        reason: z.string(),
        effectiveDate: z.string()
      }),
      output: z.object({
        success: z.boolean(),
        previousLimit: z.number(),
        newLimit: z.number()
      })
    },
    
    // 数据加载
    load_dashboard: {
      description: "加载数据看板",
      input: z.object({
        dateRange: z.object({
          start: z.string(),
          end: z.string()
        }).optional()
      }),
      output: z.object({
        metrics: z.any(),
        charts: z.any()
      })
    },
    
    // 导出报表
    export_report: {
      description: "导出报表为 PDF/Excel",
      input: z.object({
        reportType: z.enum(["loan_summary", "repayment_report", "overdue_report"]),
        format: z.enum(["pdf", "excel"]),
        dateRange: z.object({
          start: z.string(),
          end: z.string()
        })
      }),
      output: z.object({
        downloadUrl: z.string()
      })
    }
  }
});
```

---

## 📱 页面设计

### 1. 产品配置页面

```json
{
  "type": "Card",
  "props": {
    "title": "借款产品配置",
    "children": [
      {
        "type": "ProductConfig",
        "props": {
          "mode": "{{ mode }}",
          "productId": "{{ productId }}",
          "onSave": "save_product",
          "onCancel": "navigate_back"
        }
      }
    ]
  }
}
```

### 2. 借款审核页面

```json
{
  "type": "Card",
  "props": {
    "title": "借款申请审核",
    "children": [
      {
        "type": "LoanDetail",
        "props": {
          "loanId": "{{ loanId }}",
          "dataPath": "/loans/{{ loanId }}"
        }
      },
      {
        "type": "LoanReviewer",
        "props": {
          "loanId": "{{ loanId }}",
          "onSubmit": "review_loan",
          "allowedActions": ["approve", "reject", "request_more_info"]
        }
      }
    ]
  }
}
```

### 3. 数据看板页面

```json
{
  "type": "Card",
  "props": {
    "title": "业务数据看板",
    "actions": [
      {
        "label": "刷新数据",
        "actionId": "refresh_data"
      },
      {
        "label": "导出报表",
        "actionId": "export_report"
      }
    ],
    "children": [
      {
        "type": "Tabs",
        "props": {
          "tabs": [
            {
              "id": "overview",
              "label": "概览",
              "content": [
                {
                  "type": "MetricCard",
                  "props": {
                    "title": "今日放款金额",
                    "valuePath": "/metrics/today_disbursed",
                    "format": "currency",
                    "trend": {
                      "valuePath": "/metrics/today_disbursed_trend",
                      "direction": "up"
                    }
                  }
                },
                {
                  "type": "MetricCard",
                  "props": {
                    "title": "逾期率",
                    "valuePath": "/metrics/overdue_rate",
                    "format": "percent"
                  }
                },
                {
                  "type": "DataTable",
                  "props": {
                    "tableId": "recent_loans",
                    "dataPath": "/loans/recent",
                    "columns": [
                      { "key": "userId", "label": "用户", "type": "text" },
                      { "key": "amount", "label": "金额", "type": "currency" },
                      { "key": "status", "label": "状态", "type": "status" },
                      { "key": "createdAt", "label": "时间", "type": "date" }
                    ],
                    "rowActions": [
                      {
                        "label": "查看详情",
                        "actionId": "view_loan_detail"
                      }
                    ]
                  }
                }
              ]
            },
            {
              "id": "products",
              "label": "产品管理",
              "content": [
                {
                  "type": "ProductList",
                  "props": {
                    "dataPath": "/products",
                    "onEdit": "edit_product",
                    "onCreate": "create_product"
                  }
                }
              ]
            }
          ]
        }
      }
    ]
  }
}
```

---

## 🗄️ 后端 API 设计

### API 端点

```typescript
// backend/workers/admin.api.ts

// 产品管理
POST   /admin/api/products          // 创建产品
GET    /admin/api/products          // 产品列表
GET    /admin/api/products/:id      // 产品详情
PUT    /admin/api/products/:id      // 更新产品
DELETE /admin/api/products/:id      // 删除产品

// 借款审核
POST   /admin/api/loans/:id/review  // 审核借款
GET    /admin/api/loans/pending     // 待审核列表
GET    /admin/api/loans/:id         // 借款详情

// 额度管理
POST   /admin/api/users/:id/credit  // 调整额度
GET    /admin/api/users/:id/credit  // 信用历史

// 数据看板
GET    /admin/api/dashboard         // 看板数据
GET    /admin/api/reports/:type     // 报表数据
POST   /admin/api/reports/export    // 导出报表
```

### Action Handler 实现

```typescript
// backend/services/admin-action-handler.ts

export async function handleAction(actionId: string, input: any): Promise<any> {
  switch (actionId) {
    case "save_product":
      return await saveProduct(input);
    case "review_loan":
      return await reviewLoan(input);
    case "adjust_credit_limit":
      return await adjustCreditLimit(input);
    case "load_dashboard":
      return await loadDashboard(input);
    case "export_report":
      return await exportReport(input);
    default:
      throw new Error(`Unknown action: ${actionId}`);
  }
}

async function saveProduct(input: any) {
  // 验证 Schema
  const schema = z.object({
    productId: z.string().optional(),
    name: z.object({ en: z.string(), th: z.string() }),
    type: z.enum(["payday", "installment", "revolving"]),
    interestRate: z.number().min(0).max(1),
    termOptions: z.array(z.number()).min(1),
    status: z.enum(["active", "inactive"])
  });
  
  const validated = schema.parse(input);
  
  // 保存到数据库
  const product = await db.saveProduct(validated);
  
  // 记录审计日志
  await auditLog("product_save", { productId: product.id });
  
  return {
    success: true,
    productId: product.id,
    message: "产品保存成功"
  };
}
```

---

## 🔐 权限与审计

### 权限设计

```typescript
// 权限定义
const permissions = {
  // 产品管理
  "product:create": ["admin", "product_manager"],
  "product:edit": ["admin", "product_manager"],
  "product:delete": ["admin"],
  
  // 借款审核
  "loan:review": ["admin", "loan_reviewer"],
  "loan:approve": ["admin", "senior_reviewer"],
  "loan:reject": ["admin", "loan_reviewer"],
  
  // 额度管理
  "credit:adjust": ["admin", "credit_manager"],
  "credit:adjust:high": ["admin"], // 高额度调整需要管理员
  
  // 报表
  "report:view": ["admin", "analyst"],
  "report:export": ["admin", "analyst"]
};
```

### 审计日志

```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_id TEXT NOT NULL,
  input_data TEXT,  -- JSON
  output_data TEXT, -- JSON
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
);
```

---

## 📁 文件结构

```
admin-portal/
├── src/
│   ├── catalog/
│   │   ├── index.ts              # Catalog 导出
│   │   ├── components.ts         # 组件定义
│   │   └── actions.ts            # Actions 定义
│   ├── renderer/
│   │   ├── JsonRenderer.tsx      # json-render 渲染器
│   │   ├── components/           # 自定义组件实现
│   │   │   ├── FormField.tsx
│   │   │   ├── ProductConfig.tsx
│   │   │   ├── LoanReviewer.tsx
│   │   │   └── ...
│   │   └── providers/
│   │       └── ActionProvider.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ProductList.tsx
│   │   ├── ProductEdit.tsx
│   │   ├── LoanReview.tsx
│   │   └── ...
│   └── api/
│       ├── admin.api.ts          # API 端点
│       └── action-handler.ts     # Action 处理器
├── test/
│   └── admin/
│       ├── catalog.test.ts
│       ├── actions.test.ts
│       └── e2e/
└── docs/
    └── admin-portal/
        ├── architecture.md
        ├── components.md
        └── actions.md
```

---

## 🧪 测试计划

### 1. Catalog 测试

```typescript
// test/admin/catalog.test.ts
describe("Component Catalog", () => {
  it("should validate FormField props", () => {
    const validProps = {
      fieldId: "interest_rate",
      label: "利率",
      type: "number",
      valuePath: "/form/interestRate"
    };
    expect(catalog.validate("FormField", validProps)).toBe(true);
  });
  
  it("should reject invalid FormField props", () => {
    const invalidProps = {
      fieldId: "test",
      // missing required label
    };
    expect(() => catalog.validate("FormField", invalidProps)).toThrow();
  });
});
```

### 2. Actions 测试

```typescript
// test/admin/actions.test.ts
describe("Admin Actions", () => {
  it("should save product successfully", async () => {
    const input = {
      name: { en: "Payday Loan", th: "เงินด่วน" },
      type: "payday",
      interestRate: 0.01,
      termOptions: [7, 14, 30],
      status: "active"
    };
    const result = await handleAction("save_product", input);
    expect(result.success).toBe(true);
    expect(result.productId).toBeDefined();
  });
});
```

### 3. E2E 测试

```yaml
# test/e2e/admin/product-config.yaml
appId: com.lann.admin
name: 产品配置流程
---
- launchApp
- tapOn: "产品管理"
- tapOn: "新建产品"
- inputText: "Payday Loan"
- tapOn: "保存"
- assertVisible: "保存成功"
```

---

## 📅 实施计划

### Phase 1: 基础框架 (1 周)
- [ ] 安装 json-render 依赖
- [ ] 创建 Catalog 定义
- [ ] 实现基础组件
- [ ] 配置 Action Provider

### Phase 2: 业务组件 (2 周)
- [ ] ProductConfig 组件
- [ ] LoanReviewer 组件
- [ ] CreditLimitAdjuster 组件
- [ ] DataTable 组件

### Phase 3: 后端集成 (1 周)
- [ ] 实现 Action Handler
- [ ] 创建 API 端点
- [ ] 集成审计日志
- [ ] 权限控制

### Phase 4: 测试与优化 (1 周)
- [ ] 单元测试
- [ ] 集成测试
- [ ] E2E 测试
- [ ] 性能优化

---

## 📚 参考资源

- **官方文档:** https://github.com/vercel-labs/json-render
- **示例代码:** https://github.com/vercel-labs/json-render/tree/main/examples
- **Zod Schema:** https://zod.dev/
- **DeepWiki:** https://deepwiki.com/vercel-labs/json-render

---

**最后更新:** 2026-03-17  
**负责人:** 小满 (Orchestrator)  
**状态:** 设计完成 → 待实施
