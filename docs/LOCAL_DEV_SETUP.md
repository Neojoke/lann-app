# Lann 本地开发环境搭建指南

**创建日期:** 2026-03-15  
**状态:** ✅ 完整可用

---

## 🎯 问题反思

### 之前的问题
1. ❌ 没有提前规划本地开发环境
2. ❌ 直接开始写代码，导致后端无法本地测试
3. ❌ 依赖云端服务 (Cloudflare) 无法离线开发

### 现在的解决方案
1. ✅ Docker Compose 一键启动所有依赖服务
2. ✅ SQLite + MinIO + MailHog 本地运行
3. ✅ 完全离线开发，最后再部署到 Cloudflare

---

## 📦 服务架构

```
┌─────────────────────────────────────────────────┐
│              本地开发环境                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   MinIO     │  │  MailHog    │  │ SQLite  │ │
│  │  (R2 替代)   │  │ (短信模拟)   │  │ (D1 替代)│ │
│  │  :9000      │  │  :8025      │  │  文件    │ │
│  └─────────────┘  └─────────────┘  └─────────┘ │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │         Backend (Hono + Node.js)        │   │
│  │              Port: 8787                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │      Frontend (Ionic + Angular)         │   │
│  │              Port: 8100                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### Step 1: 启动依赖服务

```bash
cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app

# 启动所有服务
docker-compose up -d

# 验证服务状态
docker-compose ps
```

**预期输出:**
```
NAME            STATUS          PORTS
lann-minio      Up (healthy)    0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp
lann-mailhog    Up              0.0.0.0:1025->1025/tcp, 0.0.0.0:8025->8025/tcp
```

### Step 2: 初始化本地数据库

```bash
cd backend

# 创建数据目录
mkdir -p local

# 初始化数据库
sqlite3 local/dev.db < sql/schema.sql

# 验证数据库
sqlite3 local/dev.db "SELECT * FROM users;"
```

### Step 3: 配置环境变量

```bash
cd backend
cp .env.local.example .env.local
```

### Step 4: 安装后端依赖

```bash
cd backend
npm install
```

### Step 5: 启动后端服务

```bash
cd backend
npm run dev:local
```

**预期输出:**
```
Server running on http://localhost:8787
Database: connected
MinIO: connected
MailHog: connected
```

### Step 6: 安装前端依赖

```bash
cd mobile-app
npm install
```

### Step 7: 启动前端开发服务器

```bash
cd mobile-app
ionic serve
```

**预期输出:**
```
Running dev server: http://localhost:8100
```

---

## 🧪 验证环境

### 1. 健康检查

```bash
curl http://localhost:8787/health
```

**预期响应:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-15T07:30:00.000Z",
  "services": {
    "database": "connected",
    "minio": "connected",
    "mailhog": "connected"
  }
}
```

### 2. 测试发送 OTP

```bash
curl -X POST http://localhost:8787/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+66812345678"}'
```

**预期响应:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 300,
  "otpId": "otp_1234567890"
}
```

### 3. 查看"短信"

访问 **http://localhost:8025** 查看 MailHog 收到的"短信"

### 4. 测试借款 API

```bash
curl -X POST http://localhost:8787/api/loans \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"days":14}'
```

### 5. 访问前端应用

浏览器打开 **http://localhost:8100**

---

## 🛠️ 常用命令

### Docker 服务管理

```bash
# 查看所有服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启某个服务
docker-compose restart minio

# 停止所有服务
docker-compose down

# 停止并删除数据 (重置)
docker-compose down -v
```

### 数据库操作

```bash
# 初始化数据库
npm run db:local:init

# 重置数据库
npm run db:local:reset

# 查看数据库
sqlite3 backend/local/dev.db

# 查看表
sqlite3 backend/local/dev.db ".tables"

# 查看数据
sqlite3 backend/local/dev.db "SELECT * FROM users;"
```

### MinIO 操作

```bash
# 访问 MinIO Console
# http://localhost:9001
# 用户名：lann-dev
# 密码：lann-secret

# 创建存储桶 (可选，会自动创建)
npm run minio:create-bucket
```

---

## 📁 文件结构

```
lann-thailand-loan-app/
├── docker-compose.yml              # Docker 服务配置
├── .env.local                      # 环境变量 (不提交)
├── backend/
│   ├── local/
│   │   ├── dev.db                 # SQLite 数据库
│   │   └── minio/                 # MinIO 数据
│   ├── workers/
│   │   ├── index.ts               # Cloudflare 版本
│   │   └── index.local.ts         # 本地开发版本
│   ├── .env.local                 # 后端环境变量
│   └── package.json
└── mobile-app/
    └── package.json
```

---

## 🔧 故障排查

### Q1: 端口被占用

```bash
# 查看占用端口的进程
lsof -i :8787
lsof -i :8100
lsof -i :9000

# 杀死进程
kill -9 <PID>
```

### Q2: Docker 服务启动失败

```bash
# 查看详细日志
docker-compose logs minio
docker-compose logs mailhog

# 重新创建容器
docker-compose down
docker-compose up -d --force-recreate
```

### Q3: 数据库锁定

```bash
# 删除数据库文件
rm backend/local/dev.db

# 重新初始化
npm run db:local:init
```

### Q4: npm install 失败

```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install --legacy-peer-deps
```

---

## 📝 开发流程

1. **启动服务** - `docker-compose up -d`
2. **启动后端** - `cd backend && npm run dev:local`
3. **启动前端** - `cd mobile-app && ionic serve`
4. **开发测试** - 访问 http://localhost:8100
5. **查看短信** - 访问 http://localhost:8025
6. **查看数据** - `sqlite3 backend/local/dev.db`
7. **完成开发** - 切换到 Cloudflare 版本部署

---

## 🎯 下一步

1. ✅ 运行 `docker-compose up -d`
2. ✅ 运行 `cd backend && npm run db:local:init`
3. ✅ 运行 `cd backend && npm install`
4. ✅ 运行 `cd backend && npm run dev:local`
5. ✅ 运行 `cd mobile-app && npm install`
6. ✅ 运行 `cd mobile-app && ionic serve`

---

**现在环境已规划完整，可以开始本地开发了！**
