---
name: price-scraping
description: "Scrape commodity prices from https://www.100ppi.com/ (生意社), store in SQLite, and generate daily price reports. Use when the user wants to fetch/update material prices from 100ppi.com, build a price database, generate a daily price report (材料价格日报), query historical prices, or automate price monitoring for bulk commodities (大宗商品)."
---

# Price Scraping — 100ppi.com

Automates scraping commodity prices from 生意社 (100ppi.com) into SQLite and generating daily reports.

## Design Principles

- 尽量使用**固定代码逻辑**生成日报，不依赖模型临场发挥
- 所有路径均基于脚本相对路径，方便整体迁移
- 默认兼容 **macOS / Linux**
- 钉钉消息模板尽量避免表格，使用稳定文本结构

## Quick Start

```bash
pip install requests beautifulsoup4 lxml

# 抓取 16 个默认品种 → 保存至 data/prices.db（自动创建）
python3 scripts/scrape_prices.py

# 用数据库已有数据生成今日 markdown 报告（stdout）
python3 scripts/generate_report.py

# 先抓取最新价格，再直接生成日报
python3 scripts/generate_report.py --latest

# 生成适合钉钉发送的固定模板日报（推荐）
python3 scripts/generate_report.py --latest --dingtalk

# 一键日报入口，先同步供应商报价，再生成日报，方便挂 cron
python3 scripts/daily_report.py

# 只同步监控品种对应的供应商报价
python3 scripts/scrape_prices.py --quote-sync-watched

# 生成 HTML 报告到文件
python3 scripts/generate_report.py --latest --format html --output report.html
```

## Default Watched Commodities (16 种)

Hardcoded in `WATCHED_COMMODITIES` dict at the top of `scrape_prices.py`:

| 分类 | 品种 |
|------|------|
| 黑色金属 | 线材(740)、热轧板卷(195)、镀锌板(301) |
| 有色金属 | 铝锭(482)、锌锭(431) |
| 化工塑料 | PVC树脂SG5(107)、PP拉丝(718)、ABS(713)、LLDPE(435)、HDPE(295)、LDPE(334) |
| 化纤 | 涤纶DTY(1007)、锦纶DTY(910) |
| 造纸 | 瓦楞原纸(1250)、白卡纸(1319) |
| 能源建材 | 沥青(1022) |

未收录品种（POM、箱板纸、白板纸、分散染料、活性染料）在生意社无数据，已跳过。

## Workflow

### 1. Scrape Prices → SQLite DB

`scripts/scrape_prices.py` 完整流程：

1. 自动处理 JS cookie 挑战，建立可用 session
2. 并发抓取各品种页面
3. 解析价格、涨跌幅、三月均价/高低、一年位置
4. 写入本地 SQLite：`data/prices.db`（skill 根目录下，首次运行自动创建）
   - `commodities` 表：品种元数据（ppid、名称、单位、分类）
   - `prices` 表：每日价格记录，`(ppid, scrape_date)` 唯一，重复抓取会覆盖当日数据
   - `quote_records` 表：供应商报价记录（供应商、规格、品牌/产地、报价、发布时间、来源链接）

```bash
--db PATH         自定义 DB 路径（默认 data/prices.db，相对于 skill 根目录）
--workers N       并发数（默认 20）
--list            列出当前 WATCHED_COMMODITIES 清单
--list-all        列出生意社全部 ~447 个品种
--init-db         仅初始化 DB 结构后退出
```

### 2. Generate Report from DB or Latest Scrape

`scripts/generate_report.py` 支持两种模式：

#### 模式 A：从 DB 读取指定日期数据生成报告

```bash
python3 scripts/generate_report.py
python3 scripts/generate_report.py --date 2024-03-28
python3 scripts/generate_report.py --format txt
python3 scripts/generate_report.py --format html -o r.html
```

#### 模式 B：先抓取最新价格，再直接生成日报

```bash
python3 scripts/generate_report.py --latest
python3 scripts/generate_report.py --latest --dingtalk
python3 scripts/generate_report.py --latest --format html -o latest.html
python3 scripts/daily_report.py
```

其中：
- `--latest`：先抓取最新监控品种价格，再基于当天数据生成日报
- `--dingtalk`：输出适合钉钉消息发送的固定文本模板日报
- `scripts/daily_report.py`：一键日报入口，默认会先同步监控品种的供应商报价，再输出钉钉版日报，适合 cron 调用
- `scripts/scrape_prices.py --quote-sync-watched`：按固定关键词为监控品种同步供应商报价

## DingTalk Report Template

钉钉版日报字段固定包含：

- 每种材料最新价格
- 涨跌幅
- 一年位置
- 供应商
- 规格
- 品牌/产地
- 供应商报价
- 报价日期
- 与上次报价对比（金额 + 百分比）
- 数据来源链接

说明：
- 基准价来源固定为 `https://www.100ppi.com/rawmex/detail-{ppid}.html`
- 供应商报价使用固定关键词搜索，并支持 `search -> plist -> detail` 链路，再配合固定别名匹配规则过滤，避免串品种
- 若某材料当前没有匹配到供应商报价记录，则供应商/规格/报价等字段显示为 `—`
- 模板使用纯文本列表结构，按“材料名 + 3 个项目符号行”的固定样式输出每个材料，避免表格在钉钉里显示不稳定

## One-shot Daily Report for cron

```bash
python3 scripts/daily_report.py
python3 scripts/daily_report.py --format dingtalk
python3 scripts/daily_report.py --format md
python3 scripts/daily_report.py --format html -o out/report.html
```

默认行为：
- 先同步监控品种对应的供应商报价
- 再抓取最新监控价格
- 生成钉钉版日报
- 输出到 stdout

适合 cron：

```bash
cd /path/to/price-scraping && /usr/bin/env python3 scripts/daily_report.py
```

## Customizing Watched Commodities

编辑 `scripts/scrape_prices.py` 顶部的 `WATCHED_COMMODITIES` 字典：

```python
WATCHED_COMMODITIES = {
    740: ("线材", "黑色金属"),
    # 添加或删除品种...
}
```

查找品种 ID：
```bash
python3 scripts/scrape_prices.py --list-all | grep 铜
```

## Migration to New Machines

所有路径均为相对路径，DB 存放在 skill 目录内，整个 skill 目录复制过去即可。

**步骤：**

```bash
# 1. 复制 skill 目录到目标机器（含 data/prices.db 历史数据）
scp -r price-scraping/ user@host:/path/to/price-scraping/

# 2. 目标机器安装依赖（Python 3.9+ 即可）
pip install requests beautifulsoup4 lxml

# 3. 直接运行，无需任何路径配置
python3 scripts/scrape_prices.py
python3 scripts/generate_report.py --latest --dingtalk
python3 scripts/daily_report.py
```

**注意事项：**
- Python 版本要求 3.9+，兼容 Linux / macOS
- 依赖包：`requests`、`beautifulsoup4`、`lxml`（生成 HTML 报告额外需要 `jinja2`）
- 不需要修改任何绝对路径配置，脚本通过 `__file__` 自动定位 `data/prices.db`
- 如不需要迁移历史数据，可不复制 `data/` 目录，首次运行自动重建

## Site Structure & DB Schema Reference

See `references/site_structure.md` for:
- 页面 HTML 选择器
- 品种 ID 速查表
- DB 表结构与常用 SQL 查询
- 性能调优说明（WAL、lxml、并发数）
