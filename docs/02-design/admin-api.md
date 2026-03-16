# Lann 后台管理系统 API 设计文档

## 1. 概述

### 1.1 文档目的
本文档定义 Lann 后台管理系统的 API 接口规范，为前后端开发提供统一的接口标准。

### 1.2 设计规范
- **RESTful 风格**：资源导向，使用 HTTP 方法表达操作
- **JSON 格式**：请求和响应均使用 JSON 格式
- **版本控制**：API 路径包含版本号 `/api/v1/admin/`
- **统一响应**：成功和失败响应格式统一
- **认证授权**：所有接口需要 JWT Token 认证

### 1.3 基础信息
- **Base URL**: `/api/v1/admin`
- **认证方式**: Bearer Token (JWT)
- **请求格式**: `application/json`
- **响应格式**: `application/json`

### 1.4 统一响应格式

**成功响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": 1710604800000
}
```

**失败响应**：
```json
{
  "code": 400,
  "message": "参数错误",
  "errors": [
    { "field": "phone", "message": "手机号格式不正确" }
  ],
  "timestamp": 1710604800000
}
```

**分页响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [ ... ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "timestamp": 1710604800000
}
```

---

## 2. 用户管理 API

### 2.1 用户列表

**接口**: `GET /users`

**描述**: 获取用户列表，支持筛选和分页

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码，默认 1 |
| pageSize | Integer | 否 | 每页数量，默认 20 |
| kycStatus | String | 否 | KYC 状态：pending/approved/rejected |
| accountStatus | String | 否 | 账户状态：active/frozen/closed |
| phone | String | 否 | 手机号模糊搜索 |
| name | String | 否 | 姓名模糊搜索 |
| registerStartTime | Long | 否 | 注册时间起始（毫秒时间戳） |
| registerEndTime | Long | 否 | 注册时间截止（毫秒时间戳） |
| creditScoreMin | Integer | 否 | 信用评分最小值 |
| creditScoreMax | Integer | 否 | 信用评分最大值 |

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "userId": "usr_123456",
        "name": "Somchai Prasert",
        "phone": "0812345678",
        "idCard": "1xxxxxxxxxxxxx",
        "registerTime": 1710604800000,
        "kycStatus": "approved",
        "creditScore": 720,
        "creditLimit": 30000,
        "accountStatus": "active",
        "lastLoginTime": 1710691200000
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

### 2.2 用户详情

**接口**: `GET /users/:userId`

**描述**: 获取用户详细信息

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户 ID |

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": "usr_123456",
    "name": "Somchai Prasert",
    "phone": "0812345678",
    "email": "somchai@example.com",
    "idCard": "1xxxxxxxxxxxxx",
    "birthDate": "1990-05-15",
    "address": "123 Sukhumvit Road, Bangkok",
    "employer": "ABC Company",
    "position": "Manager",
    "monthlyIncome": 50000,
    "kycStatus": "approved",
    "kycInfo": {
      "idCardFront": "https://storage/xxx_front.jpg",
      "idCardBack": "https://storage/xxx_back.jpg",
      "facePhoto": "https://storage/xxx_face.jpg",
      "auditTime": 1710604800000,
      "auditor": "adm_001",
      "auditComment": "资料清晰，审核通过"
    },
    "creditScore": 720,
    "creditLimit": 30000,
    "usedLimit": 10000,
    "accountStatus": "active",
    "registerTime": 1710604800000,
    "lastLoginTime": 1710691200000,
    "loanStats": {
      "totalLoans": 5,
      "activeLoans": 1,
      "totalAmount": 150000,
      "overdueCount": 0
    }
  }
}
```

---

### 2.3 KYC 审核

**接口**: `POST /users/:userId/kyc`

**描述**: 提交 KYC 审核结果

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户 ID |

**请求体**：
```json
{
  "action": "approve",
  "comment": "资料清晰，信息真实，审核通过",
  "rejectReason": ""
}
```

**请求参数说明**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | String | 是 | 审核结果：approve/reject/return |
| comment | String | 是 | 审核意见 |
| rejectReason | String | 否 | 拒绝原因（action=reject 时必填） |

**响应数据**：
```json
{
  "code": 200,
  "message": "审核成功",
  "data": {
    "userId": "usr_123456",
    "kycStatus": "approved",
    "auditTime": 1710691200000,
    "auditor": "adm_001"
  }
}
```

---

### 2.4 用户状态更新

**接口**: `PATCH /users/:userId/status`

**描述**: 更新用户账户状态

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户 ID |

**请求体**：
```json
{
  "accountStatus": "frozen",
  "reason": "逾期超过 30 天",
  "freezeDuration": 30
}
```

**请求参数说明**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| accountStatus | String | 是 | 账户状态：active/frozen/closed |
| reason | String | 是 | 状态变更原因 |
| freezeDuration | Integer | 否 | 冻结天数（仅冻结时有效） |

**响应数据**：
```json
{
  "code": 200,
  "message": "状态更新成功",
  "data": {
    "userId": "usr_123456",
    "accountStatus": "frozen",
    "updateTime": 1710691200000,
    "operator": "adm_001"
  }
}
```

---

### 2.5 额度调整

**接口**: `PATCH /users/:userId/credit-limit`

**描述**: 调整用户授信额度

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户 ID |

**请求体**：
```json
{
  "newLimit": 50000,
  "reason": "良好还款记录，连续 3 期按时还款",
  "adjustType": "increase"
}
```

**请求参数说明**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| newLimit | Number | 是 | 新额度（泰铢） |
| reason | String | 是 | 调整原因 |
| adjustType | String | 是 | 调整类型：increase/decrease |

**响应数据**：
```json
{
  "code": 200,
  "message": "额度调整成功",
  "data": {
    "userId": "usr_123456",
    "oldLimit": 30000,
    "newLimit": 50000,
    "adjustTime": 1710691200000,
    "operator": "adm_001"
  }
}
```

---

### 2.6 加入黑名单

**接口**: `POST /users/:userId/blacklist`

**描述**: 将用户加入黑名单

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户 ID |

**请求体**：
```json
{
  "type": "serious_overdue",
  "reason": "逾期超过 90 天，多次催收无果",
  "duration": "permanent"
}
```

**请求参数说明**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 是 | 黑名单类型：serious_overdue/fraud/malicious/high_risk |
| reason | String | 是 | 加入原因 |
| duration | String | 是 | 期限：permanent/1y/3y/5y |

**响应数据**：
```json
{
  "code": 200,
  "message": "已加入黑名单",
  "data": {
    "userId": "usr_123456",
    "blacklistType": "serious_overdue",
    "duration": "permanent",
    "addTime": 1710691200000,
    "operator": "adm_001"
  }
}
```

---

### 2.7 移出黑名单

**接口**: `DELETE /users/:userId/blacklist`

**描述**: 将用户从黑名单移出

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户 ID |

**请求体**：
```json
{
  "reason": "用户已还清欠款，申请移出黑名单",
  "approver": "adm_002"
}
```

**响应数据**：
```json
{
  "code": 200,
  "message": "已移出黑名单",
  "data": {
    "userId": "usr_123456",
    "removeTime": 1710691200000,
    "operator": "adm_001"
  }
}
```

---

## 3. 信用管理 API

### 3.1 信用评分复审

**接口**: `POST /credit/:userId/review`

**描述**: 提交信用评分复审

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户 ID |

**请求体**：
```json
{
  "reviewType": "appeal",
  "currentScore": 650,
  "expectedScore": 700,
  "reason": "用户收入证明更新，月收入从 30000 提升至 50000",
  "attachments": ["file_token_1", "file_token_2"]
}
```

**响应数据**：
```json
{
  "code": 200,
  "message": "复审完成",
  "data": {
    "userId": "usr_123456",
    "oldScore": 650,
    "newScore": 700,
    "reviewTime": 1710691200000,
    "reviewer": "adm_001"
  }
}
```

---

### 3.2 信用历史查询

**接口**: `GET /credit/:userId/history`

**描述**: 查询用户信用评分历史

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户 ID |

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startTime | Long | 否 | 起始时间 |
| endTime | Long | 否 | 截止时间 |
| page | Integer | 否 | 页码 |
| pageSize | Integer | 否 | 每页数量 |

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "recordId": "scr_001",
        "score": 720,
        "changeReason": "按时还款",
        "changeType": "increase",
        "changeValue": 20,
        "recordTime": 1710691200000
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

## 4. 借款管理 API

### 4.1 借款列表

**接口**: `GET /loans`

**描述**: 获取借款订单列表

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码 |
| pageSize | Integer | 否 | 每页数量 |
| status | String | 否 | 状态：pending/approved/rejected/repaid/overdue |
| userId | String | 否 | 用户 ID |
| startTime | Long | 否 | 申请时间起始 |
| endTime | Long | 否 | 申请时间截止 |
| amountMin | Number | 否 | 金额最小值 |
| amountMax | Number | 否 | 金额最大值 |

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "loanId": "ln_123456",
        "userId": "usr_123456",
        "userName": "Somchai Prasert",
        "amount": 10000,
        "term": 30,
        "interest": 500,
        "fee": 200,
        "totalRepayment": 10700,
        "status": "pending",
        "applyTime": 1710691200000,
        "reviewDeadline": 1710698400000
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

### 4.2 借款详情

**接口**: `GET /loans/:loanId`

**描述**: 获取借款订单详细信息

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| loanId | String | 借款 ID |

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "loanId": "ln_123456",
    "userId": "usr_123456",
    "userName": "Somchai Prasert",
    "phone": "0812345678",
    "productId": "prd_001",
    "productName": "现金贷",
    "amount": 10000,
    "term": 30,
    "interestRate": 0.05,
    "interest": 500,
    "fee": 200,
    "totalRepayment": 10700,
    "repaymentPlan": [
      {
        "period": 1,
        "dueDate": 1713283200000,
        "principal": 10000,
        "interest": 500,
        "total": 10500,
        "status": "pending"
      }
    ],
    "status": "pending",
    "applyTime": 1710691200000,
    "reviewTime": null,
    "contractUrl": null,
    "disburseTime": null,
    "bankAccount": {
      "bankName": "Bangkok Bank",
      "accountNumber": "xxx-x-xxxxx-x",
      "accountName": "Somchai Prasert"
    }
  }
}
```

---

### 4.3 借款审批

**接口**: `POST /loans/:loanId/approve`

**描述**: 审批借款申请

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| loanId | String | 借款 ID |

**请求体**：
```json
{
  "action": "approve",
  "comment": "用户信用良好，收入稳定，批准放款",
  "rejectReason": ""
}
```

**请求参数说明**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | String | 是 | 审批结果：approve/reject |
| comment | String | 是 | 审批意见 |
| rejectReason | String | 否 | 拒绝原因（action=reject 时必填） |

**响应数据**：
```json
{
  "code": 200,
  "message": "审批成功",
  "data": {
    "loanId": "ln_123456",
    "status": "approved",
    "reviewTime": 1710691200000,
    "reviewer": "adm_001",
    "nextStep": "contract_signing"
  }
}
```

---

### 4.4 合同管理

**接口**: `GET /loans/:loanId/contract`

**描述**: 获取借款合同信息

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| loanId | String | 借款 ID |

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "loanId": "ln_123456",
    "contractId": "ctr_123456",
    "contractUrl": "https://storage/contracts/ctr_123456.pdf",
    "contractStatus": "signed",
    "generateTime": 1710691200000,
    "signTime": 1710694800000,
    "archiveTime": 1710698400000
  }
}
```

---

### 4.5 放款确认

**接口**: `POST /loans/:loanId/disburse`

**描述**: 确认放款

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| loanId | String | 借款 ID |

**请求体**：
```json
{
  "disburseChannel": "bank_transfer",
  "transactionId": "TXN123456789",
  "disburseAmount": 10000,
  "remark": "放款至曼谷银行账户"
}
```

**响应数据**：
```json
{
  "code": 200,
  "message": "放款成功",
  "data": {
    "loanId": "ln_123456",
    "status": "disbursed",
    "disburseTime": 1710698400000,
    "operator": "adm_001",
    "transactionId": "TXN123456789"
  }
}
```

---

## 5. 还款管理 API

### 5.1 还款计划调整

**接口**: `POST /repayments/:repaymentId/adjust`

**描述**: 调整还款计划

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| repaymentId | String | 还款计划 ID |

**请求体**：
```json
{
  "adjustType": "defer",
  "deferDays": 15,
  "reason": "用户临时困难，申请延期 15 天",
  "newDueDate": 1714579200000
}
```

**请求参数说明**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| adjustType | String | 是 | 调整类型：defer/reschedule/penalty_waiver |
| deferDays | Integer | 否 | 延期天数（defer 类型） |
| reason | String | 是 | 调整原因 |
| newDueDate | Long | 否 | 新到期日 |

**响应数据**：
```json
{
  "code": 200,
  "message": "调整成功",
  "data": {
    "repaymentId": "rep_123456",
    "oldDueDate": 1713283200000,
    "newDueDate": 1714579200000,
    "adjustTime": 1710698400000,
    "operator": "adm_001"
  }
}
```

---

### 5.2 逾期订单列表

**接口**: `GET /repayments/overdue`

**描述**: 获取逾期订单列表

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码 |
| pageSize | Integer | 否 | 每页数量 |
| overdueLevel | String | 否 | 逾期等级：M0/M1/M2/M3/M4 |
| userId | String | 否 | 用户 ID |

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "repaymentId": "rep_123456",
        "loanId": "ln_123456",
        "userId": "usr_123456",
        "userName": "Somchai Prasert",
        "phone": "0812345678",
        "dueAmount": 10700,
        "overdueAmount": 10700,
        "penalty": 107,
        "overdueDays": 15,
        "overdueLevel": "M1",
        "dueDate": 1712073600000,
        "lastContactTime": 1713196800000,
        "collectorId": "adm_003",
        "collectorName": "催收员 A"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

### 5.3 催收任务分配

**接口**: `POST /collections/assign`

**描述**: 分配催收任务

**请求体**：
```json
{
  "repaymentIds": ["rep_123456", "rep_123457"],
  "collectorId": "adm_003",
  "priority": "high",
  "remark": "用户承诺本周还款，请重点跟进"
}
```

**响应数据**：
```json
{
  "code": 200,
  "message": "分配成功",
  "data": {
    "assignedCount": 2,
    "collectorId": "adm_003",
    "assignTime": 1710698400000,
    "operator": "adm_001"
  }
}
```

---

### 5.4 催收记录

**接口**: `POST /collections/:taskId/record`

**描述**: 记录催收沟通

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | String | 催收任务 ID |

**请求体**：
```json
{
  "contactTime": 1710698400000,
  "contactMethod": "phone",
  "contactResult": "promised_to_pay",
  "content": "用户表示本周三会还款 5000 泰铢",
  "promiseAmount": 5000,
  "promiseDate": 1711036800000,
  "nextFollowupTime": 1711123200000
}
```

**响应数据**：
```json
{
  "code": 200,
  "message": "记录成功",
  "data": {
    "recordId": "rec_001",
    "taskId": "tsk_001",
    "recordTime": 1710698400000,
    "recorder": "adm_003"
  }
}
```

---

## 6. 产品配置 API

### 6.1 产品列表

**接口**: `GET /products`

**描述**: 获取借款产品列表

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "productId": "prd_001",
        "name": "现金贷",
        "description": "快速放款，灵活还款",
        "minAmount": 1000,
        "maxAmount": 50000,
        "minTerm": 7,
        "maxTerm": 90,
        "interestRate": 0.05,
        "feeRate": 0.02,
        "status": "active",
        "createTime": 1710604800000
      }
    ]
  }
}
```

---

### 6.2 创建产品

**接口**: `POST /products`

**请求体**：
```json
{
  "name": "消费贷",
  "description": "用于消费支出的贷款产品",
  "minAmount": 5000,
  "maxAmount": 100000,
  "minTerm": 30,
  "maxTerm": 180,
  "interestRate": 0.04,
  "feeRate": 0.015,
  "status": "active"
}
```

**响应数据**：
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "productId": "prd_002",
    "createTime": 1710698400000,
    "creator": "adm_001"
  }
}
```

---

### 6.3 更新产品

**接口**: `PUT /products/:productId`

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| productId | String | 产品 ID |

**请求体**：
```json
{
  "name": "现金贷",
  "description": "快速放款，灵活还款（更新）",
  "maxAmount": 60000,
  "interestRate": 0.045,
  "status": "active"
}
```

**响应数据**：
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "productId": "prd_001",
    "updateTime": 1710698400000,
    "operator": "adm_001"
  }
}
```

---

### 6.4 删除产品

**接口**: `DELETE /products/:productId`

**描述**: 删除产品（仅允许删除无在借订单的产品）

**响应数据**：
```json
{
  "code": 200,
  "message": "删除成功",
  "data": {
    "productId": "prd_001",
    "deleteTime": 1710698400000,
    "operator": "adm_001"
  }
}
```

---

## 7. 渠道管理 API

### 7.1 渠道列表

**接口**: `GET /channels`

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "channelId": "chn_001",
        "name": "银行转账",
        "type": "bank_transfer",
        "accountInfo": {
          "bankName": "Bangkok Bank",
          "accountNumber": "xxx-x-xxxxx-x",
          "accountName": "Lann Company Ltd."
        },
        "feeType": "fixed",
        "feeValue": 0,
        "feeBearer": "platform",
        "status": "active",
        "availability": "available"
      }
    ]
  }
}
```

---

### 7.2 创建渠道

**接口**: `POST /channels`

**请求体**：
```json
{
  "name": "PromptPay",
  "type": "promptpay",
  "accountInfo": {
    "promptpayId": "0812345678",
    "accountName": "Lann Company Ltd."
  },
  "feeType": "percentage",
  "feeValue": 0.005,
  "feeBearer": "user",
  "status": "active"
}
```

---

### 7.3 更新渠道状态

**接口**: `PATCH /channels/:channelId/status`

**请求体**：
```json
{
  "status": "inactive",
  "reason": "渠道维护中"
}
```

---

## 8. 报表统计 API

### 8.1 数据看板

**接口**: `GET /reports/dashboard`

**描述**: 获取核心业务数据看板

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dateType | String | 否 | 日期类型：today/week/month/custom |
| startDate | Long | 否 | 起始时间（custom 类型必填） |
| endDate | Long | 否 | 截止时间（custom 类型必填） |

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "overview": {
      "totalUsers": 10000,
      "todayNewUsers": 150,
      "totalLoanAmount": 50000000,
      "todayLoanAmount": 500000,
      "activeLoans": 3000,
      "overdueLoans": 150,
      "totalRevenue": 5000000,
      "todayRevenue": 50000
    },
    "trends": {
      "userGrowth": [
        { "date": "2024-03-01", "value": 9500 },
        { "date": "2024-03-02", "value": 9650 },
        { "date": "2024-03-03", "value": 9800 },
        { "date": "2024-03-04", "value": 10000 }
      ],
      "loanAmount": [
        { "date": "2024-03-01", "value": 450000 },
        { "date": "2024-03-02", "value": 480000 },
        { "date": "2024-03-03", "value": 520000 },
        { "date": "2024-03-04", "value": 500000 }
      ],
      "revenue": [
        { "date": "2024-03-01", "value": 45000 },
        { "date": "2024-03-02", "value": 48000 },
        { "date": "2024-03-03", "value": 52000 },
        { "date": "2024-03-04", "value": 50000 }
      ],
      "overdueRate": [
        { "date": "2024-03-01", "value": 4.8 },
        { "date": "2024-03-02", "value": 4.9 },
        { "date": "2024-03-03", "value": 5.0 },
        { "date": "2024-03-04", "value": 5.0 }
      ]
    }
  }
}
```

---

### 8.2 逾期率统计

**接口**: `GET /reports/overdue-rate`

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dimension | String | 否 | 统计维度：level/product/user_level/vintage |
| startTime | Long | 否 | 起始时间 |
| endTime | Long | 否 | 截止时间 |

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "currentOverdueRate": 5.0,
    "m1PlusRate": 3.2,
    "m3PlusRate": 1.5,
    "badDebtRate": 0.8,
    "byLevel": [
      { "level": "M0", "count": 100, "rate": 2.0 },
      { "level": "M1", "count": 80, "rate": 1.6 },
      { "level": "M2", "count": 40, "rate": 0.8 },
      { "level": "M3", "count": 20, "rate": 0.4 },
      { "level": "M4", "count": 10, "rate": 0.2 }
    ]
  }
}
```

---

### 8.3 收入统计

**接口**: `GET /reports/revenue`

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dimension | String | 否 | 统计维度：day/week/month |
| startTime | Long | 否 | 起始时间 |
| endTime | Long | 否 | 截止时间 |

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalRevenue": 5000000,
    "byType": [
      { "type": "interest", "amount": 3500000, "percentage": 70 },
      { "type": "fee", "amount": 1000000, "percentage": 20 },
      { "type": "penalty", "amount": 400000, "percentage": 8 },
      { "type": "other", "amount": 100000, "percentage": 2 }
    ],
    "trend": [
      { "date": "2024-03-01", "amount": 450000 },
      { "date": "2024-03-02", "amount": 480000 },
      { "date": "2024-03-03", "amount": 520000 },
      { "date": "2024-03-04", "amount": 500000 }
    ]
  }
}
```

---

### 8.4 用户增长统计

**接口**: `GET /reports/user-growth`

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "newUsers": 500,
    "growthRate": 5.26,
    "conversionFunnel": {
      "registered": 1000,
      "kycPassed": 800,
      "credited": 600,
      "firstLoan": 400,
      "repeatLoan": 250
    },
    "conversionRates": {
      "kycRate": 80.0,
      "creditRate": 75.0,
      "loanRate": 66.7,
      "repeatRate": 62.5
    },
    "trend": [
      { "date": "2024-03-01", "newUsers": 120, "kycPassed": 100 },
      { "date": "2024-03-02", "newUsers": 130, "kycPassed": 110 },
      { "date": "2024-03-03", "newUsers": 125, "kycPassed": 105 },
      { "date": "2024-03-04", "newUsers": 125, "kycPassed": 100 }
    ]
  }
}
```

---

## 9. 系统管理 API

### 9.1 后台用户列表

**接口**: `GET /admin-users`

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "userId": "adm_001",
        "name": "管理员 A",
        "username": "admin_a",
        "email": "admin_a@lann.com",
        "phone": "0812345678",
        "department": "运营部",
        "position": "运营主管",
        "roleIds": ["role_001"],
        "status": "active",
        "createTime": 1710604800000,
        "lastLoginTime": 1710691200000
      }
    ]
  }
}
```

---

### 9.2 创建后台用户

**接口**: `POST /admin-users`

**请求体**：
```json
{
  "name": "管理员 B",
  "username": "admin_b",
  "password": "encrypted_password",
  "email": "admin_b@lann.com",
  "phone": "0823456789",
  "department": "风控部",
  "position": "风控专员",
  "roleIds": ["role_002"]
}
```

---

### 9.3 角色列表

**接口**: `GET /roles`

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "roleId": "role_001",
        "name": "运营管理员",
        "description": "负责用户管理和借款审核",
        "permissions": [
          "user:view",
          "user:kyc_audit",
          "loan:view",
          "loan:approve"
        ],
        "status": "active"
      }
    ]
  }
}
```

---

### 9.4 创建角色

**接口**: `POST /roles`

**请求体**：
```json
{
  "name": "自定义角色",
  "description": "自定义权限角色",
  "permissions": [
    "user:view",
    "loan:view"
  ]
}
```

---

### 9.5 审计日志

**接口**: `GET /audit-logs`

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码 |
| pageSize | Integer | 否 | 每页数量 |
| operatorId | String | 否 | 操作人 ID |
| module | String | 否 | 操作模块 |
| actionType | String | 否 | 操作类型 |
| startTime | Long | 否 | 起始时间 |
| endTime | Long | 否 | 截止时间 |

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "logId": "log_001",
        "operatorId": "adm_001",
        "operatorName": "管理员 A",
        "actionType": "update",
        "module": "user",
        "targetId": "usr_123456",
        "targetName": "用户 Somchai",
        "content": "更新用户额度：30000 → 50000",
        "ipAddress": "192.168.1.100",
        "result": "success",
        "createTime": 1710691200000
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1000,
      "totalPages": 50
    }
  }
}
```

---

## 10. 认证授权 API

### 10.1 登录

**接口**: `POST /auth/login`

**请求体**：
```json
{
  "username": "admin_a",
  "password": "encrypted_password",
  "smsCode": "123456"
}
```

**响应数据**：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "expiresIn": 7200,
    "userInfo": {
      "userId": "adm_001",
      "name": "管理员 A",
      "username": "admin_a",
      "roleIds": ["role_001"],
      "permissions": ["user:view", "user:kyc_audit"]
    }
  }
}
```

---

### 10.2 刷新 Token

**接口**: `POST /auth/refresh`

**请求体**：
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

---

### 10.3 登出

**接口**: `POST /auth/logout`

---

## 11. 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证/Token 过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |
| 1001 | 用户不存在 |
| 1002 | 用户已冻结 |
| 2001 | 借款订单不存在 |
| 2002 | 借款订单状态不允许此操作 |
| 3001 | 产品不存在 |
| 3002 | 产品已下架 |
| 4001 | 渠道不存在 |
| 4002 | 渠道不可用 |
| 5001 | 权限不足 |
| 5002 | 角色不存在 |

---

## 12. 与现有 API 融合

### 12.1 共用认证体系
- 后台 API 与用户端 API 使用同一套 JWT 认证
- Token 中区分用户类型（admin/user）
- 后台 Token 有效期更长（2 小时 vs 30 分钟）

### 12.2 共用数据模型
- 用户、借款、还款等核心数据模型一致
- 后台 API 返回更详细的管理字段
- 后台操作会触发相同的业务逻辑

### 12.3 独立权限控制
- 后台 API 有独立的权限校验
- 基于角色的访问控制（RBAC）
- 所有操作记录审计日志
