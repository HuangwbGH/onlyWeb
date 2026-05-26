# 手动修改 `openclaw.json` 添加大模型配置说明

## 目录
- [一、适用场景](#一适用场景)
- [二、配置结构总览](#二配置结构总览)
- [三、整体依赖关系](#三整体依赖关系)
- [四、在 `auth.profiles` 中添加认证方式](#四在-authprofiles-中添加认证方式)
- [五、在 `models.providers` 中添加具体参数](#五在-modelsproviders-中添加具体参数)
- [六、在 `agents.defaults.model` 中添加默认/回退模型](#六在-agentsdefaultsmodel-中添加默认回退模型)
- [七、在 `agents.defaults.models` 中添加模型显示配置](#七在-agentsdefaultsmodels-中添加模型显示配置)
- [八、在 `~/.openclaw/.env` 中声明环境变量](#八在-openclawenv-中声明环境变量)
- [九、参数级说明总表](#九参数级说明总表)
- [十、完整示例：添加 Qwen-Max](#十完整示例添加-qwen-max)
- [十一、修改后如何生效](#十一修改后如何生效)
- [十二、一句话总结](#十二一句话总结)

---

## 一、适用场景
当需要给 OpenClaw 手动新增一个大模型 provider（例如 Qwen、DeepSeek、Claude 兼容网关、OpenAI 兼容平台等）时，通常需要同时修改以下几个位置：

1. `auth.profiles`
2. `models.providers`
3. `agents.defaults.model`
4. `agents.defaults.models`
5. `~/.openclaw/.env`（当 `apiKey` 使用环境变量时）

这几个配置分别负责：
- **认证方式定义**
- **模型服务定义**
- **模型默认路由**
- **模型显示与别名**
- **真实密钥注入**

---

## 二、配置结构总览
OpenClaw 中与模型相关的配置，大致可以理解为下面这几层：

### 1. `auth`
作用：

> 定义每个 provider 采用什么认证方式。

这一层回答的是：
- 这个 provider 怎么认证？
- 是 API Key、Password，还是别的模式？
- 有哪些认证 profile 可用？

---

### 2. `models.providers`
作用：

> 定义模型服务本身，包括 API 地址、API Key 来源、协议类型、模型列表。

这一层回答的是：
- 请求应该发到哪里？
- 调用时使用什么协议格式？
- 这个 provider 下有哪些模型？
- 每个模型的 ID、名称、上下文大小、输出限制是什么？

---

### 3. `agents.defaults.model`
作用：

> 定义默认主模型，以及主模型失败时的回退模型链。

这一层回答的是：
- OpenClaw 默认优先调用哪个模型？
- 如果失败，下一步切哪个模型？

---

### 4. `agents.defaults.models`
作用：

> 定义模型的显示配置，例如 alias（别名）。

这一层回答的是：
- 这个模型在 UI / 状态 / 日常描述里显示成什么名字？
- 有没有更友好的别名？

---

### 5. `~/.openclaw/.env`
作用：

> 给 `openclaw.json` 中引用的环境变量提供真实值。

这一层回答的是：
- `${QWEN_API_KEY}` 真实值是什么？
- `${MOONSHOT_API_KEY}` 从哪里来？
- 重启 Gateway 后实际加载的密钥是什么？

---

## 三、整体依赖关系
这几层配置之间不是独立的，而是有明确依赖关系。

### 1. `auth.profiles` 和 `models.providers` 的关系
- `auth.profiles` 中的 `provider` 名，必须和 `models.providers` 中的 provider 名一致
- 如果名称不一致，OpenClaw 无法正确建立认证与 provider 的对应关系

### 2. `models.providers` 和 `agents.defaults.model` 的关系
- 即使 `models.providers` 里已经声明了一个模型
- 只要 `agents.defaults.model.primary` 或 `fallbacks` 没有引用它
- 这个模型就不会进入默认主路由或回退链

### 3. `models.providers` 和 `agents.defaults.models` 的关系
- `models.providers` 负责“模型能不能被调用”
- `agents.defaults.models` 负责“模型怎么显示更友好”
- 前者影响能力，后者影响展示

### 4. `models.providers.apiKey` 和 `.env` 的关系
- 如果 `apiKey` 写成：
  ```json
  "apiKey": "${QWEN_API_KEY}"
  ```
- 那么 `~/.openclaw/.env` 中必须存在：
  ```bash
  export QWEN_API_KEY=你的真实key
  ```
- 两边变量名必须完全一致

---

## 四、在 `auth.profiles` 中添加认证方式
作用：

> 告诉 OpenClaw：这个 provider 使用什么认证模式。

### 示例
```json
"auth": {
  "profiles": {
    "qwen:default": {
      "provider": "qwen",
      "mode": "api_key"
    }
  }
}
```

### 这一层每个参数的含义
#### `qwen:default`
- 表示一个认证 profile
- 一般格式是：`provider:profileName`
- `default` 表示该 provider 的默认认证档案

#### `provider`
- 表示这个认证档对应哪个 provider
- 这里必须和 `models.providers` 中的 key 一致，例如都写 `qwen`

#### `mode`
- 表示认证模式
- 常见值是：`api_key`
- 含义是：OpenClaw 用 API Key 方式进行认证

### 这一层影响什么
- 影响 OpenClaw 如何理解并组织 provider 的认证方式
- 是模型调用链中的“认证定义层”
- 主要影响：认证模式是否正确匹配 provider

---

## 五、在 `models.providers` 中添加具体参数
作用：

> 告诉 OpenClaw：模型服务地址、API Key 来源、API 协议类型、模型列表。

### 示例：添加 Qwen-Max
```json
"models": {
  "providers": {
    "qwen": {
      "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "apiKey": "${QWEN_API_KEY}",
      "api": "openai-completions",
      "models": [
        {
          "id": "qwen-max",
          "name": "Qwen Max",
          "reasoning": true,
          "input": ["text"],
          "contextWindow": 32000,
          "maxTokens": 8192
        }
      ]
    }
  }
}
```

### 这一层每个参数的含义
#### `qwen`
- 是 provider 名
- 后续 `auth.profiles`、`agents.defaults.model`、`agents.defaults.models` 都会引用它

#### `baseUrl`
- 模型服务的接口地址
- 影响请求最终发往哪里

#### `apiKey`
- 该 provider 使用的 API Key
- 推荐写成环境变量引用：
  ```json
  "${QWEN_API_KEY}"
  ```
- 影响该 provider 是否能鉴权成功

#### `api`
- 表示调用协议类型
- 例如：
  - `openai-completions`
  - `openai-responses`
  - `anthropic-messages`
- 影响请求/响应格式
- 这是调用是否兼容的关键参数之一

#### `models`
- 定义该 provider 下有哪些模型可供 OpenClaw 使用

#### `id`
- 模型的真实 ID
- 后续会与 provider 组合成：
  ```text
  qwen/qwen-max
  ```
- 影响模型路由和引用

#### `name`
- 模型的显示名称
- 影响可读性和展示

#### `reasoning`
- 表示该模型是否按推理模型对待
- 影响系统对该模型能力和用途的判断

#### `input`
- 表示支持的输入类型
- 通常是 `['text']`

#### `contextWindow`
- 模型最大上下文窗口
- 影响可承载的对话/文档长度

#### `maxTokens`
- 模型最大输出 token 数
- 影响单次输出上限

### 这一层影响什么
- 影响模型是否真正被注册到 OpenClaw
- 影响请求地址、协议格式、鉴权方式、模型可用性
- 是“模型能力定义层”

---

## 六、在 `agents.defaults.model` 中添加默认/回退模型
作用：

> 告诉 OpenClaw：默认主模型和回退模型顺序。

### 示例
```json
"agents": {
  "defaults": {
    "model": {
      "primary": "openai/gpt-5.4",
      "fallbacks": [
        "qwen/qwen-max",
        "moonshot/kimi-k2-0711-preview",
        "minimax/MiniMax-M2.1"
      ]
    }
  }
}
```

### 这一层每个参数的含义
#### `primary`
- 默认主模型
- OpenClaw 在正常情况下优先调用它

#### `fallbacks`
- 回退模型列表
- 当主模型失败、超时或不可用时，OpenClaw 按顺序依次尝试这些模型

#### 模型引用格式
这里的模型必须写成：
```text
provider/model-id
```
例如：
- `qwen/qwen-max`
- `openai/gpt-5.4`

### 这一层影响什么
- 影响默认模型路由顺序
- 影响主模型失败时的自动回退逻辑
- 如果模型只在 `models.providers` 中注册，但没有写到这里，就不会进入默认主链路

---

## 七、在 `agents.defaults.models` 中添加模型显示配置
作用：

> 给模型定义更友好的显示名称或其他模型级默认设置。

### 示例
```json
"agents": {
  "defaults": {
    "models": {
      "qwen/qwen-max": {
        "alias": "Qwen Max"
      }
    }
  }
}
```

### 这一层每个参数的含义
#### `qwen/qwen-max`
- 目标模型的完整引用名
- 必须与 `provider/id` 组合完全一致

#### `alias`
- 模型的显示别名
- 用于状态页、说明、展示场景中的友好名称

### 这一层影响什么
- 主要影响显示和可读性
- 不决定模型是否能真正调用
- 不决定模型是否进入默认主链路
- 属于“展示配置层”

---

## 八、在 `~/.openclaw/.env` 中声明环境变量
作用：

> 给 `openclaw.json` 中引用的环境变量提供真实值。

### 环境文件位置
通常是：

```bash
~/.openclaw/.env
```

如果没有，就先创建：

```bash
mkdir -p ~/.openclaw
touch ~/.openclaw/.env
```

### 你要求的写法
在 `~/.openclaw/.env` 中写：

```bash
export QWEN_API_KEY=你的真实key
```

### 多个模型一起写的示例
```bash
export MOONSHOT_API_KEY=你的moonshot真实key
export MINIMAX_API_KEY=你的minimax真实key
export QWEN_API_KEY=你的qwen真实key
```

### 与代理一起写的示例
```bash
export MOONSHOT_API_KEY=你的moonshot真实key
export MINIMAX_API_KEY=你的minimax真实key
export QWEN_API_KEY=你的qwen真实key
export HTTP_PROXY=http://192.168.1.27:20171
export HTTPS_PROXY=http://192.168.1.27:20171
export NO_PROXY=localhost,127.0.0.1,::1,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,open.feishu.cn,open.feishu-boe.cn,feishu.cn,larkoffice.com,oapi.dingtalk.com,api.dingtalk.com,dingtalk.com
```

### 这一层每个参数的含义
#### `export QWEN_API_KEY=...`
- 定义环境变量 `QWEN_API_KEY`
- 供 `openclaw.json` 中的 `${QWEN_API_KEY}` 使用
- `export` 表示把该变量导出到进程环境中

### 这一层影响什么
- 影响 OpenClaw 启动后能否解析真实 API Key
- 影响模型是否能完成鉴权
- 如果只写了 `openclaw.json`，但 `.env` 中没有这个变量，则 provider 无法拿到真实 key

---

## 九、参数级说明总表

| 层级 | 参数 | 含义 | 影响 |
|------|------|------|------|
| `auth.profiles` | `provider` | 认证档案对应的 provider 名 | 必须与 `models.providers` 一致 |
| `auth.profiles` | `mode` | 认证方式 | 决定如何理解和使用认证 |
| `models.providers` | `baseUrl` | 模型接口地址 | 决定请求发往哪里 |
| `models.providers` | `apiKey` | API Key 或环境变量引用 | 决定是否能鉴权成功 |
| `models.providers` | `api` | 调用协议类型 | 决定请求/响应格式 |
| `models.providers.models[]` | `id` | 模型真实 ID | 决定模型引用名 |
| `models.providers.models[]` | `name` | 模型显示名称 | 影响展示 |
| `models.providers.models[]` | `reasoning` | 是否推理模型 | 影响模型能力定位 |
| `models.providers.models[]` | `contextWindow` | 最大上下文长度 | 影响单次可处理内容规模 |
| `models.providers.models[]` | `maxTokens` | 最大输出长度 | 影响单次最大输出 |
| `agents.defaults.model` | `primary` | 默认主模型 | 决定日常优先调用哪个模型 |
| `agents.defaults.model` | `fallbacks` | 回退模型链 | 决定主模型失败时的尝试顺序 |
| `agents.defaults.models` | `alias` | 模型别名 | 影响状态页与展示名称 |
| `.env` | `QWEN_API_KEY` | 环境变量真实值 | 决定 `${QWEN_API_KEY}` 是否能解析 |

---

## 十、完整示例：添加 Qwen-Max

### 1. `auth.profiles`
```json
"qwen:default": {
  "provider": "qwen",
  "mode": "api_key"
}
```

### 2. `models.providers`
```json
"qwen": {
  "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "apiKey": "${QWEN_API_KEY}",
  "api": "openai-completions",
  "models": [
    {
      "id": "qwen-max",
      "name": "Qwen Max",
      "reasoning": true,
      "input": ["text"],
      "contextWindow": 32000,
      "maxTokens": 8192
    }
  ]
}
```

### 3. `agents.defaults.model`
```json
"model": {
  "primary": "openai/gpt-5.4",
  "fallbacks": [
    "qwen/qwen-max",
    "moonshot/kimi-k2-0711-preview",
    "minimax/MiniMax-M2.1"
  ]
}
```

### 4. `agents.defaults.models`
```json
"qwen/qwen-max": {
  "alias": "Qwen Max"
}
```

### 5. `~/.openclaw/.env`
```bash
export QWEN_API_KEY=你的真实key
```

---

## 十一、修改后如何生效
手动改完后，通常需要重启 Gateway，让配置与环境变量重新加载：

```bash
openclaw gateway restart
```

如果改动涉及 `~/.openclaw/.env`，尤其建议重启 Gateway。

这一步影响的是：
- 配置是否重新读取
- 环境变量是否重新加载
- 新模型是否真正注册进当前运行实例

---

## 十二、一句话总结
手动给 OpenClaw 添加一个大模型，本质上是在补齐这五层：

1. **`auth.profiles`**：定义认证方式
2. **`models.providers`**：定义 provider 地址、协议、模型列表和 key 引用
3. **`agents.defaults.model`**：定义默认主模型和回退链
4. **`agents.defaults.models`**：定义别名等显示配置
5. **`~/.openclaw/.env`**：提供真实环境变量值

如果 `apiKey` 使用环境变量，那么 `~/.openclaw/.env` 中应写：

```bash
export QWEN_API_KEY=你的真实key
```

然后重启 Gateway：

```bash
openclaw gateway restart
```
