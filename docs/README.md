# Lann 项目文档中心

**最后更新:** 2026-03-17  
**版本:** v1.0  
**状态:** 🟢 文档体系已建立

---

## 📋 快速导航

| 类别 | 链接 | 文档数 |
|------|------|--------|
| 📖 需求文档 | [01-requirements](#01-requirements-需求文档) | 2 |
| 🏗️ 设计文档 | [02-design](#02-design-设计文档) | 1 |
| 💻 实现文档 | [03-implementation](#03-implementation-实现文档) | 4 |
| 🧪 测试文档 | [04-testing](#04-testing-测试文档) | 0 |
| 🔧 运维文档 | [05-operations](#05-operations-运维文档) | 2 + 归档 |

---

## 📁 完整目录结构

```
docs/
├── README.md                    # 📍 本文档 - 文档索引
├── 01-requirements/             # 📖 需求文档
│   ├── business-model.md        # 业务模型设计
│   └── credit-flow.md           # 用户进件流程设计
├── 02-design/                   # 🏗️ 设计文档
│   └── schema-spec.md           # Schema 规范
├── 03-implementation/           # 💻 实现文档
│   ├── credit-api.md            # 信用服务 API
│   ├── loan-api.md              # 借款服务 API
│   ├── repayment-api.md         # 还款服务 API
│   └── frontend.md              # 前端实现报告
├── 04-testing/                  # 🧪 测试文档 (待补充)
└── 05-operations/               # 🔧 运维文档
    ├── android-build.md         # Android 打包指南
    ├── next-steps.md            # 下一步行动计划
    └── archive/                 # 归档文档
        └── TASK_BREAKDOWN.md    # 任务分解 (历史归档)
```

---

## 📖 01-requirements: 需求文档

### business-model.md
**业务模型设计** - [查看文档](01-requirements/business-model.md)

- **版本:** v1.0
- **状态:** 🟡 设计中
- **内容:** 信用服务、借款产品、还款服务、债务与资产模型
- **相关文档:** 
  - [Schema 规范](02-design/schema-spec.md) - 数据模型定义
  - [信用 API](03-implementation/credit-api.md) - 实现参考

### credit-flow.md
**用户进件流程设计** - [查看文档](01-requirements/credit-flow.md)

- **版本:** v1.0
- **状态:** 🟡 待开发
- **内容:** 注册登录、资料填写、信用评估、额度授予全流程
- **相关文档:**
  - [前端实现](03-implementation/frontend.md) - UI/UX 实现
  - [信用 API](03-implementation/credit-api.md) - 评分服务

---

## 🏗️ 02-design: 设计文档

### schema-spec.md
**Schema 规范** - [查看文档](02-design/schema-spec.md)

- **版本:** v1.0
- **状态:** 🟢 已建立
- **内容:** JSON Schema 核心规范、基础类型、业务模型、数据库设计
- **相关文档:**
  - [业务模型](01-requirements/business-model.md) - 业务需求来源
  - [信用 API](03-implementation/credit-api.md) - 实现参考
  - [借款 API](03-implementation/loan-api.md) - 实现参考
  - [还款 API](03-implementation/repayment-api.md) - 实现参考

---

## 💻 03-implementation: 实现文档

### credit-api.md
**信用服务 API** - [查看文档](03-implementation/credit-api.md)

- **版本:** v1.0
- **状态:** ✅ 已完成
- **内容:** 信用评分服务、评分维度、权重配置、API 接口
- **相关文档:**
  - [业务模型](01-requirements/business-model.md) - 需求来源
  - [Schema 规范](02-design/schema-spec.md) - 数据模型
  - [用户进件流程](01-requirements/credit-flow.md) - 业务流程

### loan-api.md
**借款服务 API** - [查看文档](03-implementation/loan-api.md)

- **版本:** v1.0
- **状态:** ✅ 已完成
- **内容:** 产品列表、借款申请、确认借款、状态查询
- **相关文档:**
  - [业务模型](01-requirements/business-model.md) - 需求来源
  - [Schema 规范](02-design/schema-spec.md) - 数据模型
  - [还款 API](03-implementation/repayment-api.md) - 后续流程

### repayment-api.md
**还款服务 API** - [查看文档](03-implementation/repayment-api.md)

- **版本:** v1.0
- **状态:** ✅ 已完成
- **测试覆盖率:** 100% (24/24 测试通过)
- **内容:** 还款计划生成、分期计算、状态更新
- **相关文档:**
  - [业务模型](01-requirements/business-model.md) - 需求来源
  - [借款 API](03-implementation/loan-api.md) - 前置流程

### frontend.md
**前端实现报告** - [查看文档](03-implementation/frontend.md)

- **版本:** v1.0
- **状态:** ✅ 已完成
- **内容:** Ionic React、双语支持 (i18n)、页面更新、组件开发
- **相关文档:**
  - [用户进件流程](01-requirements/credit-flow.md) - 需求来源
  - [Android 打包](05-operations/android-build.md) - 发布流程

---

## 🧪 04-testing: 测试文档

> ⚠️ **待补充** - 测试文档目录已创建，待添加以下内容:
> - 单元测试报告
> - 集成测试报告
> - E2E 测试用例
> - 测试覆盖率报告

---

## 🔧 05-operations: 运维文档

### android-build.md
**Android 打包发布指南** - [查看文档](05-operations/android-build.md)

- **版本:** v1.0
- **状态:** 🟡 待执行
- **内容:** Capacitor 配置、APK 打包、签名、Google Play 发布
- **相关文档:**
  - [前端实现](03-implementation/frontend.md) - 源代码

### next-steps.md
**下一步行动计划** - [查看文档](05-operations/next-steps.md)

- **版本:** v1.0
- **状态:** 🟡 进行中
- **内容:** P0/P1/P2 任务清单、负责人、预计时间
- **相关文档:**
  - [归档任务分解](05-operations/archive/TASK_BREAKDOWN.md) - 历史版本

### archive/TASK_BREAKDOWN.md
**任务分解 (归档)** - [查看文档](05-operations/archive/TASK_BREAKDOWN.md)

- **状态:** 📦 已归档
- **说明:** 历史任务分解文档，供参考查阅

---

## 📊 需求 - 设计 - 实现对照表

| 需求文档 | 设计文档 | 实现文档 | 状态 |
|---------|---------|---------|------|
| [业务模型](01-requirements/business-model.md) | [Schema 规范](02-design/schema-spec.md) | [信用 API](03-implementation/credit-api.md) | ✅ |
| [业务模型](01-requirements/business-model.md) | [Schema 规范](02-design/schema-spec.md) | [借款 API](03-implementation/loan-api.md) | ✅ |
| [业务模型](01-requirements/business-model.md) | [Schema 规范](02-design/schema-spec.md) | [还款 API](03-implementation/repayment-api.md) | ✅ |
| [用户进件流程](01-requirements/credit-flow.md) | - | [前端实现](03-implementation/frontend.md) | ✅ |
| - | - | [Android 打包](05-operations/android-build.md) | 🟡 |

---

## 📝 文档版本历史

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-03-17 | v1.0 | 文档体系重构，建立索引 | AI Assistant |

---

## 🔗 其他资源

### 项目根目录文档
- [PROJECT.md](../PROJECT.md) - 项目概述
- [README.md](../README.md) - 项目说明
- [QUICKSTART.md](../QUICKSTART.md) - 快速开始
- [QUICKSTART_LOCAL.md](../QUICKSTART_LOCAL.md) - 本地开发指南

### 子目录文档
- [compliance/PRIVACY_POLICY.md](compliance/PRIVACY_POLICY.md) - 隐私政策
- [compliance/TERMS_OF_SERVICE.md](compliance/TERMS_OF_SERVICE.md) - 服务条款
- [design/UI_UX_SPEC.md](design/UI_UX_SPEC.md) - UI/UX 规范

### 项目日志
- [LOG_PROJECTS.md](LOG_PROJECTS.md) - 项目日志
- [LOG_SESSIONS.md](LOG_SESSIONS.md) - 会话日志

---

## 📌 文档管理规范

### 命名约定
- 使用小写字母和连字符：`my-document.md`
- 目录使用前缀编号：`01-requirements/`
- 版本标注在文档内：`**版本:** v1.0`

### 状态标识
- 🟢 已完成
- 🟡 进行中/待完善
- 🔴 已废弃
- ⚪ 草稿

### 更新流程
1. 修改文档内容
2. 更新版本号
3. 更新本文档的交叉引用
4. 提交 Git 并编写清晰的提交信息

---

**📍 本文档是唯一真实的文档索引，所有文档变更应同步更新此索引。**
