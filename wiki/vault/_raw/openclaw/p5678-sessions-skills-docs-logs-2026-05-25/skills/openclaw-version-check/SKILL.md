# OpenClaw 版本检查 Skill

每天自动检查 OpenClaw 新版本，并将更新信息推送到钉钉。

## 使用方式

### 手动检查
```bash
~/.openclaw/workspace/skills/openclaw-version-check/check-version.sh
```

### 定时任务
已配置每天上午 9:00 自动检查并推送。

## 功能

- ✅ 对比当前版本与最新版本
- ✅ 列出所有新版本（跳过 beta/alpha）
- ✅ 尝试获取 GitHub releases 的变更日志
- ✅ 钉钉 markdown 消息推送
- ✅ 不自动更新，仅提醒

## 配置

编辑 `check-version.sh` 可修改：
- 钉钉 webhook URL
- 检查时间
- 消息格式

## 文件

- `check-version.sh` - 版本检查脚本
- `SKILL.md` - 本文件
