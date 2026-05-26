---
title: OpenClaw Configuration and Permissions
category: skills
tags: [openclaw, config, permissions, gateway]
aliases: [OpenClaw Config and Permissions]
relationships:
  - target: "[[entities/openclaw]]"
    type: implements
  - target: "[[skills/openclaw-troubleshooting-playbook]]"
    type: related_to
sources: [_raw/openclaw/p234-docs-infra-archive-2026-05-25/]
summary: A practical map of the main OpenClaw configuration surfaces that control tools, command execution, gateway exposure, browser behavior, and approvals.
provenance:
  extracted: 0.82
  inferred: 0.16
  ambiguous: 0.02
base_confidence: 0.84
lifecycle: draft
lifecycle_changed: 2026-05-25
tier: supporting
created: 2026-05-25T08:50:00Z
updated: 2026-05-25T08:50:00Z
---

# OpenClaw Configuration and Permissions

OpenClaw command and tool behavior is governed by several layers at once: `openclaw.json`, the gateway surface, command-execution policy, approvals, sandbox behavior, and host operating-system permissions.

## Key Ideas

- Tool access and command execution are separate concerns; a channel may be allowed to invoke a skill while the underlying exec path is still constrained.
- `tools.profile`, `tools.allow`, `tools.deny`, and `tools.exec.*` shape the tool baseline.
- `commands.native` and `commands.nativeSkills` decide whether commands run via native execution or remain constrained.
- `gateway.nodes.denyCommands` can still block high-risk operations even if other settings are permissive.
- Gateway, WebUI, browser, and terminal are different capability paths and should not be conflated.
- `.env` affects network behavior, but not all operational permissions live there.

## Most Important Surfaces

- `~/.openclaw/openclaw.json` for runtime structure and capability boundaries.
- `~/.openclaw/.env` for proxy and environment-variable injection.
- LaunchAgent/runtime environment for whether those variables actually reach the gateway.
- Exec approvals and host permissions for final command success on macOS.

## Practical Guidance

- When troubleshooting “can it run commands?”, inspect tools, commands, deny lists, approvals, sandbox, and host permissions together.
- Treat `skills: ["*"]` on a chat channel as widening the callable surface, not as unconditional host access.
- Prefer explicit, auditable settings over assuming a permissive default.

## Related

- [[skills/openclaw-proxy-and-network-access]]
- [[skills/openclaw-troubleshooting-playbook]]
- [[entities/openclaw]]
- [[references/openclaw-docs-infra-archive-corpus-2026-05-25]]

## Sources

- [[references/openclaw-docs-infra-archive-corpus-2026-05-25]]
