---
title: Wiki Index
---

# Wiki Index

*This index is automatically maintained. Last updated: 2026-05-25 17:15:45 CST*

## Concepts

*No pages yet.*

## Entities

- [[entities/codex]] - Codex is being used as a local coding and planning agent for repository inspection, documentation, implementation, Git operations, and knowledge capture. ([codex, agent, coding])
- [[entities/dingtalk-connector]] - The main delivery channel used by the local OpenClaw setup for scheduled pushes, operational replies, and connector-side interaction. ([dingtalk, connector, delivery, openclaw])
- [[entities/openclaw]] - A locally operated AI agent platform used for memory, scheduled automation, channel integrations, and business-support workflows. ([openclaw, agent, automation, operations])
- [[entities/qmd]] - A local search/indexing tool used with OpenClaw for document retrieval, currently strongest in BM25 mode on this machine. ([qmd, search, indexing, openclaw])
- [[entities/rustdesk]] - A multi-environment remote-access setup referenced in the local infra notes, with separate internal, public, and overseas server contexts. ([rustdesk, remote-access, infra, openclaw])

## Skills

- [[skills/document-automation-and-word-integration]] - Codex sessions show a repeatable pattern for improving Word documents by extracting source facts, generating a polished .docx, and preserving backups. ([word, document-automation, office])
- [[skills/git-independent-project-management]] - Manage a project as an independent Git repository only after confirming it is not accidentally nested under or captured by a parent repository. ([git, repository, branch-management])
- [[skills/jixinde-u8-execution-analysis]] - A practical analysis pattern for connecting U8 approval, procurement, inventory, and production signals into OpenClaw-assisted tracking and interpretation. ([jixinde, u8, procurement, production])
- [[skills/local-business-app-deployment-patterns]] - Recurring deployment pattern for local business apps: Docker on LinuxOS, non-common configurable ports, docs-first delivery, and web-maintained configuration. ([docker, linuxos, configuration, deployment])
- [[skills/openclaw-configuration-and-permissions]] - A practical map of the main OpenClaw configuration surfaces that control tools, command execution, gateway exposure, browser behavior, and approvals. ([openclaw, config, permissions, gateway])
- [[skills/openclaw-dingtalk-push-operations]] - A recurring operations pattern where OpenClaw prepares or delivers news, study content, and usage reports through DingTalk-connected automation. ([openclaw, dingtalk, cron, automation])
- [[skills/openclaw-memory-governance]] - The working rules for maintaining continuity in OpenClaw through curated long-term memory, daily notes, session isolation, and raw-first wiki archiving. ([openclaw, memory, governance, wiki])
- [[skills/openclaw-proxy-and-network-access]] - Version-aware guidance for how OpenClaw handles proxying, LAN access, secure Control UI exposure, and provider-specific network behavior. ([openclaw, proxy, network, gateway])
- [[skills/openclaw-skill-validation-pattern]] - OpenClaw skills should avoid hard-coded model choices, load local configuration explicitly, and validate integration through non-destructive checks. ([openclaw, skills, validation, video-analysis])
- [[skills/openclaw-troubleshooting-playbook]] - A quick triage pattern for common OpenClaw failures, centered on status, launch environment, .env inspection, and gateway logs. ([openclaw, troubleshooting, operations, logs])
- [[skills/u8-erp-ai-assistant-pattern]] - U8 ERP AI assistants should start with query and analysis support, then move toward workflow assistance before attempting automated operations. ([u8, erp, ai-assistant, business-analysis])
- [[skills/u8-license-registration-constraints]] - The key operational constraints around U8 license-lock registration, including browser, account, network, and post-registration service requirements. ([u8, registration, operations, constraints])
- [[skills/openclaw-cron-and-delivery-automation]] - The local OpenClaw setup uses cron-driven backup, learning, news, and usage jobs with DingTalk as the main delivery surface, then trims noisy jobs when operators push back. ([openclaw, cron, dingtalk, automation])
- [[skills/openclaw-session-rollup-and-dream-pipeline]] - OpenClaw maintains a secondary reflection pipeline that rolls up session memory, updates QMD collections, and generates dream-style narrative summaries from memory fragments. ([openclaw, memory, qmd, dreams])
- [[skills/openclaw-local-skill-portfolio]] - The workspace skill set is a broad local capability layer centered on knowledge tooling, business workflows, browser automation, inference routing, and operational wrappers. ([openclaw, skills, workspace, automation])
- [[skills/openclaw-knowledge-maintenance-and-safety]] - Durable OpenClaw maintenance depends on append-safe memory handling, layered knowledge documents, raw-first wiki ingest, and explicit safety review before installing new skills. ([openclaw, memory, wiki, safety])

## References

- [[references/codex-history-corpus-2026-04-20-to-2026-05-25]] - Distilled reference page for the first Codex history ingest covering completed sessions from 2026-04-20 through 2026-05-25. ([codex, history, agent-memory])
- [[references/openclaw-docs-infra-archive-corpus-2026-05-25]] - A curated source record for 30 OpenClaw docs, infra notes, and archive files covering configuration, proxying, QMD, RustDesk, and Jixinde/U8 analysis. ([openclaw, archive, infra, u8])
- [[references/openclaw-p1-memory-corpus-2026-04-25-to-2026-05-25]] - A curated source record for the first OpenClaw memory ingest batch: MEMORY.md plus 42 recent daily and session memory files. ([openclaw, memory, dingtalk, wiki])
- [[references/openclaw-p5-p8-operations-corpus-2026-05-25]] - A curated source record for the remaining OpenClaw batches: 66 stable session transcripts, 33 local skill manuals, 5 workspace docs, and 7 representative operations logs. ([openclaw, sessions, skills, logs])

## Synthesis

- [[synthesis/codex-business-application-patterns-spring-2026]] - Cross-session synthesis of how Codex is being used to build practical local business systems around U8, files, email, websites, documents, and OpenClaw. ([codex, business-apps, synthesis])
- [[synthesis/openclaw-jixinde-u8-integration-patterns]] - A synthesis of how OpenClaw is being turned into an operations and interpretation layer above Jixinde’s U8-centered workflows. ([openclaw, jixinde, u8, synthesis])
- [[synthesis/openclaw-operating-patterns-spring-2026]] - A synthesis of how the local OpenClaw setup is actually being operated: curated memory, deterministic rules, channel automation, and business-side integration. ([openclaw, synthesis, operations, governance])
- [[synthesis/openclaw-autonomy-patterns-may-2026]] - Cross-source synthesis of how the local OpenClaw setup is maturing into an autonomous operations layer built from scheduled delivery, reflective memory maintenance, custom skills, and raw-first knowledge distillation. ([openclaw, synthesis, autonomy, automation])

## Projects

- [[projects/itemmark/itemmark]] - ItemMark unifies label printing and scan-based information lookup modules, with configurable U8/database settings and Linux Docker deployment. ([itemmark, u8, label-printing, inventory, docker])
- [[projects/jixinde/jixinde]] - Jixinde is the business domain where OpenClaw is being connected to U8 workflows, procurement execution tracking, production planning, and approval-flow analysis. ([jixinde, u8, operations, openclaw])
- [[projects/jxd-image-generation/jxd-image-generation]] - JXD Image Generation was moved toward standalone repository management with explicit Git initialization and parent-repo exclusion. ([jxd-image-generation, git, project-management])
- [[projects/mailscope/mailscope]] - MailScope is a local email download and analysis tool with IMAP/POP3 support, SQLite storage, CLI, and a simple web configuration/admin interface. ([mailscope, email, imap, pop3, sqlite, docker])
- [[projects/onlyweb/onlyweb]] - onlyWeb is a Dockerized personal website system for company-specific resumes, portfolio management, and isolated public portfolio pages. ([onlyweb, personal-site, portfolio, resume, docker])
- [[projects/openclaw/openclaw]] - The local OpenClaw project combines agent operations, channel integrations, memory curation, wiki building, and business-support automation. ([openclaw, automation, wiki, u8])
- [[projects/po-file-search/po-file-search]] - PO File Search supports conversational lookup of Synology-hosted purchase files and delivery back to users through channels such as DingTalk. ([po-file-search, synology, openclaw, dingtalk, file-search])
- [[projects/wupingpmc/wupingpmc]] - Wuping PMC is the predecessor module for scan-to-inventory ledger lookup, later folded into the broader ItemMark direction. ([wuping, inventory, qr, docker])

## Journal

*No pages yet.*
