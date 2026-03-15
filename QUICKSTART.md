# 🚀 Lann 项目快速启动指南

**最后更新:** 2026-03-15 14:55

---

## ✅ 已完成的工作

| 任务 | 状态 | 文件位置 |
|------|------|----------|
| 项目章程 | ✅ 完成 | `PROJECT.md` |
| README | ✅ 完成 | `README.md` |
| UI/UX 设计规范 | ✅ 完成 | `docs/design/UI_UX_SPEC.md` |
| 项目目录结构 | ✅ 完成 | `mobile-app/`, `backend/` |
| package.json | ✅ 完成 | `mobile-app/package.json` |
| angular.json | ✅ 完成 | `mobile-app/angular.json` |
| wrangler.toml | ✅ 完成 | `backend/wrangler.toml` |
| .opencode.json | ✅ 完成 | 根目录 |

---

## ⏳ 待完成 - 需要登录

### 1. GitHub 登录 🔴
```bash
gh auth login
```
**原因:** 创建仓库、配置 CI/CD、管理 Issues

**步骤:**
1. 运行 `gh auth login`
2. 选择 GitHub.com
3. 选择 HTTPS
4. 登录浏览器完成授权

### 2. Cloudflare 登录 🔴
```bash
npx wrangler login
```
**原因:** 创建 Workers、D1 数据库、R2 存储桶

**步骤:**
1. 运行 `npx wrangler login`
2. 浏览器登录 Cloudflare
3. 授权 Wrangler CLI

### 3. 创建 GitHub 仓库 🔴
```bash
cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app
gh repo create lann-thailand-loan-app --private --source=. --remote=origin
```

---

## 📦 下一步 - 安装依赖

### Ionic 移动应用
```bash
cd mobile-app
npm install
```

### Cloudflare 后端
```bash
cd backend
npm init -y
npm install wrangler typescript @cloudflare/workers-types
```

---

## 🎨 UI/UX 设计启动

使用已安装的 `ui-ux-pro-max` skill：

**提示词示例:**
```
使用 ui-ux-pro-max 设计 Lann App 的首页：
- 泰语和英语双语
- 显示可用额度
- 快速借款入口
- 简约高效风格
- 金色和深蓝色主题
```

---

## 🧪 E2E 测试配置

### 安装 Detox
```bash
cd mobile-app
npm install -D detox @types/detox
```

### 测试用例规划
1. 用户注册流程
2. 借款申请流程
3. 还款流程
4. 语言切换
5. 异常场景

---

## 📋 项目里程碑

### Week 1 (2026-03-15 ~ 2026-03-21)
- [x] 项目初始化
- [x] UI/UX 设计规范
- [ ] GitHub 仓库创建
- [ ] Cloudflare 项目配置
- [ ] Ionic 框架搭建

### Week 2 (2026-03-22 ~ 2026-03-28)
- [ ] 多语言配置 (th/en)
- [ ] 用户认证模块
- [ ] 首页设计实现

### Week 3-4 (2026-03-29 ~ 2026-04-11)
- [ ] 借款流程开发
- [ ] Cloudflare 后端 API
- [ ] 数据库设计

### Week 5-6 (2026-04-12 ~ 2026-04-25)
- [ ] E2E 测试
- [ ] 性能优化
- [ ] MVP 演示准备

---

## 🔧 常用命令

### 开发
```bash
# 启动 Ionic 开发服务器
cd mobile-app && ionic serve

# 启动 Cloudflare Workers 本地开发
cd backend && npx wrangler dev
```

### 构建
```bash
# 构建 Web 版本
ionic build

# 构建 Android
ionic capacitor build android
```

### 测试
```bash
# 运行单元测试
npm test

# 运行 E2E 测试
npm run e2e
```

---

## 📞 需要帮助？

**项目文档:**
- 项目章程：`PROJECT.md`
- UI/UX 规范：`docs/design/UI_UX_SPEC.md`
- 待确认事项：`TODO_CONFIRM.md`

**AI Agent 团队:**
- 项目经理：project-management-skills
- UI/UX 设计：ui-ux-pro-max
- 前端开发：OpenCode
- 后端开发：Claude Code

---

**当前状态:** 🟡 等待 GitHub 和 Cloudflare 登录
