---
title: PO File Search
category: projects
tags: [po-file-search, synology, openclaw, dingtalk, file-search]
summary: PO File Search supports conversational lookup of Synology-hosted purchase files and delivery back to users through channels such as DingTalk.
created: 2026-05-25 17:18:00 CST
updated: 2026-05-25 17:18:00 CST
base_confidence: 0.77
lifecycle: draft
lifecycle_changed: 2026-05-25
provenance:
  extracted: 0.84
  inferred: 0.16
sources:
  - ~/.codex/sessions/2026/05/20/rollout-2026-05-20T10-57-18-019e4350-f098-7272-967b-d252662eddea.jsonl
---

# PO File Search

PO File Search addresses a purchasing workflow: users ask through OpenClaw to quickly find files on a Synology/file server by folder or filename, then receive the file through delivery channels such as DingTalk. ^[extracted]

## Architecture intent

- OpenClaw runs in Linux and acts as the conversational entry point. ^[extracted]
- The file index points at mounted shared folders. ^[extracted]
- Search result delivery must include a reliable download/send path, not just filename matching. ^[extracted]

## Operational pattern

When changing shared-file scope:

1. Stop the service before changing scan roots. ^[extracted]
2. Verify the mounted directory exists in the current OS environment. ^[extracted]
3. Clear or rebuild the SQLite index. ^[extracted]
4. Re-index, restart, and verify download delivery. ^[extracted]

macOS and LinuxOS paths/mounts differ, so the README should keep separate operating instructions for each environment. ^[extracted]

## Related

- [[entities/openclaw]]
- [[entities/dingtalk-connector]]
- [[skills/openclaw-dingtalk-push-operations]]
- [[skills/local-business-app-deployment-patterns]]
