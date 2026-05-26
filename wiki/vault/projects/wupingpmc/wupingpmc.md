---
title: Wuping PMC
category: projects
tags: [wuping, inventory, qr, docker]
summary: Wuping PMC is the predecessor module for scan-to-inventory ledger lookup, later folded into the broader ItemMark direction.
created: 2026-05-25 17:18:00 CST
updated: 2026-05-25 17:18:00 CST
base_confidence: 0.69
lifecycle: draft
lifecycle_changed: 2026-05-25
provenance:
  extracted: 0.76
  inferred: 0.24
sources:
  - ~/.codex/sessions/2026/05/08/rollout-2026-05-08T10-10-22-019e0559-a8e8-7db2-ad15-3357a504208b.jsonl
---

# Wuping PMC

Wuping PMC is a scan-based inventory ledger lookup module. It became part of the broader [[projects/itemmark/itemmark]] consolidation direction. ^[inferred]

## Deployment lesson

When hosted under the same domain as an existing label system, the app should support a configurable public base path and QR base URL so links remain under the intended subpath. ^[extracted]

## Related

- [[projects/itemmark/itemmark]]
- [[skills/local-business-app-deployment-patterns]]
