# QMD 本地文档搜索

- 安装路径：/opt/homebrew/bin/qmd
- 版本：1.1.0
- 索引路径：~/.cache/qmd/index.sqlite
- 脚本路径：~/.openclaw/workspace/scripts/qmd-search.sh

## 已配置集合
- openclaw-memories → ~/.openclaw/workspace/memory
- clawhub-docs → ClawHub 文档
- clawmate-proj → Clawmate 项目
- workspace-meta → Workspace 元信息

## 使用方法
```bash
qmd search "关键词" -c openclaw-memories
qmd get qmd://openclaw-memories/文件名.md
~/.openclaw/workspace/scripts/qmd-search.sh "关键词" [集合] [数量]
```

## 当前限制
- BM25 搜索：正常
- 向量搜索：受 Apple M1 Metal GPU 问题影响
- 混合搜索：受 Apple M1 Metal GPU 问题影响

## 建议维护
```bash
qmd update
```
如需恢复更好的语义检索，可补做 embedding。
