# Lann 项目 - 下一步行动计划

**更新日期:** 2026-03-16 23:35  
**当前进度:** 90%

---

## 📋 待完成任务清单

### P0 - 紧急重要 (本周内完成)

| 任务 | 负责人 | 预计时间 | 状态 |
|------|--------|---------|------|
| **后端 API - 用户服务** | oh-my-opencode (deep) | 1 小时 | ⏳ 待开始 |
| **后端 API - 信用服务** | oh-my-opencode (deep) | 1 小时 | ⏳ 待开始 |
| **数据库表迁移** | oh-my-opencode (deep) | 30 分钟 | ⏳ 待开始 |
| **Android APK 构建测试** | oh-my-opencode (devops) | 1 小时 | ⏳ 待开始 |
| **E2E 测试用例编写** | oh-my-opencode (tester) | 2 小时 | ⏳ 待开始 |

### P1 - 重要 (下周内完成)

| 任务 | 负责人 | 预计时间 | 状态 |
|------|--------|---------|------|
| **KYC 服务集成** | oh-my-opencode (deep) | 2 小时 | ⏳ 待开始 |
| **短信服务集成** | oh-my-opencode (deep) | 1 小时 | ⏳ 待开始 |
| **后台管理面板** | oh-my-opencode (visual-engineering) | 4 小时 | ⏳ 待开始 |
| **数据看板** | oh-my-opencode (visual-engineering) | 2 小时 | ⏳ 待开始 |

### P2 - 可延后 (上线前完成)

| 任务 | 负责人 | 预计时间 | 状态 |
|------|--------|---------|------|
| **合规审计** | 外部律师 | 1 周 | ⏳ 待确认 |
| **Google Play 上架** | oh-my-opencode (devops) | 2 小时 | ⏳ 待开始 |
| **性能优化** | oh-my-opencode (deep) | 2 小时 | ⏳ 待开始 |
| **安全加固** | oh-my-opencode (deep) | 2 小时 | ⏳ 待开始 |

---

## 🎯 立即执行的任务

### 1. 后端 API 开发 (30 分钟)

**任务:** 完成用户服务和信用服务的后端 API

**文件:**
```
backend/workers/
├── user.api.ts      # 用户资料 API
├── credit.api.ts    # 信用评估 API
└── index.sqlite.ts  # 数据库迁移
```

**API 端点:**
```typescript
// 用户服务
POST   /api/user/profile          # 提交用户资料
GET    /api/user/profile          # 获取用户资料
PUT    /api/user/profile          # 更新用户资料
GET    /api/user/profile/completeness  # 获取资料完整度

// 信用服务
POST   /api/credit/apply          # 申请信用额度
GET    /api/credit/status         # 查询审核状态
GET    /api/credit/limit          # 查询可用额度
```

---

### 2. 数据库表迁移 (30 分钟)

**任务:** 创建用户和信用相关的数据库表

**SQL 迁移:**
```sql
-- 用户资料表
CREATE TABLE user_profiles (
  user_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  national_id TEXT NOT NULL UNIQUE,
  date_of_birth TEXT NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  monthly_income INTEGER NOT NULL,
  work_address TEXT NOT NULL,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_relationship TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  prompt_pay TEXT,
  profile_complete INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 信用申请表
CREATE TABLE credit_applications (
  application_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  credit_score INTEGER,
  approved_limit INTEGER,
  interest_rate REAL,
  reject_reason TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
);

-- 用户额度表
CREATE TABLE user_credit_limits (
  user_id TEXT PRIMARY KEY,
  total_limit INTEGER NOT NULL DEFAULT 0,
  available_limit INTEGER NOT NULL DEFAULT 0,
  used_limit INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
);
```

---

### 3. Android APK 构建 (1 小时)

**任务:** 构建 Android APK 并测试安装

**步骤:**
```bash
cd mobile-app

# 1. 构建 Web 应用
npm run build

# 2. 同步到 Android
npx cap sync android

# 3. 构建 Debug APK
cd android
./gradlew assembleDebug

# 4. 安装测试
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 5. 验证启动
adb shell am start -n com.lann.app/.MainActivity
```

---

### 4. E2E 测试用例 (2 小时)

**任务:** 创建 Maestro 测试用例

**测试文件:**
```
.maestro/flows/
├── login.yaml           # 登录测试
├── register.yaml        # 注册测试
├── profile.yaml         # 资料填写测试
├── credit-apply.yaml    # 信用申请测试
├── borrow.yaml          # 借款测试
└── repay.yaml           # 还款测试
```

**运行测试:**
```bash
# 本地测试
maestro test .maestro/flows/

# GitHub Actions (自动)
# Push 到 main/develop 分支时自动运行
```

---

## 📅 时间线

```
今天 (2026-03-16):
├─ 23:30-00:30  后端 API 开发
├─ 00:30-01:00  数据库迁移
└─ 01:00-02:00  Android APK 构建

明天 (2026-03-17):
├─ 上午  E2E 测试用例编写
├─ 下午 KYC/短信服务集成
└─ 晚上 后台管理面板

本周内 (2026-03-18-20):
├─ 合规审计 (外部律师)
├─ 性能优化
└─ 安全加固

下周 (2026-03-23-27):
├─ Google Play 上架准备
├─ 灰度发布
└─ 正式上线
```

---

## 🚧 阻塞问题

### 需要用户决策

| 问题 | 选项 | 建议 | 状态 |
|------|------|------|------|
| **持牌合作伙伴** | A. 某泰国民间金融公司<br>B. 某银行子公司<br>C. 自主申请牌照 | A (快速上线) | ⏳ 待决策 |
| **KYC 服务商** | A. Sumsub<br>B. Jumio<br>C. 本地服务商 | A (性价比高) | ⏳ 待决策 |
| **短信服务商** | A. Twilio<br>B. 本地泰国服务商<br>C. 阿里云短信 | B (成本低) | ⏳ 待决策 |

### 需要外部资源

| 资源 | 用途 | 预计成本 | 状态 |
|------|------|---------|------|
| **金融律师** | 合规审查 | $5,000-10,000 | ⏳ 待聘请 |
| **Google Play 账号** | App 上架 | $25 (一次性) | ⏳ 待注册 |
| **Apple Developer** | iOS 上架 (可选) | $99/年 | ⏳ 可选 |
| **SSL 证书** | HTTPS | 免费 (Let's Encrypt) | ✅ Cloudflare 提供 |

---

## 📊 里程碑检查

### MVP 上线标准

- [ ] 核心功能完成 (借款/还款/信用申请)
- [ ] E2E 测试通过率 ≥ 80%
- [ ] 隐私政策和服务条款发布
- [ ] Android APK 可安装运行
- [ ] 后端 API 响应时间 < 200ms
- [ ] 无严重安全漏洞

### Google Play 上架标准

- [ ] 合规文档齐全
- [ ] 隐私政策链接
- [ ] 服务条款链接
- [ ] 联系方式完整
- [ ] 应用截图和宣传图
- [ ] 通过 Google 审核

---

## 🔔 提醒事项

### 每日检查
- [ ] 检查 Subagent 任务完成情况
- [ ] 更新项目进度日志
- [ ] 检查 Git 提交记录

### 每周检查
- [ ] 审查合规文档
- [ ] 检查测试覆盖率
- [ ] 评估项目风险

### 每月检查
- [ ] 安全审计
- [ ] 性能评估
- [ ] 用户反馈收集

---

**下一步行动:** 等待用户确认是否立即执行 P0 任务，或优先处理特定任务。

**负责人:** 小满 (Orchestrator)  
**最后更新:** 2026-03-16 23:35
