# 🦞 Lann 本地开发环境 - 快速启动

**更新时间:** 2026-03-15 15:35  
**状态:** ✅ 环境已规划，等待安装依赖

---

## 🚀 一键启动命令

```bash
# 进入项目目录
cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app

# Step 1: 安装后端依赖
cd backend
npm install

# Step 2: 启动后端 (本地模式)
npm run dev:local

# Step 3: (新终端) 启动前端
cd ../mobile-app
npm install
ionic serve
```

---

## 📋 完整流程

### 1️⃣ 后端设置

```bash
cd backend

# 安装依赖
npm install

# 创建数据目录
mkdir -p local

# 环境变量 (可选，有默认值)
cp .env.local.example .env.local

# 启动开发服务器
npm run dev:local
```

**启动后访问:** http://localhost:8787/health

### 2️⃣ 前端设置

```bash
cd mobile-app

# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
ionic serve
```

**启动后访问:** http://localhost:8100

---

## 🧪 测试 API

```bash
# 健康检查
curl http://localhost:8787/health

# 发送 OTP
curl -X POST http://localhost:8787/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+66812345678"}'

# 创建借款
curl -X POST http://localhost:8787/api/loans \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"days":14}'
```

---

## 📁 当前文件状态

| 文件 | 状态 | 说明 |
|------|------|------|
| docker-compose.yml | ✅ 已创建 | Docker 服务编排 |
| index.local.ts | ✅ 已创建 | 本地后端代码 |
| .env.local.example | ✅ 已创建 | 环境变量模板 |
| LOCAL_DEV_SETUP.md | ✅ 已创建 | 详细文档 |
| backend/local/dev.db | ⏳ 待创建 | npm install 后自动创建 |

---

## ⚠️ 注意事项

1. **SQLite 自动创建** - 第一次运行时会自动创建数据库文件
2. **环境变量可选** - 有默认值，开发环境可直接运行
3. **MailHog/MinIO** - 如需完整功能需要 Docker，基础功能可直接运行

---

## 🎯 立即执行

```bash
# 复制粘贴以下命令开始开发：

cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app/backend && npm install && npm run dev:local &
cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app/mobile-app && npm install --legacy-peer-deps && ionic serve
```

---

**环境已规划完成，现在可以开始安装了！** 👿
