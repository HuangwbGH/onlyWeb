---
title: U8 ERP AI Assistant Pattern
category: skills
tags: [u8, erp, ai-assistant, business-analysis]
summary: U8 ERP AI assistants should start with query and analysis support, then move toward workflow assistance before attempting automated operations.
created: 2026-05-25 17:18:00 CST
updated: 2026-05-25 17:18:00 CST
base_confidence: 0.72
lifecycle: draft
lifecycle_changed: 2026-05-25
provenance:
  extracted: 0.78
  inferred: 0.22
sources:
  - ~/.codex/sessions/2026/05/20/rollout-2026-05-20T10-00-55-019e431d-5390-7290-ae98-bee119bd57e4.jsonl
---

# U8 ERP AI Assistant Pattern

A U8 ERP AI assistant should not start as an all-powerful automation layer. The safer route is query assistant first, analysis assistant second, workflow assistant third, and automated operation only after guardrails exist. ^[extracted]

## Staged capability model

1. Query assistant: natural-language lookup for sales, inventory, suppliers, receivables, orders, and delivery status. ^[extracted]
2. Analysis assistant: explain trends, anomalies, aging, inventory pressure, margin changes, and delivery risks. ^[extracted]
3. Workflow assistant: help draft or prepare ERP operations such as sales order drafts or document generation. ^[extracted]
4. Automation: only after permissions, audit logs, approval gates, and rollback paths are defined. ^[inferred]

## Related

- [[skills/jixinde-u8-execution-analysis]]
- [[skills/u8-license-registration-constraints]]
- [[projects/itemmark/itemmark]]
