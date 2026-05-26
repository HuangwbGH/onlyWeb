---
title: Codex History Corpus 2026-04-20 to 2026-05-25
category: references
tags: [codex, history, agent-memory]
summary: Distilled reference page for the first Codex history ingest covering completed sessions from 2026-04-20 through 2026-05-25.
created: 2026-05-25 17:18:00 CST
updated: 2026-05-25 17:18:00 CST
base_confidence: 0.72
lifecycle: draft
lifecycle_changed: 2026-05-25
provenance:
  extracted: 0.82
  inferred: 0.18
sources:
  - ~/.codex/session_index.jsonl
  - ~/.codex/sessions/**/rollout-*.jsonl
---

# Codex History Corpus 2026-04-20 to 2026-05-25

This page records the first Codex history ingest into the wiki. It summarizes completed local Codex sessions rather than storing raw transcripts. ^[extracted]

## Scope

- Processed `session_index.jsonl` plus 15 completed rollout files. ^[extracted]
- Skipped the currently active wiki setup/ingest session to avoid recursive capture while the file is still changing. ^[inferred]
- Source sessions span project planning, Docker deployment, Git setup, U8/ERP analysis, OpenClaw integrations, document automation, and personal knowledge-base setup. ^[extracted]

## High-signal themes

- [[entities/codex]] is mostly used here as a hands-on coding and project-planning agent, with strong value when it can inspect local repositories and write documentation/code together. ^[inferred]
- Business applications repeatedly follow the same constraint pattern: Docker deployment on LinuxOS, non-common configurable ports, web-based configuration pages, and docs-first delivery. ^[extracted]
- Several sessions converge on [[skills/git-independent-project-management]], especially when workspace folders sit under a parent repository and should become standalone repos. ^[extracted]
- [[projects/itemmark/itemmark]], [[projects/mailscope/mailscope]], [[projects/po-file-search/po-file-search]], and [[projects/onlyweb/onlyweb]] are the most durable project knowledge extracted from Codex history. ^[extracted]

## Privacy handling

Raw prompts and command output were not copied into the wiki. Sensitive-looking operational details were generalized, and raw session files remain in the local Codex history only. ^[inferred]

## Related

- [[entities/codex]]
- [[skills/local-business-app-deployment-patterns]]
- [[skills/git-independent-project-management]]
- [[synthesis/codex-business-application-patterns-spring-2026]]
