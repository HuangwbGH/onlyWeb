---
name: video-analyzer-openclaw
description: Analyze a local video file or video URL with the local video-helper backend from OpenClaw. Use when the user wants to analyze a video, summarize course content, extract highlights and timestamps, generate a mind map, or test browser-compatible playback for uploaded videos.
---

# Video Analyzer For OpenClaw

Use this skill to run the local `video-helper` backend directly from OpenClaw, without depending on the Codex-side helper skill.

## Default flow

From this skill directory, run:

```bash
python3 scripts/analyze_video.py "/absolute/path/to/video.mp4" --lang zh --title "视频标题"
```

For a URL:

```bash
python3 scripts/analyze_video.py "https://www.bilibili.com/video/BV1..."
```

The wrapper will:

1. Create the backend job directly through the API.
2. Wait until the backend reaches `blocked` or `succeeded`.
3. For long videos, fetch chunks and auto-build `summaries.json`.
4. Auto-build `plan.json`.
5. Submit the plan and poll to completion.

## Outputs

Run artifacts are saved under:

`data/runs/<projectId>/<jobId>/`

Important files:

- `chunks.json`
- `summaries.json`
- `plan_request.json`
- `plan.json`

## Result page

On success, open:

`http://localhost:3000/en/projects/<projectId>/results`

## Configuration

Optional environment overrides:

- `OPENCLAW_VIDEO_HELPER_API_URL`
- `OPENCLAW_VIDEO_HELPER_FRONTEND_URL`
- `OPENCLAW_VIDEO_HELPER_SOURCE_DIR`
- `OPENCLAW_VIDEO_HELPER_AUTO_START`

The script will auto-load overrides from `.env.local` or `.env` in this skill directory.

If the backend is already running on `localhost`, no extra configuration is needed.
If you want this skill to try starting the backend itself, set `OPENCLAW_VIDEO_HELPER_SOURCE_DIR`
to the local `video-helper` project root and keep `OPENCLAW_VIDEO_HELPER_AUTO_START=1`.
