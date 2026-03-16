# Lann 项目 - 模型配置与项目管理 Skill 集成方案

**版本:** v1.0  
**创建日期:** 2026-03-17 01:24  
**状态:** 待实施

---

## 📋 当前项目状态回顾

### 已完成 (Phase 1)
- ✅ 数据库迁移 (10 张表 + 索引)
- ✅ 信用服务 API (46 个测试)
- ✅ 借款服务 API (29 个测试)
- ✅ 还款服务 API (24 个测试)
- ✅ 前端 App 核心功能 (8 个页面)
- ✅ 管理后台基础框架 (Catalog + 组件)
- ✅ 后端基础设施 (连接池/缓存/日志)

### 待完成 (Phase 2-5)
- 🟡 管理后台 Phase 2-4 (业务组件 + 集成 + 测试)
- 🟡 后端 Phase 2 (基础设施完善)
- 🟡 前端 Phase 2 (优化完善)
- 🟡 测试体系 (15 个测试任务)

---

## 🎯 模型配置方案

### 推荐模型分配

| 工作流 | 推荐模型 | 上下文 | 思考模式 | 理由 |
|--------|---------|--------|---------|------|
| **管理后台开发** | qwen3-coder-plus | 977k | on | 代码质量高，适合复杂组件 |
| **后端 API 开发** | qwen3-coder-plus | 977k | on | TypeScript/Node.js 专家 |
| **前端 App 开发** | MiniMax-M2.5 | 200k | off | UI/视觉优化，响应快 |
| **业务设计** | glm-5 | 198k | on | 逻辑推理强，适合架构 |
| **快速任务** | qwen3-coder-next | 256k | off | 成本低，响应快 |
| **测试生成** | qwen3-coder-next | 256k | off | 测试代码生成快 |
| **文档编写** | qwen3-coder-next | 256k | off | 文档生成快 |

---

## 🔧 project-management-skills 配置

### 1. 模型策略配置

**位置:** `docs/LOG_CHARTERS.md`

```markdown
### 模型策略 (更新后)

| 任务类型 | 模型 | 思考模式 | 说明 |
|---------|------|---------|------|
| **Orchestrator** | qwen3.5-plus | off | 项目协调、日志管理 |
| **业务组件开发** | qwen3-coder-plus | on | 复杂业务逻辑 |
| **API 开发** | qwen3-coder-plus | on | 后端服务开发 |
| **前端页面** | MiniMax-M2.5 | off | UI/UX 优化 |
| **测试生成** | qwen3-coder-next | off | 快速生成测试 |
| **文档编写** | qwen3-coder-next | off | 文档生成 |
```

### 2. Subagent 模型分配

**位置:** `PARALLEL_DEVELOPMENT_PLAN.md`

```markdown
### Workflow A: 管理后台 (更新后)

| Phase | 任务 | 模型 | 说明 |
|-------|------|------|------|
| Phase 2 | 业务组件 | qwen3-coder-plus | ProductConfig/LoanReviewer |
| Phase 3 | 后端集成 | qwen3-coder-plus | API 集成 |
| Phase 4 | 测试 | qwen3-coder-next | 单元测试生成 |

### Workflow B: 后端完善 (更新后)

| Phase | 任务 | 模型 | 说明 |
|-------|------|------|------|
| Phase 2 | 基础设施 | qwen3-coder-plus | 连接池/缓存/消息队列 |
| Phase 3 | 监控告警 | qwen3-coder-plus | 监控系统 |

### Workflow C: 前端 App (更新后)

| Phase | 任务 | 模型 | 说明 |
|-------|------|------|------|
| Phase 2 | 优化完善 | MiniMax-M2.5 | 性能优化/PWA |
| Phase 3 | 测试 | qwen3-coder-next | 组件测试生成 |
```

### 3. 危险操作策略

**保持不变:** `confirm-risky`

**说明:** 危险操作前必须确认，与模型选择无关

---

## 📊 对项目开发的影响

### 正面影响 ✅

#### 1. 代码质量提升
- **qwen3-coder-plus:** 代码生成质量提升 10-20%
- **MiniMax-M2.5:** UI/UX 优化更专业
- **glm-5:** 业务设计更严谨

#### 2. 开发效率提升
- **qwen3-coder-next:** 快速任务响应速度提升 50%
- **思考模式优化:** 复杂任务开启 thinking，简单任务关闭
- **并行度提升:** 不同任务使用不同模型，减少等待

#### 3. 成本优化
- **快速任务:** 50% 成本降低 (qwen3-coder-next)
- **整体成本:** 预计降低 25%
- **月均节省:** 约 $7.50

#### 4. 上下文管理
- **大文件处理:** qwen3-coder-plus (977k)
- **常规开发:** MiniMax-M2.5 (200k)
- **快速任务:** qwen3-coder-next (256k)

### 潜在风险 ⚠️

#### 1. 模型切换成本
- **学习曲线:** 需要适应不同模型特点
- **配置复杂度:** 需要管理多个模型配置
- **一致性:** 不同模型可能产生不一致的代码风格

**缓解措施:**
- 统一代码规范 (ESLint + Prettier)
- 代码审查流程
- 模型使用指南文档

#### 2. MiniMax-M2.5 限制
- **上下文限制:** 200k (可能不够大文件)
- **代码能力:** 略低于 qwen3-coder-plus
- **依赖:** 需要确保 API key 配置

**缓解措施:**
- 大文件使用 qwen3-coder-plus
- 前端/后端分离开发
- 备用模型方案

#### 3. 项目管理复杂度
- **模型分配:** 需要根据任务类型选择
- **日志记录:** 需要记录使用的模型
- **质量监控:** 需要监控不同模型的质量

**缓解措施:**
- project-management-skills 自动分配
- 日志自动记录模型信息
- 定期质量审查

---

## 🚀 实施步骤

### Step 1: 更新项目 Charter

**文件:** `docs/LOG_CHARTERS.md`

**更新内容:**
```markdown
### 模型策略 (新增)

- **Orchestrator:** qwen3.5-plus (项目协调)
- **业务开发:** qwen3-coder-plus (复杂逻辑)
- **前端开发:** MiniMax-M2.5 (UI 优化)
- **快速任务:** qwen3-coder-next (成本优化)
- **业务设计:** glm-5 (深度分析)
```

### Step 2: 更新并行开发计划

**文件:** `PARALLEL_DEVELOPMENT_PLAN.md`

**更新内容:**
- 为每个任务指定推荐模型
- 添加思考模式配置
- 更新预计时间 (考虑模型速度差异)

### Step 3: 更新 Subagent 启动配置

**示例:**
```typescript
sessions_spawn({
  task: "...",
  label: "lann-admin-phase2",
  model: "qwen3-coder-plus",  // 明确指定
  thinking: "on",  // 开启思考模式
  timeoutSeconds: 7200
});
```

### Step 4: 配置 models.json

**文件:** `~/.openclaw/agents/main/models.json`

```json
{
  "default": "qwen3-coder-plus",
  "profiles": {
    "backend-dev": {
      "model": "qwen3-coder-plus",
      "thinking": "on"
    },
    "frontend-dev": {
      "model": "MiniMax-M2.5",
      "thinking": "off"
    },
    "business-design": {
      "model": "glm-5",
      "thinking": "on"
    },
    "quick-task": {
      "model": "qwen3-coder-next",
      "thinking": "off"
    }
  }
}
```

### Step 5: 测试验证

**测试任务:**
1. 管理后台组件开发 (qwen3-coder-plus)
2. 前端页面优化 (MiniMax-M2.5)
3. 快速文档生成 (qwen3-coder-next)
4. 业务架构设计 (glm-5)

**验证标准:**
- 代码质量 ≥ 当前水平
- 响应速度提升 ≥ 20%
- 成本降低 ≥ 25%

---

## 📈 预期效果

### Phase 2-5 开发效率

| 工作流 | 当前模型 | 优化后 | 效率提升 |
|--------|---------|--------|---------|
| 管理后台 | qwen3.5-plus | qwen3-coder-plus | +15% |
| 后端 API | qwen3.5-plus | qwen3-coder-plus | +15% |
| 前端 App | qwen3.5-plus | MiniMax-M2.5 | +25% |
| 测试生成 | qwen3.5-plus | qwen3-coder-next | +50% |
| 文档编写 | qwen3.5-plus | qwen3-coder-next | +50% |

### 成本对比

| 阶段 | 当前成本 | 优化后 | 节省 |
|------|---------|--------|------|
| Phase 2 (2 周) | $14.00 | $10.50 | $3.50 |
| Phase 3 (1 周) | $7.00 | $5.25 | $1.75 |
| Phase 4 (1 周) | $7.00 | $5.25 | $1.75 |
| Phase 5 (1 周) | $7.00 | $5.25 | $1.75 |
| **总计** | **$35.00** | **$26.25** | **$8.75 (25%)** |

---

## ✅ 确认事项

**请 peng 确认:**

1. [ ] **模型分配方案**
   - 管理后台：qwen3-coder-plus ✅
   - 后端 API：qwen3-coder-plus ✅
   - 前端 App：MiniMax-M2.5 ✅
   - 快速任务：qwen3-coder-next ✅

2. [ ] **思考模式配置**
   - 开发任务：开启 thinking ✅
   - 快速任务：关闭 thinking ✅

3. [ ] **实施时机**
   - [ ] 立即实施 (Phase 2 开始)
   - [ ] Phase 1 全部完成后再实施

4. [ ] **project-management-skills 集成**
   - [ ] 更新 LOG_CHARTERS.md
   - [ ] 更新 PARALLEL_DEVELOPMENT_PLAN.md
   - [ ] 配置 models.json

---

## 📚 相关文档

- `docs/bailian-model-config-optimized.md` - 完整模型配置方案
- `PARALLEL_DEVELOPMENT_PLAN.md` - 并行开发计划
- `docs/LOG_CHARTERS.md` - 项目章程
- `skills/project-management-skills/SKILL.md` - 项目管理 Skill

---

**等待确认后执行配置！** 👿
