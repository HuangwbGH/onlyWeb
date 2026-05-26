# OpenClaw 网络代理说明

> 适用对象：当前这台 macOS 机器上的 OpenClaw 2026.3.13
> 
> 目标：讲清楚 OpenClaw 的网络代理到底配在哪里、怎么生效、怎么验证，以及为什么可以做到“海外模型走代理，飞书/钉钉直连”。

***

## 1. 先说结论

在当前这台机器上，OpenClaw 的网络代理**不是**写在 `~/.openclaw/openclaw.json` 里。

实际生效链路是：

1. 编辑 `~/.openclaw/.env`
2. Gateway 通过 LaunchAgent 启动
3. LaunchAgent 把 `.env` 里的环境变量注入给 `openclaw-gateway`
4. Gateway 对外请求时读取这些环境变量：
   - `HTTP_PROXY`
   - `HTTPS_PROXY`
   - `NO_PROXY`

所以，**网络代理问题优先查 `.env` 和 LaunchAgent，不要先去翻 `openclaw.json`。**

***

## 2. 当前机器的实际文件位置

### 2.1 OpenClaw 主配置文件
```bash
~/.openclaw/openclaw.json
```

用途：
- 模型
- channels
- gateway
- plugins
- skills
- agents

说明：
- 这里面定义的是 OpenClaw 的业务配置
- **通常不直接写 HTTP 代理变量**

### 2.2 环境变量文件
```bash
~/.openclaw/.env
```

用途：
- API Key
- 代理变量
- 其他通过环境变量注入的密钥/参数

### 2.3 macOS LaunchAgent 文件
```bash
~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

用途：
- 定义 Gateway 如何被 launchd 启动
- 启动时会把环境变量带给 `openclaw-gateway`

***

## 3. 当前机器已经验证过的代理策略

当前机器实际生效的关键环境变量是：

```bash
HTTP_PROXY=http://192.168.66.37:10809
HTTPS_PROXY=http://192.168.66.37:10809
NO_PROXY=localhost,127.0.0.1,::1,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,open.feishu.cn,open.feishu-boe.cn,feishu.cn,larkoffice.com,oapi.dingtalk.com,api.dingtalk.com,dingtalk.com
```

### 这套策略的含义

#### 走代理的流量
默认所有外部 HTTP/HTTPS 请求都会走：
```bash
http://192.168.66.37:10809
```

典型包括：
- OpenAI
- Moonshot / Kimi（如果未命中 NO_PROXY）
- 其他海外 API

#### 不走代理的流量
命中 `NO_PROXY` 的域名将直连。

当前明确配置为直连的主要有：

##### 飞书
- `open.feishu.cn`
- `open.feishu-boe.cn`
- `feishu.cn`
- `larkoffice.com`

##### 钉钉
- `oapi.dingtalk.com`
- `api.dingtalk.com`
- `dingtalk.com`

### 一句话理解

**现在这台机器是：海外模型走公司代理，飞书/钉钉直连。**

***

## 4. 为什么飞书 / 钉钉要放进 NO_PROXY

原因很简单：

1. 中国区企业平台经常更适合本地直连
2. 走公司代理可能会引入额外延迟、鉴权异常或回调问题
3. 飞书 / 钉钉属于国内服务，通常没有必要强行套海外代理链路

所以这台机器当前采用的是：
- **模型接口** → 走代理
- **飞书 / 钉钉机器人接口** → 直连

这套策略已经实测通过：
- Feishu probe：OK
- DingTalk probe：OK

***

## 5. 当前机器的实际验证结果

### 5.1 LaunchAgent 里已经看到了代理变量
已经验证 `launchctl print gui/$UID/ai.openclaw.gateway` 中存在：
- `HTTP_PROXY`
- `HTTPS_PROXY`
- `NO_PROXY`

这说明：
**不是只有 `.env` 写了，而是 Gateway 进程真的吃到了这些变量。**

### 5.2 OpenAI 连通性测试
之前测试过：
- DNS 正常
- connect 正常
- 能访问 `https://api.openai.com`

说明代理链路已经恢复。

### 5.3 飞书 / 钉钉健康检查
已经验证：
- Feishu：OK
- DingTalk：OK

说明 `NO_PROXY` 绕过策略已经生效。

***

## 6. 修改代理时应该改哪里

### 正确入口
优先改：
```bash
~/.openclaw/.env
```

### 不建议优先改的地方
不要一上来就去猜：
- `openclaw.json`
- 某个 skill 文件
- 临时 shell 里的 `export`

因为你改了当前终端环境变量，不代表 LaunchAgent 已经吃到。

***

## 7. 修改后如何生效

修改完 `~/.openclaw/.env` 后，需要让 Gateway 重新加载环境变量。

在这台机器上，通常做法是：

```bash
openclaw gateway install
openclaw gateway restart
```

### 为什么要这两步
- `gateway install`：更新 LaunchAgent 配置
- `gateway restart`：重启 Gateway，让新环境变量生效

如果只改 `.env` 不重启，常见结果就是：

> 文件里看起来改了，但实际运行进程还在用旧值。

***

## 8. 如何检查当前到底有没有生效

### 8.1 看 `.env`
```bash
cat ~/.openclaw/.env
```

重点看：
- `HTTP_PROXY`
- `HTTPS_PROXY`
- `NO_PROXY`

### 8.2 看 LaunchAgent 实际注入值
```bash
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'HTTP_PROXY|HTTPS_PROXY|NO_PROXY'
```

这一步很关键。因为：

- `.env` 只是文件内容
- `launchctl print` 看到的才是**Gateway 真正在用的值**

### 8.3 看 OpenClaw 健康状态
```bash
openclaw status --deep
```

重点看：
- Gateway
- Feishu
- DingTalk
- Health 区域

***

## 9. 典型错误现象与含义

### 9.1 模型全部超时
常见表现：
- GPT 超时
- Kimi 超时
- MiniMax 超时

通常意味着：
- 代理没配进去
- Gateway 没拿到代理变量
- 代理地址不可达

### 9.2 `.env` 已经写了，但还是不生效
常见原因：
- 没执行 `openclaw gateway install`
- 没执行 `openclaw gateway restart`
- 改的是文件，但运行进程还是旧环境

### 9.3 Feishu / DingTalk 不通，但模型正常
常见原因：
- 飞书 / 钉钉没加入 `NO_PROXY`
- 服务端权限 / scope 缺失
- channel 自身配置错误

### 9.4 Feishu probe 不是 timeout，而是权限报错
这说明问题通常不是代理，而是：
- `appId/appSecret` 不对
- 缺少开放平台权限
- 某个 API scope 未开通

***

## 10. 当前机器上发生过的真实问题

### 10.1 代理变量曾经被删没
之前排查时发现过：
- `~/.openclaw/.env` 里没有代理变量
- LaunchAgent 里也没有代理变量

结果就是：
- Gateway 裸跑
- OpenAI / Kimi / MiniMax 直连超时

### 10.2 后来已经恢复
目前已恢复为：
- `HTTP_PROXY/HTTPS_PROXY` 指向公司代理
- `NO_PROXY` 包含飞书 / 钉钉域名
- Feishu / DingTalk 均恢复正常

***

## 11. 建议的维护方式

### 建议 1
把网络代理的修改统一收口到：
```bash
~/.openclaw/.env
```

### 建议 2
每次改完都做这 3 步：
1. 看 `.env`
2. 看 `launchctl print`
3. 看 `openclaw status --deep`

### 建议 3
如果目标是“国内平台直连、海外模型走代理”，就持续维护 `NO_PROXY`。

***

## 12. 最短排查路径

如果你以后只想用最短路径判断代理是否生效，直接按这个顺序：

```bash
cat ~/.openclaw/.env
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'HTTP_PROXY|HTTPS_PROXY|NO_PROXY'
openclaw status --deep
```

看完这三步，基本就知道：
- 文件写没写对
- Gateway 吃没吃到
- 业务层到底通没通

***

## 13. 一句话总结

**OpenClaw 代理优先看 `~/.openclaw/.env` 和 LaunchAgent；当前这台机器已经验证为“海外模型走代理，飞书/钉钉直连”。**

***

## 相关阅读 / 索引链接

- [OpenClaw 配置文件详解](./openclaw-config-guide.md)
- [OpenClaw 排障速查表](./OpenClaw%20排障速查表.md)
