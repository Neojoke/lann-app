# Lann 项目 - 任务分拆与并行执行计划

**创建日期:** 2026-03-16 23:55  
**执行策略:** 多 Subagent 并行

---

## 📋 任务分拆

### Task 1: i18n 国际化支持

**Subagent:** `lann-i18n`  
**预计时间:** 1 小时  
**优先级:** P0

**任务内容:**
1. 安装 react-i18next 和 i18next
2. 创建 i18n 配置文件
3. 创建 en.json 和 th.json 翻译文件
4. 添加语言切换组件到 Profile 页面
5. 配置 HTTP 请求头传递 Accept-Language
6. 更新所有页面组件使用 t() 函数

**输出:**
- mobile-app/src/i18n/config.ts
- mobile-app/src/i18n/locales/en.json
- mobile-app/src/i18n/locales/th.json
- mobile-app/src/components/LanguageSwitcher.tsx
- 所有页面组件更新

---

### Task 2: 数据库迁移

**Subagent:** `lann-db`  
**预计时间:** 1 小时  
**优先级:** P0

**任务内容:**
1. 创建完整的 SQL schema 文件
2. 实现数据库迁移脚本
3. 初始化本地 SQLite 数据库
4. 创建种子数据 (测试用)

**输出:**
- backend/sql/schema.sql (完整表结构)
- backend/sql/migrations/001_initial.sql
- backend/scripts/init-db.ts
- local/dev.db (初始化后的数据库)

---

### Task 3: 信用服务 API

**Subagent:** `lann-credit-api`  
**预计时间:** 2 小时  
**优先级:** P0

**任务内容:**
1. 实现信用评分算法
2. 创建信用额度管理逻辑
3. 实现信用 API 端点
4. 创建单元测试

**API 端点:**
- POST /api/credit/apply
- GET /api/credit/status
- GET /api/credit/limit
- POST /api/credit/review (额度复审)

**输出:**
- backend/workers/credit.api.ts
- backend/services/credit-score.service.ts
- backend/services/credit-limit.service.ts
- backend/tests/credit.test.ts

---

### Task 4: 借款服务 API

**Subagent:** `lann-loan-api`  
**预计时间:** 2 小时  
**优先级:** P0

**任务内容:**
1. 实现借款产品配置系统
2. 创建借款申请流程
3. 实现借款审批逻辑
4. 实现电子签约功能
5. 创建单元测试

**API 端点:**
- POST /api/loan/apply
- POST /api/loan/confirm
- GET /api/loan/:id/status
- GET /api/loan/:id
- GET /api/loan/products (产品列表)

**输出:**
- backend/workers/loan.api.ts
- backend/services/loan-product.service.ts
- backend/services/loan-application.service.ts
- backend/services/contract.service.ts
- backend/tests/loan.test.ts

---

### Task 5: 还款服务 API

**Subagent:** `lann-repay-api`  
**预计时间:** 2 小时  
**优先级:** P0

**任务内容:**
1. 实现还款计划生成
2. 创建多渠道还款逻辑
3. 实现逾期管理和罚息计算
4. 实现提前还款处理
5. 创建单元测试

**API 端点:**
- GET /api/repay/schedule
- POST /api/repay/create
- GET /api/repay/channels
- GET /api/repay/prepayment-calc
- POST /api/repay/channel/webhook (渠道回调)

**输出:**
- backend/workers/repay.api.ts
- backend/services/repayment-schedule.service.ts
- backend/services/overdue.service.ts
- backend/services/penalty.service.ts
- backend/tests/repay.test.ts

---

### Task 6: 前端服务层

**Subagent:** `lann-frontend-services`  
**预计时间:** 1.5 小时  
**优先级:** P0

**任务内容:**
1. 创建信用服务 (credit.service.ts)
2. 创建借款服务 (loan.service.ts)
3. 创建还款服务 (repay.service.ts)
4. 配置 API 拦截器 (传递 Accept-Language)

**输出:**
- mobile-app/src/services/credit.service.ts
- mobile-app/src/services/loan.service.ts
- mobile-app/src/services/repay.service.ts
- mobile-app/src/interceptors/language.interceptor.ts

---

### Task 7: 前端页面更新

**Subagent:** `lann-frontend-pages`  
**预计时间:** 2 小时  
**优先级:** P1

**任务内容:**
1. 更新 Profile 页面 (添加语言切换)
2. 更新 CreditApply 页面 (完整资料表单)
3. 更新 CreditStatus 页面 (额度展示)
4. 更新 Borrow 页面 (产品选择)
5. 创建 RepaySchedule 页面 (还款计划)

**输出:**
- mobile-app/src/pages/Profile/Profile.tsx (更新)
- mobile-app/src/pages/CreditApply/CreditApply.tsx (更新)
- mobile-app/src/pages/CreditStatus/CreditStatus.tsx (更新)
- mobile-app/src/pages/Borrow/Borrow.tsx (更新)
- mobile-app/src/pages/RepaySchedule/RepaySchedule.tsx (新建)

---

## 🔄 执行顺序

```
T+0min:   启动所有 7 个 Subagent
         ├── lann-i18n
         ├── lann-db
         ├── lann-credit-api
         ├── lann-loan-api
         ├── lann-repay-api
         ├── lann-frontend-services
         └── lann-frontend-pages

T+60min:  lann-i18n 完成 ✅
         lann-db 完成 ✅

T+90min:  lann-frontend-services 完成 ✅

T+120min: lann-credit-api 完成 ✅
          lann-loan-api 完成 ✅
          lann-repay-api 完成 ✅
          lann-frontend-pages 完成 ✅

T+150min: 集成测试
T+180min: 全部完成，准备演示
```

---

## 📊 依赖关系

```
lann-i18n ─────────────┬─────────────> lann-frontend-pages
                       │
lann-db ───────────────┼─────────────> lann-credit-api
                       │               lann-loan-api
                       │               lann-repay-api
                       │
                       └─────────────> lann-frontend-services
```

---

## ✅ 验收标准

### i18n
- [ ] 可以在泰语和英语之间切换
- [ ] 所有界面文本都有翻译
- [ ] 请求头正确传递 Accept-Language

### 数据库
- [ ] 所有表创建成功
- [ ] 外键约束正确
- [ ] 索引已创建
- [ ] 种子数据可查询

### 信用服务
- [ ] 信用评分计算正确
- [ ] 额度授予逻辑正确
- [ ] API 返回多语言错误消息

### 借款服务
- [ ] 产品可配置化
- [ ] 借款申请流程完整
- [ ] 利息计算正确

### 还款服务
- [ ] 还款计划生成正确
- [ ] 多渠道还款支持
- [ ] 罚息计算正确
- [ ] 提前还款处理正确

### 前端
- [ ] 所有服务可调用后端 API
- [ ] 页面可以正常交互
- [ ] 错误处理完善

---

**负责人:** 小满 (Orchestrator)  
**执行策略:** 7 个 Subagent 并行执行  
**预计总时间:** 2-3 小时
