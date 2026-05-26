---
title: JXD Image Generation
category: projects
tags: [jxd-image-generation, git, project-management]
summary: JXD Image Generation was moved toward standalone repository management with explicit Git initialization and parent-repo exclusion.
created: 2026-05-25 17:18:00 CST
updated: 2026-05-25 17:18:00 CST
base_confidence: 0.68
lifecycle: draft
lifecycle_changed: 2026-05-25
provenance:
  extracted: 0.78
  inferred: 0.22
sources:
  - ~/.codex/sessions/2026/05/12/rollout-2026-05-12T14-07-17-019e1acc-002c-7fb1-915a-212357ce28e9.jsonl
  - ~/.codex/sessions/2026/05/12/rollout-2026-05-12T15-29-20-019e1b17-1fc0-7202-ac27-88d03ae11624.jsonl
---

# JXD Image Generation

The durable project-management lesson from Codex history is that this project should be treated as an independent repository rather than as an untracked child folder under a parent workspace repository. ^[extracted]

## Git notes

- Initialize Git inside the project root when the project should be managed independently. ^[extracted]
- Maintain a project-specific `.gitignore` for build outputs, local databases, uploads/outputs, environment files, and OS/editor artifacts. ^[extracted]
- Add the child folder to the parent repository's local exclude when necessary so the parent repo does not keep seeing it as unrelated untracked content. ^[extracted]

## Related

- [[skills/git-independent-project-management]]
