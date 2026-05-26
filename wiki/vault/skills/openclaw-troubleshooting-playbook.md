---
title: OpenClaw Troubleshooting Playbook
category: skills
tags: [openclaw, troubleshooting, operations, logs]
aliases: [OpenClaw Troubleshooting]
relationships:
  - target: "[[entities/openclaw]]"
    type: implements
  - target: "[[skills/openclaw-configuration-and-permissions]]"
    type: uses
  - target: "[[skills/openclaw-proxy-and-network-access]]"
    type: uses
sources: [_raw/openclaw/p234-docs-infra-archive-2026-05-25/]
summary: A quick triage pattern for common OpenClaw failures, centered on status, launch environment, .env inspection, and gateway logs.
provenance:
  extracted: 0.84
  inferred: 0.14
  ambiguous: 0.02
base_confidence: 0.86
lifecycle: draft
lifecycle_changed: 2026-05-25
tier: supporting
created: 2026-05-25T08:50:00Z
updated: 2026-05-25T08:50:00Z
---

# OpenClaw Troubleshooting Playbook

The fastest useful triage path on this machine is to check runtime health, injected environment, `.env`, and gateway logs before guessing at provider or connector failure.

## First Checks

- `openclaw status --deep`
- inspect LaunchAgent environment for `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`
- inspect `~/.openclaw/.env`
- tail recent gateway logs

## Failure Buckets

- Network or proxy path failure
- Provider configuration or API-key failure
- Channel-specific permission or scope failure
- Gateway exposure or pairing issue
- Browser/CDP capability breakage

## Reusable Heuristics

- If `.env` is correct but the gateway process lacks those variables, restart and re-inject rather than debugging the provider first.
- If only one provider fails, prioritize provider config over general gateway health.
- If a page loads but secure actions fail, distinguish network reachability from secure-context requirements.
- For browser automation issues, verify CDP port exposure before touching higher-level automation config.

## Related

- [[skills/openclaw-configuration-and-permissions]]
- [[skills/openclaw-proxy-and-network-access]]
- [[entities/openclaw]]
- [[references/openclaw-docs-infra-archive-corpus-2026-05-25]]

## Sources

- [[references/openclaw-docs-infra-archive-corpus-2026-05-25]]
