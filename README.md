# 🦞 Lann - 泰国借款 App

[![Status](https://img.shields.io/badge/status-in--development-yellow)]()
[![Ionic](https://img.shields.io/badge/Ionic-8.x-blue)]()
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange)]()
[![License](https://img.shields.io/badge/license-proprietary-red)]()

**面向泰国用户的多语言借款应用程序**

---

## 📱 项目简介

Lann（泰语：ล้าน - "百万"）是一款面向泰国用户的移动借款应用，提供便捷、安全、合规的个人贷款服务。

### 核心特性
- 🇹🇭🇬🇧 **双语支持** - 泰语和英语同等重要
- ⚡ **快速审批** - 最快 10 分钟完成借款
- 🔒 **安全可靠** - 端到端加密，符合泰国 PDPA
- 💳 **多种还款** - 银行转账、便利店、在线支付

---

## 🚀 快速开始

### 环境要求
- Node.js >= 18.x
- npm >= 9.x
- Ionic CLI >= 8.x
- Capacitor >= 6.x

### 安装依赖
```bash
cd mobile-app
npm install
```

### 开发模式
```bash
ionic serve
```

### 构建 Android
```bash
ionic capacitor build android
```

---

## 📁 项目结构

```
lann-thailand-loan-app/
├── mobile-app/           # Ionic 移动应用
│   ├── src/
│   │   ├── app/         # Angular 主应用
│   │   ├── pages/       # 页面组件
│   │   ├── services/    # 业务服务
│   │   ├── models/      # 数据模型
│   │   └── assets/      # 静态资源 (i18n 等)
│   ├── e2e/             # E2E 测试
│   └── capacitor.config.ts
│
├── backend/              # Cloudflare 后端
│   ├── workers/          # Workers 函数
│   ├── d1/               # 数据库迁移
│   ├── r2/               # 存储桶配置
│   └── wrangler.toml
│
├── docs/                 # 项目文档
│   ├── api/              # API 文档
│   ├── compliance/       # 合规文档
│   └── design/           # 设计稿
│
└── scripts/              # 自动化脚本
```

---

## 🛠️ 技术栈

### 前端
- **Ionic Framework 8.x** - 跨平台移动应用框架
- **Angular 17.x** - 前端框架
- **Capacitor 6.x** - 原生功能桥接
- **RxJS** - 响应式编程

### 后端 (Cloudflare)
- **Cloudflare Workers** - 无服务器函数
- **Cloudflare D1** - SQLite 数据库
- **Cloudflare R2** - 对象存储
- **Cloudflare Queue** - 异步任务队列

---

## 📋 MVP 功能清单

### Phase 1 (Week 1-2)
- [ ] 项目初始化
- [ ] UI/UX 设计系统
- [ ] 多语言配置 (泰语/英语)

### Phase 2 (Week 3-4)
- [ ] 用户注册/登录
- [ ] OTP 短信验证
- [ ] 基础个人信息

### Phase 3 (Week 5-6)
- [ ] 借款申请流程
- [ ] 借款计算器
- [ ] 电子合同

### Phase 4 (Week 7-8)
- [ ] 后台管理面板
- [ ] 数据看板
- [ ] 演示模式

---

## 🔐 环境变量

创建 `.env` 文件：

```bash
# Cloudflare
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# 短信服务
SMS_API_KEY=your_sms_key

# 其他
APP_ENV=development
```

---

## 📞 联系方式

**项目负责人:** 吴鹏 (peng)  
**开发团队:** AI Agent Team  
**开始日期:** 2026-03-15

---

## 📄 许可证

 proprietary - 所有权利保留
