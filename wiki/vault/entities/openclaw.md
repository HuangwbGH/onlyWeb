---
title: OpenClaw
category: entities
tags: [openclaw, agent, automation, operations]
aliases: [OpenClaw Workspace, Local OpenClaw]
relationships:
  - target: "[[entities/dingtalk-connector]]"
    type: uses
  - target: "[[entities/qmd]]"
    type: uses
  - target: "[[projects/openclaw/openclaw]]"
    type: related_to
  - target: "[[skills/openclaw-memory-governance]]"
    type: uses
sources: [_raw/openclaw/p1-memory-2026-05-25/]
summary: A locally operated AI agent platform used for memory, scheduled automation, channel integrations, and business-support workflows.
provenance:
  extracted: 0.76
  inferred: 0.21
  ambiguous: 0.03
base_confidence: 0.79
lifecycle: draft
lifecycle_changed: 2026-05-25
tier: supporting
created: 2026-05-25T08:35:00Z
updated: 2026-05-25T08:35:00Z
---

# OpenClaw

OpenClaw is the local agent runtime that anchors the current operational workflow: it keeps curated memory, runs scheduled jobs, connects to chat channels, manages skills, and acts as a control plane for business-support tasks.

## Key Ideas

- OpenClaw is treated as a persistent operating environment with explicit memory files, not just a transient conversation surface.
- The local setup emphasizes skills, channel connectors, cron-style automation, and structured workspace knowledge.
- DingTalk is a primary downstream surface for pushes, reports, and operational interaction.
- The environment is used to support business-facing workflows such as U8 analysis, procurement and delivery tracking, and internal knowledge organization.
- The runtime increasingly acts as a bridge between raw documents, operational memory, and the Obsidian wiki. ^[inferred]

## Operational Role

- Hosts and routes skill-based workflows.
- Persists long-term rules in `MEMORY.md` and short-term developments in daily memory files.
- Supports recurring scheduled pushes, including news, study materials, and token/usage reporting.
- Serves as a practical orchestration layer around business data, documents, and internal collaboration tools.

## Related

- [[entities/dingtalk-connector]] — primary delivery channel in the current operating pattern
- [[entities/qmd]] — retrieval/index support layer
- [[skills/openclaw-memory-governance]] — how continuity is maintained
- [[skills/openclaw-dingtalk-push-operations]] — how scheduled outbound workflows are run
- [[skills/openclaw-configuration-and-permissions]] — capability boundaries
- [[skills/openclaw-proxy-and-network-access]] — network behavior and secure access
- [[projects/openclaw/openclaw]] — current project-level operating context
- [[references/openclaw-p1-memory-corpus-2026-04-25-to-2026-05-25]] — source batch for this page

## Sources

- [[references/openclaw-p1-memory-corpus-2026-04-25-to-2026-05-25]]
