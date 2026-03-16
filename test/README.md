# Lann 测试体系

本目录包含 Lann 项目的完整测试套件，涵盖单元测试、集成测试和 E2E 测试。

## 目录结构

```
test/
├── README.md                  # 测试文档索引（本文件）
├── frontend-unit/             # 前端单元测试 (Vitest)
│   ├── components/            # 组件测试
│   ├── pages/                 # 页面测试
│   ├── services/              # 服务层测试
│   └── utils/                 # 工具函数测试
├── backend-unit/              # 后端单元测试 (Jest)
│   ├── services/              # 服务测试
│   ├── workers/               # Worker 测试
│   ├── utils/                 # 工具函数测试
│   ├── credit/                # 信用相关测试
│   ├── loan/                  # 贷款相关测试
│   └── repayment/             # 还款相关测试
├── database-logic/            # 数据库业务逻辑测试
│   ├── schema/                # 表结构验证
│   ├── constraints/           # 约束验证
│   └── triggers/              # 触发器测试
├── api/                       # API 集成测试
│   ├── credit/                # 信用 API 测试
│   ├── loan/                  # 贷款 API 测试
│   ├── repayment/             # 还款 API 测试
│   └── admin/                 # 管理后台 API 测试
├── e2e/                       # E2E 测试 (Maestro)
│   ├── flows/                 # 用户流程测试
│   ├── fixtures/              # 测试数据
│   └── reports/               # 测试报告
└── fixtures/                  # 共享测试数据
    ├── users/                 # 用户数据
    ├── loans/                 # 贷款数据
    └── products/              # 产品数据
```

## 测试统计

| 测试类型 | 目标数量 | 说明 |
|---------|---------|------|
| 前端单元测试 | ≥ 20 个 | 组件、页面、服务 |
| 后端单元测试 | ≥ 100 个 | 继承现有测试 |
| 数据库测试 | ≥ 10 个 | 表结构、约束、触发器 |
| API 测试 | ≥ 30 个 | 各业务线集成测试 |
| E2E 测试 | ≥ 7 个 | Maestro 流程测试 |

## 运行测试

### 前端单元测试
```bash
npm run test:frontend
# 或
cd test && npx vitest run
```

### 后端单元测试
```bash
npm run test:backend
# 或
cd backend && npm test
```

### API 集成测试
```bash
npm run test:api
```

### E2E 测试
```bash
npm run test:e2e
# 或
maestro test test/e2e/flows/
```

### 全量测试
```bash
npm run test:all
```

## 测试覆盖率

生成覆盖率报告：
```bash
npm run test:coverage
```

## 测试规范

### 命名约定
- 单元测试：`*.test.ts` / `*.test.tsx`
- E2E 测试：`*.yaml` (Maestro)
- 测试数据：`*.json` / `*.yaml`

### 测试文件命名
- 组件测试：`ComponentName.test.tsx`
- 服务测试：`service-name.service.test.ts`
- API 测试：`endpoint.test.ts`
- E2E 流程：`NN-flow-name.yaml` (NN 为执行顺序)

## 环境配置

### 测试环境变量
创建 `.env.test` 文件：
```bash
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/lann_test
API_BASE_URL=http://localhost:8787
```

### 测试数据库
运行测试前确保测试数据库已创建：
```bash
npm run db:test:create
```

## CI/CD 集成

测试在以下场景自动运行：
- Pull Request 创建/更新
- 主分支推送
- 每日定时运行（E2E 测试）

详见 `.github/workflows/test.yml`
