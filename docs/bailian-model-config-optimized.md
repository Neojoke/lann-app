# 阿里云百炼模型配置优化方案

**版本:** v2.0  
**创建日期:** 2026-03-17 01:20  
**状态:** 待确认

---

## 📊 已配置模型清单

根据 OpenClaw 配置，已可用的阿里百炼模型：

| 模型 | 上下文 | 特点 | 适用场景 |
|------|--------|------|---------|
| **qwen3.5-plus** | 977k | 均衡型，当前默认 | 通用任务 |
| **qwen3-max-2026-01-23** | 256k | 最强推理 | 复杂分析 |
| **qwen3-coder-next** | 256k | 快速代码 | 简单任务 |
| **qwen3-coder-plus** | 977k | 代码专家 | 复杂开发 |
| **glm-5** | 198k | 深度分析 | 业务设计 |
| **glm-4.7** | 198k | 均衡型 | 通用任务 |
| **MiniMax-M2.5** | 200k | 多模态 | 前端/UI |

---

## 🎯 优化配置方案

### 方案 A: 全阿里系 (推荐)

**核心思路:** 最大化利用已配置模型，减少外部依赖

| 场景 | 模型 | 理由 |
|------|------|------|
| **管理后台开发** | qwen3-coder-plus | 代码质量高，977k 上下文 |
| **后端 API** | qwen3-coder-plus | TypeScript/Node.js 支持好 |
| **前端 App** | MiniMax-M2.5 | 多模态能力，UI/视觉优化 |
| **业务设计** | glm-5 | 逻辑推理强，适合架构设计 |
| **快速任务** | qwen3-coder-next | 响应快，成本低 |
| **文档生成** | qwen3-coder-next | 成本低，质量好 |

### 方案 B: 混合增强

**核心思路:** 关键任务用强模型，日常任务用快模型

| 场景 | 模型 | 理由 |
|------|------|------|
| **核心业务开发** | qwen3-max-2026-01-23 | 最强推理能力 |
| **常规开发** | qwen3-coder-plus | 性价比高 |
| **前端 App** | MiniMax-M2.5 | UI/视觉优化 |
| **快速迭代** | qwen3-coder-next | 快速响应 |

---

## 📋 Phase 2 模型分配

### Workflow A: 管理后台开发

| 任务 | 模型 | 说明 |
|------|------|------|
| Phase 2: 业务组件 | qwen3-coder-plus | React/Ionic 组件开发 |
| Phase 3: 后端集成 | qwen3-coder-plus | API 集成 |
| Phase 4: 测试 | qwen3-coder-next | 测试代码生成 |

### Workflow B: 后端完善

| 任务 | 模型 | 说明 |
|------|------|------|
| API 开发 | qwen3-coder-plus | Hono/TypeScript |
| 基础设施 | qwen3-coder-plus | 连接池/缓存 |
| 测试 | qwen3-coder-next | 单元测试生成 |

### Workflow C: 前端 App

| 任务 | 模型 | 说明 |
|------|------|------|
| 页面开发 | MiniMax-M2.5 | UI/UX 优化 |
| 服务层 | qwen3-coder-plus | TypeScript 服务 |
| 样式优化 | MiniMax-M2.5 | 视觉优化建议 |

---

## 💰 成本优化预估

### 当前配置 (全部 qwen3.5-plus)
```
日均任务：100 个
平均成本：$0.01/任务
日均成本：$1.00
月均成本：$30.00
```

### 优化后配置
```
快速任务 (50%): qwen3-coder-next → $0.005/任务
常规开发 (40%): qwen3-coder-plus → $0.01/任务
复杂分析 (10%): glm-5 → $0.015/任务

日均成本：$0.75 (降低 25%)
月均成本：$22.50
```

---

## 🚀 实施步骤

### Step 1: 更新 models.json

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

### Step 2: 更新工作流配置

**管理后台工作流:**
```json
{
  "label": "lann-admin-phase2",
  "model": "qwen3-coder-plus",
  "thinking": "on"
}
```

**后端工作流:**
```json
{
  "label": "lann-backend-complete",
  "model": "qwen3-coder-plus",
  "thinking": "on"
}
```

**前端工作流:**
```json
{
  "label": "lann-frontend-complete",
  "model": "MiniMax-M2.5",
  "thinking": "off"
}
```

### Step 3: 测试验证

**测试任务:**
1. 代码生成测试 (qwen3-coder-plus)
2. UI 优化测试 (MiniMax-M2.5)
3. 快速问答测试 (qwen3-coder-next)
4. 业务分析测试 (glm-5)

**验证标准:**
- 代码质量 ≥ 当前水平
- 响应速度提升 ≥ 20%
- 成本降低 ≥ 25%

---

## ✅ 确认事项

**请 peng 确认:**

1. [ ] **模型分配方案**
   - 管理后台：qwen3-coder-plus
   - 后端 API：qwen3-coder-plus
   - 前端 App：MiniMax-M2.5
   - 业务设计：glm-5
   - 快速任务：qwen3-coder-next

2. [ ] **切换时机**
   - [ ] 立即切换 (Phase 2 开始)
   - [ ] Phase 1 完成后再切换

3. [ ] **MiniMax-M2.5 使用范围**
   - [ ] 仅前端 App
   - [ ] 前端 App + 管理后台 UI

4. [ ] **思考模式配置**
   - [ ] 开发任务开启 thinking
   - [ ] 快速任务关闭 thinking

---

## 📊 对比分析

### MiniMax-M2.5 vs qwen3-coder-plus

| 维度 | MiniMax-M2.5 | qwen3-coder-plus |
|------|-------------|------------------|
| **上下文** | 200k | 977k |
| **代码能力** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **UI/视觉** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **响应速度** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **成本** | 中等 | 中等 |

**推荐:** 前端 App 用 MiniMax-M2.5，后端用 qwen3-coder-plus

### qwen3-coder-next vs qwen3.5-plus

| 维度 | qwen3-coder-next | qwen3.5-plus |
|------|-----------------|--------------|
| **上下文** | 256k | 977k |
| **代码能力** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **响应速度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **成本** | 低 (50% 降低) | 中等 |

**推荐:** 快速任务用 qwen3-coder-next，复杂任务用 qwen3.5-plus/coder-plus

---

## 🎯 预期效果

### 开发效率
- 代码质量：提升 10-20%
- 响应速度：提升 20-30%
- 上下文理解：提升 (977k/200k vs 256k)

### 成本优化
- 快速任务：50% 成本降低
- 整体成本：25% 成本降低
- 月均节省：$7.50

### 质量提升
- 前端 UI：MiniMax 多模态优化
- 后端代码：coder-plus 专业化
- 业务设计：glm-5 深度分析

---

**等待确认后执行配置！** 👿
