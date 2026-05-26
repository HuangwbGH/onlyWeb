---
name: openclaw-usage-ui
description: Read and format OpenClaw Control UI “使用情况” metrics using the same internal UI-style usage source. Use when the user asks for today’s model usage, hourly/recent usage, per-model input/output/cacheRead totals, or wants OpenClaw usage output rendered in a fixed template. Prefer this skill when the user explicitly wants numbers aligned with the UI “使用情况” view rather than rough transcript or trajectory estimates.
---

# OpenClaw Usage UI

Use the bundled script to read usage from assistant message `usage` fields in session transcripts. This matches the UI-style “使用情况” view much better than trajectory `model.completed` aggregation.

## Quick Start

Run:

```bash
python3 /Users/mac/.openclaw/workspace/skills/openclaw-usage-ui/scripts/render_usage_ui.py
```

The script outputs the user-facing template directly.

## Rules

- Treat transcript `message.usage` as the source of truth for this skill.
- Count only assistant messages with usage payloads.
- Use `input`, `output`, and `cacheRead` fields.
- Do not invent “模型三” or later blocks when there is no data.
- Keep the output template exactly in the user-requested style unless they ask for a different format.
- If the user asks for a different time window later, update the script or invoke a variant rather than reverting to trajectory estimates.

## Output Template

Use this structure:

```text
模型一：<provider/model>

今日总输入量（M）：<value>

今日总输出量（M）：<value>

今日总缓存命中量（M）：<value>

最近一小时：输入量（M）<value>、输出量（M）<value>、缓存命中量（M）<value>
```

Repeat only for models that actually have data.

## Notes

- The current script uses Asia/Shanghai time.
- The current script scans `/Users/mac/.openclaw/agents/main/sessions/*.jsonl` and ignores `*.trajectory.jsonl`.
- Values are rendered in M with 6 decimal places.
