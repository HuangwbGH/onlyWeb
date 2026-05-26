# OpenClaw 配置与经验知识库

> 目标：把当前 workspace 中已经验证过的 OpenClaw 配置、排障经验、运行约定和相关资料入口，整理成一个可持续维护、便于迁移与检索的知识库索引。
>
> 更新时间：2026-03-18

---

## 1. 这份知识库是干嘛的

这不是单纯的“文档堆放区”，而是一个 **OpenClaw 运维/配置/使用经验总索引**。

适合回答这类问题：
- OpenClaw 当前配置项怎么理解
- 某个功能（browser / gateway / memory / QMD / channels）怎么配
- 当前机器上已经验证过什么
- 之前踩过哪些坑
- 哪些资料应该优先查、哪些只是历史记录

---

## 2. 推荐的知识分层

### A. 核心说明文档（优先读）
这些文档已经比较接近“成体系知识”，优先作为主知识区：

- `docs/openclaw/openclaw-config-guide.md`
  - OpenClaw 配置文件详解
  - 覆盖 `auth / models / agents / tools / commands / browser / session / hooks / channels / gateway / skills / plugins`

- `docs/openclaw/OpenClaw 网络代理说明.md`
  - OpenClaw 代理实际生效路径
  - `.env`、LaunchAgent、`HTTP_PROXY / HTTPS_PROXY / NO_PROXY` 的关系

- `docs/openclaw/OpenClaw 排障速查表.md`
  - 模型超时、Feishu/DingTalk 异常、Gateway 不通、UI 卡顿等常见问题

- `docs/openclaw/QMD-索引策略.md`
  - QMD 主知识区、次级区、降权区的划分
  - `memory_search` 与 `qmd` 的分工

- `docs/openclaw/browser-cdp-9222-修复计划.md`
  - browser / CDP 9222 修复背景、恢复条件与执行方向

### B. 本地专用基础设施记录（按需读）
这些是本机/本环境的专用资料，适合作为“环境说明层”：

- `infra/qmd.md`
  - QMD 本地环境与补充记录
- `infra/rustdesk.md`
  - RustDesk 服务器信息（敏感基础设施信息，按需查看）

### C. 记忆与会话沉淀（作为经验来源，不直接当手册）
这些文件里有大量真实排障过程、结论和上下文：

- `MEMORY.md`
  - 长期记忆与稳定偏好
- `memory/*.md`
  - 日常记录、专项记录、排障记录
- `session_memory/rollups/*.md`
  - 会话汇总
- `session_memory/summaries/*.md`
  - 具体会话摘要

这些更适合：
- 回忆“之前做过什么”
- 追溯“为什么形成这个结论”
- 抽取经验再沉淀到正式文档

不适合直接作为唯一知识入口。

---

## 3. 当前已经形成的关键知识主题

### 3.1 OpenClaw 配置认知
已整理/验证的重点包括：

- `openclaw.json` 的主要模块层级
- `auth` 与 `models` 的对应关系
- `agents.defaults.model.primary` 与 fallback 的关系
- `tools` / `commands` 对能力边界与执行方式的影响
- `browser` 的多种模式：
  - 官方内置 browser
  - attach 到本地 Chrome 9222
  - `driver: existing-session` 的含义
- `channels` / `gateway` / `plugins` 的联动关系

建议入口：
- `docs/openclaw/openclaw-config-guide.md`

### 3.2 网络代理经验
已明确形成稳定结论：

- OpenClaw 的网络代理通常不写在 `openclaw.json`
- 当前机器实际通过：
  - `~/.openclaw/.env`
  - LaunchAgent 注入
  - Gateway 进程读取环境变量
- 核心检查项：
  - `HTTP_PROXY`
  - `HTTPS_PROXY`
  - `NO_PROXY`
- 当前策略曾验证为：
  - 海外模型走代理
  - Feishu / DingTalk 直连（通过 `NO_PROXY`）

建议入口：
- `docs/openclaw/OpenClaw 网络代理说明.md`
- `docs/openclaw/OpenClaw 排障速查表.md`
- `memory/2026-03-13-proxy-timeout.md`

### 3.3 QMD / memory_search 检索分工
已形成的结论：

- `memory_search` 更适合：
  - 最近记忆
  - 会话结论
  - 偏好与经验回忆
- `qmd` 更适合：
  - 文档库
  - 历史资料
  - 关键词定位
  - 跨目录搜索
- 曾经发生过：
  - QMD embedding 不完整
  - `qmd mcp` LaunchAgent / 端口问题
  - 后续已恢复主链路与 MCP

建议入口：
- `docs/openclaw/QMD-索引策略.md`
- `memory/2026-03-09-qmd-memory.md`
- `memory/2026-03-15-qmd-sigterm.md`

### 3.4 browser / CDP 9222 经验
已记录的重要认知：

- `browser.enabled` 不等于 browser 一定可用
- `cdpUrl` 是连接地址
- `driver` 是连接/接管方式
- `existing-session` 表示接管已有浏览器会话
- `attachOnly` 表示只附着，不主动启动
- `snapshotDefaults` / `ssrfPolicy` / `extraArgs` / `relayBindHost` 已有细化解释记录

建议入口：
- `docs/openclaw/openclaw-config-guide.md`
- `docs/openclaw/browser-cdp-9222-修复计划.md`
- `memory/2026-03-16-openclaw-config.md`

### 3.5 OpenClaw 迁移与打包经验
已做过“阶段一项目打包迁移”的整理实践，包括：

- 给项目补 README
- 编写迁移清单
- 处理本机不该打包的运行垃圾
- 区分可迁移内容与机器专属内容

这部分经验对以后迁移 OpenClaw 相关项目、技能、资料库也有参考价值。

建议入口：
- `memory/2026-03-16-local-service.md`

---

## 4. 建议的知识库目录结构（后续可继续完善）

建议把 OpenClaw 相关知识逐步收拢到：

```text
docs/
└── openclaw/
    ├── openclaw-config-guide.md
    ├── OpenClaw 网络代理说明.md
    ├── OpenClaw 排障速查表.md
    ├── QMD-索引策略.md
    ├── browser-cdp-9222-修复计划.md
    └── openclaw-专题文档...
```

并把这份总索引作为入口：

- `docs/openclaw-knowledge-base.md`

也就是说：
- `docs/openclaw-knowledge-base.md` = 总索引
- `docs/openclaw/*.md` = 专题手册
- `memory/*.md` = 经验来源
- `infra/*.md` = 本机基础设施说明

---

## 5. 哪些内容不建议直接混进主知识库

下面这些内容不适合直接当“主手册正文”，但可以保留为参考来源：

- 纯日志残留
- 旧版 backup
- 一次性排障现场输出
- 重复/中间态文档
- 强依赖具体机器路径、具体临时状态的内容

处理原则：
- 有长期价值的结论 → 提炼进 `docs/openclaw/*.md`
- 只对当次排障有用的细节 → 留在 `memory/*.md`
- 敏感基础设施细节 → 留在 `infra/*.md`，不要泛化复制

---

## 6. 检索建议

### 想看“成体系说明”
优先查：
- `docs/openclaw-knowledge-base.md`
- `docs/openclaw/*.md`

### 想回忆“之前做过什么 / 得出什么结论”
优先查：
- `memory_search`
- `MEMORY.md`
- `memory/*.md`

### 想找“具体资料、脚本、SQL、历史文档”
优先查：
- QMD / 本地文档目录
- `memory/u8-docs/`
- `docs/`
- `infra/`

---

## 7. 当前知识库的几个明确结论

### 已明确
- OpenClaw 配置、代理、排障、browser/QMD 相关经验已经具备形成知识库的基础
- `docs/openclaw/` 应作为主知识区
- `memory/` 应作为经验沉淀区，而不是主知识入口
- `infra/` 适合作为本地环境专用说明区

### 还值得继续做
- 清理 `openclaw-config-guide.md` 末尾重复残留内容
- 继续把零散对话中已经解释清楚的内容，提炼为专题文档
- 给 OpenClaw 迁移、Linux 部署、Gateway token、browser attach 模式补专题文档

---

## 8. 推荐后续补充的专题文档

建议下一步继续补这些：

- `docs/openclaw/Gateway token 与 WebUI 访问说明.md`
- `docs/openclaw/Linux 安装与 WebUI 打开路径.md`
- `docs/openclaw/browser-attach-existing-session.md`
- `docs/openclaw/OpenClaw 双机知识库互通方案.md`
- `docs/openclaw/OpenClaw 迁移与打包经验.md`

---

## 9. 一句话总结

现在这套 OpenClaw 相关资料，已经不只是“有一些记录”，而是可以正式看作一个：

**以 `docs/openclaw/` 为主知识区、以 `memory/` 为经验来源、以 `infra/` 为环境说明的本地知识库。**
