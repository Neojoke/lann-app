#!/bin/bash
# Lann 本地开发环境 - 完整启动脚本

set -e

echo "🦞 Lann 本地开发环境启动"
echo "================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js 未安装，请先安装 Node.js 18+"
  exit 1
fi

echo "✅ Node.js 版本：$(node -v)"
echo ""

# 进入项目目录
cd "$(dirname "$0")/.."

# ========== 后端设置 ==========
echo "📦 后端设置..."
cd backend

# 创建数据目录
mkdir -p local

# 初始化数据库
if [ ! -f local/dev.db ]; then
  echo "🗄️  创建数据库..."
  if command -v sqlite3 &> /dev/null; then
    sqlite3 local/dev.db < sql/schema.sql
    sqlite3 local/dev.db < sql/seed.sql
    echo "✅ 数据库初始化完成 (含测试数据)"
  else
    echo "⚠️  sqlite3 未安装，数据库将在第一次运行时自动创建"
  fi
else
  echo "ℹ️  数据库已存在"
fi

# 复制环境变量
if [ ! -f .env.local ]; then
  echo "📝 创建环境变量..."
  cp .env.local.example .env.local
fi

# 安装依赖
if [ ! -d node_modules ]; then
  echo "📦 安装后端依赖..."
  npm install
else
  echo "✅ 后端依赖已安装"
fi

# 启动后端
echo "🚀 启动后端服务..."
npm run dev:local &
BACKEND_PID=$!
echo "✅ 后端已启动 (PID: $BACKEND_PID)"
echo ""

# 等待后端启动
sleep 3

# ========== 前端设置 ==========
echo "📱 前端设置..."
cd ../mobile-app

# 安装依赖
if [ ! -d node_modules ]; then
  echo "📦 安装前端依赖..."
  npm install --legacy-peer-deps
else
  echo "✅ 前端依赖已安装"
fi

# 启动前端
echo "🚀 启动前端开发服务器..."
ionic serve --no-open &
FRONTEND_PID=$!
echo "✅ 前端已启动 (PID: $FRONTEND_PID)"
echo ""

# ========== 完成 ==========
echo "================================"
echo "✅ 所有服务已启动！"
echo ""
echo "🌐 访问地址:"
echo "   前端：http://localhost:8100"
echo "   后端：http://localhost:8787"
echo "   健康检查：http://localhost:8787/health"
echo ""
echo "🧪 测试账号:"
echo "   手机号：+66812345678"
echo "   OTP: 123456 (开发环境固定)"
echo ""
echo "🛑 停止服务:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "================================"

# 等待进程
wait
