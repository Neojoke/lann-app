# Lann 项目 - 全面并行开发计划

**版本:** v2.0  
**创建日期:** 2026-03-17 00:48  
**目标:** 最大化并行开发，模块独立，全面质量覆盖

---

## 📊 任务总览

| 工作流 | 任务数 | 预计时间 | 优先级 |
|--------|--------|---------|--------|
| **Workflow A: 管理后台** | 26 | 5 周 | P0 |
| **Workflow B: 后端完善** | 12 | 2 周 | P0 |
| **Workflow C: 前端 App** | 10 | 2 周 | P0 |
| **Workflow D: 测试体系** | 15 | 1 周 | P1 |
| **总计** | **63** | **5 周** | - |

---

## 🔄 并行工作流设计

### 工作流独立性分析

```
Workflow A (管理后台) - 独立
├─ 依赖：无
├─ 被依赖：无
└─ 可完全并行

Workflow B (后端完善) - 部分独立
├─ 依赖：数据库迁移
├─ 被依赖：管理后台 API
└─ 可并行 70%

Workflow C (前端 App) - 部分独立
├─ 依赖：API 端点
├─ 被依赖：无
└─ 可并行 80%

Workflow D (测试体系) - 依赖其他
├─ 依赖：A/B/C 完成
├─ 被依赖：无
└─ 串行执行
```

### 最大并行策略

```
Week 1-2:
┌─────────────────────────────────────────┐
│ Workflow A: 管理后台基础 (Phase 1-2)    │
├─────────────────────────────────────────┤
│ Workflow B: 后端 API 开发 (Phase 1-2)    │
├─────────────────────────────────────────┤
│ Workflow C: 前端 App 完善 (Phase 1-2)    │
└─────────────────────────────────────────┘

Week 3-4:
┌─────────────────────────────────────────┐
│ Workflow A: 管理后台集成 (Phase 3)      │
├─────────────────────────────────────────┤
│ Workflow B: 后端完善 (Phase 3)          │
├─────────────────────────────────────────┤
│ Workflow C: 前端 App 测试 (Phase 3)      │
└─────────────────────────────────────────┘

Week 5:
┌─────────────────────────────────────────┐
│ Workflow D: 全面测试 (所有工作流)        │
└─────────────────────────────────────────┘
```

---

## Workflow A: 管理后台开发 (26 任务，5 周)

### Phase 1: 基础框架 (5 任务，1 周)

**独立开发模块:**
```
Task A1.1: 安装依赖 (独立)
Task A1.2: Catalog 定义 (独立)
Task A1.3: FormField 组件 (独立)
Task A1.4: MetricCard/DataTable (独立)
Task A1.5: Action Provider (独立)
```

**并行执行:** 5 个任务可完全并行

### Phase 2: 业务组件 (8 任务，2 周)

**独立开发模块:**
```
Task A2.1: ProductConfig 组件 (独立)
Task A2.2: LoanReviewer 组件 (独立)
Task A2.3: CreditLimitAdjuster (独立)
Task A2.4: ProductList 组件 (独立)
Task A2.5: Dashboard 页面 (依赖 A2.1-A2.4)
Task A2.6: ProductList 页面 (依赖 A2.4)
Task A2.7: LoanReview 页面 (依赖 A2.2)
Task A2.8: 路由和导航 (依赖 A2.5-A2.7)
```

**并行执行:**
- Week 2: A2.1, A2.2, A2.3, A2.4 并行
- Week 3: A2.5, A2.6, A2.7 并行 → A2.8

### Phase 3: 后端集成 (6 任务，1 周)

**独立开发模块:**
```
Task A3.1: Action Handler (独立)
Task A3.2: 产品管理 API (独立)
Task A3.3: 借款审核 API (独立)
Task A3.4: 审计日志 (独立)
Task A3.5: 权限控制 (独立)
Task A3.6: 数据库迁移 (独立，需先执行)
```

**并行执行:** A3.6 先执行，其他 5 个并行

### Phase 4: 测试优化 (7 任务，1 周)

**独立开发模块:**
```
Task A4.1: Catalog 测试 (独立)
Task A4.2: Actions 测试 (独立)
Task A4.3: 组件测试 (独立)
Task A4.4: API 测试 (独立)
Task A4.5: E2E 测试 (独立)
Task A4.6: 性能优化 (依赖 A4.1-A4.5)
Task A4.7: 文档完善 (独立)
```

**并行执行:** 6 个并行，A4.6 最后

---

## Workflow B: 后端完善 (12 任务，2 周)

### Phase 1: 核心 API (6 任务，1 周)

**独立开发模块:**
```
Task B1.1: 用户服务 API (独立)
Task B1.2: 信用服务 API (已完成)
Task B1.3: 借款服务 API (已完成)
Task B1.4: 还款服务 API (已完成)
Task B1.5: 通知服务 API (独立)
Task B1.6: 文件上传 API (独立)
```

**并行执行:** B1.1, B1.5, B1.6 并行 (B1.2-B1.4 已完成)

### Phase 2: 基础设施 (6 任务，1 周)

**独立开发模块:**
```
Task B2.1: 数据库连接池 (独立)
Task B2.2: Redis 缓存层 (独立)
Task B2.3: 消息队列 (独立)
Task B2.4: 日志系统 (独立)
Task B2.5: 监控告警 (独立)
Task B2.6: 备份恢复 (独立)
```

**并行执行:** 6 个任务完全并行

---

## Workflow C: 前端 App 完善 (10 任务，2 周)

### Phase 1: 核心功能 (5 任务，1 周)

**独立开发模块:**
```
Task C1.1: 用户认证流程 (独立)
Task C1.2: 信用申请流程 (独立)
Task C1.3: 借款申请流程 (独立)
Task C1.4: 还款流程 (独立)
Task C1.5: 个人中心 (独立)
```

**并行执行:** 5 个任务完全并行

### Phase 2: 优化完善 (5 任务，1 周)

**独立开发模块:**
```
Task C2.1: 性能优化 (独立)
Task C2.2: 错误处理 (独立)
Task C2.3: 加载状态 (独立)
Task C2.4: 离线支持 (独立)
Task C2.5: PWA 配置 (独立)
```

**并行执行:** 5 个任务完全并行

---

## Workflow D: 测试体系 (15 任务，1 周)

### 测试任务分解

**独立开发模块:**
```
Task D1.1: 后端单元测试 (独立)
Task D1.2: 前端单元测试 (独立)
Task D1.3: API 集成测试 (独立)
Task D1.4: 数据库测试 (独立)
Task D1.5: E2E 测试 - 注册流程 (独立)
Task D1.6: E2E 测试 - 登录流程 (独立)
Task D1.7: E2E 测试 - 信用申请 (独立)
Task D1.8: E2E 测试 - 借款申请 (独立)
Task D1.9: E2E 测试 - 还款流程 (独立)
Task D1.10: E2E 测试 - 语言切换 (独立)
Task D1.11: E2E 测试 - 后台审核 (独立)
Task D1.12: 测试报告生成 (依赖 D1.1-D1.11)
Task D1.13: 覆盖率分析 (依赖 D1.1-D1.11)
Task D1.14: 性能测试 (独立)
Task D1.15: 安全测试 (独立)
```

**并行执行:** 13 个并行，D1.12-D1.13 最后

---

## 📅 详细时间线

### Week 1 (2026-03-17 ~ 2026-03-23)

**Workflow A (管理后台):**
- ✅ Task A1.1: 安装依赖
- ✅ Task A1.2: Catalog 定义
- ✅ Task A1.3: FormField 组件
- ✅ Task A1.4: MetricCard/DataTable
- ✅ Task A1.5: Action Provider

**Workflow B (后端):**
- ✅ Task B1.1: 用户服务 API
- ✅ Task B1.5: 通知服务 API
- ✅ Task B1.6: 文件上传 API
- ✅ Task B2.1: 数据库连接池
- ✅ Task B2.2: Redis 缓存层

**Workflow C (前端):**
- ✅ Task C1.1: 用户认证流程
- ✅ Task C1.2: 信用申请流程
- ✅ Task C1.3: 借款申请流程
- ✅ Task C1.4: 还款流程
- ✅ Task C1.5: 个人中心

### Week 2 (2026-03-24 ~ 2026-03-30)

**Workflow A (管理后台):**
- ✅ Task A2.1: ProductConfig 组件
- ✅ Task A2.2: LoanReviewer 组件
- ✅ Task A2.3: CreditLimitAdjuster
- ✅ Task A2.4: ProductList 组件

**Workflow B (后端):**
- ✅ Task B2.3: 消息队列
- ✅ Task B2.4: 日志系统
- ✅ Task B2.5: 监控告警
- ✅ Task B2.6: 备份恢复

**Workflow C (前端):**
- ✅ Task C2.1: 性能优化
- ✅ Task C2.2: 错误处理
- ✅ Task C2.3: 加载状态
- ✅ Task C2.4: 离线支持
- ✅ Task C2.5: PWA 配置

### Week 3 (2026-03-31 ~ 2026-04-06)

**Workflow A (管理后台):**
- ✅ Task A2.5: Dashboard 页面
- ✅ Task A2.6: ProductList 页面
- ✅ Task A2.7: LoanReview 页面
- ✅ Task A2.8: 路由和导航

**Workflow A (Phase 3):**
- ✅ Task A3.1-A3.6: 后端集成 (全部并行)

### Week 4 (2026-04-07 ~ 2026-04-13)

**Workflow A (管理后台):**
- ✅ Task A4.1-A4.5: 测试 (并行)
- ✅ Task A4.6: 性能优化
- ✅ Task A4.7: 文档完善

### Week 5 (2026-04-14 ~ 2026-04-20)

**Workflow D (测试体系):**
- ✅ Task D1.1-D1.11: 各类测试 (并行)
- ✅ Task D1.12: 测试报告生成
- ✅ Task D1.13: 覆盖率分析
- ✅ Task D1.14: 性能测试
- ✅ Task D1.15: 安全测试

---

## 🎯 关键路径分析

### 关键路径
```
A1 (1 周) → A2 (2 周) → A3 (1 周) → A4 (1 周) → D (1 周)
总长：6 周
```

### 非关键路径 (有浮动时间)
```
B (2 周) - 浮动 4 周
C (2 周) - 浮动 4 周
```

### 并行度分析

| Week | 并行任务数 | 工作流数 |
|------|-----------|---------|
| 1 | 13 | 3 (A/B/C) |
| 2 | 13 | 3 (A/B/C) |
| 3 | 8 | 2 (A) |
| 4 | 7 | 1 (A) |
| 5 | 15 | 1 (D) |

**平均并行度:** 11.2 个任务/周

---

## 📦 模块独立性保障

### 接口定义优先

**原则:** 先定义接口，后实现功能

```typescript
// 1. 先定义 API 接口 (Week 1)
interface AdminAPI {
  saveProduct(input: ProductInput): Promise<ProductOutput>;
  reviewLoan(input: ReviewInput): Promise<ReviewOutput>;
  // ...
}

// 2. Mock 实现用于并行开发 (Week 1-2)
const mockAdminAPI: AdminAPI = {
  saveProduct: async () => ({ success: true, productId: "mock" }),
  // ...
};

// 3. 真实实现 (Week 3-4)
const realAdminAPI: AdminAPI = {
  saveProduct: async (input) => { /* 真实实现 */ },
  // ...
};
```

### 数据 Schema 统一

**原则:** Schema 是单一真实来源

```typescript
// 1. 定义共享 Schema
const ProductSchema = z.object({
  id: z.string(),
  name: z.object({ en: z.string(), th: z.string() }),
  // ...
});

// 2. 所有模块使用同一 Schema
// - 后端 API 验证
// - 前端表单验证
// - 测试数据生成
// - 文档生成
```

### 测试隔离

**原则:** 每个模块独立测试

```
test/
├── admin/          # 管理后台测试 (独立)
├── backend/        # 后端测试 (独立)
├── frontend/       # 前端测试 (独立)
└── e2e/           # E2E 测试 (集成)
```

---

## 🚀 启动命令

### 初始化所有工作流

```bash
# 1. 安装所有依赖
cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app

# 管理后台
cd admin-portal && npm install

# 后端
cd backend && npm install

# 前端 App
cd mobile-app && npm install

# 2. 初始化数据库
cd backend && npm run db:init

# 3. 启动开发服务器
# Terminal 1 - 后端
cd backend && npm run dev

# Terminal 2 - 前端 App
cd mobile-app && npm run dev

# Terminal 3 - 管理后台 (Week 2 启动)
cd admin-portal && npm run dev
```

### 并行测试

```bash
# 运行所有测试
npm run test:all

# 分类运行
npm run test:admin      # 管理后台测试
npm run test:backend    # 后端测试
npm run test:frontend   # 前端测试
npm run test:e2e        # E2E 测试
npm run test:coverage   # 生成覆盖率
```

---

## ✅ 验收标准

### Week 1 验收
- [ ] Workflow A: Catalog 定义完成
- [ ] Workflow B: 核心 API 完成
- [ ] Workflow C: 核心流程完成

### Week 2 验收
- [ ] Workflow A: 业务组件完成
- [ ] Workflow B: 基础设施完成
- [ ] Workflow C: 优化完善完成

### Week 3 验收
- [ ] Workflow A: 页面集成完成
- [ ] Workflow A: 后端集成完成

### Week 4 验收
- [ ] Workflow A: 测试优化完成
- [ ] Workflow A: 文档完善完成

### Week 5 验收
- [ ] Workflow D: 所有测试完成
- [ ] Workflow D: 测试报告生成
- [ ] Workflow D: 覆盖率 ≥ 80%

---

## 📊 风险管理

### 风险识别

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 接口变更 | 中 | 高 | 先定义接口，版本控制 |
| 依赖冲突 | 低 | 中 | 锁定依赖版本 |
| 进度延迟 | 中 | 中 | 增加并行度，优先关键路径 |
| 质量下降 | 低 | 高 | 自动化测试，代码审查 |

### 质量保证

**代码审查:**
- 所有 PR 必须经过审查
- 关键模块需要 2 人审查
- 自动化检查 (ESLint, Prettier)

**测试覆盖:**
- 单元测试 ≥ 80%
- 集成测试覆盖所有 API
- E2E 测试覆盖核心流程

**持续集成:**
- 每次提交自动运行测试
- 覆盖率报告自动生成
- 构建失败自动通知

---

**负责人:** 小满 (Orchestrator)  
**启动时间:** 2026-03-17 00:48  
**预计完成:** 2026-04-20
