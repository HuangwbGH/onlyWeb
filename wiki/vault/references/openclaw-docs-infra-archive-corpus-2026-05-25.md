---
title: OpenClaw Docs, Infra, and Archive Corpus (2026-05-25)
category: references
tags: [openclaw, archive, infra, u8]
aliases: [OpenClaw P234 Corpus]
relationships:
  - target: "[[entities/openclaw]]"
    type: related_to
  - target: "[[projects/jixinde/jixinde]]"
    type: related_to
  - target: "[[skills/openclaw-configuration-and-permissions]]"
    type: derived_from
  - target: "[[skills/jixinde-u8-execution-analysis]]"
    type: derived_from
sources: [_raw/openclaw/p234-docs-infra-archive-2026-05-25/]
summary: A curated source record for 30 OpenClaw docs, infra notes, and archive files covering configuration, proxying, QMD, RustDesk, and Jixinde/U8 analysis.
provenance:
  extracted: 0.91
  inferred: 0.07
  ambiguous: 0.02
base_confidence: 0.9
lifecycle: draft
lifecycle_changed: 2026-05-25
tier: supporting
created: 2026-05-25T08:50:00Z
updated: 2026-05-25T08:50:00Z
---

# OpenClaw Docs, Infra, and Archive Corpus (2026-05-25)

This batch preserves 30 source files from OpenClaw docs, infrastructure notes, and curated archives. It extends the earlier memory ingest with system-facing documentation and business-analysis artifacts.

## Scope

- `docs/openclaw/` contributes configuration guides, permission notes, proxy and LAN access guidance, QMD indexing strategy, troubleshooting notes, and browser repair plans.
- `infra/` contributes local environment notes for QMD, RustDesk, and U8 connectivity.
- `archive/技术沉淀`, `archive/吉信德`, and `archive/u8-docs` contribute distilled business-analysis notes, SQL debugging context, approval-flow analysis, and U8 operational instructions.

## Extracted Themes

- OpenClaw behavior depends on multiple configuration surfaces, not one master switch.
- Network and proxy behavior is version-sensitive, especially after OpenClaw 4.5.
- QMD is an important local retrieval layer, but the current machine relies mainly on BM25 because vector search is degraded on M1.
- The local OpenClaw setup is increasingly tied to Jixinde business workflows through U8 analysis, SQL debugging, and operations support.
- Sensitive runtime details exist in raw infra files and should stay referenced rather than recopied into general wiki pages. ^[inferred]

## High-Value Source Groups

- `_raw/openclaw/p234-docs-infra-archive-2026-05-25/docs/openclaw/`
- `_raw/openclaw/p234-docs-infra-archive-2026-05-25/infra/`
- `_raw/openclaw/p234-docs-infra-archive-2026-05-25/archive/吉信德/`
- `_raw/openclaw/p234-docs-infra-archive-2026-05-25/archive/u8-docs/`
- `_raw/openclaw/p234-docs-infra-archive-2026-05-25/archive/技术沉淀/`

## Filtering Notes

- Root-level “Moved” stubs were preserved for provenance but treated as redirects, not substantive docs.
- Secrets such as passwords, keys, and internal credentials remain in raw sources only and are intentionally redacted from distilled pages. ^[inferred]
- Binary files like the archived Excel sheet and PDF were preserved as raw evidence but summarized through adjacent markdown notes.

## Related

- [[skills/openclaw-configuration-and-permissions]]
- [[skills/openclaw-proxy-and-network-access]]
- [[skills/openclaw-troubleshooting-playbook]]
- [[skills/jixinde-u8-execution-analysis]]
- [[skills/u8-license-registration-constraints]]
- [[synthesis/openclaw-jixinde-u8-integration-patterns]]

## Sources

- [[entities/openclaw]]
- [[projects/jixinde/jixinde]]
