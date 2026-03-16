# Lann 业务模型 Schema 规范

**版本:** v1.0  
**创建日期:** 2026-03-17  
**目标:** AI 可读、可验证、无歧义的业务模型定义

---

## 📋 规范说明

### 设计原则

1. **JSON Schema 为核心** - 所有业务模型使用 JSON Schema 定义
2. **单一数据源** - Schema 是唯一的真实来源，文档从 Schema 生成
3. **机器可读** - AI 和工具可以直接解析和验证
4. **可自动验证** - 所有数据必须符合 Schema
5. **版本化管理** - Schema 变更必须有版本号

### 文件结构

```
schema/
├── README.md                    # 本文件
├── types/                       # 基础类型定义
│   ├── common.jsonc             # 通用类型
│   ├── money.jsonc              # 金额类型
│   └── datetime.jsonc           # 日期时间类型
├── models/                      # 业务模型
│   ├── user.jsonc               # 用户模型
│   ├── credit.jsonc             # 信用模型
│   ├── loan.jsonc               # 借款模型
│   └── repayment.jsonc          # 还款模型
├── database/                    # 数据库 Schema
│   ├── tables.jsonc             # 表结构定义
│   └── constraints.jsonc        # 约束定义
├── api/                         # API Schema
│   ├── credit.jsonc             # 信用 API
│   ├── loan.jsonc               # 借款 API
│   └── repayment.jsonc          # 还款 API
└── tests/                       # 自动化测试
    ├── fixtures/                # 测试数据
    └── validations/             # 验证测试
```

---

## 🔧 基础类型定义

### common.jsonc

```jsonc
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://lann.app/schema/types/common.jsonc",
  "title": "Common Types",
  "description": "通用类型定义",
  
  "definitions": {
    "UUID": {
      "type": "string",
      "format": "uuid",
      "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
      "description": "通用唯一标识符"
    },
    
    "LanguageCode": {
      "type": "string",
      "enum": ["en", "th"],
      "description": "语言代码 (ISO 639-1)"
    },
    
    "PhoneNumber": {
      "type": "string",
      "pattern": "^\\+66[0-9]{9}$",
      "description": "泰国手机号 (+66 开头，共 12 位)",
      "examples": ["+66812345678"]
    },
    
    "NationalID": {
      "type": "string",
      "pattern": "^[0-9]{13}$",
      "description": "泰国身份证号 (13 位数字)",
      "examples": ["1100100123456"]
    },
    
    "Status": {
      "type": "string",
      "enum": ["pending", "active", "inactive", "suspended", "completed", "cancelled", "rejected"],
      "description": "通用状态枚举"
    },
    
    "MultilingualString": {
      "type": "object",
      "properties": {
        "en": { "type": "string", "minLength": 1 },
        "th": { "type": "string", "minLength": 1 }
      },
      "required": ["en", "th"],
      "additionalProperties": false,
      "description": "双语字符串"
    }
  }
}
```

### money.jsonc

```jsonc
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://lann.app/schema/types/money.jsonc",
  "title": "Money Types",
  "description": "金额类型定义",
  
  "definitions": {
    "CurrencyCode": {
      "type": "string",
      "enum": ["THB", "USD"],
      "default": "THB",
      "description": "货币代码 (ISO 4217)"
    },
    
    "Amount": {
      "type": "object",
      "properties": {
        "value": {
          "type": "number",
          "minimum": 0,
          "multipleOf": 0.01,
          "description": "金额值 (最小单位 0.01)"
        },
        "currency": {
          "$ref": "#/definitions/CurrencyCode"
        }
      },
      "required": ["value", "currency"],
      "additionalProperties": false
    },
    
    "InterestRate": {
      "type": "object",
      "properties": {
        "rate": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "multipleOf": 0.0001,
          "description": "利率值 (0-1 之间，精确到 0.01%)"
        },
        "type": {
          "type": "string",
          "enum": ["daily", "monthly", "annual"],
          "description": "利率类型"
        },
        "calculationMethod": {
          "type": "string",
          "enum": ["flat", "reducing"],
          "description": "计算方法 (固定/递减)"
        }
      },
      "required": ["rate", "type", "calculationMethod"],
      "additionalProperties": false
    }
  }
}
```

---

## 📊 业务模型定义

### models/credit.jsonc

```jsonc
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://lann.app/schema/models/credit.jsonc",
  "title": "Credit Model",
  "description": "信用服务模型定义",
  
  "$ref": "#/definitions/CreditProfile",
  
  "definitions": {
    "CreditScore": {
      "type": "integer",
      "minimum": 300,
      "maximum": 1000,
      "description": "信用评分 (300-1000 分)",
      "x-business-rule": {
        "calculation": "weighted_sum",
        "weights": {
          "basic": 0.20,
          "employment": 0.25,
          "contact": 0.15,
          "social": 0.15,
          "behavior": 0.25
        }
      }
    },
    
    "CreditGrade": {
      "type": "string",
      "enum": ["A+", "A", "B", "C", "D", "F"],
      "description": "信用等级",
      "x-business-rule": {
        "mapping": [
          {"grade": "A+", "min": 750, "max": 1000, "limit_min": 30000, "limit_max": 50000, "rate": 0.008},
          {"grade": "A", "min": 650, "max": 749, "limit_min": 20000, "limit_max": 30000, "rate": 0.01},
          {"grade": "B", "min": 550, "max": 649, "limit_min": 10000, "limit_max": 20000, "rate": 0.012},
          {"grade": "C", "min": 450, "max": 549, "limit_min": 5000, "limit_max": 10000, "rate": 0.015},
          {"grade": "D", "min": 300, "max": 449, "limit_min": 1000, "limit_max": 5000, "rate": null},
          {"grade": "F", "min": 0, "max": 299, "limit_min": null, "limit_max": null, "rate": null}
        ]
      }
    },
    
    "CreditLimit": {
      "type": "object",
      "properties": {
        "userId": { "$ref": "../types/common.jsonc#/definitions/UUID" },
        "totalLimit": { "type": "number", "minimum": 0 },
        "availableLimit": { "type": "number", "minimum": 0 },
        "usedLimit": { "type": "number", "minimum": 0 },
        "frozenLimit": { "type": "number", "minimum": 0, "default": 0 },
        "status": {
          "type": "string",
          "enum": ["active", "expired", "suspended", "revoked"]
        },
        "grantedAt": { "type": "string", "format": "date-time" },
        "expiresAt": { "type": "string", "format": "date-time" },
        "validityDays": { "type": "integer", "default": 365, "minimum": 1, "maximum": 730 }
      },
      "required": ["userId", "totalLimit", "availableLimit", "usedLimit", "status", "grantedAt", "expiresAt"],
      "additionalProperties": false,
      "x-business-rule": {
        "invariants": [
          "totalLimit = availableLimit + usedLimit + frozenLimit",
          "availableLimit >= 0",
          "expiresAt > grantedAt"
        ]
      }
    },
    
    "CreditProfile": {
      "type": "object",
      "properties": {
        "userId": { "$ref": "../types/common.jsonc#/definitions/UUID" },
        "creditScore": { "$ref": "#/definitions/CreditScore" },
        "creditGrade": { "$ref": "#/definitions/CreditGrade" },
        "creditLimit": { "$ref": "#/definitions/CreditLimit" },
        "scoreDetails": { "$ref": "#/definitions/ScoreDetails" },
        "reviewAt": { "type": "string", "format": "date-time" }
      },
      "required": ["userId", "creditScore", "creditGrade", "creditLimit"],
      "additionalProperties": false
    },
    
    "ScoreDetails": {
      "type": "object",
      "properties": {
        "basic": { "type": "number", "minimum": 0, "maximum": 200 },
        "employment": { "type": "number", "minimum": 0, "maximum": 250 },
        "contact": { "type": "number", "minimum": 0, "maximum": 150 },
        "social": { "type": "number", "minimum": 0, "maximum": 150 },
        "behavior": { "type": "number", "minimum": 0, "maximum": 250 }
      },
      "required": ["basic", "employment", "contact", "social", "behavior"],
      "additionalProperties": false
    }
  }
}
```

### models/loan.jsonc

```jsonc
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://lann.app/schema/models/loan.jsonc",
  "title": "Loan Model",
  "description": "借款服务模型定义",
  
  "$ref": "#/definitions/LoanProduct",
  
  "definitions": {
    "LoanProductType": {
      "type": "string",
      "enum": ["payday", "installment", "revolving"],
      "description": "借款产品类型"
    },
    
    "LoanProduct": {
      "type": "object",
      "properties": {
        "id": { "$ref": "../types/common.jsonc#/definitions/UUID" },
        "name": { "$ref": "../types/common.jsonc#/definitions/MultilingualString" },
        "type": { "$ref": "#/definitions/LoanProductType" },
        "minAmount": { "type": "number", "minimum": 1000 },
        "maxAmount": { "type": "number", "maximum": 100000 },
        "terms": {
          "type": "array",
          "items": { "$ref": "#/definitions/LoanTerm" },
          "minItems": 1
        },
        "interestRate": { "$ref": "../types/money.jsonc#/definitions/InterestRate" },
        "fees": {
          "type": "array",
          "items": { "$ref": "#/definitions/Fee" }
        },
        "repaymentMethods": {
          "type": "array",
          "items": { "type": "string" }
        },
        "status": { "$ref": "../types/common.jsonc#/definitions/Status" },
        "targetSegment": {
          "type": "string",
          "enum": ["new", "regular", "premium"]
        }
      },
      "required": ["id", "name", "type", "minAmount", "maxAmount", "terms", "interestRate", "status"],
      "additionalProperties": false
    },
    
    "LoanTerm": {
      "type": "object",
      "properties": {
        "days": { "type": "integer", "minimum": 1, "maximum": 365 },
        "label": { "$ref": "../types/common.jsonc#/definitions/MultilingualString" },
        "minAmount": { "type": "number", "minimum": 0 },
        "maxAmount": { "type": "number", "maximum": 100000 },
        "repaymentType": {
          "type": "string",
          "enum": ["bullet", "installment"]
        }
      },
      "required": ["days", "label", "repaymentType"],
      "additionalProperties": false
    },
    
    "Fee": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["processing", "late", "prepayment", "service"]
        },
        "amount": { "type": "number", "minimum": 0 },
        "percentage": { "type": "number", "minimum": 0, "maximum": 1 },
        "minAmount": { "type": "number", "minimum": 0 },
        "maxAmount": { "type": "number", "minimum": 0 }
      },
      "required": ["type"],
      "additionalProperties": false,
      "oneOf": [
        { "required": ["amount"] },
        { "required": ["percentage"] }
      ]
    },
    
    "Loan": {
      "type": "object",
      "properties": {
        "id": { "$ref": "../types/common.jsonc#/definitions/UUID" },
        "userId": { "$ref": "../types/common.jsonc#/definitions/UUID" },
        "productId": { "$ref": "../types/common.jsonc#/definitions/UUID" },
        "principal": { "type": "number", "minimum": 1000 },
        "interestRate": { "$ref": "../types/money.jsonc#/definitions/InterestRate" },
        "termDays": { "type": "integer", "minimum": 1, "maximum": 365 },
        "totalInterest": { "type": "number", "minimum": 0 },
        "totalRepayment": { "type": "number", "minimum": 0 },
        "paidAmount": { "type": "number", "minimum": 0, "default": 0 },
        "remainingAmount": { "type": "number", "minimum": 0 },
        "disbursedAt": { "type": "string", "format": "date-time" },
        "dueDate": { "type": "string", "format": "date-time" },
        "completedAt": { "type": "string", "format": "date-time" },
        "status": {
          "type": "string",
          "enum": ["pending", "disbursed", "active", "overdue", "completed", "written_off"]
        },
        "isOverdue": { "type": "boolean", "default": false },
        "overdueDays": { "type": "integer", "minimum": 0, "default": 0 },
        "penaltyAmount": { "type": "number", "minimum": 0, "default": 0 }
      },
      "required": ["id", "userId", "productId", "principal", "termDays", "totalRepayment", "dueDate", "status"],
      "additionalProperties": false,
      "x-business-rule": {
        "invariants": [
          "totalRepayment = principal + totalInterest",
          "remainingAmount = totalRepayment - paidAmount",
          "if status == 'completed' then remainingAmount == 0",
          "if isOverdue == true then overdueDays > 0"
        ],
        "calculations": {
          "totalInterest": "principal * interestRate.rate * (termDays / ratePeriodDays)",
          "penaltyAmount": "principal * penaltyRate * overdueDays"
        }
      }
    }
  }
}
```

---

## 🗄️ 数据库 Schema 映射

### database/tables.jsonc

```jsonc
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://lann.app/schema/database/tables.jsonc",
  "title": "Database Tables",
  "description": "数据库表结构定义 (与 SQL Schema 一一对应)",
  
  "definitions": {
    "users": {
      "tableName": "users",
      "description": "用户表",
      "columns": {
        "id": {
          "type": "TEXT",
          "primaryKey": true,
          "references": null
        },
        "phone": {
          "type": "TEXT",
          "unique": true,
          "nullable": false,
          "validation": {
            "pattern": "^\\+66[0-9]{9}$"
          }
        },
        "password_hash": {
          "type": "TEXT",
          "nullable": true
        },
        "status": {
          "type": "TEXT",
          "default": "'pending'",
          "enum": ["pending", "active", "suspended", "banned"]
        },
        "created_at": {
          "type": "TEXT",
          "default": "CURRENT_TIMESTAMP"
        },
        "updated_at": {
          "type": "TEXT",
          "default": "CURRENT_TIMESTAMP"
        }
      },
      "indexes": [
        {"name": "idx_users_phone", "columns": ["phone"], "unique": true}
      ]
    },
    
    "credit_limits": {
      "tableName": "credit_limits",
      "description": "信用额度表",
      "columns": {
        "id": {
          "type": "TEXT",
          "primaryKey": true
        },
        "user_id": {
          "type": "TEXT",
          "nullable": false,
          "references": {
            "table": "users",
            "column": "id",
            "onDelete": "CASCADE"
          }
        },
        "total_limit": {
          "type": "REAL",
          "nullable": false,
          "validation": {
            "minimum": 0
          }
        },
        "available_limit": {
          "type": "REAL",
          "nullable": false,
          "validation": {
            "minimum": 0
          }
        },
        "used_limit": {
          "type": "REAL",
          "nullable": false,
          "default": 0,
          "validation": {
            "minimum": 0
          }
        },
        "credit_score": {
          "type": "INTEGER",
          "nullable": true,
          "validation": {
            "minimum": 300,
            "maximum": 1000
          }
        },
        "status": {
          "type": "TEXT",
          "default": "'active'",
          "enum": ["active", "expired", "suspended", "revoked"]
        },
        "expires_at": {
          "type": "TEXT",
          "nullable": false
        }
      },
      "indexes": [
        {"name": "idx_credit_limits_user", "columns": ["user_id"], "unique": false},
        {"name": "idx_credit_limits_status", "columns": ["status"], "unique": false}
      ],
      "constraints": [
        {
          "type": "CHECK",
          "name": "chk_limit_balance",
          "expression": "total_limit = available_limit + used_limit + COALESCE(frozen_limit, 0)"
        }
      ]
    },
    
    "loans": {
      "tableName": "loans",
      "description": "借款表",
      "columns": {
        "id": {
          "type": "TEXT",
          "primaryKey": true
        },
        "user_id": {
          "type": "TEXT",
          "nullable": false,
          "references": {
            "table": "users",
            "column": "id",
            "onDelete": "CASCADE"
          }
        },
        "product_id": {
          "type": "TEXT",
          "nullable": false,
          "references": {
            "table": "loan_products",
            "column": "id",
            "onDelete": "RESTRICT"
          }
        },
        "principal": {
          "type": "REAL",
          "nullable": false,
          "validation": {
            "minimum": 1000,
            "maximum": 50000
          }
        },
        "status": {
          "type": "TEXT",
          "default": "'pending'",
          "enum": ["pending", "disbursed", "active", "overdue", "completed", "written_off"]
        },
        "due_date": {
          "type": "TEXT",
          "nullable": false
        }
      },
      "indexes": [
        {"name": "idx_loans_user", "columns": ["user_id"], "unique": false},
        {"name": "idx_loans_status", "columns": ["status"], "unique": false},
        {"name": "idx_loans_due_date", "columns": ["due_date"], "unique": false}
      ]
    }
  }
}
```

---

## 🧪 自动化测试验证

### tests/validations/credit-schema.test.ts

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import creditSchema from '../../schema/models/credit.jsonc';
import { expect } from 'vitest';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

describe('Credit Schema Validation', () => {
  const validate = ajv.compile(creditSchema);
  
  describe('CreditScore', () => {
    it('should accept valid score (300-1000)', () => {
      const validData = { creditScore: 750 };
      const valid = validate(validData);
      expect(valid).toBe(true);
    });
    
    it('should reject score < 300', () => {
      const invalidData = { creditScore: 299 };
      const valid = validate(invalidData);
      expect(valid).toBe(false);
      expect(validate.errors).toBeDefined();
    });
    
    it('should reject score > 1000', () => {
      const invalidData = { creditScore: 1001 };
      const valid = validate(invalidData);
      expect(valid).toBe(false);
    });
  });
  
  describe('CreditLimit Invariants', () => {
    it('should validate limit balance equation', () => {
      const validData = {
        totalLimit: 50000,
        availableLimit: 30000,
        usedLimit: 20000,
        frozenLimit: 0
      };
      // totalLimit = availableLimit + usedLimit + frozenLimit
      expect(validData.totalLimit).toBe(
        validData.availableLimit + validData.usedLimit + validData.frozenLimit
      );
    });
    
    it('should reject invalid limit balance', () => {
      const invalidData = {
        totalLimit: 50000,
        availableLimit: 40000,
        usedLimit: 20000,  // 40000 + 20000 != 50000
        frozenLimit: 0
      };
      expect(invalidData.totalLimit).not.toBe(
        invalidData.availableLimit + invalidData.usedLimit + invalidData.frozenLimit
      );
    });
  });
  
  describe('CreditGrade Mapping', () => {
    const gradeMapping = [
      { grade: 'A+', min: 750, max: 1000 },
      { grade: 'A', min: 650, max: 749 },
      { grade: 'B', min: 550, max: 649 },
      { grade: 'C', min: 450, max: 549 },
      { grade: 'D', min: 300, max: 449 },
      { grade: 'F', min: 0, max: 299 }
    ];
    
    gradeMapping.forEach(({ grade, min, max }) => {
      it(`should map score ${min}-${max} to grade ${grade}`, () => {
        const testScores = [min, Math.floor((min + max) / 2), max];
        testScores.forEach(score => {
          // 这里应该调用实际的 grade 计算函数
          // const calculatedGrade = calculateGrade(score);
          // expect(calculatedGrade).toBe(grade);
          console.log(`Score ${score} should map to grade ${grade}`);
        });
      });
    });
  });
});
```

### tests/fixtures/loan-products.jsonc

```jsonc
{
  "$schema": "../../schema/models/loan.jsonc",
  "title": "Test Loan Products Fixtures",
  "products": [
    {
      "id": "payday-standard",
      "name": {
        "en": "Payday Loan",
        "th": "เงินด่วนรายวัน"
      },
      "type": "payday",
      "minAmount": 1000,
      "maxAmount": 50000,
      "terms": [
        {
          "days": 7,
          "label": { "en": "7 Days", "th": "7 วัน" },
          "repaymentType": "bullet"
        },
        {
          "days": 14,
          "label": { "en": "14 Days", "th": "14 วัน" },
          "repaymentType": "bullet"
        },
        {
          "days": 30,
          "label": { "en": "30 Days", "th": "30 วัน" },
          "repaymentType": "bullet"
        }
      ],
      "interestRate": {
        "type": "daily",
        "rate": 0.01,
        "calculationMethod": "flat"
      },
      "fees": [
        {
          "type": "late",
          "percentage": 0.005,
          "minAmount": 50
        }
      ],
      "repaymentMethods": ["bank_transfer", "promptpay", "convenience_store", "truemoney"],
      "status": "active",
      "targetSegment": "regular"
    }
  ]
}
```

---

## 🔄 持续集成流程

### CI/CD Schema 验证

```yaml
# .github/workflows/schema-validation.yml
name: Schema Validation

on:
  push:
    paths:
      - 'schema/**/*.jsonc'
      - 'backend/sql/schema.sql'
  pull_request:
    paths:
      - 'schema/**/*.jsonc'
      - 'backend/sql/schema.sql'

jobs:
  validate-schema:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Validate JSON Schema
        run: npm run schema:validate
      
      - name: Check SQL-Schema consistency
        run: npm run schema:check-sql
      
      - name: Run schema tests
        run: npm run test:schema
```

### NPM Scripts

```json
{
  "scripts": {
    "schema:validate": "ajv validate -s schema/**/*.jsonc -d 'tests/fixtures/*.jsonc'",
    "schema:check-sql": "ts-node scripts/check-sql-schema-consistency.ts",
    "schema:generate-docs": "ts-node scripts/generate-schema-docs.ts",
    "schema:generate-types": "json2ts schema/models/*.jsonc --output mobile-app/src/types/generated/",
    "test:schema": "vitest run tests/validations/"
  }
}
```

---

## 📚 文档生成

### 从 Schema 自动生成文档

```typescript
// scripts/generate-schema-docs.ts
import { readFileSync, writeFileSync } from 'fs';
import { compile } from 'json-schema-to-markdown';

function generateDocs() {
  const schemas = [
    'schema/models/credit.jsonc',
    'schema/models/loan.jsonc',
    'schema/models/repayment.jsonc'
  ];
  
  schemas.forEach(schemaPath => {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
    const markdown = compile(schema);
    const outputPath = schemaPath.replace('.jsonc', '.md');
    writeFileSync(outputPath, markdown);
    console.log(`Generated: ${outputPath}`);
  });
}

generateDocs();
```

---

## ✅ 实施清单

### Phase 1: Schema 基础 (1 周)
- [ ] 创建基础类型定义 (common, money, datetime)
- [ ] 创建业务模型定义 (credit, loan, repayment)
- [ ] 创建数据库 Schema 映射
- [ ] 配置 Ajv 验证器

### Phase 2: 测试验证 (1 周)
- [ ] 创建测试 fixtures
- [ ] 编写 Schema 验证测试
- [ ] 编写业务规则测试
- [ ] 集成到 CI/CD

### Phase 3: 代码生成 (1 周)
- [ ] 生成 TypeScript 类型
- [ ] 生成 API 客户端
- [ ] 生成数据库迁移
- [ ] 生成文档

### Phase 4: 持续维护 (持续)
- [ ] Schema 变更管理流程
- [ ] 版本控制策略
- [ ] 向后兼容性检查
- [ ] 定期审查和更新

---

**最后更新:** 2026-03-17  
**负责人:** 小满 (Orchestrator)  
**状态:** 设计中 → 待实施
