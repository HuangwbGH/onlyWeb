---
name: worklog-skill
description: 管理本地工作日志（SQLite），当用户说出任何以 worklog 开头的命令时必须使用此 skill，包括但不限于：worklog add、worklog list、worklog find、worklog done、worklog update、worklog delete、worklog restore、worklog dedupe、worklog show、worklog help。`worklog add` 也支持缩写 `wrk a`、`wla`、`/wa`，`worklog list` 支持缩写 `wl`。也适用于中文表达如"添加工作日志"、"列出工作日志"、"标记完成"、"恢复工作日志"、"查询 worklog"等。不要为"工作日志"等通用提及触发，除非用户明确使用"worklog"或要求操作工作日志记录。数据存储在本地 SQLite 文件 `skills/worklog-skill/data/worklog.db`，无需网络连接。
---

# Worklog Skill

本地工作日志管理，数据存储于 `skills/worklog-skill/data/worklog.db`（SQLite；相对 skill 根目录则为 `data/worklog.db`）。字段定义见 [references/schema.md](references/schema.md)。

## 核心原则

- 所有操作通过 `scripts/worklog.py` 执行，路径相对于 skill 根目录
- `<target>` 可以是 `WL-0001` 格式的业务 ID、自增行号 `id`，或标题关键词（模糊匹配取第一条）
- 删除为软删除（归档），数据可恢复
- 默认不显示已归档条目；如需查看归档项，使用 `list archived` 或 `list all --include-archived`
- 输出文案统一为中文全角格式，例如：`1、WL-0002 ：回归测试记录 2026-04-06；`
- `show` 输出为逐行中文字段，适合直接在聊天里展示

## 命令速查

```bash
# 添加
python3 scripts/worklog.py add "事项标题" [--date YYYY-MM-DD] [--priority 高|中|低] \
    [--category 分类] [--deadline YYYY-MM-DD] [--note 备注]

# 添加（缩写）
python3 scripts/worklog.py wrk a "事项标题"
python3 scripts/worklog.py wla "事项标题"
python3 scripts/worklog.py /wa "事项标题"

# 列表
python3 scripts/worklog.py list [all|unfinished|done|archived] [关键词] [--include-archived] [--keyword 关键词]
python3 scripts/worklog.py wl [all|unfinished|done|archived] [关键词] [--include-archived] [--keyword 关键词]

# 查找
python3 scripts/worklog.py find <关键词>

# 查看详情
python3 scripts/worklog.py show <target>

# 标记完成
python3 scripts/worklog.py done <target>

# 更新
python3 scripts/worklog.py update <target> [--title 新标题] [--status 已完成|未完成] \
    [--note 备注] [--date YYYY-MM-DD] [--deadline YYYY-MM-DD] \
    [--priority 高|中|低] [--category 分类]

# 删除（归档）
python3 scripts/worklog.py delete <target> [--reason 原因]

# 恢复归档
python3 scripts/worklog.py restore <target>

# 去重（按标题，保留最早一条）
python3 scripts/worklog.py dedupe

# 周报
python3 scripts/worklog.py weekly [--last-week] [--date YYYY-MM-DD]

# 帮助
python3 scripts/worklog.py help
```

## 操作流程

**添加时：** 直接执行 add，或使用 `wrk a` / `wla` / `/wa` 作为 `worklog add` 的缩写，worklog_id 自动生成（WL-XXXX 递增）。

**查询时：** 优先用 `list unfinished` 或缩写 `wl unfinished` 展示未完成项；用户指定范围时用 `all`、`done` 或 `archived`；关键词搜索优先用 `find`，也可用 `list ... [关键词]` 或 `wl ... [关键词]`；若要在 `all` 中一并查看归档项，追加 `--include-archived`。

**更新/完成/删除/恢复时：** 先通过 `find` 或 `list` 确认目标记录的 ID，再执行操作；若用户已提供 worklog_id 或行号则直接操作。

**去重时：** 运行 `dedupe`，按标题完全匹配，保留 id 最小的一条，其余归档。

**周报时：** 运行 `weekly` 生成周报；默认按本周统计“本周完成工作”，并列出当前所有未完成事项作为“下周计划工作”；使用 `--last-week` 生成上周周报。

## 输出风格

- 列表类输出模板：`1、WL-0002 ：回归测试记录 2026-04-06；`
- **每一条记录结束后必须再空一行**
- 成功提示：`已添加工作日志：WL-0003；事项：提示语风格测试；`
- 空结果提示：`暂无工作日志记录；`
- 未命中提示：`未找到工作日志：WL-9999；`
- 帮助与用法提示统一使用中文冒号与分号
- 周报输出固定为：`周报范围` / `本周完成工作` / `下周计划工作`
- 周报中的每个条目也要在输出后空一行
- 该模板要求适用于 `list`、`find`、`dedupe`、`weekly` 等展示型输出
