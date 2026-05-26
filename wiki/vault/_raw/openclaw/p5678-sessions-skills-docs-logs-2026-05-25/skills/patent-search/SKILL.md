---
name: patent-search
description: Automate patent search on pat.daweisoft.com — login, search by keywords from a file, filter results by disclosure date (within 7 days), save structured data to SQLite, and download patent drawings. Use when the user wants to scrape/monitor recent patents from the Dawei patent platform.
---

# Patent Search

Automate patent collection from `pat.daweisoft.com` using `scripts/patent_search.py`.

## Quick Start

```bash
# Install dependencies (one-time)
pip install playwright requests openpyxl pillow
playwright install chromium

# Run (headed mode required — headless mode fails login on this site)
python3 scripts/patent_search.py --headed

# Or specify a different keywords file
python3 scripts/patent_search.py --headed --keywords /path/to/other.txt
```

All default paths resolve to the **skill root directory**:

| 文件/目录 | 默认位置 |
|-----------|---------|
| 关键词 | `keywords.txt` — 一行一个关键词，`#` 开头为注释 |
| 数据库 | `patents.db` |
| 专利附图 | `patent_images/` |
| Excel 报表 | `patents_YYYYMMDD.xlsx`（每次抓取结束后自动生成） |

手动生成 Excel（可指定天数范围）：

```bash
python3 scripts/export_excel.py               # 默认近 7 天
python3 scripts/export_excel.py --days 30     # 近 30 天
python3 scripts/export_excel.py --output /path/to/out.xlsx
```

## Script Options

**`patent_search.py`**

| Flag | Default | Description |
|------|---------|-------------|
| `--keywords` | `<skill_root>/keywords.txt` | Path to keywords file |
| `--db` | `<skill_root>/patents.db` | SQLite file path |
| `--images-dir` | `<skill_root>/patent_images` | Directory for drawings |
| `--headed` | *(off)* | Show browser window — **required**, headless mode fails login |

**`export_excel.py`**

| Flag | Default | Description |
|------|---------|-------------|
| `--days` | `7` | Export patents whose 公开日 is within last N days |
| `--db` | `<skill_root>/patents.db` | SQLite database path |
| `--output` | `patents_YYYYMMDD.xlsx` | Output file path |

## Database Schema

**`patents`** — primary key `disclosure_no` (公开号)

Fields: `no`, `dpi`, `disclosure_no`, `patent_name`, `original_applicant`, `application_no`, `application_date`, `disclosure_date`, `inventor`, `ipc_class`, `annotation`, `grant_date`, `current_owner`, `legal_status`, `patent_type`, `keyword`, `created_at`

**`patent_images`** — stores relative paths to downloaded drawings

Fields: `id`, `disclosure_no` (FK), `image_path` (relative to skill root, e.g. `patent_images/CN123456A_001.jpg`), `sequence_no`, `created_at`

## Workflow

1. Open `https://pat.daweisoft.com/login`; login with `15859298751` / `jxd6027405` if not already authenticated
2. If "账号已在其他地方登录" dialog appears, auto-confirm to proceed
3. Navigate to `https://pat.daweisoft.com/index` (patent search page)
4. For each keyword: fill search box → press Enter → paginate through results
5. Collect rows where `公开(公告)日` is within 7 days of today → `upsert_patent()` into SQLite; stop paginating when a page has 0 matching rows
6. For each saved patent: click 公开号 in left-fixed table → click 说明书附图 tab → download all images (skip `data:` placeholder URIs) → record **relative** paths in `patent_images`
7. After all keywords finish, auto-call `export_excel.py` to generate `patents_YYYYMMDD.xlsx`

## De-duplication (for scheduled runs)

Safe to run daily/weekly on the same database:

- **`patents`**: `INSERT ... ON CONFLICT(disclosure_no) DO UPDATE` — same patent updates in place, no duplicate rows
- **`patent_images`**: `UNIQUE(disclosure_no, sequence_no)` + `INSERT OR IGNORE` — duplicate images are skipped; image files on disk are also skipped if already present (`abs_path.exists()` check)

## Site Structure Notes (verified)

The results page (`/searchresult`) uses Ant Design table with fixed columns, which renders **two separate `<table>` elements**:

- `.ant-table-body-inner table` (fixed left, 6 cols): checkbox | No | status | DPI | 公开号 | 专利名称
- `.ant-table-body table` (full, 18 cols, cols 0–5 are ghost placeholders): cols 6–16 contain 原始申请人 → 专利类型

`parse_result_rows()` merges both tables by row index.

Login page selectors:
- Username: `input[placeholder="请输入手机号或邮箱"]`
- Password: `input[placeholder="请输入密码"]`
- Agreement checkbox: `.saCheckbox .ant-checkbox-input`
- Login button: `div.loginButton` (a `<div>`, not `<button>`)

Pagination: `.ant-pagination-next` (disabled class indicates last page)

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Login fails | Must use `--headed`; headless mode is blocked by the site |
| 0 rows found | Check `parse_result_rows()` — table structure may have changed; inspect with `--headed` |
| Images not downloading | Some imgs use lazy-load `data:` placeholders — script skips these automatically; if real images also fail, check the drawing panel selector in `download_drawings()` |
