---
title: OpenClaw P5-P8 Operations Corpus (2026-05-25)
category: references
tags: [openclaw, sessions, skills, logs, operations]
aliases: [OpenClaw P5-P8 Operations Corpus]
relationships:
  - target: "[[entities/openclaw]]"
    type: related_to
  - target: "[[skills/openclaw-cron-and-delivery-automation]]"
    type: derived_from
  - target: "[[skills/openclaw-session-rollup-and-dream-pipeline]]"
    type: derived_from
  - target: "[[skills/openclaw-local-skill-portfolio]]"
    type: derived_from
sources: [_raw/openclaw/p5678-sessions-skills-docs-logs-2026-05-25/]
summary: A curated source record for the remaining OpenClaw batches: 66 stable session transcripts, 33 local skill manuals, 5 workspace docs, and 7 representative operations logs.
provenance:
  extracted: 0.88
  inferred: 0.10
  ambiguous: 0.02
base_confidence: 0.87
lifecycle: draft
lifecycle_changed: 2026-05-25
tier: supporting
created: 2026-05-25T09:15:45Z
updated: 2026-05-25T09:15:45Z
---

# OpenClaw P5-P8 Operations Corpus (2026-05-25)

This batch closes the remaining OpenClaw ingest backlog with four artifact streams preserved under `_raw/openclaw/p5678-sessions-skills-docs-logs-2026-05-25/`: session history, workspace skill manuals, non-core workspace docs, and selected operational logs.

## Scope

- Stable session history: `66` indexed transcripts plus `sessions.json`, with `1` active session intentionally skipped to avoid recursive ingest.
- Workspace skill docs: `33` local `SKILL.md` files, captured as the most stable expression of the custom skill portfolio.
- Workspace docs: `5` root-level operational notes, excluding the unrelated Petco trend document to keep the OpenClaw topic boundary clean.
- Operations logs: `7` representative logs for QMD, Playwright, auto-optimization, and session-memory rollups.

## Extracted Themes

- OpenClaw is operating as a control plane with scheduled delivery jobs, channel-facing replies, subagent execution, and nightly memory maintenance.
- The local skill layer is broad but opinionated: most workspace skills are workflow wrappers around scripts, CLIs, or structured external systems rather than generic prompts.
- Session-memory rollups and dream narratives function as secondary reflection layers, not source-of-truth memory.
- Operational noise is high in raw logs and cron transcripts, so distillation has to favor patterns over chronology.
- User feedback actively changes the automation surface; high-frequency pushes were reduced when token-usage noise became visible.

## Session Mix

- Cron sessions: `7`
- Dashboard/webchat sessions: `7` stable, plus one skipped active dashboard session
- DingTalk connector sessions: `4`
- Subagent sessions: `2`
- Dreaming sessions: `44`

## Representative Raw Sources

- `_raw/openclaw/p5678-sessions-skills-docs-logs-2026-05-25/sessions/sessions.json`
- `_raw/openclaw/p5678-sessions-skills-docs-logs-2026-05-25/sessions/f51886ba-2d0b-46ce-b201-e9ea82c6df13.jsonl`
- `_raw/openclaw/p5678-sessions-skills-docs-logs-2026-05-25/sessions/9c6c81af-ffe4-413d-a894-c5f8ae080fd4.jsonl`
- `_raw/openclaw/p5678-sessions-skills-docs-logs-2026-05-25/skills/personal-wiki/SKILL.md`
- `_raw/openclaw/p5678-sessions-skills-docs-logs-2026-05-25/docs/openclaw-knowledge-base.md`
- `_raw/openclaw/p5678-sessions-skills-docs-logs-2026-05-25/logs/session-memory-rollup.out.log`
- `_raw/openclaw/p5678-sessions-skills-docs-logs-2026-05-25/logs/qmd-update.log`

## Filtering Notes

- Active session transcripts were skipped because they are still mutating.
- Dreaming transcripts were archived but treated as interpretive artifacts, not authoritative facts.
- Root docs and logs were selected for durable operational value rather than copied wholesale.
- The non-OpenClaw file `petco_h1_2027_trend_summary.md` remains outside this batch on purpose.

## Sources

- [[skills/openclaw-cron-and-delivery-automation]]
- [[skills/openclaw-session-rollup-and-dream-pipeline]]
- [[skills/openclaw-local-skill-portfolio]]
- [[skills/openclaw-knowledge-maintenance-and-safety]]
