---
title: QMD
category: entities
tags: [qmd, search, indexing, openclaw]
aliases: [QMD Local Search]
relationships:
  - target: "[[entities/openclaw]]"
    type: uses
  - target: "[[skills/openclaw-proxy-and-network-access]]"
    type: related_to
sources: [_raw/openclaw/p234-docs-infra-archive-2026-05-25/]
summary: A local search/indexing tool used with OpenClaw for document retrieval, currently strongest in BM25 mode on this machine.
provenance:
  extracted: 0.79
  inferred: 0.19
  ambiguous: 0.02
base_confidence: 0.81
lifecycle: draft
lifecycle_changed: 2026-05-25
tier: supporting
created: 2026-05-25T08:50:00Z
updated: 2026-05-25T08:50:00Z
---

# QMD

QMD is the local document-search layer used alongside OpenClaw. On the current machine it is operational for lexical retrieval and partially constrained for vector-heavy workflows.

## Key Ideas

- QMD is installed locally and used as a search/index layer rather than as the source of truth.
- BM25 search is working reliably.
- Vector and hybrid search are limited on the current Apple M1 setup.
- The indexed collections include OpenClaw memories and workspace-oriented corpora.
- Maintenance mainly centers on `qmd update`, with embeddings handled more selectively.

## Related

- [[entities/openclaw]]
- [[skills/openclaw-proxy-and-network-access]]
- [[references/openclaw-docs-infra-archive-corpus-2026-05-25]]

## Sources

- [[references/openclaw-docs-infra-archive-corpus-2026-05-25]]
