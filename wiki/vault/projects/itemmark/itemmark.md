---
title: ItemMark
category: projects
tags: [itemmark, u8, label-printing, inventory, docker]
summary: ItemMark unifies label printing and scan-based information lookup modules, with configurable U8/database settings and Linux Docker deployment.
created: 2026-05-25 17:18:00 CST
updated: 2026-05-25 17:18:00 CST
base_confidence: 0.75
lifecycle: draft
lifecycle_changed: 2026-05-25
provenance:
  extracted: 0.82
  inferred: 0.18
sources:
  - ~/.codex/sessions/2026/05/09/rollout-2026-05-09T08-43-39-019e0a30-9e85-78e1-8047-24d7a8e69cfa.jsonl
  - ~/.codex/sessions/2026/05/12/rollout-2026-05-12T16-24-02-019e1b49-3352-7c50-be3e-6f059038b8e5.jsonl
---

# ItemMark

ItemMark is the consolidation target for two earlier systems: a material-label printing system and the Wuping scan-to-inventory ledger system. ^[extracted]

## Product intent

- One deployable system should serve multiple modules under a single domain and server. ^[extracted]
- Different modules need different QR behaviors: one scans to material information, another scans to inventory ledger information. ^[extracted]
- Each module should keep independently configurable U8 account set, database address, database user, database password, and QR template. ^[extracted]

## Deployment constraints

- Target deployment is LinuxOS with Docker. ^[extracted]
- Public access is expected through the same domain rather than separate unrelated systems. ^[extracted]
- Ports and base paths should be configurable and avoid common ports. ^[inferred]

## U8 ledger knowledge

The Wuping inventory ledger SQL work identified that U8 ledger queries need to cover multiple receipt/inventory document families and join receipt style names where possible. ^[extracted]

Durable implementation note:

- Add produced-goods receipt sources such as `rdrecord10 / rdrecords10` when inventory ledger semantics require them. ^[extracted]
- For receipt families such as `rdrecord01/08/09/11/32`, join `Rd_Style` through `cRdCode` to improve document type names. ^[extracted]

## Git/workflow note

A local folder under a parent workspace repository should not be pushed accidentally as an untracked child of the wrong repository. Clone or initialize the correct standalone ItemMark repo before pushing changes. ^[extracted]

## Related

- [[skills/u8-license-registration-constraints]]
- [[skills/jixinde-u8-execution-analysis]]
- [[skills/local-business-app-deployment-patterns]]
- [[synthesis/openclaw-jixinde-u8-integration-patterns]]
