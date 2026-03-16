# Lann 项目定时汇报配置

## 汇报频率
- **开发阶段:** 每 4 小时检查一次进展
- **测试阶段:** 每 2 小时检查一次进展
- **上线后:** 每日汇总报告

## 汇报时间（曼谷时间 GMT+7）
- 10:00 - 早间检查
- 14:00 - 午后进展
- 18:00 - 下班前汇总
- 22:00 - 晚间检查（可选）

## 汇报内容模板

```
## 🦞 Lann 项目进度汇报

**时间:** YYYY-MM-DD HH:mm
**阶段:** 开发/测试/上线

### 本周期进展
- [完成事项 1]
- [完成事项 2]

### 进行中任务
- [任务名称] - 预计完成时间

### 阻塞问题
- [问题描述] - 需要 peng 决策

### 下周期计划
- [计划事项 1]
- [计划事项 2]

### 模型使用情况
- Orchestrator: bailian/qwen3.5-plus
- Subagent: bailian/qwen3.5-plus
- Token 消耗：估算值
```

## 触发汇报的条件

**立即汇报（不等待定时检查）：**
- Subagent 完成重要里程碑
- 遇到需要用户决策的阻塞问题
- 发生错误/异常需要处理
- 危险操作需要确认（confirm-risky 策略）

**保持沉默：**
- Subagent 正常运行中，无新进展
- 深夜时段（23:00-08:00）除非紧急

## 检查 Subagent 状态的方法

```bash
# 查看活跃会话
sessions_list --activeMinutes 60

# 查看特定会话历史
sessions_history --sessionKey <key> --limit 10

# 发送消息给 Subagent（如需询问）
sessions_send --sessionKey <key> --message "当前进展如何？"
```

## 日志更新要求

每次汇报后必须更新：
1. `LOG_PROJECTS.md` - 进度百分比 + 任务状态
2. `LOG_SESSIONS.md` - 添加汇报会话记录
3. `LOG_CACHES.md` - 更新 Subagent 状态

---

**配置日期:** 2026-03-16  
**负责人:** 小满 (Orchestrator)
