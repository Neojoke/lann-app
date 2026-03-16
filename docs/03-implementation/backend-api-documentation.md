# Lann 后端 API 文档

## 概述

本文档描述了 Lann 泰国贷款应用后端 API 的完整实现。

## API 端点

### 1. 用户服务 API (`/api/users/*`)

**文件**: `backend/workers/user.api.ts`

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/users/:id` | 获取用户详情 |
| PUT | `/api/users/:id/profile` | 更新用户资料 |
| GET | `/api/users/:id/kyc` | 获取 KYC 状态 |
| POST | `/api/users/:id/kyc` | 提交 KYC 信息 |

#### GET /api/users/:id

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "user_001",
    "email": "test@example.com",
    "phone": "+66812345678",
    "first_name": "Test",
    "last_name": "User",
    "full_name": "Test User",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/users/:id/profile

**请求体**:
```json
{
  "email": "newemail@example.com",
  "phone": "+66898765432",
  "address": "123 New Street"
}
```

#### POST /api/users/:id/kyc

**请求体**:
```json
{
  "id_card_front": "https://storage.example.com/front.jpg",
  "id_card_back": "https://storage.example.com/back.jpg",
  "selfie": "https://storage.example.com/selfie.jpg",
  "additional_documents": ["https://storage.example.com/doc.pdf"]
}
```

---

### 2. 通知服务 API (`/api/notifications/*`)

**文件**: `backend/workers/notification.api.ts`

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/notifications/sms` | 发送短信 |
| POST | `/api/notifications/push` | 推送通知 |
| POST | `/api/notifications/email` | 发送邮件 |
| GET | `/api/notifications/templates` | 获取模板列表 |

#### POST /api/notifications/sms

**请求体**:
```json
{
  "to": "+66812345678",
  "message": "Your verification code is 123456",
  "template_id": "otp_sms",
  "template_data": {"code": "123456"}
}
```

#### POST /api/notifications/push

**请求体**:
```json
{
  "user_id": "user_001",
  "title": "Loan Approved",
  "body": "Your loan application has been approved",
  "data": {"loan_id": "loan_123"}
}
```

#### POST /api/notifications/email

**请求体**:
```json
{
  "to": "user@example.com",
  "cc": "manager@example.com",
  "subject": "Welcome to Lann",
  "body": "Thank you for joining Lann...",
  "html": true
}
```

---

### 3. 文件上传 API (`/api/upload/*`)

**文件**: `backend/workers/upload.api.ts`

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/upload` | 上传文件 |
| GET | `/api/upload/:id` | 获取文件 |
| DELETE | `/api/upload/:id` | 删除文件 |

#### POST /api/upload (Base64)

**请求体**:
```json
{
  "filename": "document.pdf",
  "content_type": "application/pdf",
  "base64": "JVBERi0xLjQK...",
  "uploaded_by": "user_001"
}
```

**支持的文件类型**:
- 图片：JPEG, PNG, GIF, WebP
- 文档：PDF, DOC, DOCX, XLS, XLSX
- 其他：TXT, CSV

**最大文件大小**: 50MB

---

## 服务层

### 1. 数据库连接池 (`db-pool.service.ts`)

**功能**:
- 连接池管理（最大/最小连接数）
- 查询缓存（LRU 策略）
- 慢查询日志
- 连接数监控

**使用示例**:
```typescript
import { dbPool } from './services/db-pool.service';

// 执行查询（带缓存）
const users = await dbPool.query('SELECT * FROM users WHERE id = ?', [userId], {
  cache: true
});

// 获取统计信息
const stats = dbPool.getStats();
```

### 2. 缓存服务 (`cache.service.ts`)

**功能**:
- 多级缓存（内存 + Redis 支持）
- 命名空间管理
- TTL 过期控制
- 缓存穿透/击穿防护

**预定义命名空间**:
- `PRODUCT_CONFIG` - 产品配置
- `USER_SESSION` - 用户会话
- `CREDIT_LIMIT` - 额度查询
- `USER_PROFILE` - 用户资料
- `KYC_STATUS` - KYC 状态

**使用示例**:
```typescript
import { cache, CacheNamespace } from './services/cache.service';

// 设置缓存
await cache.set(CacheNamespace.USER_PROFILE, userId, userProfile, { ttl: 300 });

// 获取缓存
const profile = await cache.get(CacheNamespace.USER_PROFILE, userId);

// 便捷方法
await userSession.set(userId, sessionData);
const limit = await creditLimit.get(userId);
```

### 3. 日志服务 (`logger.service.ts`)

**功能**:
- 结构化日志（JSON 格式）
- 5 级日志级别（TRACE, DEBUG, INFO, WARN, ERROR）
- 日志文件轮转
- 性能追踪

**日志级别**:
```typescript
logger.trace('Trace message');
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

**性能追踪**:
```typescript
await logger.track('Operation name', async () => {
  // 操作代码
});
```

**请求日志**:
```typescript
logger.request('GET', '/api/users', 200, 50, { requestId: '123' });
```

---

## 错误处理

所有 API 端点返回统一的错误格式：

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "message_en": "User not found",
    "message_th": "ไม่พบผู้ใช้"
  }
}
```

### 常见错误码

| 错误码 | HTTP 状态码 | 描述 |
|--------|------------|------|
| USER_NOT_FOUND | 404 | 用户不存在 |
| INVALID_INPUT | 400 | 输入无效 |
| KYC_ALREADY_SUBMITTED | 400 | KYC 已提交 |
| FILE_NOT_FOUND | 404 | 文件不存在 |
| FILE_TOO_LARGE | 400 | 文件过大 |
| UNSUPPORTED_TYPE | 400 | 不支持的文件类型 |
| TEMPLATE_NOT_FOUND | 404 | 模板不存在 |
| RATE_LIMIT_EXCEEDED | 429 | 超过速率限制 |
| INTERNAL_ERROR | 500 | 内部服务器错误 |

---

## 多语言支持

所有 API 端点支持英语 (EN) 和泰语 (TH)：

- 通过 `Accept-Language` 请求头检测语言
- 错误消息返回双语
- 响应数据包含双语标签

**示例**:
```bash
curl -H "Accept-Language: th" http://localhost:3000/api/users/123
```

---

## 性能指标

- **响应时间**: < 200ms（所有端点）
- **缓存命中率**: > 80%（配置缓存）
- **连接池**: 最大 10 连接，最小 2 连接
- **日志轮转**: 10MB/文件，保留 7 个文件

---

## 测试

**测试文件**:
- `tests/user.test.ts` - 用户服务测试
- `tests/notification.test.ts` - 通知服务测试
- `tests/upload.test.ts` - 上传服务测试
- `tests/services.test.ts` - 服务层测试

**运行测试**:
```bash
npm test
npm run test:coverage
```

**覆盖率要求**: ≥ 80%

---

## 数据库表结构

### users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  date_of_birth TEXT,
  nationality TEXT,
  id_card_number TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT,
  avatar_url TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

### user_kyc
```sql
CREATE TABLE user_kyc (
  user_id TEXT PRIMARY KEY,
  status TEXT,
  submitted_at TEXT,
  reviewed_at TEXT,
  reviewer_id TEXT,
  rejection_reason TEXT,
  id_card_front_url TEXT,
  id_card_back_url TEXT,
  selfie_url TEXT,
  additional_documents TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

### notifications
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  type TEXT,
  recipient TEXT,
  message TEXT,
  status TEXT,
  error TEXT,
  sent_at TEXT,
  created_at TEXT
);
```

### notification_templates
```sql
CREATE TABLE notification_templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  subject TEXT,
  content_en TEXT,
  content_th TEXT,
  variables TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

### uploaded_files
```sql
CREATE TABLE uploaded_files (
  id TEXT PRIMARY KEY,
  filename TEXT,
  original_name TEXT,
  content_type TEXT,
  size INTEGER,
  storage_path TEXT,
  url TEXT,
  uploaded_by TEXT,
  created_at TEXT,
  expires_at TEXT
);
```

---

## 安全考虑

1. **输入验证**: 所有输入都经过严格验证
2. **速率限制**: 通知 API 实施速率限制
3. **文件类型白名单**: 仅允许特定文件类型上传
4. **文件大小限制**: 最大 50MB
5. **错误处理**: 不泄露敏感信息

---

## 部署

### 本地开发
```bash
npm run dev:local
```

### 生产部署
```bash
npm run deploy
```

### 环境变量
```bash
LOG_LEVEL=INFO
NODE_ENV=production
```

---

**文档版本**: 1.0  
**最后更新**: 2026-03-17
