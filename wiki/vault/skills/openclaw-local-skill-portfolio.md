---
title: OpenClaw Local Skill Portfolio
category: skills
tags: [openclaw, skills, workspace, automation]
aliases: [OpenClaw Workspace Skills]
relationships:
  - target: "[[entities/openclaw]]"
    type: implements
  - target: "[[references/openclaw-p5-p8-operations-corpus-2026-05-25]]"
    type: derived_from
sources: [_raw/openclaw/p5678-sessions-skills-docs-logs-2026-05-25/]
summary: The workspace skill set is a broad local capability layer centered on knowledge tooling, business workflows, browser automation, inference routing, and operational wrappers.
provenance:
  extracted: 0.87
  inferred: 0.11
  ambiguous: 0.02
base_confidence: 0.85
lifecycle: draft
lifecycle_changed: 2026-05-25
tier: supporting
created: 2026-05-25T09:15:45Z
updated: 2026-05-25T09:15:45Z
---

# OpenClaw Local Skill Portfolio

The workspace-level skill layer is not a grab bag of generic prompts. It is a local operations toolkit where most skills wrap a script, a CLI, or a fixed business workflow.

## Families

- Knowledge and memory: daily-report, ontology, pdf-enhancer, personal-wiki, self-improving-agent, skill-creator, summarize, worklog-skill, yi-chang-bao-gao-fen-xi-skill
- Business and data operations: boss-job-collector, email-fetcher, notion, patent-information-retrieval, patent-search, price-scraping, project-manager-ai, u8-db, vgm-declaration
- Browser and acquisition workflows: find, github-project-download-analysis, playwright
- Inference, media, and document conversion: image-generation-orchestrator, infer-router, po-pdf-spec-compare, sheet-cog, taobao-native, video-analyzer-openclaw
- Operational wrappers and environment helpers: github, openclaw-slides, openclaw-usage-ui, openclaw-version-check, tavily-search, weather

## What This Suggests

- OpenClaw is being shaped around repeatable operator workflows rather than pure chat convenience.
- A large share of local skills exist to bridge external systems such as U8, Notion, Taobao, BOSS, patents, email, and browser-driven sites.
- Knowledge capture is itself first-class: wiki, ontology, summarization, and self-improvement are implemented as explicit skills rather than ad hoc habits.

## Design Traits

- Most skills specify exact scripts or command lines, which keeps them auditable.
- Skills often encode local business context, not just general-purpose tool use.
- Safety boundaries show up in the skill layer itself, especially around installation review, memory handling, and channel output rules.

## Related

- [[skills/openclaw-knowledge-maintenance-and-safety]]
- [[synthesis/openclaw-autonomy-patterns-may-2026]]
- [[references/openclaw-p5-p8-operations-corpus-2026-05-25]]
