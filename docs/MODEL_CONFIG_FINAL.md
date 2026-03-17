# Lann 项目 - 最终模型配置方案

**版本:** v3.0 (剔除 MiniMax-M2.5)  
**创建日期:** 2026-03-17 01:28  
**状态:** ✅ 立即实施

---

## 🎯 最终模型分配

| 工作流 | 模型 | 上下文 | 思考模式 | 理由 |
|--------|------|--------|---------|------|
| **管理后台开发** | qwen3-coder-plus | 977k | on | 代码质量高，大上下文 |
| **后端 API** | qwen3-coder-plus | 977k | on | TypeScript/Node.js 专家 |
| **前端 App** | qwen3-coder-plus | 977k | off | 代码质量高，响应快 |
| **业务设计** | glm-5 | 198k | on | 逻辑推理强，架构设计 |
| **快速任务** | qwen3-coder-next | 256k | off | 成本降低 50%，速度快 |
| **测试生成** | qwen3-coder-next | 256k | off | 快速生成测试代码 |
| **文档编写** | qwen3-coder-next | 256k | off | 文档生成快 |
| **Orchestrator** | qwen3.5-plus | 977k | off | 项目协调，均衡型 |

---

## 📊 简化后的模型策略

**仅使用 4 个模型:**
1. **qwen3-coder-plus** - 主力开发 (代码质量最高)
2. **qwen3-coder-next** - 快速任务 (成本最低)
3. **glm-5** - 业务设计 (逻辑推理最强)
4. **qwen3.5-plus** - 默认/协调 (均衡型)

---

## 🔧 立即实施步骤

### Step 0: 执行优化方案 V2 (优先级最高)

**文件:** `docs/OPTIMIZATION_PLAN_V2.md`

**任务:**
1. 删除前端 PWA 文件 (5 个)
2. 重构后端服务 (删除 Redis，改用 Cloudflare KV/Queues)
3. 更新 wrangler.toml 配置
4. 测试验证

**预计时间:** 105 分钟

---

### Step 1: 更新 LOG_CHARTERS.md

```markdown
### 模型策略 (已更新)

| 任务类型 | 模型 | 思考模式 |
|---------|------|---------|
| Orchestrator | qwen3.5-plus | off |
| 管理后台开发 | qwen3-coder-plus | on |
| 后端 API 开发 | qwen3-coder-plus | on |
| 前端 App 开发 | qwen3-coder-plus | off |
| 业务设计 | glm-5 | on |
| 测试生成 | qwen3-coder-next | off |
| 文档编写 | qwen3-coder-next | off |
| 快速任务 | qwen3-coder-next | off |
```

### Step 2: Subagent 启动配置

```typescript
// 管理后台 Phase 2
sessions_spawn({
  task: "业务组件开发",
  label: "lann-admin-phase2",
  model: "qwen3-coder-plus",
  thinking: "on",
  timeoutSeconds: 7200
});

// 后端 Phase 2
sessions_spawn({
  task: "基础设施完善",
  label: "lann-backend-phase2",
  model: "qwen3-coder-plus",
  thinking: "on",
  timeoutSeconds: 7200
});

// 前端 Phase 2
sessions_spawn({
  task: "优化完善",
  label: "lann-frontend-phase2",
  model: "qwen3-coder-plus",
  thinking: "off",
  timeoutSeconds: 7200
});

// 测试生成
sessions_spawn({
  task: "单元测试生成",
  label: "lann-test-generation",
  model: "qwen3-coder-next",
  thinking: "off",
  timeoutSeconds: 3600
});
```

---

## 📈 预期效果

### 开发效率

| 工作流 | 当前模型 | 优化后 | 效率提升 |
|--------|---------|--------|---------|
| 管理后台 | qwen3.5-plus | qwen3-coder-plus | +15% |
| 后端 API | qwen3.5-plus | qwen3-coder-plus | +15% |
| 前端 App | qwen3.5-plus | qwen3-coder-plus | +15% |
| 测试生成 | qwen3.5-plus | qwen3-coder-next | +50% |
| 业务设计 | qwen3.5-plus | glm-5 | +20% |
| **整体** | - | - | **+20%** |

### 成本优化

| 模型 | 占比 | 成本变化 |
|------|------|---------|
| qwen3-coder-next | 40% | -50% |
| qwen3-coder-plus | 45% | 持平 |
| glm-5 | 10% | 持平 |
| qwen3.5-plus | 5% | 持平 |

**整体成本:** 降低约 **20%**

---

## ✅ 实施确认

**已确认事项:**
- ✅ 剔除 MiniMax-M2.5
- ✅ 使用阿里百炼全系模型
- ✅ 立即实施 (Phase 2 开始)
- ✅ project-management-skills 集成

**执行清单:**
- [ ] 更新 LOG_CHARTERS.md
- [ ] 更新 PARALLEL_DEVELOPMENT_PLAN.md
- [ ] 配置 models.json profiles
- [ ] Phase 2 Subagent 使用新模型
- [ ] 监控质量和成本

---

**状态:** 等待立即执行！🚀
