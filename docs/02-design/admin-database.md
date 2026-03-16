# Lann 后台管理系统数据库设计文档

## 1. 概述

### 1.1 文档目的
本文档定义 Lann 后台管理系统新增的数据库表结构，包括后台用户、角色权限、审计日志、审核记录等核心表。

### 1.2 设计原则
- **规范化**：遵循第三范式，减少数据冗余
- **可扩展**：预留扩展字段，支持业务增长
- **性能优化**：合理设计索引，支持高频查询
- **安全性**：敏感数据加密存储，操作可追溯

### 1.3 与现有数据库关系
- 后台管理系统复用现有用户、借款、还款等核心业务表
- 新增表主要用于后台管理、权限控制、审核记录、配置管理
- 通过外键关联现有业务表

---

## 2. 新增表结构

### 2.1 admin_users - 后台用户表

**描述**：存储后台管理系统用户账号信息

```sql
CREATE TABLE admin_users (
    id VARCHAR(32) PRIMARY KEY COMMENT '用户 ID，格式 adm_xxx',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '登录账号',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    name VARCHAR(100) NOT NULL COMMENT '真实姓名',
    email VARCHAR(100) UNIQUE COMMENT '工作邮箱',
    phone VARCHAR(20) COMMENT '联系电话',
    department VARCHAR(100) COMMENT '所属部门',
    position VARCHAR(100) COMMENT '职位',
    avatar_url VARCHAR(500) COMMENT '头像 URL',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    last_login_time DATETIME COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录 IP',
    password_changed_at DATETIME COMMENT '密码修改时间',
    must_change_password BOOLEAN DEFAULT FALSE COMMENT '是否必须修改密码',
    created_by VARCHAR(32) COMMENT '创建人 ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by VARCHAR(32) COMMENT '更新人 ID',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at DATETIME COMMENT '删除时间（软删除）',
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_department (department),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台用户表';
```

**字段说明**：
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | VARCHAR(32) | 是 | 主键，格式 adm_xxx |
| username | VARCHAR(50) | 是 | 登录账号，唯一 |
| password_hash | VARCHAR(255) | 是 | bcrypt 加密的密码 |
| name | VARCHAR(100) | 是 | 真实姓名 |
| email | VARCHAR(100) | 否 | 工作邮箱，唯一 |
| phone | VARCHAR(20) | 否 | 联系电话 |
| department | VARCHAR(100) | 否 | 所属部门 |
| position | VARCHAR(100) | 否 | 职位 |
| status | TINYINT | 是 | 0-禁用，1-启用 |
| last_login_time | DATETIME | 否 | 最后登录时间 |
| last_login_ip | VARCHAR(50) | 否 | 最后登录 IP |

---

### 2.2 admin_roles - 角色表

**描述**：存储后台用户角色信息

```sql
CREATE TABLE admin_roles (
    id VARCHAR(32) PRIMARY KEY COMMENT '角色 ID，格式 role_xxx',
    name VARCHAR(100) UNIQUE NOT NULL COMMENT '角色名称',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '角色代码',
    description TEXT COMMENT '角色描述',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统预设角色',
    created_by VARCHAR(32) COMMENT '创建人 ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by VARCHAR(32) COMMENT '更新人 ID',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at DATETIME COMMENT '删除时间（软删除）',
    
    INDEX idx_code (code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';
```

**预设角色数据**：
```sql
INSERT INTO admin_roles (id, name, code, description, is_system) VALUES
('role_001', '超级管理员', 'super_admin', '拥有全部权限', TRUE),
('role_002', '运营管理员', 'operation_admin', '负责用户管理和借款审核', TRUE),
('role_003', '风控专员', 'risk_specialist', '负责信用审核和逾期管理', TRUE),
('role_004', '催收专员', 'collection_specialist', '负责催收任务', TRUE),
('role_005', '财务人员', 'finance_staff', '负责放款审批和收入统计', TRUE),
('role_006', '客服人员', 'customer_service', '负责用户查询和基础操作', TRUE),
('role_007', '只读账号', 'readonly', '仅查看权限', TRUE);
```

---

### 2.3 admin_permissions - 权限表

**描述**：存储权限定义信息

```sql
CREATE TABLE admin_permissions (
    id VARCHAR(32) PRIMARY KEY COMMENT '权限 ID，格式 perm_xxx',
    name VARCHAR(100) NOT NULL COMMENT '权限名称',
    code VARCHAR(100) UNIQUE NOT NULL COMMENT '权限代码',
    module VARCHAR(50) NOT NULL COMMENT '所属模块',
    type TINYINT NOT NULL COMMENT '类型：1-菜单，2-操作，3-数据',
    parent_id VARCHAR(32) COMMENT '父权限 ID',
    path VARCHAR(500) COMMENT '前端路由路径',
    icon VARCHAR(100) COMMENT '菜单图标',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_code (code),
    INDEX idx_module (module),
    INDEX idx_parent (parent_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';
```

**预设权限数据**：
```sql
-- 用户管理模块
INSERT INTO admin_permissions (id, name, code, module, type, path, sort_order) VALUES
('perm_001', '用户管理', 'user:view', 'user', 1, '/admin/users', 1),
('perm_002', '用户详情', 'user:detail', 'user', 2, NULL, 2),
('perm_003', 'KYC 审核', 'user:kyc_audit', 'user', 2, NULL, 3),
('perm_004', '状态管理', 'user:status', 'user', 2, NULL, 4),
('perm_005', '额度调整', 'user:credit_adjust', 'user', 2, NULL, 5);

-- 借款管理模块
INSERT INTO admin_permissions (id, name, code, module, type, path, sort_order) VALUES
('perm_010', '借款管理', 'loan:view', 'loan', 1, '/admin/loans', 10),
('perm_011', '借款详情', 'loan:detail', 'loan', 2, NULL, 11),
('perm_012', '借款审核', 'loan:approve', 'loan', 2, NULL, 12),
('perm_013', '合同管理', 'loan:contract', 'loan', 2, NULL, 13),
('perm_014', '放款确认', 'loan:disburse', 'loan', 2, NULL, 14);

-- 信用管理模块
INSERT INTO admin_permissions (id, name, code, module, type, path, sort_order) VALUES
('perm_020', '信用管理', 'credit:view', 'credit', 1, '/admin/credit', 20),
('perm_021', '信用复审', 'credit:review', 'credit', 2, NULL, 21),
('perm_022', '黑名单管理', 'credit:blacklist', 'credit', 2, NULL, 22);

-- 还款管理模块
INSERT INTO admin_permissions (id, name, code, module, type, path, sort_order) VALUES
('perm_030', '还款管理', 'repayment:view', 'repayment', 1, '/admin/repayments', 30),
('perm_031', '还款调整', 'repayment:adjust', 'repayment', 2, NULL, 31),
('perm_032', '逾期管理', 'repayment:overdue', 'repayment', 2, NULL, 32),
('perm_033', '催收任务', 'repayment:collection', 'repayment', 2, NULL, 33);

-- 产品配置模块
INSERT INTO admin_permissions (id, name, code, module, type, path, sort_order) VALUES
('perm_040', '产品配置', 'product:view', 'product', 1, '/admin/products', 40),
('perm_041', '产品创建', 'product:create', 'product', 2, NULL, 41),
('perm_042', '产品编辑', 'product:edit', 'product', 2, NULL, 42),
('perm_043', '产品删除', 'product:delete', 'product', 2, NULL, 43);

-- 渠道管理模块
INSERT INTO admin_permissions (id, name, code, module, type, path, sort_order) VALUES
('perm_050', '渠道管理', 'channel:view', 'channel', 1, '/admin/channels', 50),
('perm_051', '渠道配置', 'channel:config', 'channel', 2, NULL, 51);

-- 报表统计模块
INSERT INTO admin_permissions (id, name, code, module, type, path, sort_order) VALUES
('perm_060', '数据看板', 'report:dashboard', 'report', 1, '/admin/reports', 60),
('perm_061', '逾期统计', 'report:overdue', 'report', 2, NULL, 61),
('perm_062', '收入统计', 'report:revenue', 'report', 2, NULL, 62);

-- 系统管理模块
INSERT INTO admin_permissions (id, name, code, module, type, path, sort_order) VALUES
('perm_070', '后台用户', 'admin_user:view', 'system', 1, '/admin/system/users', 70),
('perm_071', '角色管理', 'admin_role:view', 'system', 1, '/admin/system/roles', 71),
('perm_072', '审计日志', 'admin_log:view', 'system', 1, '/admin/system/logs', 72);
```

---

### 2.4 admin_user_roles - 用户角色关联表

**描述**：后台用户与角色的多对多关联

```sql
CREATE TABLE admin_user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    user_id VARCHAR(32) NOT NULL COMMENT '用户 ID',
    role_id VARCHAR(32) NOT NULL COMMENT '角色 ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    UNIQUE KEY uk_user_role (user_id, role_id),
    INDEX idx_user (user_id),
    INDEX idx_role (role_id),
    
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';
```

---

### 2.5 admin_role_permissions - 角色权限关联表

**描述**：角色与权限的多对多关联

```sql
CREATE TABLE admin_role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    role_id VARCHAR(32) NOT NULL COMMENT '角色 ID',
    permission_id VARCHAR(32) NOT NULL COMMENT '权限 ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    UNIQUE KEY uk_role_permission (role_id, permission_id),
    INDEX idx_role (role_id),
    INDEX idx_permission (permission_id),
    
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';
```

---

### 2.6 audit_logs - 审计日志表

**描述**：记录后台用户的所有操作日志

```sql
CREATE TABLE audit_logs (
    id VARCHAR(32) PRIMARY KEY COMMENT '日志 ID，格式 log_xxx',
    operator_id VARCHAR(32) NOT NULL COMMENT '操作人 ID',
    operator_name VARCHAR(100) NOT NULL COMMENT '操作人姓名',
    action_type VARCHAR(20) NOT NULL COMMENT '操作类型：create/update/delete/query/approve/reject',
    module VARCHAR(50) NOT NULL COMMENT '操作模块：user/loan/credit/product/channel/system',
    target_id VARCHAR(100) COMMENT '操作对象 ID',
    target_name VARCHAR(200) COMMENT '操作对象名称',
    content TEXT COMMENT '操作内容描述',
    request_data JSON COMMENT '请求数据快照',
    response_data JSON COMMENT '响应数据快照',
    ip_address VARCHAR(50) COMMENT '操作 IP',
    user_agent VARCHAR(500) COMMENT '浏览器信息',
    result TINYINT NOT NULL COMMENT '结果：0-失败，1-成功',
    error_message TEXT COMMENT '错误信息',
    duration_ms INT COMMENT '操作耗时（毫秒）',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    
    INDEX idx_operator (operator_id),
    INDEX idx_module (module),
    INDEX idx_action (action_type),
    INDEX idx_target (target_id),
    INDEX idx_created_at (created_at),
    INDEX idx_result (result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';
```

**字段说明**：
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | VARCHAR(32) | 是 | 日志 ID，格式 log_xxx |
| operator_id | VARCHAR(32) | 是 | 操作人 ID |
| operator_name | VARCHAR(100) | 是 | 操作人姓名 |
| action_type | VARCHAR(20) | 是 | 操作类型 |
| module | VARCHAR(50) | 是 | 操作模块 |
| target_id | VARCHAR(100) | 否 | 操作对象 ID |
| target_name | VARCHAR(200) | 否 | 操作对象名称 |
| content | TEXT | 否 | 操作内容描述 |
| request_data | JSON | 否 | 请求数据快照 |
| response_data | JSON | 否 | 响应数据快照 |
| ip_address | VARCHAR(50) | 否 | 操作 IP |
| result | TINYINT | 是 | 0-失败，1-成功 |
| duration_ms | INT | 否 | 操作耗时 |

---

### 2.7 loan_reviews - 借款审核记录表

**描述**：记录借款订单的审核历史

```sql
CREATE TABLE loan_reviews (
    id VARCHAR(32) PRIMARY KEY COMMENT '审核记录 ID，格式 lrv_xxx',
    loan_id VARCHAR(32) NOT NULL COMMENT '借款 ID',
    review_type TINYINT NOT NULL COMMENT '审核类型：1-自动审核，2-人工审核',
    review_stage TINYINT NOT NULL COMMENT '审核阶段：1-初审，2-复审',
    action VARCHAR(20) NOT NULL COMMENT '审核动作：approve/reject/return',
    reason TEXT COMMENT '审核意见',
    reject_reason VARCHAR(500) COMMENT '拒绝原因',
    reviewer_id VARCHAR(32) COMMENT '审核人 ID（人工审核）',
    reviewer_name VARCHAR(100) COMMENT '审核人姓名',
    auto_review_result JSON COMMENT '自动审核结果（规则命中情况）',
    risk_score DECIMAL(5,2) COMMENT '风险评分',
    attachments JSON COMMENT '附件列表',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '审核时间',
    
    INDEX idx_loan (loan_id),
    INDEX idx_reviewer (reviewer_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='借款审核记录表';
```

**字段说明**：
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | VARCHAR(32) | 是 | 审核记录 ID |
| loan_id | VARCHAR(32) | 是 | 借款 ID |
| review_type | TINYINT | 是 | 1-自动审核，2-人工审核 |
| review_stage | TINYINT | 是 | 1-初审，2-复审 |
| action | VARCHAR(20) | 是 | approve/reject/return |
| reason | TEXT | 否 | 审核意见 |
| reject_reason | VARCHAR(500) | 否 | 拒绝原因 |
| reviewer_id | VARCHAR(32) | 否 | 审核人 ID |
| auto_review_result | JSON | 否 | 自动审核结果 |
| risk_score | DECIMAL(5,2) | 否 | 风险评分 |

---

### 2.8 credit_reviews - 信用复审记录表

**描述**：记录信用评分的复审历史

```sql
CREATE TABLE credit_reviews (
    id VARCHAR(32) PRIMARY KEY COMMENT '复审记录 ID，格式 crv_xxx',
    user_id VARCHAR(32) NOT NULL COMMENT '用户 ID',
    review_type TINYINT NOT NULL COMMENT '复审类型：1-用户申诉，2-定期复审，3-异常检测',
    old_score INT NOT NULL COMMENT '原信用评分',
    new_score INT COMMENT '新信用评分',
    action VARCHAR(20) NOT NULL COMMENT '复审结果：maintain/adjust/recalculate',
    reason TEXT COMMENT '复审原因',
    reviewer_id VARCHAR(32) NOT NULL COMMENT '复审人 ID',
    reviewer_name VARCHAR(100) NOT NULL COMMENT '复审人姓名',
    attachments JSON COMMENT '附件列表（申诉材料等）',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '复审时间',
    
    INDEX idx_user (user_id),
    INDEX idx_reviewer (reviewer_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='信用复审记录表';
```

---

### 2.9 collection_tasks - 催收任务表

**描述**：存储催收任务分配和记录

```sql
CREATE TABLE collection_tasks (
    id VARCHAR(32) PRIMARY KEY COMMENT '任务 ID，格式 tsk_xxx',
    repayment_id VARCHAR(32) NOT NULL COMMENT '还款计划 ID',
    loan_id VARCHAR(32) NOT NULL COMMENT '借款 ID',
    user_id VARCHAR(32) NOT NULL COMMENT '用户 ID',
    user_name VARCHAR(100) NOT NULL COMMENT '用户姓名',
    user_phone VARCHAR(20) NOT NULL COMMENT '用户电话',
    overdue_amount DECIMAL(12,2) NOT NULL COMMENT '逾期金额',
    overdue_days INT NOT NULL COMMENT '逾期天数',
    overdue_level VARCHAR(10) NOT NULL COMMENT '逾期等级：M0/M1/M2/M3/M4',
    collector_id VARCHAR(32) COMMENT '催收员 ID',
    collector_name VARCHAR(100) COMMENT '催收员姓名',
    priority TINYINT NOT NULL DEFAULT 2 COMMENT '优先级：1-高，2-中，3-低',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-待处理，2-处理中，3-已完成，4-已关闭',
    assigned_at DATETIME COMMENT '分配时间',
    assigned_by VARCHAR(32) COMMENT '分配人 ID',
    first_contact_at DATETIME COMMENT '首次联系时间',
    last_contact_at DATETIME COMMENT '最后联系时间',
    promise_pay_amount DECIMAL(12,2) COMMENT '承诺还款金额',
    promise_pay_date DATETIME COMMENT '承诺还款日期',
    next_followup_at DATETIME COMMENT '下次跟进时间',
    remark TEXT COMMENT '备注',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_repayment (repayment_id),
    INDEX idx_user (user_id),
    INDEX idx_collector (collector_id),
    INDEX idx_status (status),
    INDEX idx_overdue_level (overdue_level),
    INDEX idx_priority (priority),
    
    FOREIGN KEY (repayment_id) REFERENCES repayments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='催收任务表';
```

---

### 2.10 collection_records - 催收记录表

**描述**：记录每次催收沟通的详细信息

```sql
CREATE TABLE collection_records (
    id VARCHAR(32) PRIMARY KEY COMMENT '记录 ID，格式 rec_xxx',
    task_id VARCHAR(32) NOT NULL COMMENT '任务 ID',
    contact_time DATETIME NOT NULL COMMENT '联系时间',
    contact_method TINYINT NOT NULL COMMENT '联系方式：1-电话，2-短信，3-邮件，4-上门，5-其他',
    contact_result TINYINT NOT NULL COMMENT '联系结果：1-接通，2-未接通，3-拒接，4-空号，5-承诺还款，6-拒绝还款',
    content TEXT NOT NULL COMMENT '沟通内容',
    promise_amount DECIMAL(12,2) COMMENT '承诺还款金额',
    promise_date DATETIME COMMENT '承诺还款日期',
    next_followup_time DATETIME COMMENT '下次跟进时间',
    recorder_id VARCHAR(32) NOT NULL COMMENT '记录人 ID',
    recorder_name VARCHAR(100) NOT NULL COMMENT '记录人姓名',
    attachments JSON COMMENT '附件（录音、截图等）',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_task (task_id),
    INDEX idx_contact_time (contact_time),
    INDEX idx_recorder (recorder_id),
    
    FOREIGN KEY (task_id) REFERENCES collection_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='催收记录表';
```

---

### 2.11 product_configs - 产品配置表

**描述**：存储借款产品的配置信息

```sql
CREATE TABLE product_configs (
    id VARCHAR(32) PRIMARY KEY COMMENT '配置 ID，格式 pcfg_xxx',
    product_id VARCHAR(32) NOT NULL COMMENT '产品 ID',
    config_version INT NOT NULL COMMENT '配置版本号',
    config_type TINYINT NOT NULL COMMENT '配置类型：1-基础配置，2-费率配置，3-期限配置',
    config_data JSON NOT NULL COMMENT '配置数据',
    effective_at DATETIME COMMENT '生效时间',
    expires_at DATETIME COMMENT '过期时间',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-无效，1-有效，2-历史',
    change_reason TEXT COMMENT '变更原因',
    created_by VARCHAR(32) NOT NULL COMMENT '创建人 ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_product (product_id),
    INDEX idx_version (product_id, config_version),
    INDEX idx_status (status),
    INDEX idx_effective (effective_at),
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品配置表';
```

**配置数据结构**：
```json
{
  "baseConfig": {
    "minAmount": 1000,
    "maxAmount": 50000,
    "minTerm": 7,
    "maxTerm": 90,
    "allowedTerms": [7, 14, 30, 60, 90]
  },
  "feeConfig": {
    "interestRate": 0.05,
    "feeRate": 0.02,
    "penaltyRate": 0.01,
    "prepaymentFeeRate": 0.03
  },
  "riskConfig": {
    "minCreditScore": 600,
    "maxLoanCount": 5,
    "maxOutstandingAmount": 30000
  }
}
```

---

### 2.12 channel_configs - 渠道配置表

**描述**：存储还款渠道的配置信息

```sql
CREATE TABLE channel_configs (
    id VARCHAR(32) PRIMARY KEY COMMENT '配置 ID，格式 ccfg_xxx',
    channel_id VARCHAR(32) NOT NULL COMMENT '渠道 ID',
    channel_name VARCHAR(100) NOT NULL COMMENT '渠道名称',
    channel_type VARCHAR(50) NOT NULL COMMENT '渠道类型',
    account_info JSON COMMENT '账户信息',
    fee_type VARCHAR(20) NOT NULL COMMENT '费率类型：fixed/percentage',
    fee_value DECIMAL(10,4) NOT NULL COMMENT '费率值',
    fee_bearer VARCHAR(20) NOT NULL COMMENT '费用承担方：user/platform',
    min_amount DECIMAL(12,2) COMMENT '最小金额',
    max_amount DECIMAL(12,2) COMMENT '最大金额',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    availability VARCHAR(20) NOT NULL DEFAULT 'available' COMMENT '可用性：available/maintenance/unavailable',
    remark TEXT COMMENT '备注',
    created_by VARCHAR(32) COMMENT '创建人 ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by VARCHAR(32) COMMENT '更新人 ID',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_channel (channel_id),
    INDEX idx_type (channel_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='渠道配置表';
```

---

### 2.13 system_settings - 系统配置表

**描述**：存储系统级别的配置信息

```sql
CREATE TABLE system_settings (
    id VARCHAR(32) PRIMARY KEY COMMENT '配置 ID',
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value JSON NOT NULL COMMENT '配置值',
    config_type VARCHAR(50) NOT NULL COMMENT '配置类型：boolean/number/string/json',
    category VARCHAR(50) COMMENT '配置分类：business/risk/notification/system',
    description TEXT COMMENT '配置描述',
    is_public BOOLEAN DEFAULT FALSE COMMENT '是否对前端公开',
    version INT NOT NULL DEFAULT 1 COMMENT '版本号',
    updated_by VARCHAR(32) COMMENT '更新人 ID',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_key (config_key),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';
```

**预设配置数据**：
```sql
INSERT INTO system_settings (id, config_key, config_value, config_type, category, description) VALUES
('cfg_001', 'kyc.auto_audit.enabled', 'true', 'boolean', 'business', '是否启用 KYC 自动审核'),
('cfg_002', 'kyc.manual_audit.timeout_hours', '24', 'number', 'business', 'KYC 人工审核超时时间（小时）'),
('cfg_003', 'loan.auto_approve.max_amount', '5000', 'number', 'business', '自动审批最大金额'),
('cfg_004', 'loan.manual_review.timeout_hours', '2', 'number', 'business', '人工审核超时时间（小时）'),
('cfg_005', 'risk.overdue.freeze_days', '30', 'number', 'risk', '逾期冻结账户天数'),
('cfg_006', 'risk.blacklist.threshold_days', '90', 'number', 'risk', '逾期加入黑名单天数阈值'),
('cfg_007', 'notification.sms.enabled', 'true', 'boolean', 'notification', '是否启用短信通知'),
('cfg_008', 'notification.email.enabled', 'true', 'boolean', 'notification', '是否启用邮件通知'),
('cfg_009', 'system.maintenance.mode', 'false', 'boolean', 'system', '系统维护模式'),
('cfg_010', 'system.max_concurrent_loans', '3', 'number', 'business', '用户最大同时在借订单数');
```

---

### 2.14 admin_login_logs - 后台登录日志表

**描述**：记录后台用户的登录日志

```sql
CREATE TABLE admin_login_logs (
    id VARCHAR(32) PRIMARY KEY COMMENT '日志 ID',
    user_id VARCHAR(32) NOT NULL COMMENT '用户 ID',
    username VARCHAR(50) NOT NULL COMMENT '登录账号',
    login_type TINYINT NOT NULL COMMENT '登录类型：1-密码，2-短信验证码',
    login_result TINYINT NOT NULL COMMENT '登录结果：0-失败，1-成功',
    fail_reason VARCHAR(200) COMMENT '失败原因',
    ip_address VARCHAR(50) NOT NULL COMMENT '登录 IP',
    ip_location VARCHAR(200) COMMENT 'IP 归属地',
    user_agent VARCHAR(500) COMMENT '浏览器信息',
    device_type VARCHAR(50) COMMENT '设备类型：desktop/mobile/tablet',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
    
    INDEX idx_user (user_id),
    INDEX idx_login_time (created_at),
    INDEX idx_ip (ip_address),
    INDEX idx_result (login_result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台登录日志表';
```

---

## 3. 现有表扩展

### 3.1 users 表扩展字段

为支持后台管理，在现有 users 表中添加以下字段：

```sql
ALTER TABLE users ADD COLUMN account_status TINYINT NOT NULL DEFAULT 1 COMMENT '账户状态：0-冻结，1-激活，2-注销';
ALTER TABLE users ADD COLUMN freeze_reason VARCHAR(500) COMMENT '冻结原因';
ALTER TABLE users ADD COLUMN freeze_until DATETIME COMMENT '冻结截止时间';
ALTER TABLE users ADD COLUMN blacklist_type VARCHAR(50) COMMENT '黑名单类型';
ALTER TABLE users ADD COLUMN blacklist_until DATETIME COMMENT '黑名单截止时间';
ALTER TABLE users ADD COLUMN kyc_audit_time DATETIME COMMENT 'KYC 审核时间';
ALTER TABLE users ADD COLUMN kyc_auditor VARCHAR(32) COMMENT 'KYC 审核人 ID';
ALTER TABLE users ADD COLUMN kyc_audit_comment TEXT COMMENT 'KYC 审核意见';
ALTER TABLE users ADD COLUMN credit_limit DECIMAL(12,2) DEFAULT 0 COMMENT '授信额度';
ALTER TABLE users ADD COLUMN credit_score INT DEFAULT 650 COMMENT '信用评分';
ALTER TABLE users ADD COLUMN last_credit_adjust_time DATETIME COMMENT '最后额度调整时间';
ALTER TABLE users ADD COLUMN last_credit_adjust_by VARCHAR(32) COMMENT '最后额度调整人';

ALTER TABLE users ADD INDEX idx_account_status (account_status);
ALTER TABLE users ADD INDEX idx_blacklist (blacklist_type);
ALTER TABLE users ADD INDEX idx_credit_score (credit_score);
```

---

### 3.2 loans 表扩展字段

为支持后台审核，在现有 loans 表中添加以下字段：

```sql
ALTER TABLE loans ADD COLUMN review_type TINYINT COMMENT '审核类型：1-自动，2-人工';
ALTER TABLE loans ADD COLUMN review_time DATETIME COMMENT '审核时间';
ALTER TABLE loans ADD COLUMN reviewer_id VARCHAR(32) COMMENT '审核人 ID';
ALTER TABLE loans ADD COLUMN review_comment TEXT COMMENT '审核意见';
ALTER TABLE loans ADD COLUMN reject_reason VARCHAR(500) COMMENT '拒绝原因';
ALTER TABLE loans ADD COLUMN contract_id VARCHAR(32) COMMENT '合同 ID';
ALTER TABLE loans ADD COLUMN contract_sign_time DATETIME COMMENT '合同签署时间';
ALTER TABLE loans ADD COLUMN disburse_time DATETIME COMMENT '放款时间';
ALTER TABLE loans ADD COLUMN disburse_channel VARCHAR(50) COMMENT '放款渠道';
ALTER TABLE loans ADD COLUMN disburse_transaction_id VARCHAR(100) COMMENT '放款交易号';

ALTER TABLE loans ADD INDEX idx_review_status (status);
ALTER TABLE loans ADD INDEX idx_reviewer (reviewer_id);
ALTER TABLE loans ADD INDEX idx_disburse_time (disburse_time);
```

---

### 3.3 repayments 表扩展字段

为支持后台还款管理，在现有 repayments 表中添加以下字段：

```sql
ALTER TABLE repayments ADD COLUMN adjusted BOOLEAN DEFAULT FALSE COMMENT '是否调整过';
ALTER TABLE repayments ADD COLUMN adjust_reason TEXT COMMENT '调整原因';
ALTER TABLE repayments ADD COLUMN adjust_by VARCHAR(32) COMMENT '调整人 ID';
ALTER TABLE repayments ADD COLUMN adjust_time DATETIME COMMENT '调整时间';
ALTER TABLE repayments ADD COLUMN original_due_date DATETIME COMMENT '原到期日';
ALTER TABLE repayments ADD COLUMN collection_task_id VARCHAR(32) COMMENT '催收任务 ID';
ALTER TABLE repayments ADD COLUMN last_collection_time DATETIME COMMENT '最后催收时间';
ALTER TABLE repayments ADD COLUMN promise_pay_amount DECIMAL(12,2) COMMENT '承诺还款金额';
ALTER TABLE repayments ADD COLUMN promise_pay_date DATETIME COMMENT '承诺还款日期';

ALTER TABLE repayments ADD INDEX idx_collection (collection_task_id);
ALTER TABLE repayments ADD INDEX idx_adjusted (adjusted);
```

---

## 4. 索引优化

### 4.1 高频查询索引

```sql
-- 用户查询优化
CREATE INDEX idx_users_register_time ON users(register_time);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
CREATE INDEX idx_users_credit_score ON users(credit_score);

-- 借款查询优化
CREATE INDEX idx_loans_apply_time ON loans(apply_time);
CREATE INDEX idx_loans_status_time ON loans(status, apply_time);

-- 逾期查询优化
CREATE INDEX idx_repayments_overdue ON repayments(due_date, status);
CREATE INDEX idx_collection_overdue_level ON collection_tasks(overdue_level, status);

-- 审计日志查询优化
CREATE INDEX idx_audit_logs_composite ON audit_logs(module, action_type, created_at);
```

---

### 4.2 分区表设计

对于数据量大的表，考虑分区：

```sql
-- 审计日志按月分区
ALTER TABLE audit_logs 
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    PARTITION p202403 VALUES LESS THAN (202404),
    ...
);

-- 催收记录按月分区
ALTER TABLE collection_records
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    ...
);
```

---

## 5. 数据字典

### 5.1 状态枚举

**账户状态 (account_status)**：
| 值 | 说明 |
|----|------|
| 0 | 冻结 |
| 1 | 激活 |
| 2 | 注销 |

**KYC 状态 (kyc_status)**：
| 值 | 说明 |
|----|------|
| 0 | 待审核 |
| 1 | 已通过 |
| 2 | 已拒绝 |

**借款状态 (loan_status)**：
| 值 | 说明 |
|----|------|
| 0 | 待审核 |
| 1 | 审核通过 |
| 2 | 审核拒绝 |
| 3 | 合同待签署 |
| 4 | 待放款 |
| 5 | 放款成功 |
| 6 | 还款中 |
| 7 | 已结清 |
| 8 | 逾期 |

**逾期等级 (overdue_level)**：
| 值 | 说明 | 逾期天数 |
|----|------|----------|
| M0 | 轻度逾期 | 1-7 天 |
| M1 | 中度逾期 | 8-30 天 |
| M2 | 重度逾期 | 31-60 天 |
| M3 | 严重逾期 | 61-90 天 |
| M4 | 坏账 | 90+ 天 |

---

### 5.2 权限代码规范

权限代码格式：`模块：操作`

**模块代码**：
- `user` - 用户管理
- `loan` - 借款管理
- `credit` - 信用管理
- `repayment` - 还款管理
- `product` - 产品配置
- `channel` - 渠道管理
- `report` - 报表统计
- `system` - 系统管理

**操作代码**：
- `view` - 查看
- `create` - 创建
- `edit` - 编辑
- `delete` - 删除
- `approve` - 审批
- `audit` - 审核
- `export` - 导出

---

## 6. 与现有数据库融合

### 6.1 外键关系

```
admin_users (1) ──< admin_user_roles >── (1) admin_roles
admin_roles (1) ──< admin_role_permissions >── (1) admin_permissions

admin_users (1) ──< audit_logs
admin_users (1) ──< loan_reviews
admin_users (1) ──< credit_reviews
admin_users (1) ──< collection_tasks

users (1) ──< credit_reviews
users (1) ──< collection_tasks

loans (1) ──< loan_reviews

repayments (1) ──< collection_tasks
repayments (1) ──< collection_records

collection_tasks (1) ──< collection_records

products (1) ──< product_configs
```

### 6.2 数据一致性

- 所有外键关联使用 `ON DELETE CASCADE` 确保数据一致性
- 软删除表（admin_users、admin_roles）使用 `deleted_at` 字段
- 审计日志永久保留，不删除

### 6.3 数据迁移

从现有系统迁移数据时：
1. 先创建新表结构
2. 迁移后台用户数据（如有）
3. 迁移角色权限数据
4. 为现有用户表添加扩展字段
5. 历史审核数据迁移（如有）

---

## 7. 性能优化

### 7.1 查询优化建议

```sql
-- 避免全表扫描，使用覆盖索引
SELECT id, username, name, status 
FROM admin_users 
WHERE status = 1 AND department = '运营部';

-- 分页查询使用延迟关联
SELECT u.* 
FROM admin_users u
INNER JOIN (
    SELECT id FROM admin_users 
    WHERE status = 1 
    ORDER BY created_at DESC 
    LIMIT 0, 20
) tmp ON u.id = tmp.id;

-- 审计日志按时间范围查询
SELECT * FROM audit_logs 
WHERE created_at BETWEEN '2024-03-01' AND '2024-03-31'
ORDER BY created_at DESC;
```

### 7.2 缓存策略

- 角色权限数据：Redis 缓存，TTL 1 小时
- 系统配置数据：Redis 缓存，TTL 5 分钟
- 产品配置数据：Redis 缓存，TTL 10 分钟
- 渠道配置数据：Redis 缓存，TTL 5 分钟

---

## 8. 安全设计

### 8.1 敏感数据加密

```sql
-- 密码使用 bcrypt 加密
-- 敏感字段应用层加密后存储
ALTER TABLE admin_users ADD COLUMN password_salt VARCHAR(32) COMMENT '密码盐值';
```

### 8.2 数据脱敏

查询敏感数据时应用层脱敏：
- 手机号：138****1234
- 身份证号：1101**********1234
- 银行卡号：6222****1234

### 8.3 访问控制

- 所有后台表仅允许通过 API 访问
- 数据库账号按最小权限分配
- 审计日志表仅允许插入，不允许修改删除
