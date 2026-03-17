# Lann 项目 - 本地演示指南

**版本:** v1.0  
**创建日期:** 2026-03-17 08:31  
**目标:** 5 分钟快速启动本地演示

---

## 🎯 演示场景

### 核心流程演示
1. **用户注册 + 登录** (2 分钟)
2. **信用申请 + 评估** (3 分钟)
3. **借款申请 + 审批** (3 分钟)
4. **还款流程** (2 分钟)
5. **管理后台审核** (3 分钟)

**总演示时间:** 约 13 分钟

---

## 📦 前置准备

### 环境要求
- Node.js 18+
- npm 或 pnpm
- 浏览器 (Chrome/Edge)

### 检查环境
```bash
# 检查 Node.js 版本
node --version  # 应该 >= 18

# 检查 npm
npm --version
```

---

## 🚀 快速启动 (5 分钟)

### Step 1: 安装依赖 (2 分钟)

```bash
cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../mobile-app
npm install

# 安装管理后台依赖
cd ../admin-portal
npm install
```

### Step 2: 初始化数据库 (1 分钟)

```bash
cd backend

# 初始化 SQLite 数据库
npm run db:init

# 插入测试数据
npm run db:seed
```

**测试数据包括:**
- 3 个测试用户 (不同信用等级)
- 3 个借款产品
- 5 个还款渠道

### Step 3: 启动后端服务 (1 分钟)

```bash
cd backend

# 启动开发服务器
npm run dev:local

# 应该看到:
# 🚀 Server ready at http://localhost:3000
# 📊 Health check: http://localhost:3000/health
```

### Step 4: 启动前端 App (1 分钟)

```bash
# 新终端窗口
cd mobile-app

# 启动开发服务器
npm run dev

# 应该看到:
# ➜  Local:   http://localhost:5173
# ➜  Network: use --host to expose
```

### Step 5: 启动管理后台 (可选)

```bash
# 新终端窗口
cd admin-portal

# 启动开发服务器
npm run dev

# 应该看到:
# ➜  Local:   http://localhost:5174
```

---

## 📱 演示流程

### 场景 1: 用户注册 + 登录

**访问:** http://localhost:5173

**步骤:**
1. 点击"注册"按钮
2. 输入手机号：`+66812345678`
3. 点击"发送 OTP"
4. 输入测试 OTP：`123456`
5. 设置密码
6. 完成注册

**登录:**
1. 输入手机号：`+66812345678`
2. 输入密码
3. 登录成功

---

### 场景 2: 信用申请 + 评估

**步骤:**
1. 登录后点击"信用申请"
2. 填写 4 步表单:
   - **步骤 1:** 身份信息
     - 姓名：`Test User`
     - 身份证号：`1234567890123`
     - 出生日期：`1990-01-01`
   - **步骤 2:** 联系信息
     - 邮箱：`test@example.com`
     - 地址：`Bangkok, Thailand`
   - **步骤 3:** 工作信息
     - 公司：`Test Company`
     - 职位：`Developer`
     - 月收入：`30000 THB`
   - **步骤 4:** 确认提交
3. 提交申请
4. 等待信用评估 (约 10 秒)
5. 查看评估结果:
   - 信用评分：`680` (B 级)
   - 授信额度：`15,000 THB`
   - 有效期：`365 天`

---

### 场景 3: 借款申请 + 审批

**步骤:**
1. 点击"借款"按钮
2. 选择借款金额：`10,000 THB`
3. 选择借款期限：`14 天`
4. 查看费用明细:
   - 本金：`10,000 THB`
   - 利息：`1,400 THB` (1%/天 × 14 天)
   - 总还款：`11,400 THB`
5. 确认借款
6. 电子签名
7. 提交申请
8. 查看审批状态:
   - 自动审批通过
   - 放款中...
   - 放款成功

**查看借款详情:**
- 借款 ID
- 放款时间
- 到期日
- 还款计划

---

### 场景 4: 还款流程

**步骤:**
1. 点击"还款"按钮
2. 查看应还金额：`11,400 THB`
3. 选择还款方式:
   - 银行转账
   - PromptPay 扫码
   - 便利店还款
   - TrueMoney 钱包
4. 确认还款
5. 还款成功
6. 查看还款记录

**提前还款演示:**
1. 选择"提前还款"
2. 查看节省利息:
   - 原计划利息：`1,400 THB`
   - 实际利息 (7 天)：`700 THB`
   - **节省：`700 THB`**
3. 确认提前还款
4. 还款成功

---

### 场景 5: 管理后台审核

**访问:** http://localhost:5174

**登录管理后台:**
- 账号：`admin@lann.app`
- 密码：`admin123`

**审核借款申请:**
1. 点击"借款审核"
2. 查看待审核列表
3. 选择一笔申请
4. 查看详情:
   - 用户信息
   - 信用评分
   - 借款金额
   - 借款用途
5. 审核操作:
   - 通过
   - 拒绝
   - 要求补充材料
6. 输入审核意见
7. 提交审核

**产品管理演示:**
1. 点击"产品管理"
2. 编辑产品:
   - 调整利率
   - 修改期限选项
   - 启用/禁用
3. 保存配置

**数据看板演示:**
1. 点击"数据看板"
2. 查看指标:
   - 今日放款金额
   - 逾期率
   - 用户增长
   - 收入统计

---

## 🎬 演示技巧

### 1. 使用测试账号

**预设测试用户:**
| 手机号 | 密码 | 信用等级 | 额度 |
|--------|------|---------|------|
| +66812345678 | test123 | A (750 分) | 30,000 THB |
| +66823456789 | test123 | B (650 分) | 15,000 THB |
| +66834567890 | test123 | C (550 分) | 8,000 THB |

### 2. 快速跳过等待

**OTP 验证码:** 始终输入 `123456`

**审批时间:** 本地环境即时审批

### 3. 展示关键特性

**双语切换:**
1. 进入个人中心
2. 点击语言切换
3. 展示泰语/英语界面

**费用透明:**
- 借款前展示全部费用
- 无隐藏费用
- 提前还款免费

**响应式设计:**
- 调整浏览器窗口大小
- 展示手机/平板/桌面适配

---

## 🔧 常见问题

### Q1: 端口被占用
```bash
# 查看占用端口的进程
lsof -i :3000
lsof -i :5173

# 杀死进程
kill -9 <PID>
```

### Q2: 依赖安装失败
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### Q3: 数据库初始化失败
```bash
# 删除旧数据库
rm -f backend/local/dev.db

# 重新初始化
cd backend
npm run db:init
```

### Q4: 前端构建失败
```bash
# 清理缓存
npm run clean

# 重新构建
npm run build
```

---

## 📊 演示数据说明

### 测试用户数据
```typescript
{
  phone: '+66812345678',
  creditScore: 750,  // A 级
  creditLimit: 30000,
  status: 'active'
}
```

### 测试借款产品
```typescript
{
  name: 'Payday Standard',
  minAmount: 1000,
  maxAmount: 50000,
  interestRate: 0.01,  // 1%/天
  terms: [7, 14, 21, 30]
}
```

### 测试借款记录
```typescript
{
  userId: 'test-user-001',
  amount: 10000,
  termDays: 14,
  interest: 1400,
  totalRepayment: 11400,
  status: 'active'
}
```

---

## 🎯 演示检查清单

### 启动前检查
- [ ] Node.js 版本 >= 18
- [ ] 后端服务启动 (http://localhost:3000)
- [ ] 前端服务启动 (http://localhost:5173)
- [ ] 管理后台启动 (http://localhost:5174)
- [ ] 数据库初始化成功
- [ ] 测试数据已插入

### 演示中检查
- [ ] 用户注册成功
- [ ] 信用评估完成
- [ ] 借款申请通过
- [ ] 还款流程正常
- [ ] 管理后台可访问

### 演示后清理
- [ ] 停止所有服务 (Ctrl+C)
- [ ] 清理测试数据 (可选)
- [ ] 关闭数据库连接

---

## 📹 演示录屏建议

**推荐工具:**
- OBS Studio (免费)
- Loom (在线)
- QuickTime (Mac)

**录制场景:**
1. 用户注册流程 (2 分钟)
2. 信用申请 + 评估 (3 分钟)
3. 借款申请 + 审批 (3 分钟)
4. 还款流程 (2 分钟)
5. 管理后台审核 (3 分钟)

**总时长:** 约 13 分钟

---

## 🚀 一键启动脚本

**创建脚本:** `scripts/demo-start.sh`

```bash
#!/bin/bash

echo "🚀 启动 Lann 项目演示环境..."

# 启动后端
cd backend
npm run dev:local &
BACKEND_PID=$!

# 等待后端启动
sleep 5

# 启动前端
cd ../mobile-app
npm run dev &
FRONTEND_PID=$!

# 启动管理后台
cd ../admin-portal
npm run dev &
ADMIN_PID=$!

echo "✅ 所有服务已启动!"
echo ""
echo "📱 前端 App: http://localhost:5173"
echo "🖥️  管理后台：http://localhost:5174"
echo "🔧 后端 API: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待中断信号
trap "kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID" EXIT
wait
```

**使用:**
```bash
chmod +x scripts/demo-start.sh
./scripts/demo-start.sh
```

---

## ✅ 演示准备完成确认

**完成标志:**
- [ ] 所有服务正常启动
- [ ] 可以访问前端 App
- [ ] 可以访问管理后台
- [ ] 测试账号可以登录
- [ ] 核心流程可以完整演示

---

**准备就绪，开始演示！** 🎉👿
