---
name: daily-report
description: 自动生成每日、每周工作报告，从会话历史提取工作内容，结构化总结并推送到钉钉
metadata:
  openclaw:
    emoji: "📊"
    requires:
      bins: ["jq", "curl"]
    entries:
      daily-report:
        path: scripts/daily_report.py
        description: 生成每日工作报告
      weekly-report:
        path: scripts/weekly_report.py
        description: 生成每周工作报告
---

# Daily Report Skill

自动化的日报、周报生成工具。

## 功能

- **每日报告**: 每天 21:00 自动生成，从会话历史提取工作内容
- **每周报告**: 每周日 20:00 自动生成本周总结
- **智能总结**: AI 提炼关键工作项，结构化呈现
- **推送通知**: 自动发送到钉钉
- **本地存储**: 保存结构化记忆文件

## 报告格式

### 每日报告

```markdown
## 今日完成的工作
- 任务1（简洁描述）
- 任务2

## 成本统计
- 今日花费: $X.XX

## 遇到的问题
- 问题描述 或 无

## 明日计划
- 计划1 或 待定
```

### 每周报告

```markdown
## 本周完成的工作
- 任务1
- 任务2

## 本周成本
- 总花费: $X.XX

## 本周问题
- 问题1
- 无

## 下周计划
- 计划1
```

## 使用方法

### 手动生成日报

```bash
./scripts/daily_report.py [YYYY-MM-DD]
```

### 手动生成周报

```bash
./scripts/weekly_report.py [YYYY-MM-DD]
```

### 自动调度

通过 cron 设置定时任务：
- 每日 21:00: 生成日报
- 每周日 20:00: 生成周报

## 配置

在 `scripts/config.py` 中配置：
- 钉钉 Webhook URL
- 工作日/周末设置
- 报告模板

## 输出

- **记忆文件**: `~/.openclaw/workspace/memory/YYYY-MM-DD.md`
- **钉钉推送**: Markdown 格式消息卡片
