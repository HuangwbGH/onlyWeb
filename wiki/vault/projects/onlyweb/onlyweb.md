---
title: onlyWeb
category: projects
tags: [onlyweb, personal-site, portfolio, resume, docker]
summary: onlyWeb is a Dockerized personal website system for company-specific resumes, portfolio management, and isolated public portfolio pages.
created: 2026-05-25 17:18:00 CST
updated: 2026-05-25 17:18:00 CST
base_confidence: 0.74
lifecycle: draft
lifecycle_changed: 2026-05-25
provenance:
  extracted: 0.82
  inferred: 0.18
sources:
  - ~/.codex/sessions/2026/05/18/rollout-2026-05-18T08-40-06-019e3886-9bad-7250-ba31-433468e453a5.jsonl
---

# onlyWeb

onlyWeb is a small personal website system for dynamically creating pages, tailoring resume content for different companies/roles, and providing a unified entrance to personal works. ^[extracted]

## Core modules

- Dynamic pages for different job applications and resume variants. ^[extracted]
- Portfolio/project management in the admin area. ^[extracted]
- A public portfolio entrance at `/portfolio`. ^[extracted]
- Dedicated portfolio detail pages under `/portfolio/:slug`, separated from the general site navigation. ^[extracted]

## UX rule

Portfolio pages intended for external viewing should not expose the full site header, admin links, general navigation, or footer. Project and document pages opened from the portfolio should stay in the isolated portfolio route family. ^[extracted]

## Deployment rule

The project is intended as a small Dockerized system, with build/typecheck verification before container restart. ^[extracted]

## Related

- [[skills/local-business-app-deployment-patterns]]
- [[synthesis/codex-business-application-patterns-spring-2026]]
