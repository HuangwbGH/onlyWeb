# OpenClaw 配置文件详解

> 配置文件路径：`~/.openclaw/openclaw.json`
>
> 说明：本文保持原有章节结构不变，但已根据当前 OpenClaw 官网文档、当前机器上的真实配置字段以及已验证的运行结果进行纠错和补充。
>
> 当前状态说明：本文已补充新版权限相关内容（尤其是 `tools / exec / elevated / gateway.auth / gateway.tools`），并新增“权限配置速查表”。如后续继续修订，建议再对 `commands`、`session`、`channels` 等章节做一次全量校对。

本文档详细解析 OpenClaw 配置文件的每个参数含义、层级结构、实际影响及默认值。

***

## 目录

1. [meta - 元数据](#meta---元数据)
2. [wizard - 向导配置](#wizard---向导配置)
3. [auth - 认证配置](#auth---认证配置)
4. [models - 模型配置](#models---模型配置)
5. [agents - 代理配置](#agents---代理配置)
6. [tools - 工具配置](#tools---工具配置)
7. [tools 逐字段全量说明](#tools-逐字段全量说明)
8. [commands - 命令配置](#commands---命令配置)
9. [browser - 浏览器配置](#browser---浏览器配置)
10. [session - 会话配置](#session---会话配置)
11. [hooks - 钩子配置](#hooks---钩子配置)
12. [channels - 通道配置](#channels---通道配置)
13. [gateway - 网关配置](#gateway---网关配置)
14. [skills - 技能配置](#skills---技能配置)
15. [plugins - 插件配置](#plugins---插件配置)
16. [模块间关联关系](#模块间关联关系)
17. [权限配置速查表](#权限配置速查表)
18. [相关阅读 / 索引链接](#相关阅读--索引链接)

> 注：此处“代理”指 AI Agent，不是网络代理。网络代理（HTTP_PROXY / HTTPS_PROXY / NO_PROXY）通常不写在 `openclaw.json`，而是通过 `~/.openclaw/.env` 与 LaunchAgent 环境变量生效。

***

## meta - 元数据

> 当前机器实际值
>
> ```json
> "meta": {
>   "lastTouchedVersion": "2026.3.11",
>   "lastTouchedAt": "2026-03-14T06:16:39.594Z"
> }
> ```

### 层级影响范围

**影响：** 仅用于内部记录和版本控制，不影响系统运行时行为。

### 参数详解

```json
"meta": {
  "lastTouchedVersion": "2026.3.11",
  "lastTouchedAt": "2026-03-14T06:16:39.594Z"
}
```

| 参数                   | 类型                | 说明                   | 实际影响                                 |
| -------------------- | ----------------- | -------------------- | ------------------------------------ |
| `lastTouchedVersion` | string            | 最后修改配置的 OpenClaw 版本号 | 用于版本兼容性检查，升级时判断是否需要进行配置迁移            |
| `lastTouchedAt`      | string (ISO 8601) | 最后修改配置的时间戳           | 用于配置备份和恢复时判断新旧， troubleshooting 时可追溯 |

**层级：** `meta` → 字段\
**默认值：** 自动生成，无需手动配置\
**修改建议：** 不要手动修改，系统会自动维护

***

## wizard - 向导配置

> 当前机器实际值
>
> ```json
> "wizard": {
>   "lastRunAt": "2026-03-12T01:13:37.158Z",
>   "lastRunVersion": "2026.3.8",
>   "lastRunCommand": "configure",
>   "lastRunMode": "local"
> }
> ```

### 层级影响范围

**影响：** 记录配置向导的执行历史，影响向导的启动行为（是否跳过已执行的步骤）。

### 参数详解

```json
"wizard": {
  "lastRunAt": "2026-03-12T01:13:37.158Z",
  "lastRunVersion": "2026.3.8",
  "lastRunCommand": "configure",
  "lastRunMode": "local"
}
```

| 参数               | 类型                | 说明                         | 实际影响                                      |
| ---------------- | ----------------- | -------------------------- | ----------------------------------------- |
| `lastRunAt`      | string (ISO 8601) | 向导最后运行时间                   | 影响 `--skip-wizard` 逻辑的判定，用于判断是否需要重新运行配置检查 |
| `lastRunVersion` | string            | 向导运行时使用的 OpenClaw 版本       | 版本升级后，如果检测到版本差异，会提示重新运行向导以适配新功能           |
| `lastRunCommand` | string            | 向导最后执行的命令（如 `doctor`）      | 影响 `openclaw doctor` 命令的行为，决定检查哪些配置项      |
| `lastRunMode`    | string            | 向导运行模式（`local` / `remote`） | 影响后续向导的默认运行模式建议                           |

**层级：** `wizard` → 字段\
**默认值：** 自动生成\
**修改建议：** 如需强制重新运行向导，可删除此对象或修改 `lastRunVersion`

***

## auth - 认证配置

> 当前机器实际值
>
> - 已配置 `moonshot:default`、`minimax:default`、`openai:default` 三套认证 profile。

### 层级影响范围

**影响：** 控制所有与外部 AI Provider 通信时的身份验证方式。影响范围涵盖模型调用、API 请求、Token 计费等功能。

### 层级结构

```
auth                              # 认证配置根节点
└── profiles                      # 认证配置档案集合
    └── {provider:profileName}    # 特定 provider 的认证配置
        ├── provider              # provider 名称
        └── mode                  # 认证模式
```

### 参数详解

```json
"auth": {
  "profiles": {
    "moonshot:default": {
      "provider": "moonshot",
      "mode": "api_key"
    },
    "maxConcurrent": 4,
    "subagents": {
      "maxConcurrent": 8
    }
  }
}
```

| 参数         | 类型     | 说明                                       | 实际影响                                                                                                              |
| ---------- | ------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `profiles` | object | 认证档案集合，键名为 `{provider}:{profileName}` 格式 | **核心参数**，决定了系统有哪些可用的认证方式。如果没有配置对应 provider 的 profile，models 中配置的该 provider 将无法使用                                  |
| `provider` | string | provider 标识                              | 必须与 `models.providers` 中的键名匹配，否则认证配置不会生效                                                                          |
| `mode`     | string | 认证方式                                     | 影响 API 请求时的认证头格式：- `api_key`: 使用 `Authorization: Bearer {key}`- `oauth`: 使用 OAuth 2.0 流程- `token`: 使用自定义 token 格式 |

### 实际影响说明

| 场景         | 影响描述                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------- |
| **模型调用**   | 当 Agent 调用模型时，系统根据 `models.providers.{name}` 查找对应的 `auth.profiles.{name}:default`，如果没有匹配的认证配置，调用会失败 |
| **API 请求** | 认证模式决定了 HTTP 请求的认证头格式，错误的模式会导致 401/403 错误                                                           |
| **多账号支持**  | 通过创建多个 profile（如 `moonshot:work`, `moonshot:personal`），可以实现同一个 provider 的多账号切换                      |

**默认值：** 空对象 `{}`，需手动配置\
**关联模块：** `models.providers`（必须与之一一对应）

***

## models - 模型配置

> 当前机器实际值
>
> - `openai`：`gpt-5.4`
> - `moonshot`：`kimi-k2-0711-preview`、`kimi-k2-0905-preview`
> - `minimax`：`MiniMax-M2.1`
> - 当前默认主模型：`openai/gpt-5.4`

### 层级影响范围

**影响：** 决定系统可用的 AI 模型、模型能力、成本计算和调用方式。这是核心配置之一，直接影响 Agent 的智能水平和响应质量。

<br />

<br />

层级结构

```
models                            # 模型配置根节点
├── mode                          # 模型合并模式
└── providers                     # provider 配置集合
    └── {providerName}            # 单个 provider 配置
        ├── baseUrl               # API 基础地址
        ├── apiKey                # API 密钥（可选）
        ├── api                   # API 类型
        └── models                # 该 provider 下的模型列表
            └── {model}           # 单个模型配置
                ├── id            # 模型 ID
                ├── name          # 显示名称
                ├── reasoning     # 是否支持推理
                ├── input         # 支持的输入类型
                ├── cost          # 成本配置
                ├── contextWindow # 上下文窗口大小
                └── maxTokens     # 最大生成 token 数
```

### 参数详解

```json
"models": {
  "mode": "merge",
  "providers": {
    "moonshot": {
      "baseUrl": "https://api.moonshot.cn/v1",
      "api": "openai-completions",
      "models": [...]
    },
    "maxConcurrent": 4,
    "subagents": {
      "maxConcurrent": 8
    }
  }
}
```

#### 根级别参数

| 参数     | 类型     | 说明     | 默认值       | 实际影响                                                                                          |
| ------ | ------ | ------ | --------- | --------------------------------------------------------------------------------------------- |
| `mode` | string | 模型合并模式 | `"merge"` | 当存在多个配置源（如用户配置+默认配置）时：- `"merge"`: 合并所有模型列表- `"replace"`: 仅使用用户配置的模型- `"append"`: 用户配置追加到默认配置 |

#### Provider 级别参数

| 参数        | 类型     | 说明                  | 实际影响                                                                                             |
| --------- | ------ | ------------------- | ------------------------------------------------------------------------------------------------ |
| `baseUrl` | string | API 服务端点 URL        | **核心参数**，所有对该 provider 的请求都会发送到这个 URL。错误的 URL 会导致无法连接                                            |
| `apiKey`  | string | 该 provider 的 API 密钥 | 用于认证。如果 provider 配置了 `apiKey`，会覆盖 `auth.profiles` 中的配置                                           |
| `api`     | string | API 协议类型            | 决定请求体格式和端点路径：- `openai-completions`: 使用 `/chat/completions`- `openai-responses`: 使用 `/responses` |
| `models`  | array  | 模型列表                | 定义该 provider 下可用的模型                                                                              |

#### 模型级别参数

| 参数                | 类型      | 说明                       | 实际影响                                                          |
| ----------------- | ------- | ------------------------ | ------------------------------------------------------------- |
| `id`              | string  | 模型唯一标识                   | 用于在 `agents.defaults.model.primary` 中引用，格式为 `{provider}/{id}` |
| `name`            | string  | 人类可读的显示名称                | 在日志、CLI 输出、Web UI 中显示                                         |
| `reasoning`       | boolean | 是否具备推理能力                 | 影响 Agent 的决策逻辑，推理模型会消耗更多 token 但更智能                           |
| `input`           | array   | 支持的输入类型                  | 限制用户可以发送的消息类型，如 `["text", "image"]` 支持图文输入                    |
| `cost.input`      | number  | 输入 token 单价（每 1M tokens） | 用于成本估算和用量监控                                                   |
| `cost.output`     | number  | 输出 token 单价（每 1M tokens） | 用于成本估算和用量监控                                                   |
| `cost.cacheRead`  | number  | 缓存读取单价                   | 影响 Prompt Caching 的成本计算                                       |
| `cost.cacheWrite` | number  | 缓存写入单价                   | 影响 Prompt Caching 的成本计算                                       |
| `contextWindow`   | number  | 最大上下文长度（tokens）          | **核心参数**，限制单次请求的最大上下文长度。超过会触发 compaction 或报错                  |
| `maxTokens`       | number  | 单次请求最大生成 tokens          | 限制模型回复的最大长度                                                   |

### 实际影响说明

| 场景             | 影响描述                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| **Agent 选择模型** | 系统根据 `agents.defaults.model.primary` 查找对应的 provider 和模型。如果找不到，会降级到默认模型或报错 |
| **API 请求构造**   | `api` 参数决定使用哪个 OpenAI 端点，影响请求的 JSON 结构和响应格式                               |
| **上下文管理**      | `contextWindow` 决定何时触发 compaction。当会话 token 数接近限制时，系统会压缩或丢弃历史消息           |
| **成本计算**       | `cost` 参数用于 `openclaw usage` 命令和用量报表，帮助用户了解 API 调用成本                      |
| **多模态支持**      | `input` 数组控制 UI 中是否显示图片上传按钮，以及后端是否处理图片输入                                  |

### API 类型对比

| 类型                   | 端点                  | 特点       | 适用场景              |
| -------------------- | ------------------- | -------- | ----------------- |
| `openai-completions` | `/chat/completions` | 标准聊天完成接口 | 大多数 OpenAI 兼容 API |
| `openai-responses`   | `/responses`        | 新版本响应接口 | OpenAI 官方新 API，当前机器上的 `openai/gpt-5.4` 即使用这一类 |

**关联模块：**

- `auth.profiles`（认证依赖）
- `agents.defaults.model.primary`（模型选择）
- `agents.defaults.compaction`（上下文管理）

***

## agents - 代理配置

> 当前机器实际值
>
> - `agents.defaults.model.primary = openai/gpt-5.4`
> - `agents.defaults.model.fallbacks` 已配置
> - `workspace = /Users/mac/.openclaw/workspace`
> - `memorySearch.enabled = true`
> - `memorySearch.model = bge-m3`
> - `maxConcurrent = 4`
> - `subagents.maxConcurrent = 8`

### 层级影响范围

**影响：** 控制所有 AI Agent 的默认行为，包括模型选择、工作目录、记忆搜索和会话压缩策略。这是影响 Agent 行为的核心配置。

### 层级结构

```
agents                            # 代理配置根节点
└── defaults                      # 默认配置
    ├── model                     # 主模型配置
    │   ├── primary               # 主模型标识
    │   └── fallbacks             # 回退模型列表
    ├── models                    # 特定模型覆盖配置
    │   └── {modelId}             # 模型特定参数
    │       ├── alias             # 别名
    │       └── params            # 额外参数
    ├── workspace                 # 工作目录
    ├── memorySearch              # 记忆搜索配置
    │   ├── enabled               # 是否启用
    │   ├── provider              # embedding provider
    │   ├── remote                # 远端/兼容配置（可选）
    │   └── model                 # embedding 模型
    └── compaction                # 会话压缩配置
        └── mode                  # 压缩模式
```

### 参数详解

```json
"agents": {
  "defaults": {
    "model": {
      "primary": "openai/gpt-5.4"
    },
    "models": {
      "moonshot/kimi-k2.5": {
        "alias": "Kimi"
      },
      "\"openai/gpt-5.2\"": {
        "params": {
          "transport": "sse",
          "openaiWsWarmup": false
        }
      }
    },
    "workspace": "/Users/mac/.openclaw/workspace",
    "memorySearch": {
      "enabled": true,
      "provider": "openai",
      "remote": {
        "baseUrl": "http://localhost:11434/v1",
        "apiKey": "ollama"
      },
      "model": "bge-m3"
    },
    "compaction": {
      "mode": "safeguard"
    },
    "maxConcurrent": 4,
    "subagents": {
      "maxConcurrent": 8
    }
  }
}
```

#### 主模型配置

| 参数                | 类型     | 说明                        | 实际影响                                          |
| ----------------- | ------ | ------------------------- | --------------------------------------------- |
| `model.primary`   | string | 主模型，格式 `provider/modelId` | **核心参数**，决定 Agent 默认使用的模型。如果该模型不可用，系统会尝试回退或报错 |
| `model.fallbacks` | array  | 回退模型列表                    | 主模型失败、超时或不可达时，系统可按顺序尝试后备模型；当前机器已实际配置该字段       |

#### 模型特定覆盖配置

| 参数                                  | 类型      | 说明                  | 实际影响                                                     |
| ----------------------------------- | ------- | ------------------- | -------------------------------------------------------- |
| `models.{id}.alias`                 | string  | 模型别名                | 在 CLI 和 UI 中显示的简化名称，方便用户识别                               |
| `models.{id}.params`                | object  | 模型特定参数              | 覆盖该模型的默认连接参数                                             |
| `models.{id}.params.transport`      | string  | 传输协议                | `"sse"` (Server-Sent Events) 或 `"websocket"`。影响流式响应的实现方式 |
| `models.{id}.params.openaiWsWarmup` | boolean | OpenAI WebSocket 预热 | `true` 时会在首次请求前建立 WebSocket 连接，减少首次延迟                    |

#### 工作目录

| 参数          | 类型     | 说明           | 实际影响                                      |
| ----------- | ------ | ------------ | ----------------------------------------- |
| `workspace` | string | Agent 工作目录路径 | Agent 执行文件操作（读写、执行命令）的默认目录。所有相对路径都基于此目录解析 |

#### 记忆搜索配置

| 参数                    | 类型      | 说明                 | 实际影响                                                 |
| --------------------- | ------- | ------------------ | ---------------------------------------------------- |
| `memorySearch.enabled` | boolean | 是否启用记忆搜索           | 关闭后 memory_search 能力会受限或停用                           |
| `memorySearch.provider` | string  | Embedding provider | 指定用于向量化的模型 provider，如 `ollama`, `openai`             |
| `memorySearch.model`  | string  | Embedding 模型名称     | 具体的 embedding 模型，如 `qwen3-embedding:0.6b`。影响记忆检索的准确性 |

**实际影响：**

- 当 Agent 需要检索历史记忆时，会将查询内容转换为向量
- 使用指定的 embedding 模型计算向量相似度
- 错误的配置会导致记忆搜索功能失效

#### 会话压缩配置

| 参数                | 类型     | 说明     | 默认值           | 实际影响                    |
| ----------------- | ------ | ------ | ------------- | ----------------------- |
| `compaction.mode` | string | 会话压缩模式 | `"safeguard"` | 决定何时以及如何压缩会话历史以节省 token |

##### 压缩模式详解

| 值           | 触发时机         | 压缩策略        | 适用场景          |
| ----------- | ------------ | ----------- | ------------- |
| `safeguard` | 上下文达到 80% 容量 | 智能摘要，保留关键信息 | 默认推荐，平衡性能和上下文 |
| `aggressive` | 上下文达到 60% 容量 | 激进压缩，可能丢失细节 | 长会话场景，优先节省成本 |
| `off`       | 不自动压缩        | 不压缩，超过时截断或报错 | 调试场景，需要完整上下文 |

**实际影响：**

- `safeguard`: 每 10-20 轮对话可能触发一次压缩，用户体验较平滑
- `aggressive`: 频繁压缩，可能遗忘早期对话细节，但成本最低
- `off`: 当 `contextWindow` 满时，系统会拒绝新消息或截断历史

### 实际影响说明

| 场景           | 影响描述                                                                      |
| ------------ | ------------------------------------------------------------------------- |
| **Agent 启动** | 系统根据 `model.primary` 加载对应模型配置，如果不存在会报错                                    |
| **文件操作**     | 所有相对路径都相对于 `workspace` 解析。例如 `cat file.txt` 实际读取的是 `{workspace}/file.txt` |
| **长会话**      | `compaction.mode` 决定用户何时会感觉到"机器人忘记了之前的对话"                                 |
| **记忆检索**     | `memorySearch` 配置决定 Agent 能否准确找到相关历史信息                                    |
| **模型别名**     | 在 CLI 中可以使用 `alias` 代替完整的 `provider/modelId`，如 `@Kimi`                    |

**关联模块：**

- `models.providers`（模型定义）
- `tools`（影响 Agent 可用能力）
- `commands`（影响命令执行）

***

## qtools - 工具配置

> 当前机器实际值
>
> ```json
> "tools": {
>   "sessions": {
>     "visibility": "all"
>   }
> }
> ```

### 层级影响范围

**影响：** `tools` 是 OpenClaw 最核心的权限边界之一，决定 Agent **能不能看到某个工具、能不能调用、在什么条件下调用、在 sandbox 里还是宿主机上调用、以及不同 provider / agent / HTTP 入口是否还要进一步受限**。

可以把它理解成 4 层：

1. **基础工具集合**：`profile`
2. **精细放行/封禁**：`allow / deny`
3. **特殊能力控制**：`exec / fs / elevated / sessions / sandbox`
4. **按来源/模型再细分**：`byProvider`

### 参数详解

```json
"tools": {
  "sessions": {
    "visibility": "all"
  }
}
```

> 说明：较新的 OpenClaw 版本中，`tools` 不再只是一个简单的 `profile` 字段。它可以包含 `profile / allow / deny / byProvider / exec / fs / elevated / sessions / web / sandbox` 等更细粒度策略。
>
> 根据当前官方文档，工具权限判断通常会叠加多层：
>
> - 全局工具策略 `tools.*`
> - provider 级工具策略 `tools.byProvider.*`
> - agent 级工具策略 `agents.list[].tools.*`
> - sandbox 工具策略 `tools.sandbox.tools.*`
> - HTTP `/tools/invoke` 入口自己的默认 deny 规则

### 根级参数总表

| 参数 | 类型 | 含义 / 意义 | 可选值 / 常见值 | 默认值 / 官方结论 | 影响内容 |
| --- | --- | --- | --- | --- | --- |
| `tools.profile` | string | 工具基线配置档，决定默认暴露哪些工具 | 常见：`"full"`, `"minimal"`, `"none"` | 依版本与默认配置而定 | 决定 Agent 默认“能做什么” |
| `tools.allow` | array | 显式允许工具列表 | 例如 `[`read`, `write`, `browser`]` | 未设置时按 `profile` | 精细放行；当 allow 非空时，未列出的工具通常视为不可用 |
| `tools.deny` | array | 显式拒绝工具列表 | 例如 `[`exec`, `gateway`]` | 未设置时按 `profile` | 精细封禁；`deny` 优先级高 |
| `tools.byProvider` | object | 按 provider 或 `provider/model` 做差异化工具策略 | provider 名、`provider/model` | 未设置 | 对不同模型/来源施加不同工具权限 |
| `tools.exec` | object | `exec` 工具专用策略 | 子字段见下 | 未配置时走默认审批/安全策略 | 决定 shell 命令如何执行 |
| `tools.fs` | object | 文件系统访问策略 | 子字段见下 | 未配置时走工作区默认边界 | 决定文件读写边界 |
| `tools.elevated` | object | sandbox 中越狱到宿主机执行 `exec` 的配置 | 子字段见下 | `enabled: false`（需显式开启） | 决定是否能从 sandbox 切回宿主机执行 |
| `tools.sessions` | object | 会话工具可见性与边界 | 如 `visibility` | 依实现默认值 | 决定能否看到/操作别的会话 |
| `tools.web` | object | 联网类工具策略 | 依实现 | 未配置 | 对 web 类工具做额外约束 |
| `tools.sandbox` | object | sandbox 专用工具策略 | 子字段见下 | 未配置 | 仅在 sandboxed session 中生效 |

### `profile`：工具基线

`profile` 决定“默认给 Agent 一组什么能力”。它像一个预设包，后面还能继续叠加 `allow / deny`。

| 值 | 意义 | 典型场景 | 影响 |
| --- | --- | --- | --- |
| `full` | 最大能力集 | 个人高权限助理、开发场景 | 文件、搜索、浏览器、命令等能力都更完整，风险最高 |
| `minimal` | 最小必要能力 | 安全优先、对外机器人、文档类场景 | 更适合先安全跑起来，再按需放行 |
| `none` | 不给工具 | 纯聊天 / 演示 | 只能文本回答，几乎不能外部操作 |

**示例：**

```json5
{
  tools: {
    profile: "minimal"
  }
}
```

**影响：** Agent 默认只拿到较保守的工具基线，很多高风险工具不会直接暴露。

### `allow / deny`：精细权限控制

这是最常用的精细权限开关。

| 参数 | 类型 | 可选范围 | 意义 | 影响 |
| --- | --- | --- | --- | --- |
| `tools.allow` | array | 工具名数组、工具组（如 `group:fs`） | 精细放行 | 非空时通常变成“白名单模式” |
| `tools.deny` | array | 工具名数组、工具组 | 精细封禁 | `deny` 永远优先于允许 |

**官方规则要点：**

- `deny` 总是优先。
- 如果 `allow` 非空，未明确允许的工具通常视为 blocked。
- 工具组（group）可以一次展开一类工具：
  - `group:runtime` → `exec`, `bash`, `process`
  - `group:fs` → `read`, `write`, `edit`, `apply_patch`
  - `group:sessions` → `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
  - `group:memory` → `memory_search`, `memory_get`
  - `group:ui` → `browser`, `canvas`
  - `group:automation` → `cron`, `gateway`
  - `group:messaging` → `message`
  - `group:nodes` → `nodes`
  - `group:openclaw` → 所有内建 OpenClaw 工具（不含 provider plugins）

**示例 1：只允许文件类工具**

```json5
{
  tools: {
    allow: ["group:fs"],
    deny: ["apply_patch"]
  }
}
```

**效果：**

- 允许 `read / write / edit`
- 再额外禁止 `apply_patch`
- 典型用于“能改文件，但不想让它做大面积 patch”

**示例 2：开放基础工具，但拒绝高危自动化**

```json5
{
  tools: {
    profile: "full",
    deny: ["exec", "gateway", "cron", "nodes"]
  }
}
```

**效果：** Agent 能力仍然较强，但不能直接跑命令、改网关、跑 cron、控制设备。

### `byProvider`：按 provider / 模型拆分工具权限

这个参数用于“不同模型，不同权限”。

| 参数 | 类型 | 可选范围 | 意义 | 影响 |
| --- | --- | --- | --- | --- |
| `tools.byProvider` | object | provider 或 `provider/model` 键名对象 | 做差异化工具权限 | 某些模型可以放宽，某些模型必须收紧 |
| `tools.byProvider.<key>.profile` | string | `full` / `minimal` / `none` | 覆盖该 provider 的工具基线 | 针对某类模型设置单独基线 |
| `tools.byProvider.<key>.allow` | array | 工具名 / 工具组 | 针对某类模型放行工具 | 更细粒度控制 |
| `tools.byProvider.<key>.deny` | array | 工具名 / 工具组 | 针对某类模型拒绝工具 | 防止某些模型拿高危能力 |

> `key` 可以是 provider，例如 `openai`，也可以是更细的 `provider/model`，例如 `openai/gpt-5.4`。

**示例：**

```json5
{
  tools: {
    byProvider: {
      openai: {
        deny: ["exec"]
      },
      "anthropic/claude-sonnet-4-6": {
        allow: ["group:fs", "browser"]
      }
    }
  }
}
```

**效果：**

- 所有 OpenAI 模型默认禁用 `exec`
- 指定 Claude 模型额外放行文件类工具和浏览器

### `tools.exec`：命令执行权限

这是 `tools` 下最关键的一类，因为它直接决定 shell / 命令执行的安全边界。

| 参数 | 类型 | 含义 / 意义 | 可选范围 / 常见值 | 默认值 / 官方结论 | 影响内容 |
| --- | --- | --- | --- | --- | --- |
| `tools.exec` | object | `exec` 工具子配置 | 对象 | 未配置时走默认审批链 | 控制命令是否容易执行、是否要审批 |
| `tools.exec.host` | string | 命令优先在哪执行 | 常见 `"auto"` | 文档示例默认 `auto` | 影响命令是走当前环境还是按策略分配 |
| `tools.exec.security` | string | 安全策略级别 | 常见 `"allowlist"` | 常见默认 `allowlist` | 决定未被允许命令是否被拦或需审批 |
| `tools.exec.ask` | string | 审批触发模式 | 常见 `"on-miss"`, `"always"`, `"never"`（依实现） | 常见默认 `on-miss` | 决定 exec 是否弹审批 |
| `tools.exec.allowFrom` | object / array | 哪些来源更宽松可用 exec | sender allowlist | 依配置 | 可按 channel/sender 放宽 exec |
| `tools.exec.approvals` | object | 审批规则补充项 | 依实现 | 默认启用保护性审批 | 影响 allow-once / allow-always 等审批体验 |
| `tools.exec.defaultMode` | string | 默认执行模式 | 依版本 | 依版本 | 影响未显式声明时的 exec 行为 |

**意义：**

- 决定命令执行是“默认拦住”、“按 allowlist 放行”，还是“每次都问”。
- 决定 exec 是生产环境里的安全闸门，还是开发环境里的高效能力。

**关键结论：**

- `exec` 是否可用，先看工具策略有没有允许它。
- 工具允许了，也不代表一定直接执行，还要经过审批链。
- HTTP `/tools/invoke` 默认仍会额外拒绝 `exec`。

**示例：允许 exec 但保留审批**

```json5
{
  tools: {
    exec: {
      host: "auto",
      security: "allowlist",
      ask: "on-miss"
    }
  }
}
```

**效果：**

- 命中 allowlist 的命令更容易直接执行
- 未命中的命令需要审批
- 适合个人助手或运维半自动场景

**示例：极严格 exec**

```json5
{
  tools: {
    deny: ["exec"]
  }
}
```

**效果：** 无论审批怎么配，工具层已经把 `exec` 彻底禁掉了。

### `tools.elevated`：sandbox 中越狱到宿主机执行

Elevated 只影响 `exec`，**不增加新的工具权限**。

| 参数 | 类型 | 含义 / 意义 | 可选范围 | 默认值 | 影响内容 |
| --- | --- | --- | --- | --- | --- |
| `tools.elevated.enabled` | boolean | 是否启用 elevated 能力 | `true` / `false` | `false` | 不开启则 `/elevated on/full` 等都不可用 |
| `tools.elevated.allowFrom` | object | 哪些发送者能用 elevated | 各 channel sender allowlist | 空 | 只有命中 allowlist 才能启用 elevated |

**可选运行级别（会话指令，不是配置值）：**

| 指令 | 含义 | 效果 |
| --- | --- | --- |
| `/elevated off` | 关闭 elevated | 回到 sandbox 内执行 |
| `/elevated on` | 开启 elevated | 改为宿主机执行，但保留 exec 审批 |
| `/elevated ask` | `on` 的别名 | 同上 |
| `/elevated full` | 最强级别 | 宿主机执行，并跳过 exec 审批 |

**允许格式：**

`allowFrom` 的条目可以匹配：

- 无前缀：sender ID / E.164 / from 字段
- `name:`：显示名
- `username:`：用户名
- `tag:`：tag
- `id:` / `from:` / `e164:`：显式身份匹配

**解析顺序：**

1. inline directive
2. session override
3. `agents.defaults.elevatedDefault`

**权限门：**

- 全局门：`tools.elevated.enabled`
- 全局 allowlist：`tools.elevated.allowFrom`
- agent 门：`agents.list[].tools.elevated.enabled`
- agent allowlist：`agents.list[].tools.elevated.allowFrom`
- 所有门都得通过

**示例：只允许 Discord 指定用户用 elevated**

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        discord: ["123456789012345678"]
      }
    }
  }
}
```

**效果：**

- 只有这个 Discord 用户能发 `/elevated on` 或 `/elevated full`
- 其他人即使会指令，也没权限打开

### `tools.sessions`：会话工具可见性

| 参数 | 类型 | 含义 / 意义 | 可选范围 / 常见值 | 默认值 / 文档结论 | 影响内容 |
| --- | --- | --- | --- | --- | --- |
| `tools.sessions.visibility` | string | 控制会话工具能看多大范围 | 常见如 `"all"` | 依配置 | 决定 `sessions_list`、`sessions_history`、`sessions_send` 等可见范围 |

当前机器实际值：

```json
"tools": {
  "sessions": {
    "visibility": "all"
  }
}
```

**意义：**

- 不是只影响“能不能调用 sessions 工具”
- 而是影响“调用后能看到哪些 session”

**示例：**

```json5
{
  tools: {
    sessions: {
      visibility: "all"
    }
  }
}
```

**效果：** 会话工具可见性更大，但多用户环境下风险也更高。

### `tools.fs`：文件系统访问边界

> 官方文档对 `tools.fs` 的细节分散在工具策略 / sandbox / 工作区边界说明里。它的核心意义是：**控制 Agent 文件访问范围，不要让文件类工具默认越界。**

| 参数 | 类型 | 含义 / 意义 | 常见效果 | 默认值 / 官方结论 |
| --- | --- | --- | --- | --- |
| `tools.fs` | object | 文件访问控制 | 控制读写目录范围、只读/读写边界 | 未配置时通常以 workspace 与运行环境边界为主 |

**意义：**

- 用于约束 `read / write / edit / apply_patch` 这一类工具的宿主文件访问边界。
- 对“能改工作区，但不能改系统目录”这类需求尤其重要。

**示例思路：**

```json5
{
  tools: {
    allow: ["group:fs"],
    fs: {
      // 具体字段依版本实现；核心目标是限制文件边界
    }
  }
}
```

**效果：** 即使开放了文件类工具，也应继续通过 `fs` 或 sandbox/workspace 边界限制其作用范围。

### `tools.sandbox`：仅对 sandbox 生效的工具策略

这是很多人会漏掉的一层。只要 session 真在 sandbox 内，`tools.sandbox.tools.*` 还会继续过滤工具。

| 参数 | 类型 | 意义 | 可选范围 | 影响 |
| --- | --- | --- | --- | --- |
| `tools.sandbox.tools.allow` | array | sandbox 内允许哪些工具 | 工具名 / 工具组 | 只在 sandbox 里放行 |
| `tools.sandbox.tools.deny` | array | sandbox 内禁止哪些工具 | 工具名 / 工具组 | 只在 sandbox 里封禁 |

**示例：sandbox 内只给文件和记忆工具**

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:fs", "group:memory"],
        deny: ["exec", "browser", "gateway", "nodes"]
      }
    }
  }
}
```

**效果：**

- 非 sandbox 会话不受这层影响
- sandbox 会话会进一步被收紧
- 常用于“群聊 / 子任务默认进 sandbox，但只让它读写工作区”

### `tools.web`：联网类工具约束

| 参数 | 类型 | 意义 | 默认值 / 文档结论 | 影响 |
| --- | --- | --- | --- | --- |
| `tools.web` | object | 对联网/网页相关工具做额外策略控制 | 未配置 | 影响 `web_search`、`web_fetch`、`browser` 等联网能力的暴露面 |

**意义：**

- 当你希望 AI 能查资料，但不希望它拥有完整浏览器/自动化能力时，这类字段很有用。
- 具体子字段依版本实现变化较快，因此建议和 `allow / deny` 联合使用，而不是单独依赖它。

### `tools` 逐字段全量说明

> 这一节按“字段字典”方式写，尽量把 `tools` 下面常见字段逐条列清楚。对于官网已明确写出的字段，按官方行为说明；对于官网未集中列出的字段，会明确标注“依实现 / 需结合当前版本验证”。

#### 一、根级字段

##### `tools.profile`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.profile` |
| 类型 | `string` |
| 意义 | 定义工具基线，相当于一套默认工具包 |
| 常见可选值 | `"full"`, `"minimal"`, `"none"` |
| 默认值 | 依版本与默认配置而定 |
| 影响 | 决定 Agent 默认能接触到哪些工具类别 |

**示例：**

```json5
{
  tools: {
    profile: "minimal"
  }
}
```

##### `tools.allow`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.allow` |
| 类型 | `array<string>` |
| 意义 | 显式允许的工具列表 |
| 可选范围 | 工具名、工具组（如 `group:fs`） |
| 默认值 | 空 / 未设置 |
| 影响 | 当 allow 非空时，系统通常按白名单思路处理 |

**常见写法：**

```json5
{
  tools: {
    allow: ["read", "write", "browser"]
  }
}
```

##### `tools.deny`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.deny` |
| 类型 | `array<string>` |
| 意义 | 显式禁止的工具列表 |
| 可选范围 | 工具名、工具组 |
| 默认值 | 空 / 未设置 |
| 影响 | 比 allow 更强，`deny` 优先级最高 |

**示例：**

```json5
{
  tools: {
    deny: ["exec", "gateway", "nodes"]
  }
}
```

##### `tools.byProvider`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.byProvider` |
| 类型 | `object` |
| 意义 | 按 provider / model 拆分工具权限 |
| 可选范围 | provider 名、`provider/model` |
| 默认值 | 未设置 |
| 影响 | 某些模型可以更开放，某些模型可以更保守 |

**结构：**

```json5
{
  tools: {
    byProvider: {
      openai: {
        profile: "minimal",
        deny: ["exec"]
      },
      "anthropic/claude-sonnet-4-6": {
        allow: ["group:fs", "browser"]
      }
    }
  }
}
```

#### 二、`tools.byProvider.<key>` 子字段

##### `tools.byProvider.<key>.profile`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.byProvider.<providerOrModel>.profile` |
| 类型 | `string` |
| 可选值 | `"full"`, `"minimal"`, `"none"` |
| 意义 | 覆盖特定 provider / model 的工具基线 |
| 影响 | 对某一类模型设单独权限底盘 |

##### `tools.byProvider.<key>.allow`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.byProvider.<providerOrModel>.allow` |
| 类型 | `array<string>` |
| 可选范围 | 工具名、工具组 |
| 意义 | 对某个 provider / model 单独放行工具 |
| 影响 | 适合做“高模型高权限 / 低模型低权限”区分 |

##### `tools.byProvider.<key>.deny`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.byProvider.<providerOrModel>.deny` |
| 类型 | `array<string>` |
| 可选范围 | 工具名、工具组 |
| 意义 | 对某个 provider / model 单独封禁工具 |
| 影响 | 防止某类模型拿到高危工具 |

#### 三、`tools.exec` 子字段

##### `tools.exec.host`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.exec.host` |
| 类型 | `string` |
| 常见值 | `"auto"` |
| 默认值 | 文档示例常见为 `auto` |
| 意义 | 指定 exec 默认优先在哪个执行环境运行 |
| 影响 | 影响命令落点与路由策略 |

##### `tools.exec.security`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.exec.security` |
| 类型 | `string` |
| 常见值 | `"allowlist"` |
| 默认值 | 常见默认 `allowlist` |
| 意义 | 决定命令安全检查策略 |
| 影响 | 未放行命令可能被拦截或转为审批 |

##### `tools.exec.ask`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.exec.ask` |
| 类型 | `string` |
| 常见值 | `"on-miss"`, `"always"`, `"never"`（依实现） |
| 默认值 | 常见默认 `on-miss` |
| 意义 | 定义审批触发模式 |
| 影响 | 决定 exec 是否弹批准 |

##### `tools.exec.allowFrom`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.exec.allowFrom` |
| 类型 | `object` 或 `array` |
| 可选范围 | sender allowlist / 按通道 allowlist |
| 默认值 | 未设置 |
| 意义 | 放宽特定来源的 exec 使用权限 |
| 影响 | 不同发送者可有不同 exec 权限体验 |

##### `tools.exec.approvals`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.exec.approvals` |
| 类型 | `object` |
| 默认值 | 默认启用保护性审批链 |
| 意义 | 进一步控制 exec 审批行为 |
| 影响 | 关系到 allow-once / allow-always / exact command trust 等体验 |

> 这一节的细子字段在官方文档里分散在 exec approvals 体系中，建议最终结合 `exec-approvals.json` 与当前版本验证。

##### `tools.exec.defaultMode`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.exec.defaultMode` |
| 类型 | `string` |
| 默认值 | 依版本 |
| 意义 | 定义未显式指定时的 exec 默认运行模式 |
| 影响 | 影响默认审批/默认执行路径 |

#### 四、`tools.elevated` 子字段

##### `tools.elevated.enabled`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.elevated.enabled` |
| 类型 | `boolean` |
| 可选值 | `true`, `false` |
| 默认值 | `false` |
| 意义 | 是否启用 elevated 能力 |
| 影响 | 不开启则 `/elevated on/full` 不可用 |

##### `tools.elevated.allowFrom`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.elevated.allowFrom` |
| 类型 | `object` |
| 可选范围 | 按 channel 列 sender allowlist |
| 默认值 | 空 |
| 意义 | 指定哪些来源可使用 elevated |
| 影响 | 决定谁有资格把 sandbox 内的 exec 切回宿主机 |

##### `tools.elevated.allowFrom.<channel>`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.elevated.allowFrom.discord` / `whatsapp` / `telegram` 等 |
| 类型 | `array<string>` |
| 可选范围 | sender id、`name:`、`username:`、`tag:`、`id:`、`from:`、`e164:` |
| 默认值 | 未设置 |
| 意义 | 某个 channel 的具体 allowlist |
| 影响 | 只有命中该列表的用户可用 elevated |

#### 五、`tools.sessions` 子字段

##### `tools.sessions.visibility`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.sessions.visibility` |
| 类型 | `string` |
| 常见值 | `"all"` |
| 默认值 | 依配置 |
| 意义 | 控制会话工具看到的范围 |
| 影响 | 决定 `sessions_list` / `sessions_history` / `sessions_send` 的可见范围 |

#### 六、`tools.sandbox` 子字段

##### `tools.sandbox.tools.allow`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.sandbox.tools.allow` |
| 类型 | `array<string>` |
| 可选范围 | 工具名、工具组 |
| 默认值 | 未设置 |
| 意义 | 仅在 sandbox 环境里额外放行工具 |
| 影响 | 只影响 sandboxed session |

##### `tools.sandbox.tools.deny`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.sandbox.tools.deny` |
| 类型 | `array<string>` |
| 可选范围 | 工具名、工具组 |
| 默认值 | 未设置 |
| 意义 | 仅在 sandbox 环境里额外封禁工具 |
| 影响 | 只影响 sandboxed session |

#### 七、`tools.fs` 子字段

> 当前官方文档没有把 `tools.fs` 所有细子字段集中列成一个完整表，但其职责很明确：限制文件访问边界。这里先把“意义、效果、使用方式”说明清楚。

##### `tools.fs`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.fs` |
| 类型 | `object` |
| 默认值 | 未设置时通常由 workspace / sandbox / 运行环境边界共同决定 |
| 意义 | 为文件类工具设置额外的路径边界和读写限制 |
| 影响 | 限制 `read / write / edit / apply_patch` 能访问的目录范围 |

**使用建议：**

- 只开放 `group:fs` 还不够，最好还要配合 workspace / sandbox / bind mounts 限制路径
- 如果你的需求是“只能改项目目录，不能碰系统目录”，`tools.fs` 是应该重点关注的层

#### 八、`tools.web` 子字段

> 官方文档对 `tools.web` 也没有把所有细子字段集中列清。它更多用于对联网类工具做额外策略控制，通常和 `allow / deny` 联用。

##### `tools.web`

| 项目 | 说明 |
| --- | --- |
| 字段路径 | `tools.web` |
| 类型 | `object` |
| 默认值 | 未设置 |
| 意义 | 对联网类工具（搜索、抓取、浏览器）附加策略 |
| 影响 | 影响 `web_search`、`web_fetch`、`browser` 的暴露范围 |

#### 九、逐字段理解速记

| 字段 | 最核心问题 |
| --- | --- |
| `tools.profile` | 默认给 Agent 多大工具盘子？ |
| `tools.allow` | 明确让它能用哪些工具？ |
| `tools.deny` | 明确不让它碰哪些工具？ |
| `tools.byProvider.*` | 不同模型是不是要不同权限？ |
| `tools.exec.*` | shell 命令怎么执行，需不需要审批？ |
| `tools.elevated.*` | sandbox 内能不能跳回宿主机？谁能跳？ |
| `tools.sessions.visibility` | 会话工具能看到多大范围？ |
| `tools.sandbox.tools.*` | sandbox 里是不是还要再收紧一层？ |
| `tools.fs` | 文件类工具能碰哪些路径？ |
| `tools.web` | 联网能力到底放多开？ |

### 工具类别说明

| 工具类别 | 典型工具 | 功能描述 | 风险等级 |
| --- | --- | --- | --- |
| 文件操作 | `read`, `write`, `edit`, `apply_patch` | 读写本地文件系统 | 中到高 |
| 代码执行 | `exec`, `bash`, `process` | 执行系统命令或脚本 | 高 |
| 网络请求 | `web_search`, `web_fetch`, `browser` | 联网搜索、抓取、浏览器交互 | 中 |
| 系统控制 | `nodes`, `gateway` | 控制节点设备、网关配置与重启 | 高 |
| 搜索查询 | `memory_search`, `sessions_list` | 搜索记忆、会话或上下文 | 低到中 |
| 记忆管理 | `memory_get` 等 | 长期记忆读取 | 低 |
| 自动化 | `cron` | 定时任务和自动执行 | 高 |

### `tools` 参数影响总结

| 配置项 | 主要意义 | 可选范围 / 典型值 | 实际影响 |
| --- | --- | --- | --- |
| `profile` | 决定默认工具基线 | `full` / `minimal` / `none` | 决定 Agent 初始能力盘子 |
| `allow` | 精细放行 | 工具名 / 工具组 | 白名单式控制工具 |
| `deny` | 精细封禁 | 工具名 / 工具组 | 黑名单式硬封禁 |
| `byProvider` | 差异化权限 | provider / provider-model 对象 | 不同模型不同权限 |
| `exec` | 命令执行安全 | `host/security/ask/...` | 决定命令审批与执行方式 |
| `fs` | 文件边界 | object | 决定文件类工具能碰哪些路径 |
| `elevated` | sandbox 越狱 | `enabled/allowFrom` | 决定是否能切到宿主机执行 |
| `sessions` | 会话可见性 | `visibility` | 决定能看到哪些 session |
| `sandbox` | sandbox 内再收紧 | `tools.allow/deny` | 仅在 sandboxed session 中生效 |
| `web` | 联网类工具约束 | object | 决定联网暴露面 |

### 典型配置示例

#### 示例 1：最稳妥的个人助理

```json5
{
  tools: {
    profile: "full",
    deny: ["gateway", "nodes"],
    exec: {
      host: "auto",
      security: "allowlist",
      ask: "on-miss"
    },
    sessions: {
      visibility: "all"
    }
  }
}
```

**意义：** 能力完整，但保留 exec 审批，并且不让 AI 直接改网关/控设备。
