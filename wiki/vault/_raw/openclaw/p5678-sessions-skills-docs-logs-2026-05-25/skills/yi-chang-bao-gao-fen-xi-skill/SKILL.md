---
name: yi-chang-bao-gao-fen-xi-skill
description: 异常报告 Excel 自动入库与分析技能。用于处理从钉钉 OA 审批“异常报告”单据导出的 Excel 文件：当收到新的异常报告文件或相关目录时，先自动导入到 skill 自带的 SQLite 数据库，再按用户要求做查询、统计、趋势分析、供应商/物料/部门检索、损失与审批状态分析。
---

# 异常报告分析 Skill

## 概述

用这个 skill 处理“异常报告”Excel：收到新文件先自动入库，再按用户要求做查询、统计、趋势分析、异常明细检索。

数据库以 `数据id` 为业务主键；同一文件内容按哈希跳过重复导入；重复导入或新版本导入时按 `数据id` 覆盖更新，避免重复累计。

## 自动入库工作流

### 1. 收到单个异常报告文件

当用户提供新的 Excel 文件时：
- 如果文件名包含“异常报告”，或用户明确说明这是钉钉 OA 的异常报告导出文件，则立即导入
- 执行 `python3 scripts/import_exception_report.py <excel_path>`
- 如果返回 `skipped: true`，说明相同文件内容已导入过，直接告知用户已跳过
- 导入完成后，再继续后续分析

### 2. 收到目录或历史文件集合

如果用户给的是目录，或者要求“把这批异常报告都入库”：
- 执行 `python3 scripts/scan_exception_reports.py <folder>`
- 递归扫描目录内文件名包含“异常报告”的 `.xlsx/.xls` 文件
- 自动批量导入，并汇总导入 / 跳过 / 报错数量

### 3. 分析前先理解数据结构

分析前如需确认字段，读取：
- `references/schema.md`
- `references/auto-import.md`

如需查看数据库中的实际列映射，可查询：
- `report_columns`

## 执行分析

按用户问题组织 SQL，优先使用聚合查询。

常见分析方向：
- 数量统计：公司、部门、问题类型、责任归属、审批状态
- 时间趋势：按天/周/月统计异常数量
- 明细筛选：按供应商、物料编码、物料名称、创建人、负责人筛选
- 风险分析：造成损失的记录、处理中超时记录、重复发生异常
- 文本分析：总结异常说明、原因分析、改进措施中的高频问题

执行查询时：
- 用 `scripts/query_exception_report.py` 执行 SELECT 类 SQL
- 先给结论，再给必要明细
- 行数较多时，只展示代表性样本或 Top N

## 查询模板

### 总量与分布

```sql
SELECT 问题类型, COUNT(*) AS cnt
FROM reports
GROUP BY 问题类型
ORDER BY cnt DESC
```

### 按公司统计

```sql
SELECT 所属公司, COUNT(*) AS cnt
FROM reports
GROUP BY 所属公司
ORDER BY cnt DESC
```

### 按供应商统计

```sql
SELECT 异常材料清单_1 AS 供应商名称, COUNT(*) AS cnt
FROM reports
GROUP BY 异常材料清单_1
ORDER BY cnt DESC
LIMIT 20
```

### 处理中记录

```sql
SELECT 数据id, 审批编号, 所属公司, 问题类型, 当前负责人, 审批状态, 更新时间
FROM reports
WHERE 审批状态 LIKE '%审批中%'
ORDER BY 更新时间 DESC
```

### 损失记录

```sql
SELECT 数据id, 审批编号, 是否造成损失, 损失明细, 损失明细_1, 责任归属, 责任归属_1
FROM reports
WHERE COALESCE(是否造成损失, '') <> ''
  AND 是否造成损失 NOT IN ('否', '无', 'nan')
ORDER BY 更新时间 DESC
```

## 结果表达规范

- 先回答用户真正关心的结论，不要先甩 SQL
- 尽量把字段名翻译成自然语言，例如：
  - `异常材料清单.1` = 供应商名称
  - `异常材料清单.2` = 物料编码
  - `异常材料清单.3` = 物料名称
- 如果发现原始数据有重复表头行或重复 `数据id`，按既定规则清理后再分析，不把脏数据直接报给用户
- 如果用户要求“基于最新导入数据”，可先查看 `imports` 表确认最新批次

## 资源

- 导入脚本：`scripts/import_exception_report.py`
- 批量扫描脚本：`scripts/scan_exception_reports.py`
- 查询脚本：`scripts/query_exception_report.py`
- 自动入库说明：`references/auto-import.md`
- 结构说明：`references/schema.md`
- SQLite 数据库：`assets/exception_reports.db`
