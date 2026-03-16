# Lann Admin Portal - json-render 实现

**版本:** v1.0.0  
**创建日期:** 2026-03-17  
**技术栈:** React 19 + Ionic 8 + json-render + Zod

---

## 📋 概述

Lann 管理后台是基于 [@vercel-labs/json-render](https://github.com/vercel-labs/json-render) 实现的配置化后台管理系统。通过 Schema 驱动的组件目录（Catalog）和动态 Actions，实现：

- ✅ 配置化界面 - 无需重新编译即可更新 UI
- ✅ 类型安全 - 完整的 TypeScript 支持
- ✅ 动态表单 - AI 或后端可动态生成 UI JSON
- ✅ 可扩展 - 自定义组件和动作

---

## 🚀 快速开始

### 安装依赖

```bash
cd admin-portal
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm run test
npm run test:coverage
```

---

## 📁 项目结构

```
admin-portal/
├── src/
│   ├── catalog/
│   │   └── index.ts              # Catalog 定义（组件 + Actions）
│   ├── renderer/
│   │   ├── components/           # 自定义组件实现
│   │   │   ├── FormField.tsx     # 表单字段组件
│   │   │   ├── MetricCard.tsx    # 指标卡片组件
│   │   │   └── DataTable.tsx     # 数据表格组件
│   │   ├── providers/
│   │   │   └── ActionProvider.tsx # Action 执行上下文
│   │   └── index.ts
│   ├── pages/                    # 页面组件
│   └── api/                      # API 客户端
├── test/
│   ├── setup.ts                  # 测试配置
│   └── unit/
│       ├── catalog/              # Catalog 测试
│       └── components/           # 组件测试
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 🧩 Component Catalog

### 基础组件

#### FormField - 表单字段

支持类型：`text`, `number`, `email`, `tel`, `date`, `select`, `textarea`, `checkbox`, `radio`

```tsx
<FormField
  fieldId="email"
  label="邮箱"
  type="email"
  valuePath="/form/email"
  required
  checks={[
    { fn: "required", message: "邮箱不能为空" },
    { fn: "email", message: "请输入有效的邮箱地址" }
  ]}
/>
```

#### MetricCard - 指标卡片

```tsx
<MetricCard
  title="今日放款金额"
  value={500000}
  format="currency"
  currency="THB"
  trend={{
    value: 15.5,
    direction: "up",
    label: "较昨日"
  }}
/>
```

#### DataTable - 数据表格

```tsx
<DataTable
  tableId="loans"
  dataPath="/loans/recent"
  columns={[
    { key: "userId", label: "用户", type: "text" },
    { key: "amount", label: "金额", type: "currency" },
    { key: "status", label: "状态", type: "status" }
  ]}
  rowActions={[
    { label: "查看详情", actionId: "view_loan_detail" }
  ]}
/>
```

### 业务组件

- **ProductConfig** - 借款产品配置
- **LoanReviewer** - 借款审核
- **CreditLimitAdjuster** - 信用额度调整

---

## 🔧 Actions

### 产品管理

- `save_product` - 保存产品配置
- `load_product` - 加载产品详情

### 借款审核

- `review_loan` - 审核借款申请

### 额度管理

- `adjust_credit_limit` - 调整信用额度

### 数据报表

- `load_dashboard` - 加载数据看板
- `export_report` - 导出报表

---

## 📖 使用示例

### 1. 配置 ActionProvider

```tsx
import { ActionProvider } from "./renderer";

function App() {
  return (
    <ActionProvider
      apiUrl="https://api.lann.com"
      authToken={userToken}
    >
      <Dashboard />
    </ActionProvider>
  );
}
```

### 2. 使用 Action

```tsx
import { useAction } from "./renderer";

function ProductForm() {
  const { execute } = useAction();
  
  const handleSubmit = async (data) => {
    try {
      const result = await execute("save_product", data);
      console.log("Saved:", result);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 3. 渲染动态 UI

```tsx
import { JsonRenderer } from "@json-render/react";
import { catalog } from "./catalog";

function DynamicPage({ uiConfig }) {
  return (
    <JsonRenderer
      catalog={catalog}
      config={uiConfig}
      actionHandler={async (actionId, input) => {
        // 调用后端 API
      }}
    />
  );
}
```

---

## 🧪 测试

### 单元测试

```bash
# 运行所有测试
npm run test

# 运行特定测试文件
npm run test -- FormField.test.tsx

# 生成覆盖率报告
npm run test:coverage
```

### 测试示例

```typescript
import { validateField } from "./FormField";

describe("FormField validation", () => {
  it("should validate email", () => {
    const checks = [{ fn: "email", message: "Invalid" }];
    expect(validateField("test@example.com", checks)).toBeNull();
    expect(validateField("invalid", checks)).toBe("Invalid");
  });
});
```

---

## 📚 类型定义

所有组件和 Actions 的类型定义都在 `src/catalog/index.ts` 中导出：

```typescript
import type {
  FormFieldProps,
  MetricCardProps,
  DataTableProps,
  SaveProductInput,
  ReviewLoanOutput
} from "./catalog";
```

---

## 🔐 错误处理

ActionProvider 提供统一的错误处理：

```typescript
import { useAction, ActionError, ValidationError } from "./renderer";

function MyComponent() {
  const { execute, error, clearError } = useAction();
  
  useEffect(() => {
    if (error instanceof ValidationError) {
      // 处理验证错误
    } else if (error instanceof ActionError) {
      // 处理其他错误
    }
  }, [error]);
}
```

---

## 📅 开发计划

### Phase 1: 基础框架 ✅ (已完成)
- [x] 安装依赖
- [x] 创建 Catalog 定义
- [x] 实现基础组件（FormField, MetricCard, DataTable）
- [x] 创建 Action Provider
- [x] 编写单元测试

### Phase 2: 业务组件 (进行中)
- [ ] ProductConfig 组件
- [ ] LoanReviewer 组件
- [ ] CreditLimitAdjuster 组件

### Phase 3: 后端集成
- [ ] Action Handler 实现
- [ ] API 端点创建
- [ ] 审计日志

### Phase 4: 测试与优化
- [ ] E2E 测试
- [ ] 性能优化
- [ ] 文档完善

---

## 📖 参考资源

- [json-render 官方文档](https://github.com/vercel-labs/json-render)
- [Ionic React 文档](https://ionicframework.com/docs/react)
- [Zod Schema](https://zod.dev/)
- [Vitest](https://vitest.dev/)

---

**最后更新:** 2026-03-17  
**负责人:** 小满 (Xiao Man)  
**状态:** Phase 1 完成 ✅
