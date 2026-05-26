# OpenClaw 4.5 代理配置指南

## 问题背景

升级到 OpenClaw 4.5 后，使用 OpenAI GPT 模型时持续报错 `LLM request timed out`，而其他服务器上同一 API Key 可以正常使用。

## 根本原因

OpenClaw 4.5 引入了新的 `openai-responses` API 类型（调用 `/v1/responses` 端点，即 OpenAI Responses API），其底层使用 `fetchWithSsrFGuard` 在 **STRICT 模式**下发起请求。

该模式**不会自动读取 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量**，必须在 `openclaw.json` 中为 Provider 显式配置 `request.proxy`，请求才会走代理。

## 文件说明

| 文件 | 说明 |
|---|---|
| `~/.openclaw/.env` | **有效**：openclaw 启动时自动加载到 `process.env` |
| `~/.openclaw/openclaw.env` | **无效**：openclaw 源码中零引用，不会被读取 |

> 所有环境变量（代理、API Key 等）应写在 `~/.openclaw/.env`，不要写在 `openclaw.env`。

## 配置步骤

### 第一步：确认 `~/.openclaw/.env` 包含代理配置

```bash
# ~/.openclaw/.env
HTTP_PROXY=http://192.168.1.27:20171
HTTPS_PROXY=http://192.168.1.27:20171
NO_PROXY=localhost,127.0.0.1,::1,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,open.feishu.cn,open.feishu-boe.cn,feishu.cn,larkoffice.com,oapi.dingtalk.com,api.dingtalk.com,dingtalk.com
```

### 第二步：在 `~/.openclaw/openclaw.json` 中为 OpenAI Provider 添加代理配置

在 `models.providers.openai` 下添加 `request.proxy`：

```json
"openai": {
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-...",
  "api": "openai-responses",
  "request": {
    "proxy": {
      "mode": "env-proxy"
    }
  },
  "models": [...]
}
```

`env-proxy` 模式会自动读取 `process.env` 中的 `HTTPS_PROXY` / `HTTP_PROXY`，并遵守 `NO_PROXY` 规则。

### 第三步：重启 openclaw-gateway

`openclaw.json` 支持热重载，但 `.env` 的变更（环境变量）需要重启才能生效。

## 哪些 Provider 需要配置代理

| Provider | 是否需要 `request.proxy` | 原因 |
|---|---|---|
| `openai` | **需要** | 境外服务，中国大陆无法直连 |
| `moonshot`、`qwen`、`minimax` 等 | 不需要 | 中国服务商，直连即可 |
| 本地服务（如 `localhost:11434` Ollama） | 不需要 | 本地直连 |

> 未配置 `request.proxy` 的 Provider 默认直连，不走代理。

## 代理模式说明

| 模式 | 配置 | 说明 |
|---|---|---|
| `env-proxy` | `{"mode": "env-proxy"}` | 读取 `HTTPS_PROXY` 环境变量，自动遵守 `NO_PROXY`，**推荐** |
| `explicit-proxy` | `{"mode": "explicit-proxy", "url": "http://..."}` | 硬编码代理地址，不读取环境变量 |

## 技术细节

OpenClaw 4.5 使用 undici 的 `EnvHttpProxyAgent` 实现 `env-proxy` 模式，`NO_PROXY` 支持：
- 域名精确匹配：`api.dingtalk.com`
- 域名后缀匹配：`.local`
- CIDR 网段：`192.168.0.0/16`、`10.0.0.0/8`
