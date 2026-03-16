# Lann 后台管理系统配置化设计文档

## 1. 概述

### 1.1 文档目的
本文档定义 Lann 后台管理系统的配置化设计方案，实现业务规则、产品参数、费率、流程等的动态配置，减少代码发布频率，提高运营效率。

### 1.2 配置化目标
- **灵活性**：业务参数可动态调整，无需代码发布
- **可追溯**：所有配置变更有历史记录，支持回滚
- **安全性**：配置变更需审批，关键配置有验证
- **高性能**：配置数据缓存，快速加载

### 1.3 配置化范围
| 配置类型 | 配置内容 | 变更频率 | 审批要求 |
|----------|----------|----------|----------|
| 产品配置 | 借款产品参数、费率、期限 | 低 | 需要 |
| 费率配置 | 利率、服务费、罚息 | 低 | 需要 |
| 期限配置 | 借款期限选项 | 低 | 需要 |
| 审批流程 | 审核规则、工作流 | 中 | 需要 |
| 通知模板 | 短信、邮件、APP 推送模板 | 中 | 不需要 |
| 渠道配置 | 还款渠道、费率 | 中 | 需要 |
| 风控规则 | 评分模型、阈值 | 中 | 需要 |
| 系统配置 | 开关、超时、限制 | 高 | 不需要 |

---

## 2. 配置架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    后台管理系统                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  配置管理 UI │  │  配置编辑器  │  │  配置审批   │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         └────────────────┼────────────────┘             │
│                          │                              │
│                  ┌───────▼────────┐                     │
│                  │  配置服务层    │                     │
│                  │  (ConfigService)│                    │
│                  └───────┬────────┘                     │
└──────────────────────────┼──────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌──▼────────┐ ┌─▼────────────┐
       │   MySQL     │ │   Redis   │ │  Config File │
       │  (持久化)   │ │  (缓存)   │ │  (默认配置)  │
       └─────────────┘ └───────────┘ └──────────────┘
```

### 2.2 配置层级

```
Level 1: 系统级配置（System）
  └── 全局生效，如系统开关、超时设置

Level 2: 产品级配置（Product）
  └── 按产品区分，如费率、期限

Level 3: 用户级配置（User）
  └── 按用户群体区分，如 VIP 用户特殊费率

Level 4: 订单级配置（Order）
  └── 单笔订单的特殊配置
```

### 2.3 配置优先级

```
订单级 > 用户级 > 产品级 > 系统级
（高优先级覆盖低优先级）
```

---

## 3. 借款产品配置

### 3.1 配置结构

```json
{
  "productId": "prd_001",
  "productName": "现金贷",
  "version": "1.2.0",
  "effectiveDate": "2024-03-01T00:00:00+07:00",
  "baseConfig": {
    "minAmount": 1000,
    "maxAmount": 50000,
    "minTerm": 7,
    "maxTerm": 90,
    "allowedTerms": [7, 14, 30, 60, 90],
    "defaultTerm": 30,
    "amountStep": 100,
    "currency": "THB"
  },
  "feeConfig": {
    "interestRate": {
      "type": "daily",
      "value": 0.0015,
      "minValue": 0.001,
      "maxValue": 0.003,
      "description": "日利率 0.15%"
    },
    "serviceFeeRate": {
      "type": "percentage",
      "value": 0.02,
      "minValue": 0.01,
      "maxValue": 0.05,
      "description": "服务费 2%"
    },
    "managementFee": {
      "type": "fixed",
      "value": 0,
      "description": "管理费（固定金额）"
    },
    "penaltyRate": {
      "type": "daily",
      "value": 0.001,
      "description": "逾期罚息率 0.1%/天"
    },
    "prepaymentFeeRate": {
      "type": "percentage",
      "value": 0.03,
      "description": "提前还款手续费 3%"
    }
  },
  "riskConfig": {
    "minCreditScore": 600,
    "maxCreditScore": 850,
    "maxLoanCount": 5,
    "maxOutstandingAmount": 30000,
    "maxOutstandingCount": 3,
    "minIncome": 15000,
    "minAge": 20,
    "maxAge": 60,
    "blacklistCheck": true,
    "multiPlatformCheck": true
  },
  "approvalConfig": {
    "autoApprovalEnabled": true,
    "autoApprovalMaxAmount": 5000,
    "autoApprovalMinScore": 700,
    "manualReviewRequired": false,
    "manualReviewThresholds": {
      "amount": 20000,
      "score": 650
    }
  },
  "repaymentConfig": {
    "repaymentMethods": ["bank_transfer", "promptpay", "truemoney", "711"],
    "autoDeductEnabled": true,
    "gracePeriodDays": 3,
    "installmentEnabled": true,
    "prepaymentEnabled": true,
    "prepaymentMinDays": 7
  },
  "notificationConfig": {
    "approvalTemplate": "loan_approval_th",
    "rejectTemplate": "loan_reject_th",
    "disburseTemplate": "loan_disburse_th",
    "reminderTemplates": {
      "before3Days": "repayment_reminder_3d",
      "before1Day": "repayment_reminder_1d",
      "dueDay": "repayment_reminder_due",
      "overdue1Day": "repayment_overdue_1d",
      "overdue7Days": "repayment_overdue_7d"
    }
  },
  "status": "active",
  "displayOrder": 1
}
```

### 3.2 JSON Schema 验证

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "借款产品配置",
  "type": "object",
  "required": ["productId", "productName", "baseConfig", "feeConfig"],
  "properties": {
    "productId": {
      "type": "string",
      "pattern": "^prd_[0-9]+$"
    },
    "productName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "baseConfig": {
      "type": "object",
      "required": ["minAmount", "maxAmount", "minTerm", "maxTerm"],
      "properties": {
        "minAmount": { "type": "number", "minimum": 0 },
        "maxAmount": { "type": "number", "minimum": 0 },
        "minTerm": { "type": "integer", "minimum": 1 },
        "maxTerm": { "type": "integer", "minimum": 1 },
        "allowedTerms": {
          "type": "array",
          "items": { "type": "integer", "minimum": 1 }
        }
      }
    },
    "feeConfig": {
      "type": "object",
      "required": ["interestRate"],
      "properties": {
        "interestRate": { "$ref": "#/definitions/rateConfig" },
        "serviceFeeRate": { "$ref": "#/definitions/rateConfig" },
        "penaltyRate": { "$ref": "#/definitions/rateConfig" }
      }
    }
  },
  "definitions": {
    "rateConfig": {
      "type": "object",
      "required": ["type", "value"],
      "properties": {
        "type": { "type": "string", "enum": ["daily", "monthly", "percentage", "fixed"] },
        "value": { "type": "number", "minimum": 0 },
        "minValue": { "type": "number" },
        "maxValue": { "type": "number" }
      }
    }
  }
}
```

### 3.3 配置版本管理

每次配置变更创建新版本：

```sql
-- 配置历史表
CREATE TABLE product_config_history (
    id VARCHAR(32) PRIMARY KEY,
    product_id VARCHAR(32) NOT NULL,
    version VARCHAR(20) NOT NULL,
    config_data JSON NOT NULL,
    change_type VARCHAR(20) NOT NULL,
    change_reason TEXT,
    created_by VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL,
    approved_by VARCHAR(32),
    approved_at DATETIME,
    status TINYINT NOT NULL DEFAULT 0,
    
    INDEX idx_product_version (product_id, version)
);
```

**版本规则**：
- 主版本：重大变更（费率结构调整）
- 次版本：功能新增（新期限选项）
- 修订版：参数微调（利率调整）

---

## 4. 费率配置

### 4.1 费率结构设计

```json
{
  "feeStructure": {
    "interestRate": {
      "baseRate": 0.0015,
      "riskAdjustment": {
        "enabled": true,
        "tiers": [
          { "minScore": 750, "maxScore": 850, "adjustment": -0.0005 },
          { "minScore": 700, "maxScore": 749, "adjustment": -0.0002 },
          { "minScore": 650, "maxScore": 699, "adjustment": 0 },
          { "minScore": 600, "maxScore": 649, "adjustment": 0.0003 },
          { "minScore": 550, "maxScore": 599, "adjustment": 0.0008 }
        ]
      },
      "promotionAdjustment": {
        "enabled": true,
        "promotionCode": "NEWYEAR2024",
        "adjustment": -0.0003,
        "startDate": "2024-01-01",
        "endDate": "2024-01-31"
      }
    },
    "serviceFee": {
      "baseRate": 0.02,
      "minFee": 50,
      "maxFee": 2000,
      "waiveConditions": [
        { "condition": "first_loan", "waiveRate": 1.0 },
        { "condition": "vip_user", "waiveRate": 0.5 }
      ]
    },
    "penaltyFee": {
      "baseRate": 0.001,
      "maxDays": 90,
      "capAmount": 5000
    }
  }
}
```

### 4.2 动态加载机制

```javascript
// 费率计算服务
class FeeCalculationService {
  async calculateFee(loan, user) {
    // 1. 加载产品基础费率
    const productConfig = await this.loadProductConfig(loan.productId);
    
    // 2. 应用风险调整
    const riskRate = this.applyRiskAdjustment(
      productConfig.feeConfig.interestRate,
      user.creditScore
    );
    
    // 3. 应用促销调整
    const promotionRate = await this.applyPromotionAdjustment(
      riskRate,
      user,
      loan
    );
    
    // 4. 计算最终费用
    return {
      interest: this.calculateInterest(loan.amount, promotionRate, loan.term),
      serviceFee: this.calculateServiceFee(loan.amount, productConfig.feeConfig.serviceFeeRate),
      total: this.calculateTotal(loan.amount, promotionRate, productConfig)
    };
  }
  
  async loadProductConfig(productId) {
    // 1. 尝试从 Redis 缓存加载
    const cached = await redis.get(`config:product:${productId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 2. 从数据库加载
    const config = await db.query(
      'SELECT config_data FROM product_configs WHERE product_id = ? AND status = 1 ORDER BY version DESC LIMIT 1',
      [productId]
    );
    
    // 3. 写入缓存（TTL 10 分钟）
    await redis.setex(`config:product:${productId}`, 600, JSON.stringify(config));
    
    return config;
  }
}
```

---

## 5. 期限配置

### 5.1 灵活期限配置

```json
{
  "termConfig": {
    "mode": "flexible",
    "options": {
      "fixed": {
        "enabled": true,
        "values": [7, 14, 30, 60, 90],
        "default": 30
      },
      "range": {
        "enabled": false,
        "min": 7,
        "max": 90,
        "step": 1
      }
    },
    "termRateMapping": {
      "7": { "interestRate": 0.0012, "serviceFeeRate": 0.015 },
      "14": { "interestRate": 0.0013, "serviceFeeRate": 0.018 },
      "30": { "interestRate": 0.0015, "serviceFeeRate": 0.02 },
      "60": { "interestRate": 0.0017, "serviceFeeRate": 0.022 },
      "90": { "interestRate": 0.002, "serviceFeeRate": 0.025 }
    },
    "recommendation": {
      "enabled": true,
      "algorithm": "credit_score_based",
      "rules": [
        { "minScore": 750, "recommendedTerms": [30, 60, 90] },
        { "minScore": 650, "recommendedTerms": [14, 30, 60] },
        { "minScore": 600, "recommendedTerms": [7, 14, 30] }
      ]
    }
  }
}
```

### 5.2 期限与费率联动

```javascript
// 期限费率联动计算
function getTermRate(term, baseConfig) {
  const { termRateMapping } = baseConfig.termConfig;
  
  if (termRateMapping[term]) {
    return termRateMapping[term];
  }
  
  // 如果没有配置，使用基础费率
  return {
    interestRate: baseConfig.feeConfig.interestRate.value,
    serviceFeeRate: baseConfig.feeConfig.serviceFeeRate.value
  };
}
```

---

## 6. 审批流程配置

### 6.1 工作流引擎配置

```json
{
  "approvalWorkflow": {
    "version": "2.0",
    "name": "借款审批流程",
    "stages": [
      {
        "id": "auto_review",
        "name": "自动审核",
        "type": "system",
        "timeout": 60,
        "timeoutUnit": "seconds",
        "rules": [
          {
            "id": "rule_001",
            "name": "小额自动通过",
            "conditions": {
              "all": [
                { "field": "amount", "operator": "<=", "value": 5000 },
                { "field": "creditScore", "operator": ">=", "value": 700 },
                { "field": "kycStatus", "operator": "==", "value": "approved" },
                { "field": "blacklist", "operator": "==", "value": false }
              ]
            },
            "action": "approve",
            "priority": 1
          },
          {
            "id": "rule_002",
            "name": "高风险自动拒绝",
            "conditions": {
              "any": [
                { "field": "creditScore", "operator": "<", "value": 600 },
                { "field": "blacklist", "operator": "==", "value": true },
                { "field": "outstandingCount", "operator": ">=", "value": 5 }
              ]
            },
            "action": "reject",
            "rejectReason": "风险过高",
            "priority": 2
          }
        ],
        "nextStage": {
          "approve": "contract",
          "reject": "end",
          "default": "manual_review"
        }
      },
      {
        "id": "manual_review",
        "name": "人工审核",
        "type": "manual",
        "assignee": {
          "role": "risk_specialist",
          "strategy": "round_robin"
        },
        "timeout": 2,
        "timeoutUnit": "hours",
        "escalation": {
          "enabled": true,
          "escalateTo": "risk_supervisor",
          "escalateAfter": 4,
          "escalateAfterUnit": "hours"
        },
        "form": {
          "fields": [
            { "key": "income_verified", "label": "收入核实", "type": "boolean" },
            { "key": "employment_verified", "label": "工作核实", "type": "boolean" },
            { "key": "risk_comment", "label": "风险意见", "type": "textarea" }
          ]
        },
        "nextStage": {
          "approve": "supervisor_review",
          "reject": "end"
        }
      },
      {
        "id": "supervisor_review",
        "name": "主管复审",
        "type": "manual",
        "condition": {
          "field": "amount",
          "operator": ">",
          "value": 20000
        },
        "assignee": {
          "role": "risk_supervisor"
        },
        "timeout": 4,
        "timeoutUnit": "hours",
        "nextStage": {
          "approve": "contract",
          "reject": "end"
        }
      },
      {
        "id": "contract",
        "name": "合同签署",
        "type": "system",
        "action": "generate_contract",
        "nextStage": "disburse"
      },
      {
        "id": "disburse",
        "name": "放款",
        "type": "manual",
        "assignee": {
          "role": "finance_staff"
        },
        "nextStage": "end"
      }
    ]
  }
}
```

### 6.2 规则引擎配置

```json
{
  "ruleEngine": {
    "version": "1.0",
    "rules": [
      {
        "id": "credit_check",
        "name": "信用检查",
        "type": "validation",
        "script": "user.creditScore >= config.minCreditScore",
        "errorMessage": "信用评分不足"
      },
      {
        "id": "income_check",
        "name": "收入检查",
        "type": "validation",
        "script": "user.monthlyIncome >= config.minIncome",
        "errorMessage": "收入不满足最低要求"
      },
      {
        "id": "loan_count_check",
        "name": "在借数量检查",
        "type": "validation",
        "script": "user.outstandingLoanCount < config.maxLoanCount",
        "errorMessage": "在借订单数已达上限"
      },
      {
        "id": "amount_limit_check",
        "name": "金额限制检查",
        "type": "validation",
        "script": "loan.amount <= user.creditLimit - user.usedLimit",
        "errorMessage": "借款金额超过可用额度"
      }
    ]
  }
}
```

---

## 7. 通知模板配置

### 7.1 多语言模板

```json
{
  "notificationTemplates": {
    "sms": {
      "loan_approval_th": {
        "language": "th",
        "content": "ยินดีด้วย! คำขอกู้ของคุณได้รับการอนุมัติแล้ว จำนวน {amount} บาท ระยะเวลา {term} วัน กรุณาลงนามในสัญญาภายใน 24 ชั่วโมง",
        "variables": ["amount", "term"],
        "maxLength": 160
      },
      "loan_approval_en": {
        "language": "en",
        "content": "Congratulations! Your loan application of {amount} THB for {term} days has been approved. Please sign the contract within 24 hours.",
        "variables": ["amount", "term"],
        "maxLength": 160
      },
      "loan_reject_th": {
        "language": "th",
        "content": "ขออภัย คำขอกู้ของคุณไม่ผ่านการอนุมัติ เหตุผล: {reason} คุณสามารถยื่นคำขอใหม่ได้หลังจาก 30 วัน",
        "variables": ["reason"],
        "maxLength": 160
      },
      "repayment_reminder_1d_th": {
        "language": "th",
        "content": "เตือนการชำระคืน: คุณมียอดชำระ {amount} บาท ที่จะครบกำหนดในวันพรุ่งนี้ กรุณาเตรียมเงินให้พร้อม",
        "variables": ["amount"],
        "maxLength": 160
      }
    },
    "email": {
      "loan_approval_th": {
        "language": "th",
        "subject": "คำขอกู้ของคุณได้รับการอนุมัติแล้ว",
        "htmlTemplate": "email_loan_approval_th.html",
        "variables": ["userName", "amount", "term", "interest", "dueDate"]
      }
    },
    "push": {
      "repayment_due_th": {
        "language": "th",
        "title": "เตือนการชำระคืน",
        "body": "ยอดชำระ {amount} บาท จะครบกำหนดใน {days} วัน",
        "variables": ["amount", "days"],
        "action": "open_repayment_page"
      }
    }
  }
}
```

### 7.2 模板管理

```javascript
// 通知服务
class NotificationService {
  async send(templateKey, user, variables) {
    // 1. 获取用户语言偏好
    const language = user.language || 'th';
    
    // 2. 加载模板
    const template = await this.loadTemplate(templateKey, language);
    
    // 3. 渲染模板
    const content = this.renderTemplate(template, variables);
    
    // 4. 发送通知
    switch (template.type) {
      case 'sms':
        await this.sendSms(user.phone, content);
        break;
      case 'email':
        await this.sendEmail(user.email, template.subject, content);
        break;
      case 'push':
        await this.sendPush(user.deviceToken, template.title, content);
        break;
    }
  }
  
  async loadTemplate(templateKey, language) {
    // 从缓存或数据库加载模板
    const cacheKey = `template:${templateKey}:${language}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 从数据库加载
    const template = await db.query(
      'SELECT * FROM notification_templates WHERE template_key = ? AND language = ?',
      [templateKey, language]
    );
    
    await redis.setex(cacheKey, 3600, JSON.stringify(template));
    return template;
  }
}
```

---

## 8. 渠道配置

### 8.1 渠道动态配置

```json
{
  "channels": [
    {
      "channelId": "chn_001",
      "name": "银行转账",
      "type": "bank_transfer",
      "enabled": true,
      "priority": 1,
      "accounts": [
        {
          "bankName": "Bangkok Bank",
          "accountNumber": "123-4-56789-0",
          "accountName": "Lann Company Ltd.",
          "branchCode": "0001"
        },
        {
          "bankName": "Kasikorn Bank",
          "accountNumber": "987-6-54321-0",
          "accountName": "Lann Company Ltd.",
          "branchCode": "0002"
        }
      ],
      "fee": {
        "type": "fixed",
        "value": 0,
        "bearer": "platform"
      },
      "limits": {
        "minAmount": 1000,
        "maxAmount": 100000,
        "dailyLimit": 200000
      },
      "processingTime": {
        "min": 1,
        "max": 2,
        "unit": "hours"
      },
      "availableHours": {
        "start": "00:00",
        "end": "23:59",
        "timezone": "Asia/Bangkok"
      },
      "maintenance": {
        "enabled": false,
        "scheduledStart": null,
        "scheduledEnd": null,
        "message": ""
      }
    },
    {
      "channelId": "chn_002",
      "name": "PromptPay",
      "type": "promptpay",
      "enabled": true,
      "priority": 2,
      "accounts": [
        {
          "promptpayId": "0812345678",
          "accountName": "Lann Company Ltd.",
          "type": "phone"
        }
      ],
      "fee": {
        "type": "percentage",
        "value": 0.005,
        "bearer": "user",
        "minFee": 0,
        "maxFee": 500
      },
      "limits": {
        "minAmount": 100,
        "maxAmount": 50000,
        "dailyLimit": 100000
      },
      "processingTime": {
        "min": 0,
        "max": 5,
        "unit": "minutes"
      }
    }
  ]
}
```

### 8.2 渠道状态监控

```javascript
// 渠道监控服务
class ChannelMonitorService {
  async checkChannelHealth(channelId) {
    const channel = await this.getChannelConfig(channelId);
    
    // 检查维护状态
    if (channel.maintenance.enabled) {
      const now = new Date();
      if (now >= channel.maintenance.scheduledStart && 
          now <= channel.maintenance.scheduledEnd) {
        return { status: 'maintenance', message: channel.maintenance.message };
      }
    }
    
    // 检查可用时间
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const startMinutes = this.parseTime(channel.availableHours.start);
    const endMinutes = this.parseTime(channel.availableHours.end);
    
    if (currentTime < startMinutes || currentTime > endMinutes) {
      return { status: 'outside_hours', message: '不在服务时间内' };
    }
    
    // 检查交易量
    const todayVolume = await this.getTodayVolume(channelId);
    if (todayVolume >= channel.limits.dailyLimit) {
      return { status: 'limit_reached', message: '已达日交易限额' };
    }
    
    // 检查可用性（调用渠道 API 测试）
    try {
      const healthCheck = await this.pingChannel(channelId);
      if (!healthCheck.success) {
        return { status: 'unavailable', message: '渠道不可用' };
      }
    } catch (error) {
      return { status: 'error', message: error.message };
    }
    
    return { status: 'available' };
  }
  
  async getAvailableChannels(amount) {
    const channels = await this.getAllChannels();
    const available = [];
    
    for (const channel of channels) {
      if (!channel.enabled) continue;
      
      const health = await this.checkChannelHealth(channel.channelId);
      if (health.status !== 'available') continue;
      
      if (amount < channel.limits.minAmount || 
          amount > channel.limits.maxAmount) continue;
      
      available.push({
        ...channel,
        healthStatus: health.status,
        estimatedTime: channel.processingTime
      });
    }
    
    // 按优先级排序
    return available.sort((a, b) => a.priority - b.priority);
  }
}
```

---

## 9. 配置存储与缓存

### 9.1 数据库存储

```sql
-- 配置主表
CREATE TABLE configurations (
    id VARCHAR(32) PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_type VARCHAR(50) NOT NULL,
    config_data JSON NOT NULL,
    version INT NOT NULL DEFAULT 1,
    status TINYINT NOT NULL DEFAULT 1,
    effective_at DATETIME,
    expires_at DATETIME,
    created_by VARCHAR(32),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(32),
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (config_key),
    INDEX idx_type (config_type),
    INDEX idx_status (status)
);

-- 配置历史表
CREATE TABLE configuration_history (
    id VARCHAR(32) PRIMARY KEY,
    config_id VARCHAR(32) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    version INT NOT NULL,
    config_data JSON NOT NULL,
    change_type VARCHAR(20) NOT NULL,
    change_reason TEXT,
    created_by VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(32),
    approved_at DATETIME,
    
    INDEX idx_config (config_id),
    INDEX idx_key_version (config_key, version)
);
```

### 9.2 Redis 缓存策略

```javascript
// 配置缓存服务
class ConfigCacheService {
  constructor() {
    this.cachePrefix = 'config:';
    this.defaultTTL = 600; // 10 分钟
  }
  
  async get(configKey) {
    const cacheKey = this.cachePrefix + configKey;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 缓存未命中，从数据库加载
    const config = await this.loadFromDatabase(configKey);
    
    // 写入缓存
    await redis.setex(cacheKey, this.defaultTTL, JSON.stringify(config));
    
    return config;
  }
  
  async set(configKey, configData, options = {}) {
    const cacheKey = this.cachePrefix + configKey;
    const ttl = options.ttl || this.defaultTTL;
    
    await redis.setex(cacheKey, ttl, JSON.stringify(configData));
  }
  
  async invalidate(configKey) {
    const cacheKey = this.cachePrefix + configKey;
    await redis.del(cacheKey);
  }
  
  async invalidatePattern(pattern) {
    const keys = await redis.keys(this.cachePrefix + pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
  
  // 配置变更时清除缓存
  async onConfigChange(configKey) {
    await this.invalidate(configKey);
    
    // 通知其他服务配置已变更（发布订阅）
    await redis.publish('config:change', JSON.stringify({
      configKey,
      timestamp: Date.now()
    }));
  }
}
```

### 9.3 配置热更新

```javascript
// 配置变更监听
redis.subscribe('config:change');

redis.on('config:change', async (message) => {
  const { configKey, timestamp } = JSON.parse(message);
  
  // 清除本地缓存
  configCache.invalidate(configKey);
  
  // 记录日志
  logger.info(`Configuration changed: ${configKey}`, { timestamp });
});
```

---

## 10. 配置管理 UI

### 10.1 配置编辑器

```
┌─────────────────────────────────────────────────────────┐
│  配置管理 > 产品配置 > 现金贷                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  基本信息                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 产品 ID: prd_001                                 │   │
│  │ 产品名称: [现金贷________________]               │   │
│  │ 产品状态: (•) 启用 ( ) 禁用                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  基础配置                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 最小金额: [1000___] THB                          │   │
│  │ 最大金额: [50000__] THB                          │   │
│  │ 最短期数: [7_____] 天                            │   │
│  │ 最长期数: [90____] 天                            │   │
│  │ 可选期数: [7] [14] [30] [60] [90]               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  费率配置                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 日利率: [0.15___] %                              │   │
│  │ 服务费率: [2_____] %                             │   │
│  │ 逾期罚息: [0.1___] %/天                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  变更原因: [________________________________]           │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │   保存草稿   │  │  提交审批   │                      │
│  └─────────────┘  └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

### 10.2 配置审批流程

```
┌─────────────────────────────────────────────────────────┐
│  配置审批                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  待审批配置 (3)                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 现金贷 - 费率调整                                │   │
│  │ 申请人：张三 | 申请时间：2024-03-15 10:30       │   │
│  │ 变更内容：日利率 0.15% → 0.13%                   │   │
│  │ 变更原因：促销活动                               │   │
│  │ ┌─────────────┐  ┌─────────────┐               │   │
│  │ │   批准     │  │   拒绝     │               │   │
│  │ └─────────────┘  └─────────────┘               │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 消费贷 - 期限扩展                                │   │
│  │ 申请人：李四 | 申请时间：2024-03-14 15:20       │   │
│  │ 变更内容：新增 180 天期限选项                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  审批历史                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 2024-03-10 现金贷 产品创建  张三  [已批准]      │   │
│  │ 2024-03-08 系统配置 开关调整  王五  [已批准]    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 11. 配置安全与审计

### 11.1 配置变更审批

```javascript
// 配置审批服务
class ConfigApprovalService {
  async submitChange(configKey, newData, changeReason, applicantId) {
    // 1. 获取当前配置
    const currentConfig = await configService.get(configKey);
    
    // 2. 检查是否需要审批
    const requiresApproval = this.checkRequiresApproval(configKey, newData);
    
    if (!requiresApproval) {
      // 直接应用变更
      await configService.update(configKey, newData);
      return { status: 'applied' };
    }
    
    // 3. 创建审批单
    const approvalId = await this.createApproval({
      configKey,
      oldData: currentConfig,
      newData,
      changeReason,
      applicantId,
      status: 'pending'
    });
    
    // 4. 通知审批人
    const approvers = await this.getApprovers(configKey);
    for (const approver of approvers) {
      await notificationService.send('config_approval_request', approver, {
        configKey,
        applicantName: await this.getUserName(applicantId),
        changeReason
      });
    }
    
    return { status: 'pending', approvalId };
  }
  
  async approve(approvalId, approverId, decision, comment) {
    const approval = await this.getApproval(approvalId);
    
    // 更新审批状态
    await this.updateApproval(approvalId, {
      status: decision, // approved / rejected
      approverId,
      comment,
      approvedAt: new Date()
    });
    
    if (decision === 'approved') {
      // 应用配置变更
      await configService.update(approval.configKey, approval.newData);
      
      // 记录配置历史
      await this.recordHistory(approval);
      
      // 清除缓存
      await configCache.invalidate(approval.configKey);
    }
  }
}
```

### 11.2 配置审计日志

```javascript
// 配置审计
class ConfigAuditService {
  async logChange(configKey, oldData, newData, operatorId, changeType) {
    const auditLog = {
      id: generateId('cfglog'),
      configKey,
      oldData: JSON.stringify(oldData),
      newData: JSON.stringify(newData),
      changeType, // create / update / delete
      operatorId,
      operatorName: await this.getUserName(operatorId),
      operatorIp: await this.getClientIp(),
      timestamp: new Date(),
      diff: this.calculateDiff(oldData, newData)
    };
    
    await db.insert('config_audit_logs', auditLog);
  }
  
  calculateDiff(oldData, newData) {
    // 计算配置变更差异
    const diff = {};
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    
    for (const key of allKeys) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        diff[key] = {
          old: oldData[key],
          new: newData[key]
        };
      }
    }
    
    return diff;
  }
}
```

---

## 12. 与现有系统融合

### 12.1 配置服务集成

```javascript
// 在现有业务服务中使用配置
class LoanService {
  async applyLoan(userId, loanData) {
    // 1. 加载产品配置
    const productConfig = await configService.get(`product:${loanData.productId}`);
    
    // 2. 验证借款参数
    this.validateLoanAmount(loanData.amount, productConfig.baseConfig);
    this.validateLoanTerm(loanData.term, productConfig.baseConfig);
    
    // 3. 加载风控规则
    const riskConfig = await configService.get('risk:loan_approval');
    
    // 4. 执行风控检查
    const riskResult = await this.riskCheck(userId, loanData, riskConfig);
    
    // 5. 加载审批流程
    const workflowConfig = await configService.get('workflow:loan_approval');
    
    // 6. 启动审批流程
    const approvalResult = await this.startApproval(loanData, workflowConfig);
    
    return approvalResult;
  }
}
```

### 12.2 配置中心

```javascript
// 配置中心（统一管理所有配置）
class ConfigCenter {
  constructor() {
    this.configs = new Map();
    this.listeners = new Map();
  }
  
  // 注册配置
  register(configKey, schema, defaultValue) {
    this.configs.set(configKey, {
      schema,
      defaultValue,
      listeners: []
    });
  }
  
  // 获取配置
  async get(configKey) {
    const config = await configCache.get(configKey);
    if (!config) {
      throw new Error(`Configuration not found: ${configKey}`);
    }
    return config;
  }
  
  // 监听配置变更
  onChange(configKey, callback) {
    const config = this.configs.get(configKey);
    if (config) {
      config.listeners.push(callback);
    }
  }
  
  // 通知配置变更
  notifyChange(configKey, newData) {
    const config = this.configs.get(configKey);
    if (config) {
      for (const listener of config.listeners) {
        listener(newData);
      }
    }
  }
}

// 全局配置中心实例
const configCenter = new ConfigCenter();

// 注册配置
configCenter.register('product:prd_001', productSchema, defaultProductConfig);
configCenter.register('risk:loan_approval', riskSchema, defaultRiskConfig);
configCenter.register('workflow:loan_approval', workflowSchema, defaultWorkflow);
```

---

## 13. 总结

### 13.1 配置化收益

| 方面 | 收益 |
|------|------|
| **运营效率** | 产品调整从小时级降至分钟级 |
| **发布频率** | 减少 80% 的配置相关代码发布 |
| **风险控制** | 配置变更可追溯、可回滚 |
| **灵活性** | 支持快速响应市场变化 |

### 13.2 实施建议

1. **分阶段实施**：先实现产品配置，再扩展至流程配置
2. **灰度发布**：新配置先小范围测试，再全量发布
3. **监控告警**：配置变更实时监控，异常情况及时告警
4. **文档完善**：每个配置项都有清晰的说明和示例

### 13.3 后续扩展

- **A/B 测试**：支持不同用户群体使用不同配置
- **智能推荐**：基于历史数据自动优化配置参数
- **配置分析**：分析配置变更对业务指标的影响
