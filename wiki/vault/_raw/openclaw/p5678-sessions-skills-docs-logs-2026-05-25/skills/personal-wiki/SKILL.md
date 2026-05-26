---
name: personal-wiki
description: "Build and maintain a personal knowledge base wiki using the personal-wiki MCP server. Use when the user wants to ingest source documents (articles, papers, notes, meetings, journals) into a structured wiki, query accumulated knowledge, initialize a wiki workspace, or check wiki health. The MCP server handles all file operations — this skill tells you how to orchestrate them."
---

# Personal Wiki

所有文件操作通过 `personal-wiki` MCP 工具完成。本 skill 说明**何时调用哪个工具、按什么顺序、内容怎么生成**。

默认 wiki 根目录：`knowledge/personal-wiki`（相对于 OpenClaw 项目根目录）。

Read `references/schema.md` for page formats, frontmatter, and naming conventions.

## MCP 工具一览

| 工具 | 用途 |
|---|---|
| `init_wiki` | 初始化目录结构（幂等） |
| `ingest_source` | 写 source 页 + 更新 index + 写 log，slug 去重 |
| `update_source` | 重新导入已有 source |
| `save_entity` | 写/更新 entity 页，新建时自动加 index |
| `save_concept` | 写/更新 concept 页，新建时自动加 index |
| `save_synthesis` | 保存查询结果，更新 index + log |
| `update_overview` | 覆写跨源综合摘要 |
| `search_wiki` | 全文检索，返回命中页面和上下文片段 |
| `health_check` | 结构完整性检查 |
| `lint_wiki` | 孤儿页 + 缺失 entity 检测 |

---

## Init

Triggered by: *"初始化 wiki"* / *"create wiki"* / *"init wiki"*

```
init_wiki(wiki_root="knowledge/personal-wiki")
```

如果用户指定了其他路径，用指定路径。

---

## Ingest

Triggered by: *"ingest <file>"* / *"导入 <file>"* / *"消化 <file>"*

**你的工作**：先保全原始文档，再读原文并生成结构化内容。**MCP 的工作**：写 wiki 页、维护 index 和 log。

步骤：

1. 先确认 wiki 已初始化；若未初始化，先执行 `init_wiki`
2. **必须先把原始文档复制到 wiki 的 `raw/` 目录保存**，保留原文件名；如果是整个文件夹批量整理，就把该批原始文件逐个复制到 `raw/` 中，再继续后续步骤
3. 用 Read 工具读取 `raw/` 中保存后的原始文档，而不是直接基于外部原路径生成 source 页
4. 调用 `search_wiki` 了解已有相关知识，识别潜在矛盾
5. 生成 source 页内容（格式见 `references/schema.md`），并确保 frontmatter 中的 `source_file` 指向 `raw/...` 路径；然后调用 `ingest_source`
6. 提取文档中的实体（人物、公司、项目）：
   - 若 entity 已存在：Read 现有页面，合并新信息，调用 `save_entity`
   - 若 entity 不存在：生成新页面，调用 `save_entity`
7. 提取文档中的概念（思想、框架、方法）：
   - 若 concept 已存在：Read 现有页面，合并新信息，调用 `save_concept`
   - 若 concept 不存在：生成新页面，调用 `save_concept`
8. 调用 `update_overview` 更新跨源综合摘要
9. 报告创建/更新了哪些页面，并说明原始文件已保存到 `raw/`

**关键规则**：
- **原始文档必须先落到 `raw/`，再做任何 ingest**
- `raw/` 里的文件只读，不修改，只做归档保存
- 每个 source 页必须通过 `[[WikiLink]]` 链接到对应的 entity 和 concept 页
- `source_file` 必须写成 wiki 内部的 `raw/...` 路径，不能继续指向外部临时路径或桌面路径

---

## Query

Triggered by: *"query: <问题>"* / *"问: <问题>"* / *"wiki 里关于…"*

步骤：

1. 调用 `search_wiki(query)` 找相关页面
2. 用 Read 工具读取命中的页面
3. 综合回答，引用用 `[[PageName]]` 标注
4. 询问是否保存为 synthesis 页，是则调用 `save_synthesis`

优先从 wiki 页面回答，`raw/` 只作为辅助证据。

---

## Health

Triggered by: *"health"* / *"检查 wiki"*

```
health_check(wiki_root="knowledge/personal-wiki")
```

列出问题，不自动修复，问用户怎么处理。

---

## Lint

Triggered by: *"lint"* / *"lint wiki"*

先跑 health，health 干净再跑 lint：

```
lint_wiki(wiki_root="knowledge/personal-wiki")
```

孤儿页和缺失 entity 页由工具检测。矛盾和知识空白需要你读页面内容分析。
