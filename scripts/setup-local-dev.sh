#!/bin/bash
# Lann 本地开发环境 - 手动启动脚本
# 当 Docker 不可用时的备选方案

set -e

echo "🦞 Lann 本地开发环境启动脚本"
echo "================================"

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p backend/local/minio

# 初始化 SQLite 数据库
echo "🗄️ 初始化数据库..."
if [ ! -f backend/local/dev.db ]; then
  sqlite3 backend/local/dev.db < backend/sql/schema.sql
  echo "✅ 数据库初始化完成"
else
  echo "ℹ️  数据库已存在，跳过初始化"
fi

# 复制环境变量
if [ ! -f backend/.env.local ]; then
  echo "📝 创建环境变量..."
  cp backend/.env.local.example backend/.env.local
fi

echo ""
echo "✅ 环境准备完成！"
echo ""
echo "📋 下一步:"
echo "1. 安装后端依赖：cd backend && npm install"
echo "2. 启动后端服务：cd backend && npm run dev:local"
echo "3. 安装前端依赖：cd mobile-app && npm install"
echo "4. 启动前端服务：cd mobile-app && ionic serve"
echo ""
echo "🌐 访问地址:"
echo "- 前端：http://localhost:8100"
echo "- 后端：http://localhost:8787"
echo "- API 文档：http://localhost:8787/docs"
echo ""
echo "⚠️  注意：MailHog 和 MinIO 需要 Docker，如无法使用请参考 LOCAL_DEV_SETUP.md 配置替代方案"
