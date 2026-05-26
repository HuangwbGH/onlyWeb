# QMD 索引策略

## 主知识区（优先）
- docs/
- infra/
- docs/openclaw/

## 次级区（按需）
- memory/
- notes/

## 降权 / 清理目标
- archive/
- 各类备份、副本、.bak
- 纯日志导出
- 临时中间稿

## 检索分工
- memory_search：近期结论、最近会话、偏好、记忆回忆
- qmd：文档库、历史资料、关键词定位、跨目录搜索

## 当前结论
- qmd embed 已确认历史执行成功
- qmd update/embed 的系统级独立定时入口未单独发现
- 当前更像是被 ai.openclaw.session-memory-rollup.plist 链路间接触发，其中已明确包含 qmd-update-session-memory.sh
- ai.openclaw.session-memory-rollup.plist 当前存在 XML / ampersand 转义问题风险，可能影响调度稳定性
