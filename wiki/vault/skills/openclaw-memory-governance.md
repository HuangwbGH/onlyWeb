---
title: OpenClaw Memory Governance
category: skills
tags: [openclaw, memory, governance, wiki]
aliases: [Memory Governance for OpenClaw]
relationships:
  - target: "[[entities/openclaw]]"
    type: implements
  - target: "[[projects/openclaw/openclaw]]"
    type: uses
sources: [_raw/openclaw/p1-memory-2026-05-25/]
summary: The working rules for maintaining continuity in OpenClaw through curated long-term memory, daily notes, session isolation, and raw-first wiki archiving.
provenance:
  extracted: 0.84
  inferred: 0.14
  ambiguous: 0.02
base_confidence: 0.87
lifecycle: draft
lifecycle_changed: 2026-05-25
tier: supporting
created: 2026-05-25T08:35:00Z
updated: 2026-05-25T08:35:00Z
---

# OpenClaw Memory Governance

This page captures the stable operating rules behind continuity in the local OpenClaw environment: what belongs in long-term memory, what belongs in daily notes, when cross-session recall is allowed, and how wiki ingest should preserve raw evidence.

## Key Ideas

- `MEMORY.md` stores durable facts: user preferences, long-term rules, stable business context, and recurring priorities.
- `memory/YYYY-MM-DD.md` stores short-term developments, timestamped operational events, and daily task context.
- Session isolation is explicit: direct-message memory is scoped per channel peer, and cross-channel recall should not happen silently.
- Skill installation is governed by a safety-first flow: security check, safety report, user confirmation, then installation.
- Wiki ingest follows a raw-first rule: preserve original files under the wiki raw area before distilling them into category pages.
- Continuity in this setup depends more on curated memory files than on raw transcript replay. ^[inferred]

## Practical Rules

- Record durable facts immediately when the user says “remember”.
- Promote only genuinely stable items from daily memory into long-term memory.
- Keep sensitive or external-action details out of broad memory by default.
- Treat raw source preservation as part of the ingest contract, not an optional convenience.

## Related

- [[entities/openclaw]]
- [[projects/openclaw/openclaw]]
- [[references/openclaw-p1-memory-corpus-2026-04-25-to-2026-05-25]]

## Sources

- [[references/openclaw-p1-memory-corpus-2026-04-25-to-2026-05-25]]
