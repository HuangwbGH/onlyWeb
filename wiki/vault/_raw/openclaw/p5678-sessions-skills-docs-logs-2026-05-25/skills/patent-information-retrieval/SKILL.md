---
name: patent-information-retrieval
description: Retrieve recent patent information from 大为专利搜索网 via browser automation and CDP, log in with stored site credentials, search user-specified keywords such as “宠物包” or “宠物床”, compare 当前日期 with 公开日, keep only patents published within the last 7 days, and store structured results into SQLite. Use when the user wants a reusable patent-search skill, browser-based patent retrieval workflow, recent patent monitoring, keyword-based patent discovery, or a structured patent database pipeline.
---

# Patent Information Retrieval

## Overview

Use this skill to automate keyword-based patent retrieval from 大为专利搜索网, collect patents newly公开 within the last 7 days, and persist normalized records into SQLite for later querying, filtering, and reporting.

Use the bundled scripts as the default execution path. Prefer deterministic scripts over ad-hoc manual steps.

## Workflow

Follow this sequence as a fixed, script-first pipeline:

1. Initialize SQLite schema.
2. Ensure Chrome CDP is available on port `9222`; if not, start Chrome with remote debugging enabled.
3. Create a `search_runs` record for the current keyword.
4. Connect in CDP mode.
5. Open `https://pat.daweisoft.com/`.
6. Read login credentials from `references/site-login.md`.
7. Validate whether the authenticated search API is already usable.
8. If needed, log in and confirm login success by probing the search API again.
9. Call the site's internal search API with the authenticated browser session.
10. Store normalized result rows into SQLite using `query_text + publication_no` as the uniqueness key.
11. Run the default result-page structured enhancement via pipe/stdin-stdout and backfill SQLite without persisting large intermediate page dumps.
12. Optionally run DOM fallback enrichment only when explicitly enabled for debugging or recovery.
13. Compare `公开日` with the current date and mark whether it is within the last 7 days.
14. Compute field completeness metrics and write a lightweight structured run summary.
15. Update `search_runs` status and notes.

This pipeline should be executed through stable scripts, not manual browser clicking.

## Execution Rules

- Always use CDP mode on port `9222`.
- If CDP is unavailable, run `scripts/ensure_cdp.sh 9222` first.
- Do not expose account credentials in user-facing output.
- Use SQLite at `data/patents.db`.
- Prefer the fixed script entrypoint `scripts/run_full_pipeline.sh` for stable, repeatable execution.
- `scrape_patents.js` must not create or finish `search_runs`; run bookkeeping belongs to the orchestration layer.
- Use API-based login validation: login is considered successful only when the authenticated search API probe succeeds.
- Daily/production runs should keep SQLite plus lightweight summaries only; do not persist raw search dumps, per-keyword run logs, or large page dump files by default.
- `search_runs.raw_output_path` remains empty in normal runs and should only be used in explicit debug mode.
- Prefer a single search run per keyword and batch-write results instead of writing one field at a time.
- Result-page structured enhancement is enabled by default and is the preferred enhancement layer after API retrieval.
- DOM enrichment remains fallback-only and should not run by default in periodic tasks.
- Batch runs may reuse a shared logged-in session; if the shared session expires, the batch runner may re-establish it and continue.
- When selectors drift, patch the scripts instead of relying on manual browser interaction.
- Make the whole chain reproducible enough for periodic execution or later scheduling.

## Required Output Fields

Store these fields for each patent record:

- `No`
- `DPI`
- `公开(公告)号`
- `专利名称`
- `原始申请人`
- `申请号`
- `申请日`
- `公开日`
- `发明人`
- `IPC分类号`
- `批注`
- `授权日`
- `当前权利人`
- `法律状态`
- `专利类型`

Map them to SQLite columns as defined in `references/schema.md`:

- `No` → `no`
- `DPI` → `dpi`
- `公开(公告)号` → `publication_no`
- `专利名称` → `patent_name`
- `原始申请人` → `original_applicant`
- `申请号` → `application_no`
- `申请日` → `application_date`
- `公开日` → `publication_date`
- `发明人` → `inventors`
- `IPC分类号` → `ipc_classification`
- `批注` → `annotation`
- `授权日` → `authorization_date`
- `当前权利人` → `current_right_holder`
- `法律状态` → `legal_status`
- `专利类型` → `patent_type`

## Default Commands

### Initialize database

```bash
python3 scripts/init_db.py
```

### Ensure CDP is running

```bash
bash scripts/ensure_cdp.sh 9222
```

### Run the full fixed pipeline for one keyword

```bash
bash scripts/run_full_pipeline.sh "宠物包" 9222 100 3 1 0
```

### Run the full fixed pipeline for multiple keywords

```bash
bash scripts/run_multi_pipeline.sh "宠物包,宠物床,宠物窝" 9222 100 3
```

### Run the batch pipeline from the maintained keyword file

```bash
bash scripts/run_keywords_file_pipeline.sh config/keywords.txt 9222 100 3
```

Default keyword file:
- `config/keywords.txt`

Current maintained keywords:
- 宠物包
- 宠物背包
- 宠物双肩包
- 宠物笼
- 宠物窝
- 宠物屋

Keyword-file rules:
- One keyword per line
- Blank lines are ignored
- Lines starting with `#` are treated as comments
- Repeated keywords are automatically deduplicated
- Future additions or modifications should be recorded in `config/keywords.txt`

Multi-keyword rules:
- Supports separators: `,` `，` `;` `；` or line breaks
- Automatically deduplicates repeated keywords
- Runs one keyword at a time for stability
- Default batch retention keeps only the lightweight batch summary JSON
- One keyword failing will not stop the rest of the batch; the final exit code becomes non-zero only if any keyword failed

### Lower-level commands

Create a search run record:

```bash
python3 scripts/start_search_run.py "宠物包" "full scripted pipeline"
```

Main authenticated API extraction:

```bash
SEARCH_RUN_ID=<run_id> node scripts/scrape_patents.js --query "宠物包" --port 9222 --pageSize 100 --maxPages 3
```

Compute metrics:

```bash
python3 scripts/compute_metrics.py "宠物包"
```

Default result-page structured enhancement:

```bash
node scripts/capture_result_page_structured.js "宠物包" | python3 scripts/parse_result_detail_section.py "宠物包" > /tmp/patent_result_detail_rows.json
python3 scripts/backfill_result_detail_section.py "宠物包" < /tmp/patent_result_detail_rows.json
```

Optional DOM enrichment and backfill:

```bash
node scripts/enrich_from_result_dom.js "宠物包"
python3 scripts/backfill_from_dom.py "宠物包"
```

Finish a search run:

```bash
python3 scripts/finish_search_run.py <run_id> success "" "rows=100; recent_7_days=2"
```

Inspect stored patents:

```bash
python3 scripts/list_patents.py "宠物包" 20
python3 scripts/list_patents.py "宠物包" 20 --recent
```

## References

Read these files when needed:

- `references/site-login.md` — site URL and login credentials
- `references/schema.md` — SQLite schema and field mapping
- `config/keywords.txt` — maintained batch keyword list for recurring searches

## Implementation Notes

- `scripts/run_full_pipeline.sh` is the canonical stable entrypoint for a single keyword. It wires together database initialization, CDP startup, search-run bookkeeping, authenticated extraction, default result-page structured enhancement, optional DOM fallback enrichment, metrics computation, lightweight structured summary writing, and final status update.
- `scripts/run_multi_pipeline.sh` is the canonical batch entrypoint for ad-hoc multiple keywords. It normalizes separators, deduplicates keywords, runs them serially, and keeps only a lightweight batch summary JSON by default.
- `scripts/run_keywords_file_pipeline.sh` is the canonical maintained-keyword batch entrypoint. It reads keywords from `config/keywords.txt`, ignores comments/blank lines, deduplicates entries, ensures CDP is available, establishes one shared logged-in session, and then runs the batch pipeline.
- `scripts/write_batch_summary.py` writes a structured batch summary JSON for audit and later reporting, including keyword-file source, shared-session status, and per-keyword results.
- `scripts/scrape_patents.js` uses CDP browser login to establish or reuse an authenticated session, validates login by probing the search API, then calls the site's internal search API to retrieve structured JSON and store it into SQLite.
- `scripts/start_search_run.py` and `scripts/finish_search_run.py` make run tracking explicit and reproducible.
- `scripts/compute_metrics.py` computes field completeness and recent-window counts after each run.
- `scripts/write_summary.py` writes a structured JSON run summary under `data/summaries/`.
- `scripts/capture_result_page_structured.js` + `scripts/parse_result_detail_section.py` + `scripts/backfill_result_detail_section.py` provide the default structured enhancement path by parsing the rendered result-page field section through pipes/stdin-stdout and backfilling SQLite.
- `scripts/enrich_from_result_dom.js` + `scripts/backfill_from_dom.py` provide a secondary enrichment path to backfill fields visible in the rendered result list when list API values are missing or incomplete, but they are fallback-only.
- `scripts/list_patents.py` can be used to inspect stored data by keyword or by recent-window filter.
- Large exploratory debug scripts and raw dump files are not part of the normal retained runtime footprint and should be removed or regenerated only when explicitly debugging.
- The current implemented fields are sufficient for list-level retrieval and near-7-day filtering.
- Some fields may still require one or more detail APIs/pages for fuller coverage, especially when the list API omits richer metadata.
- Normalize Chinese dates into a consistent `YYYY-MM-DD` format before comparing dates.
- Time handling should stay consistent with Asia/Shanghai for reproducibility.
- Upsert logic preserves existing rows and refreshes `updated_at` when the same `query_text + publication_no` appears again.
- The design goal is stable re-execution for scheduled or periodic runs with minimal manual intervention.

## Validation Checklist

Before packaging or declaring the skill complete, verify all of the following:

- Login works with the stored credentials.
- Search works for at least `宠物包` and one additional keyword.
- Login success is validated by API probe, not only by page appearance.
- Only patents with `公开日` within the last 7 days are marked as included.
- All required fields are captured into SQLite.
- Duplicate records do not create extra rows for the same keyword and publication number.
- The run leaves a trace in `search_runs`.
- A lightweight structured summary is written under `data/summaries/`.
- Field completeness metrics are available after each run.
- Failures write diagnostic notes instead of silently succeeding.
