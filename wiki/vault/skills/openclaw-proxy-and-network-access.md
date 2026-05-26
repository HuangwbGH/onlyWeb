---
title: OpenClaw Proxy and Network Access
category: skills
tags: [openclaw, proxy, network, gateway]
aliases: [OpenClaw Proxy and Network Guide]
relationships:
  - target: "[[entities/openclaw]]"
    type: implements
  - target: "[[entities/qmd]]"
    type: related_to
  - target: "[[skills/openclaw-configuration-and-permissions]]"
    type: related_to
sources: [_raw/openclaw/p234-docs-infra-archive-2026-05-25/]
summary: Version-aware guidance for how OpenClaw handles proxying, LAN access, secure Control UI exposure, and provider-specific network behavior.
provenance:
  extracted: 0.8
  inferred: 0.18
  ambiguous: 0.02
base_confidence: 0.82
lifecycle: draft
lifecycle_changed: 2026-05-25
tier: supporting
created: 2026-05-25T08:50:00Z
updated: 2026-05-25T08:50:00Z
---

# OpenClaw Proxy and Network Access

OpenClaw network behavior is not uniform across versions or providers. The docs in this batch show that proxy handling, Control UI access, and provider reachability must be reasoned about explicitly.

## Key Ideas

- `~/.openclaw/.env` is the effective environment-variable file; `openclaw.env` is not used in the documented 4.5 path.
- OpenClaw 4.5 introduced a stricter OpenAI responses path where `HTTPS_PROXY` alone is insufficient; the provider needs explicit `request.proxy` configuration.
- `NO_PROXY` is part of the design, especially for services that should bypass the corporate proxy path.
- Exposing the Control UI over LAN requires more than reachability: HTTPS or localhost-like secure context, token authentication, and pairing all matter.
- Reverse proxying with Caddy plus firewall control is the documented pattern for secure LAN HTTPS access.

## Practical Patterns

- Keep proxy-sensitive providers version-aware.
- Separate internal/direct destinations from proxied internet destinations.
- Verify launch-time environment injection, not just the contents of `.env`.
- When building LAN access, treat Caddy/UFW/token/pairing as one chain rather than isolated steps.

## Related

- [[skills/openclaw-configuration-and-permissions]]
- [[skills/openclaw-troubleshooting-playbook]]
- [[entities/openclaw]]
- [[references/openclaw-docs-infra-archive-corpus-2026-05-25]]

## Sources

- [[references/openclaw-docs-infra-archive-corpus-2026-05-25]]
