# Lann 项目重构计划

**版本:** v2.0  
**创建日期:** 2026-03-17 00:22  
**目标:** 文档集中化、后台管理设计、测试体系化

---

## 📋 任务拆解与依赖关系

### Phase 1: 文档体系重构 (优先级 P0, 预计 1 小时)

#### Task 1.1: 创建 docs 目录结构和索引
**依赖:** 无  
**执行:** 并行  
**输出:**
```
docs/
├── README.md              # 文档索引（唯一真实来源）
├── 01-requirements/       # 需求文档
│   ├── business-model.md  # 业务模型
│   ├── credit-model.md    # 信用模型
│   ├── loan-model.md      # 借款模型
│   ├── repayment-model.md # 还款模型
│   └── admin-portal.md    # 管理后台需求
├── 02-design/             # 设计文档
│   ├── architecture.md    # 架构设计
│   ├── database.md        # 数据库设计
│   ├── api.md             # API 设计
│   └── schema/            # Schema 规范
├── 03-implementation/     # 实现文档
│   ├── backend/           # 后端实现
│   ├── frontend/          # 前端实现
│   └── admin/             # 后台实现
├── 04-testing/            # 测试文档
│   ├── test-plan.md       # 测试计划
│   ├── unit-tests/        # 单元测试
│   ├── integration-tests/ # 集成测试
│   └── e2e-tests/         # E2E 测试
└── 05-operations/         # 运维文档
    ├── deployment.md      # 部署指南
    ├── monitoring.md      # 监控方案
    └── compliance.md      # 合规文档
```

#### Task 1.2: 迁移现有文档到 docs 目录
**依赖:** Task 1.1 完成  
**执行:** 并行  
**输入:**
- `docs/BUSINESS_MODEL_DESIGN.md`
- `docs/CREDIT_API_COMPLETE.md`
- `docs/LOAN_API_GUIDE.md`
- `docs/REPAYMENT_API_IMPLEMENTATION.md`
- `docs/FRONTEND_UPDATE_REPORT.md`
- `schema/README.md`

**输出:** 按新结构归档

#### Task 1.3: 创建文档索引和交叉引用
**依赖:** Task 1.2 完成  
**执行:** 串行  
**输出:**
- `docs/README.md` - 完整索引
- 所有文档添加双向链接
- 需求 - 设计 - 实现 - 测试对照表

---

### Phase 2: 后台管理需求设计 (优先级 P0, 预计 2 小时)

#### Task 2.1: 后台管理需求分析
**依赖:** Phase 1 完成（需求文档就位）  
**执行:** 串行  
**输出:** `docs/01-requirements/admin-portal.md`

**核心功能:**
1. **用户管理**
   - 用户列表/详情
   - KYC 审核
   - 用户状态管理

2. **信用管理**
   - 信用评分复审
   - 额度调整审批
   - 黑名单管理

3. **借款管理**
   - 借款申请审核
   - 合同管理
   - 放款审批

4. **还款管理**
   - 还款计划调整
   - 逾期管理
   - 催收任务分配

5. **产品配置**
   - 借款产品 CRUD
   - 费率配置
   - 期限配置

6. **渠道管理**
   - 还款渠道配置
   - 渠道状态监控

7. **报表统计**
   - 业务数据看板
   - 逾期率统计
   - 收入统计

#### Task 2.2: 后台 API 设计
**依赖:** Task 2.1 完成  
**执行:** 串行  
**输出:** `docs/02-design/admin-api.md`

**API 端点规划:**
```
/admin/users          - 用户管理
/admin/credit         - 信用管理
/admin/loans          - 借款管理
/admin/repayments     - 还款管理
/admin/products       - 产品配置
/admin/channels       - 渠道管理
/admin/reports        - 报表统计
/admin/audit-logs     - 审计日志
```

#### Task 2.3: 后台数据库设计
**依赖:** Task 2.1 完成  
**执行:** 并行  
**输出:** `docs/02-design/admin-database.md`

**新增表:**
```sql
- admin_users          - 后台用户
- admin_roles          - 角色权限
- audit_logs           - 审计日志
- loan_reviews         - 借款审核记录
- credit_reviews       - 信用复审记录
- collection_tasks     - 催收任务
- product_configs      - 产品配置历史
- channel_configs      - 渠道配置
```

#### Task 2.4: 配置化重构设计
**依赖:** Task 2.2, 2.3 完成  
**执行:** 串行  
**输出:** `docs/02-design/configuration-design.md`

**配置化范围:**
- 借款产品配置（JSON 存储）
- 费率配置（动态加载）
- 期限配置（灵活组合）
- 审批流程配置（工作流引擎）
- 通知模板配置（多语言）

---

### Phase 3: 测试体系重构 (优先级 P0, 预计 3 小时)

#### Task 3.1: 创建 test 目录结构
**依赖:** 无  
**执行:** 并行  
**输出:**
```
test/
├── README.md                  # 测试文档索引
├── frontend-unit/             # 前端单元测试
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── utils/
├── backend-unit/              # 后端单元测试
│   ├── services/
│   ├── workers/
│   └── utils/
├── database-logic/            # 数据库业务逻辑测试
│   ├── schema/
│   ├── constraints/
│   └── triggers/
├── api/                       # API 测试
│   ├── credit/
│   ├── loan/
│   ├── repayment/
│   └── admin/
├── e2e/                       # E2E 测试 (Maestro)
│   ├── flows/
│   ├── fixtures/
│   └── reports/
└── fixtures/                  # 测试数据
    ├── users/
    ├── loans/
    └── products/
```

#### Task 3.2: 迁移现有测试文件
**依赖:** Task 3.1 完成  
**执行:** 并行  
**输入:**
- `backend/tests/credit.test.ts`
- `backend/tests/loan.test.ts`
- `backend/tests/repay.test.ts`

**输出:**
- `test/backend-unit/credit/`
- `test/backend-unit/loan/`
- `test/backend-unit/repayment/`

#### Task 3.3: 前端单元测试补充
**依赖:** Task 3.2 完成  
**执行:** 并行  
**输出:**
- `test/frontend-unit/components/LanguageSelector.test.tsx`
- `test/frontend-unit/pages/CreditApply.test.tsx`
- `test/frontend-unit/pages/Borrow.test.tsx`
- `test/frontend-unit/services/*.test.ts`

#### Task 3.4: 数据库业务逻辑测试
**依赖:** Task 3.1 完成  
**执行:** 串行  
**输出:**
- `test/database-logic/schema/tables.test.ts`
- `test/database-logic/constraints/foreign-keys.test.ts`
- `test/database-logic/triggers/audit.test.ts`

#### Task 3.5: API 集成测试
**依赖:** Task 3.2 完成  
**执行:** 并行  
**输出:**
- `test/api/credit/apply.test.ts`
- `test/api/loan/flow.test.ts`
- `test/api/repayment/schedule.test.ts`
- `test/api/admin/users.test.ts`

#### Task 3.6: E2E 测试用例编写 (Maestro)
**依赖:** Task 3.1 完成  
**执行:** 并行  
**输出:**
```
test/e2e/flows/
├── 01-register.yaml
├── 02-login.yaml
├── 03-credit-apply.yaml
├── 04-loan-apply.yaml
├── 05-repayment.yaml
├── 06-language-switch.yaml
└── 07-admin-review.yaml
```

#### Task 3.7: 测试报告生成器
**依赖:** Task 3.3-3.6 完成  
**执行:** 串行  
**输出:**
- `test/scripts/generate-report.ts`
- 覆盖率报告
- 测试执行历史

---

## 🔄 执行顺序与并行策略

### 关键路径
```
Phase 1 (文档重构)
  └─> Phase 2 (后台设计)
        └─> Phase 3 (测试体系)
```

### 可并行任务
```
Phase 1:
  - Task 1.1 (创建结构) [串行]
  - Task 1.2 (迁移文档) [并行 x6]
  - Task 1.3 (创建索引) [串行]

Phase 2:
  - Task 2.1 (需求分析) [串行]
  - Task 2.2 (API 设计) [串行]
  - Task 2.3 (数据库设计) [并行]
  - Task 2.4 (配置化设计) [串行]

Phase 3:
  - Task 3.1 (创建结构) [串行]
  - Task 3.2 (迁移测试) [并行 x3]
  - Task 3.3 (前端测试) [并行 x4]
  - Task 3.4 (数据库测试) [串行]
  - Task 3.5 (API 测试) [并行 x4]
  - Task 3.6 (E2E 测试) [并行 x7]
  - Task 3.7 (报告生成) [串行]
```

---

## 📊 成功率保障措施

### 1. 文档质量保障
- ✅ 所有文档必须有版本号
- ✅ 需求 - 设计 - 实现双向追溯
- ✅ 文档变更必须更新索引
- ✅ 关键文档需要 review

### 2. 测试质量保障
- ✅ 测试覆盖率 ≥ 80%
- ✅ 关键业务逻辑 100% 覆盖
- ✅ 所有测试必须可重复执行
- ✅ 测试数据必须隔离

### 3. 配置化质量保障
- ✅ 配置必须有 Schema 验证
- ✅ 配置变更必须有审计日志
- ✅ 配置必须有版本控制
- ✅ 配置必须有回滚机制

---

## 📈 验收标准

### Phase 1 验收
- [ ] docs 目录结构完整
- [ ] 所有现有文档已迁移
- [ ] 文档索引可导航
- [ ] 需求 - 设计 - 实现对照表完整

### Phase 2 验收
- [ ] 后台管理需求文档完整
- [ ] API 设计文档完整
- [ ] 数据库设计文档完整
- [ ] 配置化设计方案完整
- [ ] 与现有设计融合方案明确

### Phase 3 验收
- [ ] test 目录结构完整
- [ ] 所有测试文件已迁移
- [ ] 前端单元测试 ≥ 20 个
- [ ] 后端单元测试 ≥ 100 个
- [ ] 数据库测试 ≥ 10 个
- [ ] API 测试 ≥ 30 个
- [ ] E2E 测试 ≥ 7 个
- [ ] 测试覆盖率报告生成

---

## 🎯 任务执行计划

### 立即执行 (T+0)
1. 创建 docs 目录结构
2. 创建 test 目录结构
3. 开始文档迁移

### 第一阶段 (T+1h)
- 完成文档体系重构
- 开始后台需求分析

### 第二阶段 (T+3h)
- 完成后台设计
- 开始测试体系重构

### 第三阶段 (T+6h)
- 完成测试体系重构
- 生成测试报告
- 项目验收

---

**负责人:** 小满 (Orchestrator)  
**启动时间:** 2026-03-17 00:22  
**预计完成:** 2026-03-17 06:22
