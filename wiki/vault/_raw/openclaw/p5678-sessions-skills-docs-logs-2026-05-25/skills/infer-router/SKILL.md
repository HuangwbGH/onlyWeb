---
name: infer-router
description: "Route common provider-backed inference workflows to `openclaw infer`. Use when the user wants CLI-oriented inference instead of ad hoc wrappers or custom scripts, especially for: (1) text/model runs with `openclaw infer model run`, (2) image generation or image description, (3) video generation or video description, (4) audio transcription, (5) TTS conversion, (6) web search or web fetch through infer, and (7) embedding creation. Trigger on requests to create a skill around `openclaw infer`, standardize common infer commands, or map user intents to the right infer subcommand."
---

# infer-router

Use `openclaw infer` as the default CLI surface for provider-backed inference tasks.

Read `references/infer-cheatsheet.md` when you need command examples, routing hints, or quick reminders about model/provider rules.

## Core rule

Prefer `openclaw infer ...` over one-off provider SDK snippets or custom wrappers when the job is fundamentally inference.

## Intent routing

### 1. Text / structured model runs

Use:

```bash
openclaw infer model run --prompt "..." --json
```

Use this for summarization, extraction, classification, rewriting, drafting, JSON generation, and other prompt-in / text-out tasks.

When backend choice matters, inspect or pin provider/model explicitly.

### 2. Image workflows

Use:

```bash
openclaw infer image generate --prompt "..." --json
```

For existing input images, prefer `image edit`.

For understanding an image file, use `image describe` and pass `--model <provider/model>`.

### 3. Video workflows

Use:

```bash
openclaw infer video generate --prompt "..." --json
```

For understanding an existing clip, use `video describe --file ... --model <provider/model> --json`.

### 4. Audio transcription

Use:

```bash
openclaw infer audio transcribe --file ./audio.m4a --json
```

If you specify a model, use full `provider/model` format.

### 5. TTS

Use:

```bash
openclaw infer tts convert --text "..." --output ./speech.mp3 --json
```

Use provider/voice inspection commands only when needed.

### 6. Web search / fetch

Use:

```bash
openclaw infer web search --query "..." --json
openclaw infer web fetch --url https://example.com --json
```

Prefer this when the user explicitly wants infer CLI workflows, lightweight research scripts, or JSON output for automation.

### 7. Embeddings

Use:

```bash
openclaw infer embedding create --text "..." --json
```

Use for vector creation, semantic similarity pipelines, and indexing workflows.

## Recommended workflow

1. Identify the user’s real task family.
2. Map it to the smallest correct `openclaw infer` subcommand.
3. Prefer `--json` if results will be parsed, stored, or piped to another tool.
4. If model/provider constraints matter, inspect availability before choosing.
5. Use full `<provider/model>` where infer requires it.

## Minimal examples to reuse

```bash
openclaw infer model run --prompt "Summarize this changelog" --json
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
openclaw infer tts convert --text "Build complete" --output ./build-complete.mp3 --json
openclaw infer web search --query "OpenClaw infer docs" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --json
```

## When to inspect state first

Before suggesting a concrete backend, inspect state if the task depends on:
- a specific provider
- a specific model family
- auth availability
- image/audio/video capability support

In those cases, prefer the relevant `list`, `inspect`, `providers`, or `auth status` command first.
