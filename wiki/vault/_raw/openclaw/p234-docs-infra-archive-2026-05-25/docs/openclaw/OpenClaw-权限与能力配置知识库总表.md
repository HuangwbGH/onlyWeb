# OpenClaw 权限与能力配置知识库总表

> 用途：作为 OpenClaw 权限、能力边界、默认值、当前机器生效值与排查方法的统一知识库。
>
> 本文整合自以下两份旧文档：
> 1. `OpenClaw-终端命令权限影响因素全清单.md`
> 2. `OpenClaw-四类能力参数对照表（含默认值与默认行为）.md`
>
> 阅读目标：
> - 搞清楚哪些配置影响 OpenClaw 是否能执行终端命令
> - 区分 WebUI / browser / gateway / terminal 四类能力
> - 补全未写字段时的默认值 / 默认行为
> - 对照当前机器真实生效值
> - 快速定位权限、执行、网络、沙箱相关问题
>
> 资料来源分级：
> - **官网 docs / reference（优先）**：`docs.openclaw.ai`
> - **本机知识整理文档**：`docs/openclaw/openclaw-config-guide.md` 等
> - **当前机器真实配置**：`/Users/mac/.openclaw/openclaw.json`
> - **说明性推断**：仅在官网和本机文档都没有明确枚举默认值时使用，并显式标记为“依版本 / 推断”

---

## 目录

- [1. 一句话结论](#1-一句话结论)
- [2. 四类能力总览](#2-四类能力总览)
- [3. 默认值与默认行为判定规则](#3-默认值与默认行为判定规则)
- [4. 影响终端命令权限的核心配置总表](#4-影响终端命令权限的核心配置总表)
- [5. 当前机器真实生效值](#5-当前机器真实生效值)
- [6. 当前机器风险点评](#6-当前机器风险点评)
- [7. WebUI（Control UI）能力](#7-webuicontrol-ui能力)
- [8. browser 能力](#8-browser-能力)
- [9. gateway 能力](#9-gateway-能力)
- [10. terminal / exec 能力](#10-terminal--exec-能力)
- [11. 关键默认值与默认行为速查](#11-关键默认值与默认行为速查)
- [12. 终端命令权限专项排查手册](#12-终端命令权限专项排查手册)
- [13. 最实用的排查顺序](#13-最实用的排查顺序)
- [14. 当前机器四类能力简明判断](#14-当前机器四类能力简明判断)
- [15. 资料出处总索引](#15-资料出处总索引)
- [16. 文档保存位置](#16-文档保存位置)

---

## 1. 一句话结论

**OpenClaw 能不能执行终端命令，不是只看一个开关，而是至少看这几层是否同时放行：**

1. 当前会话是否暴露了命令执行工具
2. `tools` 是否给了足够工具能力
3. `commands` 是否允许原生执行、以及如何执行
4. `gateway.nodes.denyCommands` 是否额外拦截
5. 是否处于受限运行环境（sandbox / node / browser attach / ACP）
6. 宿主机本身是否允许该进程访问目标资源（macOS TCC / launchd / 用户权限）
7. 如果命令需要联网，还要看 `~/.openclaw/.env` 里的代理环境变量

同时要明确：**WebUI / browser / gateway / terminal 是四条不同链路**。
- WebUI 能打开，不代表 terminal 一定宽松
- browser 能 `evaluate`，不代表 shell 一定有同级别权限
- gateway 暴露方式影响谁能访问，但不等于自动赋予所有工具权限

---

## 2. 四类能力总览

| 能力类别 | 主要作用 | 最关键配置 | 未写出时默认值 / 默认行为 | 当前机器状态 |
|---|---|---|---|---|
| WebUI | 浏览器里打开控制台、管理会话/配置/审批 | `gateway.controlUi.*`, `gateway.auth.*`, `gateway.bind`, `gateway.mode` | 官网：默认 UI 地址为 `http://127.0.0.1:18789/`；本地 loopback 自动批准；local HTTP 默认要求设备身份 | 可用 |
| browser | 浏览器自动化、快照、页面交互、evaluate | `browser.enabled`, `browser.evaluateEnabled`, `browser.attachOnly`, `browser.profiles.*` | 本机文档：`attachOnly=false`，`headless=false`，`noSandbox=false`，`defaultProfile` 常见默认 `chrome` | 已启用 |
| gateway | 服务是否暴露、谁能连、是否需要 token | `gateway.mode`, `gateway.bind`, `gateway.auth.mode`, `gateway.port`, `gateway.tailscale.*` | 官网/本机文档：常见安全默认是 `mode=local`, `bind=loopback`, `auth.mode=token`, `port=18789`, `tailscale.mode=off` | 本机就是这组 |
| terminal / exec | 执行系统命令、skill 内 shell、进程管理 | `tools.*`, `commands.*`, `gateway.nodes.denyCommands`, `exec approvals`, sandbox | 官网：缺配置时会用 safe defaults；reference 明确给出了 `exec/background` 等字段默认值；安全基线建议 `exec.security=deny`, `ask=always`, `workspaceOnly=true`, `elevated=false` | 当前可执行，但受 `commands.native=auto` 等影响 |

---

## 3. 默认值与默认行为判定规则

本文中的“默认值 / 默认行为”分三类：

### A. 官网明确写了 default
可信度最高，直接按官网记录。

### B. 官网没写死，但写了“missing config → safe defaults / 某行为为 default”
这属于**默认行为**，同样重要。

### C. 官网和本机资料都没写明，只能从 schema 注释、本机文档或实际运行情况判断
这种情况会明确标注为：
- **依版本**
- **当前认知**
- **本机文档口径**
- **推断，不视为官方硬默认值**

---

## 4. 影响终端命令权限的核心配置总表

| 参数路径 | 位置 | 可选值 / 常见值 | 直接影响 | 优先级 |
|---|---|---|---|---|
| `tools.profile` | `openclaw.json` | `full` / `minimal` / `none` / `messaging`（依版本） | 决定工具能力基线，是否具备执行复杂命令的能力 | 高 |
| `tools.allow` | `openclaw.json` | 数组 | 显式放行工具/能力 | 高 |
| `tools.deny` | `openclaw.json` | 数组 | 显式拒绝工具/能力 | 高 |
| `tools.exec` | `openclaw.json` | 对象 | 命令执行细粒度策略 | 高 |
| `tools.fs` | `openclaw.json` | 对象 | 文件系统访问边界，间接影响命令可否成功 | 高 |
| `tools.elevated` | `openclaw.json` | 对象 | 是否允许更高权限路径 / elevated exec | 高 |
| `commands.native` | `openclaw.json` | `auto` / `always` / `never` | 命令原生执行还是走沙箱/受限执行 | 很高 |
| `commands.nativeSkills` | `openclaw.json` | `auto` / `always` / `never` | skill 内命令是否原生执行 | 高 |
| `commands.restart` | `openclaw.json` | `true` / `false` | 是否允许重启类命令 | 中 |
| `commands.ownerDisplay` | `openclaw.json` | `raw` / `masked` | 影响日志显示，不直接决定权限 | 低 |
| `gateway.nodes.denyCommands` | `openclaw.json` | 数组 | 额外拦截危险系统命令/能力 | 很高 |
| `agents.defaults.sandbox.mode` | `openclaw.json` | `off` / `non-main` / `all` | 决定 exec / file tools 在 host 还是 sandbox | 很高 |
| `agents.defaults.sandbox.scope` | `openclaw.json` | `session` / `agent` / `shared` | 影响 sandbox 容器隔离范围 | 中 |
| `agents.defaults.sandbox.workspaceAccess` | `openclaw.json` | `none` / `ro` / `rw` | 影响 sandbox 中能否读写工作区 | 很高 |
| `~/.openclaw/.env` | 环境变量文件 | `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 等 | 不决定“能不能执行”，但决定命令联网是否成功 | 中 |
| `~/.openclaw/exec-approvals.json` | 本机审批文件 | allow/ask/deny 结果 | 影响 macOS `system.run` / 审批型执行 | 很高 |

---

## 5. 当前机器真实生效值

下面这部分基于当前机器 `/Users/mac/.openclaw/openclaw.json` 的真实内容整理。

### 5.1 当前与权限最相关的实际值

```json
{
  "tools": {
    "sessions": {
      "visibility": "all"
    }
  },
  "commands": {
    "native": "auto",
    "nativeSkills": "auto",
    "restart": true,
    "ownerDisplay": "raw"
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback",
    "auth": {
      "mode": "token"
    },
    "tailscale": {
      "mode": "off",
      "resetOnExit": false
    },
    "nodes": {
      "denyCommands": [
        "camera.snap",
        "camera.clip",
        "screen.record",
        "calendar.add",
        "contacts.add",
        "reminders.add"
      ]
    }
  },
  "agents": {
    "defaults": {
      "workspace": "/Users/mac/.openclaw/workspace"
    }
  },
  "browser": {
    "enabled": true,
    "evaluateEnabled": true,
    "cdpUrl": "http://127.0.0.1:9222",
    "attachOnly": false,
    "defaultProfile": "chrome9222",
    "profiles": {
      "chrome9222": {
        "cdpUrl": "http://127.0.0.1:9222",
        "driver": "openclaw"
      }
    }
  }
}
```

### 5.2 关键解释

#### `tools`
当前机器只显式写了：

```json
"tools": {
  "sessions": {
    "visibility": "all"
  }
}
```

含义：
- 当前明确配置了 **会话可见性**
- 但 **没有显式写出** `tools.profile / tools.exec / tools.fs / tools.elevated`
- 因此这些能力可能走默认值，也可能由 runtime / 当前会话工具暴露决定

#### `commands.native = "auto"`

这是当前机器最关键的命令执行策略之一：
- 简单命令更可能原生执行
- 复杂命令更可能受限、转入沙箱或触发审批

#### `commands.restart = true`
表示重启类动作在策略层没有整体禁掉，但是否真的成功仍受宿主权限、审批、目标服务状态影响。

#### `commands.ownerDisplay = "raw"`
表示日志 / UI 更偏向显示原始命令，便于调试，但不利于安全共享。

#### `gateway.mode = "local"` 与 `gateway.bind = "loopback"`
表示当前网关是本机模式且只绑定本地回环：
- 暴露面小
- 很多能力最终落在本机执行环境上

#### `gateway.nodes.denyCommands`

当前机器真实值：

```json
[
  "camera.snap",
  "camera.clip",
  "screen.record",
  "calendar.add",
  "contacts.add",
  "reminders.add"
]
```

注意：
- 这是**功能级 deny**
- 不是 shell 文本 denylist
- 不是 `rm` / `mv` 这种传统 shell 黑名单

#### `agents.defaults.workspace`
当前默认工作区：

```json
"/Users/mac/.openclaw/workspace"
```

含义：
- 命令和文件操作通常围绕这个工作区进行
- 有助于减少“能跑但找不到文件”的问题

#### `browser.*`
当前 browser 配置说明：
- browser 已启用
- 页面 JS 执行已启用
- 不是 attach-only 模式
- 默认走 `chrome9222`
- CDP 地址为 `127.0.0.1:9222`

---

## 6. 当前机器风险点评

### 6.1 偏保守的地方

#### `gateway.bind = loopback`
优点：
- 暴露面小
- 不容易被外部直接打到

#### `gateway.nodes.denyCommands` 已设置
优点：
- 明确拦了高风险系统能力
- 对 camera / screen / contacts / reminders 这类隐私能力尤其重要

### 6.2 偏宽松的地方

#### `commands.native = auto`
这不是最宽，但也绝不是最保守。

含义：
- OpenClaw 有机会直接原生命令执行
- 不会像 `never` 那样全部锁进隔离环境

#### `commands.restart = true`
说明 restart 类动作在策略层没有禁掉。

#### `browser.evaluateEnabled = true`
说明页面内可以执行任意 JS，自动化能力更强，但风险面也更大。

#### Feishu 群聊配置偏宽（间接风险）
当前配置里还看到类似：

```json
"groupPolicy": "open",
"allowFrom": ["*"]
```

这不是 terminal 参数本身，但会间接放大工具执行风险，因为更多来源能触发 agent。

### 6.3 一个关键现实判断

当前机器是否“真的能执行某条命令”，不能只看 `openclaw.json`。还必须叠加：

1. 当前会话实际暴露了哪些工具
2. 当前 runtime / tool policy 是否进一步限制
3. 本机 `exec-approvals.json` 审批结果
4. macOS TCC / launchd / 当前登录用户上下文

---

## 7. WebUI（Control UI）能力

### 7.1 直接相关参数

| 参数路径 | 作用 | 常见值 | 未写出时默认值 / 默认行为 | 来源 |
|---|---|---|---|---|
| `gateway.port` | WebUI 与 Gateway 共用端口 | 数字 | **默认 `18789`** | 官网 configuration / reference / 本机文档 |
| `gateway.bind` | 决定 UI 绑定在哪些网络接口 | `loopback` / `tailnet` / `lan` / `custom`（依版本） | **安全默认偏向 `loopback`** | 官网安全基线 / 本机文档 |
| `gateway.mode` | local / remote 运行形态 | `local` / `remote` / `hybrid`（依版本） | **常见默认 `local`** | 官网安全基线 / 本机文档 |
| `gateway.auth.mode` | UI 连接认证方式 | `token` / `password` / `none` / `oauth`（依页面/版本） | onboarding 默认会生成 token；安全默认应启用认证 | 官网 control-ui / security / 本机文档 |
| `gateway.controlUi.basePath` | UI 路径前缀 | 字符串 | 未写出时 UI 挂在根路径 `/` | 官网 control-ui |
| `gateway.controlUi.allowInsecureAuth` | 非安全 HTTP 下允许本地兼容连接 | `true` / `false` | **默认行为：不放宽**，即默认要求设备身份 | 官网 control-ui |
| `gateway.controlUi.dangerouslyDisableDeviceAuth` | 紧急禁用设备身份校验 | `true` / `false` | **默认应为 `false`** | 官网 control-ui |
| `gateway.auth.allowTailscale` | 是否允许 Tailscale 身份头免 token | `true` / `false` | 未写时按默认认证链路处理 | 官网 control-ui |

### 7.2 默认行为

- 默认本地地址：`http://127.0.0.1:18789/`
- 本地 `127.0.0.1` 连接 auto-approved
- 远程设备默认需要 pairing approval
- insecure HTTP 默认不放宽设备身份校验
- `allowInsecureAuth` 是兼容开关
- `dangerouslyDisableDeviceAuth` 是 break-glass

### 7.3 当前机器状态
- WebUI 可用
- 本地安全模式
- 不是公网开放模式

---

## 8. browser 能力

### 8.1 直接相关参数

| 参数路径 | 作用 | 常见值 | 未写出时默认值 / 默认行为 | 来源 |
|---|---|---|---|---|
| `browser.enabled` | browser 工具总开关 | `true` / `false` | 官网公开页未直接列出硬默认；依安装/版本/配置决定 | 本机文档 / 当前配置 |
| `browser.evaluateEnabled` | 是否允许页面 JS 执行 | `true` / `false` | 本机文档口径默认 `true` | 本机文档 |
| `browser.cdpUrl` | 顶层 CDP 地址 | URL | 未写时通常走 OpenClaw 自管 profile | 本机文档 |
| `browser.attachOnly` | 只 attach，不自行启动 | `true` / `false` | **默认 `false`** | 本机文档 |
| `browser.headless` | 是否无头模式 | `true` / `false` | **默认 `false`** | 本机文档 |
| `browser.noSandbox` | 是否加 `--no-sandbox` | `true` / `false` | **默认 `false`** | 本机文档 |
| `browser.defaultProfile` | 默认 profile | 字符串 | 常见默认 `chrome` | 本机文档 |
| `browser.profiles.{name}.driver` | profile 驱动方式 | `openclaw` / `clawd` / `extension` / `existing-session` | 未写时本机文档口径为 `openclaw` | 本机文档 |
| `browser.profiles.{name}.attachOnly` | profile 级 attach 行为 | `true` / `false` | 未写时回退到顶层 `browser.attachOnly` | 本机文档 |
| `browser.executablePath` | 指定浏览器二进制 | 路径字符串 | 未写时自动发现 | 本机文档 |
| `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` | 是否允许访问私网 | `true` / `false` | 本机文档口径默认 `true` | 本机文档 |

### 8.2 默认行为
- 未指定 profile 时走 `defaultProfile`
- profile 未写 `attachOnly` 时回退到顶层 `browser.attachOnly`
- 未写 `executablePath` 时自动发现浏览器

### 8.3 当前机器状态
- `browser.enabled = true`
- `browser.evaluateEnabled = true`
- `attachOnly = false`
- 默认 profile = `chrome9222`
- 主要走本机 `9222` CDP 链路

---

## 9. gateway 能力

### 9.1 直接相关参数

| 参数路径 | 作用 | 常见值 | 未写出时默认值 / 默认行为 | 来源 |
|---|---|---|---|---|
| `gateway.port` | 服务监听端口 | `1024-65535` | **默认 `18789`** | 官网 / 本机文档 |
| `gateway.mode` | 运行模式 | `local` / `remote` / `hybrid` | **常见默认 `local`** | 官网安全基线 / 本机文档 |
| `gateway.bind` | 绑定模式 / 接口 | `loopback` / `auto` / `lan` / `custom` / `tailnet` | **安全默认偏向 `loopback`** | 官网安全基线 / 本机文档 |
| `gateway.auth.mode` | 认证模式 | `token` / `none` / `oauth` / `password` | onboarding 默认生成 token；安全上默认不应裸奔 | 官网 control-ui / 本机文档 |
| `gateway.auth.token` | 访问令牌 | 字符串 | token 模式下需要设置；onboarding 可生成 | 官网 control-ui / 本机文档 |
| `gateway.tailscale.mode` | 是否启用 Tailnet 暴露 | `off` / `auto` / `manual` | **默认 `off`**（本机文档口径） | 本机文档 |
| `gateway.tailscale.resetOnExit` | 停止时是否重置 tailnet | `true` / `false` | **默认 `false`**（本机文档口径） | 本机文档 |
| `gateway.nodes.denyCommands` | 节点/远程执行 deny 列表 | 数组 | 默认至少应拦部分高风险系统能力；不同版本不一定完全一致 | 官网 security / 本机文档 |

### 9.2 默认行为
- 缺配置文件时使用 safe defaults
- 安全基线偏向 `local + loopback + token`
- `denyCommands` 做精确命令名匹配，不检查 shell 文本

### 9.3 当前机器状态
- `port = 18789`
- `mode = local`
- `bind = loopback`
- `auth.mode = token`
- `tailscale.mode = off`
- `denyCommands` 已设置

---

## 10. terminal / exec 能力

这部分最复杂，因为它不是一个参数控制，而是多层组合。

### 10.1 直接相关参数

| 参数路径 | 作用 | 常见值 | 未写出时默认值 / 默认行为 | 来源 |
|---|---|---|---|---|
| `tools.profile` | 工具能力基线 | `full` / `minimal` / `none` / `messaging` | 未写时依版本、agent profile、runtime 默认策略 | 官网 security / 本机文档 |
| `tools.allow` | 显式放行工具 | 数组 | 未写时按 profile / 默认策略 | 官网 security / sandbox-vs-tool-policy |
| `tools.deny` | 显式拒绝工具 | 数组 | 未写时按 profile / 默认策略 | 官网 security / sandbox-vs-tool-policy |
| `tools.byProvider[provider].profile` | provider 级工具基线 | 字符串 | 未写时回退到全局 `tools.profile` | 官网 sandbox-vs-tool-policy |
| `tools.byProvider[provider].allow/deny` | provider 级 allow / deny | 数组 | 未写时回退到全局工具策略 | 官网 sandbox-vs-tool-policy |
| `tools.fs.workspaceOnly` | 限制只访问工作区 | `true` / `false` | 官网安全基线示例推荐 `true`；未明确声明为全局硬默认 | 官网 security |
| `tools.exec.security` | exec 安全级别 | `deny` / `allowlist` / `full` | 官网安全基线示例推荐 `deny`；未明确声明为全局硬默认 | 官网 security / 本机文档 |
| `tools.exec.ask` | 审批策略 | `always` / `on-miss` / `off` | 官网安全基线示例推荐 `always`；未明确声明为全局硬默认 | 官网 security / 本机文档 |
| `tools.exec.backgroundMs` | exec 自动后台化等待时间 | 数字 | **默认 `10000`** | 官网 background-process |
| `tools.exec.timeoutSec` | exec 超时秒数 | 数字 | **默认 `1800`** | 官网 background-process |
| `tools.exec.cleanupMs` | exec 完成后保留时长 | 数字 | **默认 `1800000`** | 官网 background-process |
| `tools.exec.notifyOnExit` | 后台 exec 退出时是否通知 | `true` / `false` | **默认 `true`** | 官网 background-process |
| `tools.exec.notifyOnExitEmptySuccess` | 无输出成功是否通知 | `true` / `false` | **默认 `false`** | 官网 background-process |
| `tools.elevated.enabled` | 是否允许 elevated exec | `true` / `false` | 官网安全基线示例推荐 `false`；未明确声明为全局硬默认 | 官网 security / sandbox-vs-tool-policy |
| `tools.elevated.allowFrom.<provider>` | 哪些来源允许 elevated | allowlist | 未写时按默认 deny / 未授权处理 | 官网 sandbox-vs-tool-policy |
| `commands.native` | 是否原生执行命令 | `auto` / `always` / `never` | **本机文档默认 `auto`** | 本机文档 / 当前配置 |
| `commands.nativeSkills` | skill 内命令执行方式 | `auto` / `always` / `never` | **本机文档默认 `auto`** | 本机文档 / 当前配置 |
| `commands.restart` | 是否允许重启类命令 | `true` / `false` | **本机文档默认 `true`** | 本机文档 / 当前配置 |
| `commands.ownerDisplay` | 命令显示格式 | `raw` / `masked` | **本机文档默认 `raw`** | 本机文档 / 当前配置 |
| `gateway.nodes.denyCommands` | 功能级 deny | 数组 | 默认至少应拦一部分高风险系统能力；不同版本不一定一样 | 官网 security / 本机文档 |
| `agents.defaults.sandbox.mode` | sandbox 模式 | `off` / `non-main` / `all` | 未写时通常视为未启用 sandbox | 官网 configuration / sandboxing |
| `agents.defaults.sandbox.scope` | sandbox 作用域 | `session` / `agent` / `shared` | **默认 `session`** | 官网 sandboxing |
| `agents.defaults.sandbox.backend` | sandbox 后端 | `docker` / `ssh` / `openshell` | **默认 `docker`** | 官网 sandboxing |
| `agents.defaults.sandbox.workspaceAccess` | sandbox 看到的工作区权限 | `none` / `ro` / `rw` | **默认 `none`** | 官网 sandboxing |
| `agents.defaults.sandbox.browser.autoStart` | sandbox browser 是否自动启动 | `true` / `false` | **默认自动启动** | 官网 sandboxing |
| `agents.defaults.sandbox.browser.network` | sandbox browser 网络 | 字符串 | 默认使用 `openclaw-sandbox-browser` 专用网络 | 官网 sandboxing |
| `~/.openclaw/exec-approvals.json` | 本机审批记录 | allow / ask / deny 持久化 | 未写配置时依系统审批默认行为 | 本机文档 |

### 10.2 最关键的默认规则

#### 如果 config 文件缺失，会走 safe defaults
但注意：
- 官网没把 `tools.exec.security` 等所有字段的统一硬默认值全部列死
- 所以不能把安全基线示例直接当作“所有版本默认值”

#### 官方安全基线建议非常保守
官网 security 的 hardened baseline：

```json5
{
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false }
  }
}
```

#### `commands.native=auto` 的默认行为
本机文档口径：
- 简单命令倾向原生执行
- 复杂命令倾向更受限执行

#### `denyCommands` 只按精确命令名匹配
不是 shell 文本黑名单。

#### 如果 `tools.exec.host="sandbox"` 但 sandbox 没开
实际可能直接落到 gateway host。官网把这叫 **runtime expectation drift**。

#### 当 sandbox 开启时，`tools.sandbox.tools.allow/deny` 只在 sandbox 中生效
这一点容易误判。

#### `deny` 永远优先，`allow` 非空时未列出的都视为 blocked
这是官网 reference / tool policy 里非常关键的规则。

#### elevated 只影响 exec
不会授予别的工具，也不会覆盖工具 allow / deny。

### 10.3 工具组 shorthand

| 组名 | 展开工具 |
|---|---|
| `group:runtime` | `exec`, `bash`, `process` |
| `group:fs` | `read`, `write`, `edit`, `apply_patch` |
| `group:sessions` | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status` |
| `group:memory` | `memory_search`, `memory_get` |
| `group:ui` | `browser`, `canvas` |
| `group:automation` | `cron`, `gateway` |
| `group:messaging` | `message` |
| `group:nodes` | `nodes` |
| `group:openclaw` | 所有内建 OpenClaw 工具（不含 provider plugins） |

这意味着：
- 想限制 terminal，不一定只盯 `exec`
- 还要看是否放开了 `group:runtime`

---

## 11. 关键默认值与默认行为速查

### 11.1 全局
- config 文件缺失 → safe defaults

### 11.2 WebUI
- 默认本地地址：`http://127.0.0.1:18789/`
- 本地 loopback 自动批准
- 远程设备默认需要 pairing approval
- insecure HTTP 默认不放宽设备身份
- onboarding 默认会生成 gateway token

### 11.3 browser
- profile 子项未写时回退到顶层 browser 配置
- 未写 `browser.executablePath` → 自动发现
- 本机文档口径：`attachOnly=false`、`headless=false`、`noSandbox=false`

### 11.4 gateway / channel
- DM policy 默认 `pairing`
- Group policy 默认 `allowlist`
- provider block 缺失时，group policy fail-closed 到 `allowlist`
- `denyCommands` 只做精确命令名匹配

### 11.5 exec / sandbox
- `tools.exec.backgroundMs=10000`
- `tools.exec.timeoutSec=1800`
- `tools.exec.cleanupMs=1800000`
- `tools.exec.notifyOnExit=true`
- `tools.exec.notifyOnExitEmptySuccess=false`
- sandbox 默认 `scope=session`
- sandbox 默认 `backend=docker`
- sandbox 默认 `workspaceAccess=none`
- sandbox browser 默认 auto-start
- sandbox browser 默认使用 `openclaw-sandbox-browser` 专用网络
- sandbox 未启用时，某些“以为会进沙箱”的执行可能实际落到 host

---

## 12. 终端命令权限专项排查手册

### 场景 1：`pwd` / `ls` 能跑，但 `rm` / `curl` / 链式命令不行
**最可能原因：**
- `commands.native = auto`
- 简单命令与复杂命令被区别处理
- 复杂命令进入更受限路径、需要审批或被策略拦截

**优先检查：**
1. `commands.native`
2. `exec-approvals.json`
3. 是否命中高风险判断

### 场景 2：命令能执行，但访问路径失败
**最可能原因：**
- `tools.fs` 限制
- macOS 文件权限 / TCC 限制
- launchd 环境与 Terminal 环境不同

**优先检查：**
1. `tools.fs`
2. `agents.defaults.workspace`
3. 完全磁盘访问 / 文件夹授权

### 场景 3：命令能跑，但联网失败
**最可能原因：**
- 不是 exec 权限问题，而是代理 / 网络问题

**优先检查：**
1. `~/.openclaw/.env`
2. `HTTP_PROXY`
3. `HTTPS_PROXY`
4. `NO_PROXY`
5. LaunchAgent 是否继承这些变量

### 场景 4：在终端里能跑，在 OpenClaw 里不行
**最可能原因：**
- Terminal 与 OpenClaw Gateway 不是同一个环境
- Gateway 走 launchd 启动，环境变量不同
- OpenClaw 进程缺少 TCC 权限
- 当前会话工具暴露不同

**优先检查：**
1. launchd 环境
2. OpenClaw 是否通过 LaunchAgent 启动
3. 当前会话是否暴露 `exec`
4. macOS 权限是否授权给对应进程

### 场景 5：browser 能执行页面动作，但系统命令不行
**最可能原因：**
- browser 和 shell 是两条不同的执行链路
- `browser.evaluateEnabled = true` 不代表 shell 一定宽松
- browser profile 正常，不代表 `commands.native` / 审批 / TCC 也正常

**结论：**
- 不要拿 browser 可用，去推断系统命令一定可用

### 场景 6：系统能力类动作不行，但普通 shell 命令正常

例如：
- 录屏不行
- 摄像头不行
- 加提醒不行

**最可能原因：**

- 命中了