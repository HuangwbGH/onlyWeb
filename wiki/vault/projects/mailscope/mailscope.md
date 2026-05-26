---
title: MailScope
category: projects
tags: [mailscope, email, imap, pop3, sqlite, docker]
summary: MailScope is a local email download and analysis tool with IMAP/POP3 support, SQLite storage, CLI, and a simple web configuration/admin interface.
created: 2026-05-25 17:18:00 CST
updated: 2026-05-25 17:18:00 CST
base_confidence: 0.76
lifecycle: draft
lifecycle_changed: 2026-05-25
provenance:
  extracted: 0.84
  inferred: 0.16
sources:
  - ~/.codex/sessions/2026/05/22/rollout-2026-05-22T08-53-30-019e4d2c-5095-7091-a0ab-d12fb469830f.jsonl
---

# MailScope

MailScope is planned as a personal local program that downloads email, stores metadata/content locally, and analyzes email information through both a web admin page and CLI. ^[extracted]

## Requirements

- Support both IMAP and POP3. ^[extracted]
- Support at least enterprise email and 163 email. ^[extracted]
- Use SQLite for local storage. ^[extracted]
- Provide simple web pages showing database tables/fields and configuration information. ^[extracted]
- Make configurable items editable from a web configuration page. ^[extracted]
- Support Docker deployment on LinuxOS. ^[extracted]

## Enterprise mail finding

For the tested enterprise mail server, SSL ports 993/995 were refused, while non-SSL ports 143/110 were reachable. The practical starting configuration was IMAP on port 143 without SSL/TLS, or POP3 on port 110 without SSL/TLS. ^[extracted]

## Related

- [[skills/local-business-app-deployment-patterns]]
- [[synthesis/codex-business-application-patterns-spring-2026]]
