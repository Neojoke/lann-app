# Lann 管理后台 - json-render 开发任务

**版本:** v1.0  
**创建日期:** 2026-03-17  
**状态:** 待执行

---

## 📋 任务总览

| 阶段 | 任务数 | 预计时间 | 负责人 |
|------|--------|---------|--------|
| Phase 1: 基础框架 | 5 | 1 周 | - |
| Phase 2: 业务组件 | 8 | 2 周 | - |
| Phase 3: 后端集成 | 6 | 1 周 | - |
| Phase 4: 测试优化 | 7 | 1 周 | - |
| **总计** | **26** | **5 周** | - |

---

## Phase 1: 基础框架 (1 周)

### Task 1.1: 安装依赖

**文件:** `package.json`

**执行:**
```bash
cd admin-portal

# 安装 json-render 核心
npm install @json-render/core @json-render/react

# 安装 Zod
npm install zod

# 安装 React 相关 (如果还没有)
npm install react react-dom react-router-dom

# 安装 Ionic (如果还没有)
npm install @ionic/react @ionic/core
```

**验收:**
- [ ] 依赖安装成功
- [ ] 无版本冲突
- [ ] TypeScript 类型识别正常

---

### Task 1.2: 创建 Catalog 定义

**文件:** `admin-portal/src/catalog/index.ts`

**代码:**
```typescript
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

export const catalog = defineCatalog(schema, {
  components: {
    // 在后续任务中定义
  },
  actions: {
    // 在后续任务中定义
  }
});

export type Catalog = typeof catalog;
```

**验收:**
- [ ] Catalog 创建成功
- [ ] TypeScript 类型推导正常
- [ ] 导出类型正确

---

### Task 1.3: 实现基础组件 - FormField

**文件:** `admin-portal/src/renderer/components/FormField.tsx`

**代码:**
```typescript
import React from "react";
import { IonInput, IonItem, IonLabel, IonText } from "@ionic/react";

interface FormFieldProps {
  fieldId: string;
  label: string;
  type: "text" | "number" | "email" | "tel" | "date" | "select" | "textarea";
  valuePath: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  checks?: Array<{
    fn: "required" | "email" | "min" | "max" | "pattern";
    value?: string | number;
    message: string;
  }>;
  validateOn?: "blur" | "change" | "submit";
  disabled?: boolean;
  visible?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  fieldId,
  label,
  type,
  valuePath,
  required,
  placeholder,
  helpText,
  checks,
  validateOn,
  disabled,
  visible
}) => {
  if (!visible) return null;
  
  return (
    <IonItem>
      <IonLabel position="stacked">{label}</IonLabel>
      <IonInput
        id={fieldId}
        type={type}
        value={valuePath}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        // 验证逻辑
      />
      {helpText && (
        <IonText color="medium">
          <small>{helpText}</small>
        </IonText>
      )}
    </IonItem>
  );
};
```

**验收:**
- [ ] 组件渲染正常
- [ ] 所有 props 类型正确
- [ ] 验证逻辑工作正常

---

### Task 1.4: 实现基础组件 - MetricCard 和 DataTable

**文件:** 
- `admin-portal/src/renderer/components/MetricCard.tsx`
- `admin-portal/src/renderer/components/DataTable.tsx`

**验收:**
- [ ] MetricCard 显示指标数据
- [ ] DataTable 支持分页和排序
- [ ] 组件可复用

---

### Task 1.5: 创建 Action Provider

**文件:** `admin-portal/src/renderer/providers/ActionProvider.tsx`

**代码:**
```typescript
import React, { createContext, useContext } from "react";
import { catalog } from "../catalog";

interface ActionContextType {
  execute: (actionId: string, input: any) => Promise<any>;
}

const ActionContext = createContext<ActionContextType | null>(null);

export const ActionProvider: React.FC<{
  apiUrl: string;
  children: React.ReactNode;
}> = ({ apiUrl, children }) => {
  const execute = async (actionId: string, input: any) => {
    const response = await fetch(`${apiUrl}/admin/api/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId, input })
    });
    
    if (!response.ok) {
      throw new Error(`Action failed: ${response.statusText}`);
    }
    
    return await response.json();
  };
  
  return (
    <ActionContext.Provider value={{ execute }}>
      {children}
    </ActionContext.Provider>
  );
};

export const useAction = () => {
  const context = useContext(ActionContext);
  if (!context) {
    throw new Error("useAction must be used within ActionProvider");
  }
  return context;
};
```

**验收:**
- [ ] Action 调用正常
- [ ] 错误处理完善
- [ ] TypeScript 类型正确

---

## Phase 2: 业务组件 (2 周)

### Task 2.1: ProductConfig 组件

**文件:** `admin-portal/src/renderer/components/ProductConfig.tsx`

**功能:**
- 产品基本信息 (名称、类型)
- 费率配置 (利率、费用)
- 期限配置 (期限选项)
- 状态管理 (启用/禁用)

**验收:**
- [ ] 创建/编辑模式支持
- [ ] 表单验证完整
- [ ] 保存成功

---

### Task 2.2: LoanReviewer 组件

**文件:** `admin-portal/src/renderer/components/LoanReviewer.tsx`

**功能:**
- 借款详情展示
- 审核操作 (通过/拒绝/补充材料)
- 审核意见输入
- 审核历史记录

**验收:**
- [ ] 审核流程完整
- [ ] 权限控制正常
- [ ] 审计日志记录

---

### Task 2.3: CreditLimitAdjuster 组件

**文件:** `admin-portal/src/renderer/components/CreditLimitAdjuster.tsx`

**功能:**
- 当前额度展示
- 额度调整输入
- 调整原因说明
- 生效日期选择

**验收:**
- [ ] 额度调整成功
- [ ] 历史记录完整
- [ ] 通知用户

---

### Task 2.4: ProductList 组件

**文件:** `admin-portal/src/renderer/components/ProductList.tsx`

**功能:**
- 产品列表展示
- 搜索和筛选
- 编辑/删除操作
- 状态切换

**验收:**
- [ ] 列表加载正常
- [ ] 操作功能完整

---

### Task 2.5: Dashboard 页面

**文件:** `admin-portal/src/pages/Dashboard.tsx`

**功能:**
- 数据看板 (指标卡片)
- 最近借款列表
- 逾期统计图表
- 快捷操作入口

**JSON 配置:**
```json
{
  "type": "Card",
  "props": {
    "title": "业务数据看板",
    "children": [
      {
        "type": "MetricCard",
        "props": {
          "title": "今日放款金额",
          "valuePath": "/metrics/today_disbursed",
          "format": "currency"
        }
      },
      {
        "type": "DataTable",
        "props": {
          "tableId": "recent_loans",
          "dataPath": "/loans/recent",
          "columns": [...]
        }
      }
    ]
  }
}
```

**验收:**
- [ ] 数据加载正常
- [ ] 图表显示正确

---

### Task 2.6: ProductList 页面

**文件:** `admin-portal/src/pages/ProductList.tsx`

**验收:**
- [ ] 产品列表展示
- [ ] CRUD 操作完整

---

### Task 2.7: LoanReview 页面

**文件:** `admin-portal/src/pages/LoanReview.tsx`

**验收:**
- [ ] 待审核列表
- [ ] 审核流程完整

---

### Task 2.8: 路由和导航

**文件:** `admin-portal/src/App.tsx`

**验收:**
- [ ] 路由配置完整
- [ ] 导航菜单正常

---

## Phase 3: 后端集成 (1 周)

### Task 3.1: Action Handler 实现

**文件:** `backend/services/admin-action-handler.ts`

**验收:**
- [ ] 所有 Actions 实现
- [ ] 错误处理完善

---

### Task 3.2: 产品管理 API

**文件:** `backend/workers/admin.api.ts`

**端点:**
```
POST   /admin/api/products
GET    /admin/api/products
GET    /admin/api/products/:id
PUT    /admin/api/products/:id
DELETE /admin/api/products/:id
```

**验收:**
- [ ] API 端点工作正常
- [ ] 数据验证完整

---

### Task 3.3: 借款审核 API

**端点:**
```
POST   /admin/api/loans/:id/review
GET    /admin/api/loans/pending
```

**验收:**
- [ ] 审核流程完整

---

### Task 3.4: 审计日志

**文件:** `backend/services/audit-log.service.ts`

**验收:**
- [ ] 所有操作记录日志
- [ ] 日志查询功能

---

### Task 3.5: 权限控制

**文件:** `backend/middleware/auth.middleware.ts`

**验收:**
- [ ] JWT 认证正常
- [ ] 权限检查完整

---

### Task 3.6: 数据库迁移

**文件:** `backend/sql/migrations/002_admin_tables.sql`

**验收:**
- [ ] 所有表创建成功
- [ ] 索引优化完成

---

## Phase 4: 测试与优化 (1 周)

### Task 4.1: Catalog 测试

**文件:** `test/admin/catalog.test.ts`

**验收:**
- [ ] 组件验证测试通过
- [ ] 类型推导测试通过

---

### Task 4.2: Actions 测试

**文件:** `test/admin/actions.test.ts`

**验收:**
- [ ] 所有 Actions 测试通过

---

### Task 4.3: 组件测试

**文件:** `test/admin/components/*.test.tsx`

**验收:**
- [ ] 组件渲染测试
- [ ] 交互测试

---

### Task 4.4: API 测试

**文件:** `test/admin/api/*.test.ts`

**验收:**
- [ ] API 端点测试通过

---

### Task 4.5: E2E 测试

**文件:** `test/e2e/admin/*.yaml`

**验收:**
- [ ] 核心流程测试通过

---

### Task 4.6: 性能优化

**验收:**
- [ ] 页面加载 < 2 秒
- [ ] API 响应 < 200ms

---

### Task 4.7: 文档完善

**文件:** `admin-portal/README.md`

**验收:**
- [ ] 使用文档完整
- [ ] API 文档完整

---

## 📊 依赖关系

```
Phase 1 (基础框架)
├─ Task 1.1 (安装依赖)
├─ Task 1.2 (Catalog 定义)
│  └─ Task 1.3 (FormField 组件)
│  └─ Task 1.4 (MetricCard/DataTable)
└─ Task 1.5 (Action Provider)

Phase 2 (业务组件)
├─ Task 2.1 (ProductConfig)
├─ Task 2.2 (LoanReviewer)
├─ Task 2.3 (CreditLimitAdjuster)
├─ Task 2.4 (ProductList)
├─ Task 2.5 (Dashboard 页面)
├─ Task 2.6 (ProductList 页面)
├─ Task 2.7 (LoanReview 页面)
└─ Task 2.8 (路由和导航)

Phase 3 (后端集成)
├─ Task 3.1 (Action Handler)
├─ Task 3.2 (产品管理 API)
├─ Task 3.3 (借款审核 API)
├─ Task 3.4 (审计日志)
├─ Task 3.5 (权限控制)
└─ Task 3.6 (数据库迁移)

Phase 4 (测试优化)
├─ Task 4.1 (Catalog 测试)
├─ Task 4.2 (Actions 测试)
├─ Task 4.3 (组件测试)
├─ Task 4.4 (API 测试)
├─ Task 4.5 (E2E 测试)
├─ Task 4.6 (性能优化)
└─ Task 4.7 (文档完善)
```

---

## ✅ 验收标准

### Phase 1 验收
- [ ] Catalog 定义完整
- [ ] 基础组件可渲染
- [ ] Action Provider 工作正常

### Phase 2 验收
- [ ] 所有业务组件实现
- [ ] 页面可正常访问
- [ ] 组件间交互正常

### Phase 3 验收
- [ ] 所有 API 端点工作
- [ ] 权限控制正常
- [ ] 审计日志完整

### Phase 4 验收
- [ ] 测试覆盖率 ≥ 80%
- [ ] 性能指标达标
- [ ] 文档完整

---

**负责人:** 小满 (Orchestrator)  
**启动时间:** 待启动  
**预计完成:** 5 周
