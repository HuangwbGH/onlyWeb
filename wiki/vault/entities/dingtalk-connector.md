---
title: DingTalk Connector
category: entities
tags: [dingtalk, connector, delivery, openclaw]
aliases: [dingtalk-connector]
relationships:
  - target: "[[entities/openclaw]]"
    type: related_to
  - target: "[[skills/openclaw-dingtalk-push-operations]]"
    type: implements
sources: [_raw/openclaw/p1-memory-2026-05-25/]
summary: The main delivery channel used by the local OpenClaw setup for scheduled pushes, operational replies, and connector-side interaction.
provenance:
  extracted: 0.74
  inferred: 0.23
  ambiguous: 0.03
base_confidence: 0.75
lifecycle: draft
lifecycle_changed: 2026-05-25
tier: supporting
created: 2026-05-25T08:35:00Z
updated: 2026-05-25T08:35:00Z
---

# DingTalk Connector

The DingTalk connector is the most visible delivery surface in this OpenClaw setup. It is used for scheduled news pushes, study pushes, token/usage reports, and routine operational interaction.

## Key Ideas

- Connector traffic is treated as channel-scoped, and session isolation across channels is a confirmed operating rule.
- Operational success is often judged at the delivery layer, for example whether a webhook push or connector message actually reaches the intended DingTalk destination.
- A substantial share of recent OpenClaw work is about making connector-driven automation stable and usable.
- Connector-side conversation summaries also surface adjacent operational topics such as MCP handling, proxy configuration, worklog use, and wiki bootstrapping. ^[inferred]

## Related

- [[entities/openclaw]]
- [[skills/openclaw-dingtalk-push-operations]]
- [[projects/openclaw/openclaw]]

## Sources

- [[references/openclaw-p1-memory-corpus-2026-04-25-to-2026-05-25]]
