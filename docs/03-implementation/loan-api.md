# Lann 借款 API 使用指南

**版本:** v1.0  
**创建日期:** 2026-03-16  
**状态:** ✅ 已完成

> 📚 **相关文档:** [文档索引](../README.md) | [业务模型](../01-requirements/business-model.md) | [Schema 规范](../02-design/schema-spec.md) | [还款 API](./repayment-api.md)

---

## 📋 目录

1. [API 概览](#api-概览)
2. [认证](#认证)
3. [产品列表](#产品列表)
4. [借款申请](#借款申请)
5. [确认借款](#确认借款)
6. [查询状态](#查询状态)
7. [借款详情](#借款详情)
8. [取消申请](#取消申请)
9. [错误处理](#错误处理)

---

## API 概览

### 基础信息

- **Base URL:** `https://api.lann.co.th` (生产环境)
- **Base URL:** `http://localhost:8787` (本地开发)
- **内容类型:** `application/json`
- **语言支持:** 英语 (en) / 泰语 (th)

### 语言设置

通过 HTTP 请求头设置语言：

```http
Accept-Language: th-TH  # 泰语
Accept-Language: en-US  # 英语
```

---

## 认证

### 用户认证

所有借款相关 API 都需要用户认证。在请求头中传递用户 ID：

```http
X-User-ID: ou_f4dfe1f198e16699aa72d7942dd939ca
```

> ⚠️ **注意:** 生产环境应使用 JWT 或其他安全认证方式。

---

## 产品列表

### GET /api/loan/products

获取所有可用的借款产品。

**请求:**

```http
GET /api/loan/products
Accept-Language: th-TH
```

**响应:**

```json
{
  "success": true,
  "data": [
    {
      "id": "payday-standard",
      "name": "เงินด่วนรายวัน",
      "type": "payday",
      "minAmount": 1000,
      "maxAmount": 50000,
      "terms": [
        {
          "days": 7,
          "label": "7 วัน",
          "minAmount": 1000,
          "maxAmount": 10000,
          "repaymentType": "bullet"
        },
        {
          "days": 14,
          "label": "14 วัน",
          "minAmount": 1000,
          "maxAmount": 20000,
          "repaymentType": "bullet"
        },
        {
          "days": 30,
          "label": "30 วัน",
          "minAmount": 5000,
          "maxAmount": 50000,
          "repaymentType": "bullet"
        }
      ],
      "interestRate": {
        "type": "daily",
        "rate": 1,
        "calculationMethod": "flat"
      },
      "fees": [
        {
          "type": "late",
          "percentage": 0.005,
          "minAmount": 50
        }
      ],
      "repaymentMethods": ["bank_transfer", "convenience_store", "promptpay", "truemoney"],
      "targetSegment": "regular"
    },
    {
      "id": "installment-standard",
      "name": "เงินผ่อนชำระ",
      "type": "installment",
      "minAmount": 5000,
      "maxAmount": 100000,
      "terms": [
        {
          "days": 90,
          "label": "3 เดือน",
          "minAmount": 5000,
          "maxAmount": 30000,
          "repaymentType": "installment"
        },
        {
          "days": 180,
          "label": "6 เดือน",
          "minAmount": 10000,
          "maxAmount": 60000,
          "repaymentType": "installment"
        },
        {
          "days": 365,
          "label": "12 เดือน",
          "minAmount": 20000,
          "maxAmount": 100000,
          "repaymentType": "installment"
        }
      ],
      "interestRate": {
        "type": "monthly",
        "rate": 2,
        "calculationMethod": "reducing"
      },
      "fees": [
        {
          "type": "processing",
          "percentage": 0.02,
          "maxAmount": 1000
        },
        {
          "type": "late",
          "percentage": 0.005
        },
        {
          "type": "prepayment",
          "percentage": 0.01
        }
      ],
      "repaymentMethods": ["bank_transfer", "promptpay"],
      "targetSegment": "regular"
    }
  ]
}
```

---

## 借款申请

### POST /api/loan/apply

创建新的借款申请。

**请求:**

```http
POST /api/loan/apply
Content-Type: application/json
Accept-Language: th-TH
X-User-ID: ou_f4dfe1f198e16699aa72d7942dd939ca

{
  "productId": "payday-standard",
  "amount": 10000,
  "termDays": 14,
  "purpose": "ฉุกเฉิน"
}
```

**响应 (成功):**

```json
{
  "success": true,
  "data": {
    "applicationId": "app_m8x9y2a3b4c5",
    "status": "pending",
    "loanDetails": {
      "principal": 10000,
      "interest": 1400,
      "totalRepayment": 11400,
      "dailyPayment": 814.29
    },
    "nextStep": "Wait for approval or proceed to confirm if auto-approved"
  }
}
```

**响应 (失败 - 额度不足):**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDIT",
    "message": "วงเงินเครดิตไม่เพียงพอ",
    "message_th": "วงเงินเครดิตไม่เพียงพอ"
  }
}
```

**响应 (失败 - 金额超出范围):**

```json
{
  "success": false,
  "error": {
    "code": "AMOUNT_OUT_OF_RANGE",
    "message": "จำนวนเงินอยู่นอกช่วงที่กำหนด",
    "message_th": "จำนวนเงินอยู่นอกช่วงที่กำหนด"
  }
}
```

---

## 确认借款

### POST /api/loan/confirm

确认借款并进行电子签约。

**请求:**

```http
POST /api/loan/confirm
Content-Type: application/json
Accept-Language: th-TH
X-User-ID: ou_f4dfe1f198e16699aa72d7942dd939ca

{
  "applicationId": "app_m8x9y2a3b4c5",
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**响应 (成功):**

```json
{
  "success": true,
  "data": {
    "loanId": "loan_n9z0a1b2c3d4",
    "status": "active",
    "contractUrl": "https://storage.lann.co.th/contracts/ou_xxx/contract_m8x9y2a3b4c5.md",
    "principal": 10000,
    "totalRepayment": 11400,
    "dueDate": "2026-03-30T00:00:00.000Z",
    "message": "การกู้เงินสำเร็จ! เงินจะถูกโอนภายใน 1 วันทำการ"
  }
}
```

**响应 (失败 - 签名无效):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SIGNATURE",
    "message": "ลายเซ็นไม่ถูกต้อง",
    "message_th": "ลายเซ็นไม่ถูกต้อง"
  }
}
```

---

## 查询状态

### GET /api/loan/:id/status

查询借款状态。

**请求:**

```http
GET /api/loan/loan_n9z0a1b2c3d4/status
Accept-Language: th-TH
X-User-ID: ou_f4dfe1f198e16699aa72d7942dd939ca
```

**响应:**

```json
{
  "success": true,
  "data": {
    "loanId": "loan_n9z0a1b2c3d4",
    "status": "active",
    "statusText": "อยู่ระหว่างชำระ",
    "remainingAmount": 11400,
    "dueDate": "2026-03-30T00:00:00.000Z",
    "isOverdue": false,
    "overdueDays": 0
  }
}
```

### 状态说明

| 状态 | 英语 | 泰语 | 说明 |
|------|------|------|------|
| `pending` | Pending Approval | รอการอนุมัติ | 待审批 |
| `approved` | Approved | อนุมัติแล้ว | 已批准 |
| `rejected` | Rejected | ถูกปฏิเสธ | 已拒绝 |
| `signing` | Signing Contract | กำลังลงนามสัญญา | 签约中 |
| `disbursing` | Disbursing | กำลังโอนเงิน | 放款中 |
| `active` | Active (Repaying) | อยู่ระหว่างชำระ | 还款中 |
| `overdue` | Overdue | ค้างชำระ | 逾期 |
| `completed` | Completed | ชำระเสร็จสิ้น | 已结清 |
| `cancelled` | Cancelled | ยกเลิกแล้ว | 已取消 |

---

## 借款详情

### GET /api/loan/:id

获取借款完整详情。

**请求:**

```http
GET /api/loan/loan_n9z0a1b2c3d4
Accept-Language: en-US
X-User-ID: ou_f4dfe1f198e16699aa72d7942dd939ca
```

**响应:**

```json
{
  "success": true,
  "data": {
    "loanId": "loan_n9z0a1b2c3d4",
    "applicationId": "app_m8x9y2a3b4c5",
    "product": {
      "id": "payday-standard",
      "name": "Payday Loan",
      "type": "payday"
    },
    "principal": 10000,
    "interestRate": 1,
    "termDays": 14,
    "totalInterest": 1400,
    "totalRepayment": 11400,
    "paidAmount": 0,
    "remainingAmount": 11400,
    "status": "active",
    "statusText": "Active (Repaying)",
    "dueDate": "2026-03-30T00:00:00.000Z",
    "disbursedAt": "2026-03-16T10:30:00.000Z",
    "isOverdue": false,
    "overdueDays": 0,
    "penaltyAmount": 0,
    "contractUrl": "https://storage.lann.co.th/contracts/ou_xxx/contract_m8x9y2a3b4c5.md",
    "signedAt": "2026-03-16T10:25:00.000Z",
    "createdAt": "2026-03-16T10:20:00.000Z"
  }
}
```

---

## 取消申请

### POST /api/loan/cancel

取消待审批的借款申请。

**请求:**

```http
POST /api/loan/cancel
Content-Type: application/json
Accept-Language: en-US
X-User-ID: ou_f4dfe1f198e16699aa72d7942dd939ca

{
  "applicationId": "app_m8x9y2a3b4c5"
}
```

**响应 (成功):**

```json
{
  "success": true,
  "data": {
    "applicationId": "app_m8x9y2a3b4c5",
    "status": "cancelled",
    "message": "Application cancelled successfully"
  }
}
```

**响应 (失败 - 不允许取消):**

```json
{
  "success": false,
  "error": {
    "code": "CANCEL_NOT_ALLOWED",
    "message": "Cancellation is not allowed",
    "message_th": "ไม่อนุญาตให้ยกเลิก"
  }
}
```

---

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message in English",
    "message_th": "ข้อความข้อผิดพลาดภาษาไทย"
  }
}
```

### 常见错误代码

| 错误代码 | 英语消息 | 泰语消息 | HTTP 状态码 |
|---------|---------|---------|-----------|
| `UNAUTHORIZED` | User ID required | ต้องการรหัสผู้ใช้ | 401 |
| `VALIDATION_ERROR` | Missing required fields | ขาดฟิลด์ที่จำเป็น | 400 |
| `PRODUCT_NOT_FOUND` | Product not found | ไม่พบผลิตภัณฑ์ | 404 |
| `INSUFFICIENT_CREDIT` | Insufficient credit limit | วงเงินเครดิตไม่เพียงพอ | 400 |
| `AMOUNT_OUT_OF_RANGE` | Amount is out of allowed range | จำนวนเงินอยู่นอกช่วงที่กำหนด | 400 |
| `INVALID_TERM` | Invalid loan term | ระยะเวลากู้ไม่ถูกต้อง | 400 |
| `APPLICATION_NOT_FOUND` | Application not found | ไม่พบคำขอสินเชื่อ | 404 |
| `LOAN_NOT_FOUND` | Loan not found | ไม่พบเงินกู้ | 404 |
| `INVALID_STATUS` | Invalid status for this operation | สถานะไม่ถูกต้องสำหรับการดำเนินการนี้ | 400 |
| `INVALID_SIGNATURE` | Invalid signature | ลายเซ็นไม่ถูกต้อง | 400 |
| `CONTRACT_NOT_FOUND` | Contract not found | ไม่พบสัญญา | 404 |
| `CANCEL_NOT_ALLOWED` | Cancellation is not allowed | ไม่อนุญาตให้ยกเลิก | 400 |
| `INTERNAL_ERROR` | Internal server error | ข้อผิดพลาดของเซิร์ฟเวอร์ | 500 |

---

## 示例代码

### TypeScript/JavaScript

```typescript
// 借款申请示例
async function applyForLoan(productId: string, amount: number, termDays: number) {
  const response = await fetch('http://localhost:8787/api/loan/apply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'th-TH',
      'X-User-ID': 'ou_f4dfe1f198e16699aa72d7942dd939ca',
    },
    body: JSON.stringify({
      productId,
      amount,
      termDays,
    }),
  });

  const result = await response.json();

  if (result.success) {
    console.log('Application ID:', result.data.applicationId);
    console.log('Total Repayment:', result.data.loanDetails.totalRepayment);
  } else {
    console.error('Error:', result.error.message);
  }

  return result;
}

// 使用示例
applyForLoan('payday-standard', 10000, 14);
```

### cURL

```bash
# 获取产品列表
curl -X GET http://localhost:8787/api/loan/products \
  -H "Accept-Language: th-TH"

# 创建借款申请
curl -X POST http://localhost:8787/api/loan/apply \
  -H "Content-Type: application/json" \
  -H "Accept-Language: th-TH" \
  -H "X-User-ID: ou_f4dfe1f198e16699aa72d7942dd939ca" \
  -d '{
    "productId": "payday-standard",
    "amount": 10000,
    "termDays": 14
  }'

# 查询借款状态
curl -X GET http://localhost:8787/api/loan/loan_n9z0a1b2c3d4/status \
  -H "Accept-Language: th-TH" \
  -H "X-User-ID: ou_f4dfe1f198e16699aa72d7942dd939ca"
```

---

## 利息计算说明

### 固定利率 (Flat Rate)

```
利息 = 本金 × 日利率 × 借款天数
```

**示例:**
- 本金：10,000 THB
- 日利率：1% (0.01)
- 借款天数：14 天
- 利息：10,000 × 0.01 × 14 = 1,400 THB
- 总还款：10,000 + 1,400 = 11,400 THB

### 递减利率 (Reducing Rate)

```
利息 = 本金 × 月利率 × 月数 × 0.5
```

**示例:**
- 本金：30,000 THB
- 月利率：2% (0.02)
- 借款月数：3 个月
- 利息：30,000 × 0.02 × 3 × 0.5 = 900 THB
- 总还款：30,000 + 900 = 30,900 THB

### 罚息计算

```
罚息 = 逾期本金 × 罚息率 × 逾期天数
```

**示例:**
- 逾期本金：10,000 THB
- 罚息率：0.5%/天 (0.005)
- 逾期天数：5 天
- 罚息：10,000 × 0.005 × 5 = 250 THB

---

## 测试

运行单元测试：

```bash
cd backend
bun test tests/loan.test.ts
```

**测试覆盖:**
- ✅ 利息计算 (固定利率、递减利率、年利率转换)
- ✅ 费用计算 (百分比、固定金额、最低/最高限制)
- ✅ 产品验证 (金额范围、期限验证)
- ✅ 借款详情计算
- ✅ 罚息计算
- ✅ 信用检查
- ✅ 审批流程 (自动审批、人工审批)
- ✅ 多语言支持

---

**最后更新:** 2026-03-16  
**负责人:** 小满 (Orchestrator)  
**状态:** ✅ 已完成
