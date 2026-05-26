---
title: OpenClaw Cron And Delivery Automation
category: skills
tags: [openclaw, cron, dingtalk, automation, delivery]
aliases: [OpenClaw Cron Automation]
relationships:
  - target: "[[entities/openclaw]]"
    type: implements
  - target: "[[entities/dingtalk-connector]]"
    type: uses
  - target: "[[references/openclaw-p5-p8-operations-corpus-2026-05-25]]"
    type: derived_from
sources: [_raw/openclaw/p5678-sessions-skills-docs-logs-2026-05-25/]
summary: The local OpenClaw setup uses cron-driven backup, learning, news, and usage jobs with DingTalk as the main delivery surface, then trims noisy jobs when operators push back.
provenance:
  extracted: 0.86
  inferred: 0.12
  ambiguous: 0.02
base_confidence: 0.85
lifecycle: draft
lifecycle_changed: 2026-05-25
tier: supporting
created: 2026-05-25T09:15:45Z
updated: 2026-05-25T09:15:45Z
---

# OpenClaw Cron And Delivery Automation

The scheduled automation pattern is straightforward but disciplined: generate or collect something locally, format it for a chat surface, and deliver it through DingTalk with compact text instead of table-heavy output.

## Core Job Types

- Configuration preservation: hourly and nightly `openclaw.json` backups.
- Knowledge delivery: morning, afternoon, and evening study pushes sourced from a local learning knowledge base.
- External awareness: daily news push that blends general AI/news topics with ERP-specific monitoring.
- Telemetry delivery: token-usage reporting based on assistant `message.usage` rather than trajectory-only accounting.

## Delivery Rules

- DingTalk is the default downstream surface for recurring pushes.
- Push text is deliberately concise and list-oriented.
- The chat surface is part of the product: formatting and noise level matter as much as the underlying job.

## Operational Adjustment Pattern

One DingTalk session shows the operator complaining that token usage had become unexpectedly high. The response was not to defend the automation volume, but to shut down several high-frequency pushes and keep only the safer backbone jobs such as nightly backup and memory-maintenance flows. ^[extracted]

## Representative Session Prompts
- `[cron:5dbf8ef8-b9f5-4be8-a57a-44317c26adbc openclaw.json hourly backup] 执行备份脚本: /Users/mac/.openclaw/scripts/backup_openclaw.sh 完成后无需回复。 Current time: Monday, May 4th, 2026 - 9:03 PM (Asia/Shanghai) / 2026-05-04 13:03 UT`
- `[cron:1ac296a0-aa08-4773-a3d6-ab795696f8e0 📰 每日新闻推送] 请执行每日新闻推送任务： ## 任务要求 使用 tavily 搜索以下两个领域的新闻，各筛选4-5条，共8-10条推送到钉钉。 ### 领域1: 综合科技新闻 - 搜索关键词: AI人工智能、大模型、科技行业动态 - 筛选标准: 今日重要新闻，2026年最新 ### 领域2: ERP企业资源计划 ⭐新增 - 搜索关键词: ERP、S`
- `[cron:7cbe02fd-49cf-4bdd-9cc8-fed962fa92ce 📚 早间学习推送 - OpenClaw] 执行早间学习推送任务： 1. 读取知识库 ~/.openclaw/skills/study/knowledge_base.md 2. 筛选 OpenClaw 相关知识点 3. 使用 message 工具推送到钉钉 推送格式: - 标题: 🌅 早安！今日份学习知识已送达 - 内容: OpenClaw 知识点（简洁`
- `[cron:69336bcf-fbf9-4465-804f-f8188e8cc5dd 📚 午后学习推送 - LangChain] 执行午后学习推送任务： 1. 读取知识库 ~/.openclaw/skills/study/knowledge_base.md 2. 筛选 LangChain 相关知识点 3. 使用 message 工具推送到钉钉 推送格式: - 标题: ☀️ 午后时光，继续学习 - 内容: LangChain 知识点 - `
- `[cron:a95a942d-9a97-470c-8c97-b83cbdce2963 📚 晚间学习推送 - ComfyUI/RAG] 执行晚间学习推送任务： 1. 读取知识库 ~/.openclaw/skills/study/knowledge_base.md 2. 筛选 ComfyUI/RAG 相关知识点 3. 使用 message 工具推送到钉钉 推送格式: - 标题: 🌙 晚间学习，丰富头脑 - 内容: ComfyUI/RAG 知`

## Reusable Heuristics

- Measure usage with the same accounting logic exposed in the UI if humans will compare against the UI.
- Keep scheduled pushes narrow and reversible; when they become noisy, reduce frequency before changing content.
- Preserve backups silently unless a failure requires operator attention.

## Related

- [[skills/openclaw-dingtalk-push-operations]]
- [[skills/openclaw-knowledge-maintenance-and-safety]]
- [[references/openclaw-p5-p8-operations-corpus-2026-05-25]]
