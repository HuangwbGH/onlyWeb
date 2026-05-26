---
title: Local Business App Deployment Patterns
category: skills
tags: [docker, linuxos, configuration, deployment]
summary: Recurring deployment pattern for local business apps: Docker on LinuxOS, non-common configurable ports, docs-first delivery, and web-maintained configuration.
created: 2026-05-25 17:18:00 CST
updated: 2026-05-25 17:18:00 CST
base_confidence: 0.79
lifecycle: draft
lifecycle_changed: 2026-05-25
provenance:
  extracted: 0.70
  inferred: 0.30
sources:
  - [[references/codex-history-corpus-2026-04-20-to-2026-05-25]]
---

# Local Business App Deployment Patterns

Across Codex sessions, local business systems repeatedly use the same delivery constraints: LinuxOS deployment, Docker packaging, non-common configurable ports, and a web page for maintaining runtime configuration. ^[inferred]

## Pattern

- Keep all configurable values out of hard-coded code paths. ^[extracted]
- Provide both configuration files and web configuration pages for operational settings. ^[extracted]
- Use Docker for deployability on LinuxOS. ^[extracted]
- Avoid common host ports and make port choices configurable. ^[extracted]
- Keep README/PRD/docs updated alongside functional changes. ^[extracted]
- For same-domain deployments, support a configurable base path and generate QR/links from the configured public base URL. ^[extracted]

## Seen in

- [[projects/itemmark/itemmark]]
- [[projects/wupingpmc/wupingpmc]]
- [[projects/mailscope/mailscope]]
- [[projects/onlyweb/onlyweb]]
- [[projects/po-file-search/po-file-search]]

## Related

- [[skills/git-independent-project-management]]
