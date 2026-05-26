---
name: github-project-download-analysis
description: Analyze a GitHub project by opening the repository page in a normal browser window, using real human-like browser interaction to click Code → Download ZIP, waiting for the ZIP to appear in /Users/mac/Downloads, unpacking it, and analyzing the full project locally. Use when the user sends a GitHub repository URL and wants project download analysis, including what the project does, what it is used for, how to use it, and whether it has security risks. Prefer this skill for requests like “分析这个 GitHub 项目”, “下载并分析 GitHub 仓库”, “帮我看看这个 GitHub 项目是干什么的”, or similar GitHub link analysis tasks.
---

# GitHub Project Download Analysis

Use this skill when the user provides a GitHub repository link and wants the repository downloaded from the web UI, then analyzed locally.

## Hard requirements

- Use a **normal browser window**, not a CDP-driven download flow.
- Open the GitHub repository page in the browser.
- Download via the web page flow: **Code → Download ZIP**.
- Perform the download click path through **real browser interaction** that mirrors a human user opening the page and clicking visible UI elements.
- Do **not** use a local script to replace or short-circuit the click actions for **Code** or **Download ZIP**.
- Do not replace this with `git clone`, `gh repo clone`, or direct archive URL download unless the user explicitly changes the requirement.
- The assistant should simulate real human-like interaction in the normal browser window to click **Code** and then **Download ZIP**.
- Only if normal-browser automation is unavailable after a real attempt should the assistant ask the user to click in the normal browser window, then continue once the ZIP lands in `/Users/mac/Downloads`.

## Expected workflow

1. Validate that the input is a GitHub repository URL.
2. Open the repository page in a normal browser window.
3. Click **Code**.
4. Click **Download ZIP**.
5. Wait for the ZIP to fully appear in `/Users/mac/Downloads`.
6. The assistant should perform the visible click path in the normal browser window using real human-like browser interaction.
7. Only if that normal-browser interaction is unavailable should the assistant ask the user to click manually and continue after the ZIP lands.
8. Unpack the ZIP into a dedicated analysis directory.
9. Analyze the full extracted project.
10. Report:
   - What the project is
   - What it is used for
   - How to use it
   - Security observations and risk level

## Download location

Canonical final download directory:
- `/Users/mac/Downloads`

Mandatory rule:
- The ZIP must finish downloading into `/Users/mac/Downloads` before analysis starts.
- Local project analysis must use the final ZIP located in `/Users/mac/Downloads` as the canonical source.
- Do not analyze a temporary or partial browser download.
- The downloaded ZIP filename may vary with the repository default branch. In real tests, GitHub produced names such as `repo-main.zip` and `repo-master.zip`.
- When locating the final ZIP, match by repository name and newest download time rather than assuming a fixed `main.zip` suffix.

Default analysis workspace root:
- `~/Downloads/github-project-analysis/`

Create a per-run folder using repository name + timestamp.

## Use bundled scripts

- Use `scripts/github_keyboard_download.sh <github-repo-url>` to perform the verified normal-browser keyboard interaction for GitHub ZIP download.
- The script generates human-like random delays on the shell side, then executes a temporary AppleScript file with fixed delay values for stable playback.
- This structure avoids unstable in-script random handlers and avoids brittle multi-line `osascript -e` command composition.
- Use `scripts/github_download_analyze.py` to:
  - watch for the newest ZIP after browser download
  - work from the canonical final file location `/Users/mac/Downloads`
  - unpack it
  - scan the project
  - generate a structured markdown summary
- Do not rely on CDP startup or CDP-only browser download handling for this skill.

## Browser interaction guidance

When driving the page:
- Open the repository URL directly in a normal browser window.
- Use the browser UI in a way that mirrors a human operator.
- Click visible controls in order:
  - `Code`
  - `Download ZIP`
- Prefer stable visible labels and normal browser interaction over hidden shortcuts or direct download endpoints.
- If GitHub renders a different menu layout, adapt the click path but preserve the same user-visible flow.
- In this workspace, the normal-browser GitHub download flow has been successfully verified using keyboard-only real interaction:
  - after page load, press `Tab` **34** times to focus `Code`
  - press `Enter`
  - then press `Tab` **8** times to focus `Download ZIP`
  - press `Enter`
- Treat `34×Tab → Enter → 8×Tab → Enter` as the current verified download path for this GitHub repository page pattern in the local environment.
- The verified path is now encapsulated in `scripts/github_keyboard_download.sh`, which preserves the tested navigation counts while adding small random delays to better match human timing.
- The current implementation was revised after testing: random timing is generated by the shell wrapper, while the actual keyboard sequence is executed from a temporary `.applescript` file for more reliable execution.
- Before using the path, ensure macOS accessibility/input permissions for the host terminal are still enabled; if `osascript` input events fail with error `1002`, re-check Terminal.app under **Privacy & Security → Accessibility**.
- Scripts may support ZIP detection, extraction, and local code analysis, but must not replace the actual repository page click path.

## Analysis guidance

Inspect at least these signals when available:

- Top-level README and docs
- Package manifests:
  - `package.json`
  - `pyproject.toml`
  - `requirements.txt`
  - `Cargo.toml`
  - `go.mod`
  - `pom.xml`
  - `build.gradle`
- Entrypoints and scripts
- Install / run instructions
- License
- Network-facing behavior
- Shell execution / subprocess usage
- Credential handling
- Auto-update / remote fetch behavior
- Obfuscation, minified suspicious loaders, postinstall hooks, curl|bash style install patterns, dangerous eval/exec usage

## Output format

Return a concise but decision-useful report with sections:

1. 项目概述
2. 主要用途
3. 使用方式
4. 项目结构与技术栈
5. 安全性检查
6. 风险结论
7. 建议下一步

## Failure handling

- If the page opens but download cannot be triggered through the visible GitHub UI in the normal browser: report the exact UI blocker.
- The assistant must first attempt the normal-browser click path itself.
- When the GitHub page layout matches the tested structure, use the currently verified path: `34×Tab → Enter → 8×Tab → Enter`.
- Prefer running `scripts/github_keyboard_download.sh <github-repo-url>` so the tested path and random human-like delays stay centralized in one place.
- If `osascript` or `System Events` input fails with error `1002`, check whether **Terminal.app** still has **Accessibility** enabled in macOS settings; this was a confirmed real-world failure mode during testing.
- During validation, two classes of failures were observed and should be distinguished:
  - macOS permission / `System Events` failures such as `1002`
  - script-implementation failures such as unstable AppleScript random-delay handlers; the current implementation has already been adjusted to avoid that earlier failure mode.
- Only if normal-browser automation is unavailable, system input permissions are not usable, or the page structure differs enough to invalidate the verified path should the assistant ask the user to perform the click path manually and continue after the ZIP appears in `/Users/mac/Downloads`.
- If the ZIP has not fully appeared in `/Users/mac/Downloads`, do not start analysis yet.
- If ZIP appears incomplete or extraction fails: report that and stop.
- If the repository is extremely large: analyze the key files first and clearly say full deep review may need a second pass.

## References

- For implementation details of local project scanning, read `references/analysis-checklist.md`.
- For deterministic local analysis and ZIP handling, run `scripts/github_download_analyze.py`.
