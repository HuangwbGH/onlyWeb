---
title: Git Independent Project Management
category: skills
tags: [git, repository, branch-management]
summary: Manage a project as an independent Git repository only after confirming it is not accidentally nested under or captured by a parent repository.
created: 2026-05-25 17:18:00 CST
updated: 2026-05-25 17:18:00 CST
base_confidence: 0.77
lifecycle: draft
lifecycle_changed: 2026-05-25
provenance:
  extracted: 0.82
  inferred: 0.18
sources:
  - ~/.codex/sessions/2026/05/12/rollout-2026-05-12T15-29-20-019e1b17-1fc0-7202-ac27-88d03ae11624.jsonl
  - ~/.codex/sessions/2026/05/12/rollout-2026-05-12T16-24-02-019e1b49-3352-7c50-be3e-6f059038b8e5.jsonl
---

# Git Independent Project Management

Before initializing or pushing a project, confirm which repository owns the directory. A project folder under a parent workspace repo can otherwise be mistaken for untracked content in the wrong repository. ^[extracted]

## Checklist

1. Check whether the project root already has its own `.git`. ^[extracted]
2. Check whether a parent directory is a Git repository. ^[extracted]
3. If the project should be independent, initialize Git in the project root or clone the real remote repository into a clean directory. ^[extracted]
4. Add build outputs, local databases, upload/output files, env files, `.DS_Store`, and typecheck caches to project `.gitignore`. ^[extracted]
5. If needed, add the child project path to the parent repository's local exclude to prevent accidental parent commits. ^[extracted]
6. Only add a remote and push after confirming the remote repository is the intended target. ^[extracted]

## Related

- [[entities/codex]]
- [[projects/jxd-image-generation/jxd-image-generation]]
- [[projects/itemmark/itemmark]]
