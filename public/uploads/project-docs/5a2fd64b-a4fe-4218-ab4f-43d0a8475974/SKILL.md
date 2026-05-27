---
name: email-fetcher
description: Download emails from an IMAP mailbox and save them as .eml files for local analysis. Use this skill when the user wants to fetch, download, or archive emails from their email account (163 mail or other IMAP providers) to local storage in EML format for subsequent analysis.
---

# Email Fetcher

## Overview

Connects to an IMAP server via SSL, downloads emails from a specified folder, and saves each email as a `.eml` file. Configuration is managed via `config.env` in the skill root.

## Quick Start

```bash
# 1. Load credentials
source config.env

# 2. Fetch the most recent emails (default: last 10, saved to ./emails/)
python3 scripts/fetch_emails.py

# 3. Custom output dir and limit
python3 scripts/fetch_emails.py --output-dir ./my_emails --limit 50
```

## Configuration

Edit `config.env` in the skill root to change connection settings:

| Variable          | Purpose                          |
|-------------------|----------------------------------|
| `MAIL_HOST`       | IMAP server hostname             |
| `MAIL_PORT`       | IMAP SSL port (default 993)      |
| `MAIL_USER`       | Email login address              |
| `MAIL_PASSWORD`   | Password or app-specific token   |
| `MAIL_FOLDER`     | Folder to fetch from (e.g. INBOX)|
| `MAIL_FETCH_LIMIT`| Max emails per run (default 10)  |

## Output

Downloaded `.eml` files are saved to the `emails/` folder in the skill root by default. Each file is named `<uid>_<subject>.eml`. EML files are standard RFC 822 format and can be opened by any email client or parsed with Python's `email` module for further analysis.

## 163 Mail Notes

163 mail requires two things for IMAP access:

1. **Authorization code** (授权码): Go to 163 mail web → Settings → POP3/SMTP/IMAP → enable IMAP → generate an authorization code. Set `MAIL_PASSWORD` in `config.env` to that code (not your login password).
2. **IMAP ID command**: 163 mail returns "Unsafe Login" on SELECT unless the client sends an IMAP ID command first. The script handles this automatically.

## Script

- `scripts/fetch_emails.py` — main download script; uses only Python stdlib (no pip installs required)
