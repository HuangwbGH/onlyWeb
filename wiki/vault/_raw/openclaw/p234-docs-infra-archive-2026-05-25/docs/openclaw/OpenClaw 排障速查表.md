# OpenClaw 排障速查表

> 适用对象：当前这台 macOS 机器上的 OpenClaw 2026.3.13
> 
> 目标：当你遇到模型超时、Feishu 异常、DingTalk 异常、Gateway 不通、UI 像卡死时，能快速知道先查什么、怎么看、怎么判断。

***

## 1. 最先用的 4 个命令

先记住这 4 个，排障时最常用：

```bash
openclaw status --deep
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'HTTP_PROXY|HTTPS_PROXY|NO_PROXY'
cat ~/.openclaw/.env
tail -n 120 ~/.openclaw/logs/gateway.log
```

如果只允许你先看 4 个地方，就先看它们。

***

## 2. 模型超时怎么查

### 常见现象
- GPT-5.4 超时
- Kimi 超时
- MiniMax 超时
- 所有模型都慢或者都失败

### 优先判断
先区分是：
1. **网络问题**
2. **代理没生效**
3. **API key / provider 配置问题**
4. **模型自身故障**

### 排查步骤

#### 第一步：看当前健康状态
```bash
openclaw status --deep
```

重点看：
- Gateway 是否 reachable
- 当前默认模型是什么
- Channels 是否正常

#### 第二步：看代理变量是否真的注入给 Gateway
```bash
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'HTTP_PROXY|HTTPS_PROXY|NO_PROXY'
```

如果这里没有代理变量，说明：
- 就算 `.env` 改了
- Gateway 也可能还是没吃到

#### 第三步：看 `.env`
```bash
cat ~/.openclaw/.env
```

当前机器正常目标值类似：
```bash
HTTP_PROXY=http://192.168.66.37:10809
HTTPS_PROXY=http://192.168.66.37:10809
NO_PROXY=localhost,127.0.0.1,...
```

#### 第四步：必要时直接测 OpenAI 连通性
```bash
curl -I https://api.openai.com --connect-timeout 5
```

### 结果判断

#### 情况 A：DNS 正常，connect 超时
大概率是：
- 代理不通
- 直连被拦

#### 情况 B：`.env` 里有代理，但 LaunchAgent 没有
大概率是：
- 改完没 install/restart

#### 情况 C：只有某一个模型坏
大概率是：
- 该 provider key 有问题
- 该 provider 接口异常
- 模型配置不对

***

## 3. Feishu 异常怎么查

### 常见现象
- Feishu probe WARN
- 飞书不回消息
- 飞书机器人连不上
- 飞书消息进来了但处理异常

### 第一步：看整体状态
```bash
openclaw status --deep
```

如果看到：
- `Feishu | OK` → 基础连接没问题
- `Feishu | WARN` → 继续看日志

### 第二步：看日志
```bash
tail -n 120 ~/.openclaw/logs/gateway.log
tail -n 120 ~/.openclaw/logs/gateway.err.log
```

### 常见原因分类

#### 1. 网络问题
如果是 timeout、connect failed、网络不可达，优先查代理和 `NO_PROXY`

#### 2. 权限 / scope 问题
如果日志里出现类似：
- `tenant_access_token` 获取失败
- `Access denied`
- `One of the following scopes is required`

这通常不是网络，而是：
- 飞书应用缺权限
- appId / appSecret 不对
- API scope 没开

### 当前机器上出现过的真实报错
这台机器日志里出现过：
- `99991672`
- 缺少联系人相关 scope

这类问题的结论通常是：
**飞书链路通了，但应用权限不足。**

### 第三步：看飞书是否应当直连
当前这台机器已经采用：
- 飞书域名放进 `NO_PROXY`
- 飞书请求直连，不走公司代理

核对方式：
```bash
launchctl print gui/$UID/ai.openclaw.gateway | grep NO_PROXY
```

重点看里面是否包含：
- `open.feishu.cn`
- `feishu.cn`
- `larkoffice.com`

***

## 4. DingTalk 异常怎么查

### 常见现象
- DingTalk probe 异常
- 钉钉不回消息
- 钉钉推送失败

### 第一步：看状态
```bash
openclaw status --deep
```

如果 DingTalk 是：
- `OK` → 基本链路正常
- `WARN` / `failed` → 继续看日志

### 第二步：看日志
```bash
tail -n 120 ~/.openclaw/logs/gateway.log
tail -n 120 ~/.openclaw/logs/gateway.err.log
```

### 第三步：区分是哪一层故障

#### 网络层
如果是 connect / timeout / proxy 相关，优先查代理配置

#### 账号 / 目标层
如果日志里出现类似：
- `staff 不存在`
- `staffId.notExisted`

说明通常不是网不通，而是：
- userId 错了
- 目标账号不存在
- 发信对象不合法

### 当前机器上出现过的真实报错
这台机器日志里出现过：
- `staffId.notExisted`

这类问题结论通常是：
**DingTalk 接口是通的，但目标人员标识不对。**

### 第四步：确认钉钉是否走直连
当前这台机器已经设置：
- `oapi.dingtalk.com`
- `api.dingtalk.com`
- `dingtalk.com`

都在 `NO_PROXY` 里。

***

## 5. Gateway 不通怎么查

### 常见现象
- 打不开控制台
- `openclaw status` 报错
- Web UI 打不开
- ws 不通

### 第一步：看服务是否在跑
```bash
openclaw status --deep
ps aux | grep -i '[o]penclaw'
```

### 第二步：看最近日志
```bash
tail -n 120 ~/.openclaw/logs/gateway.log
tail -n 120 ~/.openclaw/logs/gateway.err.log
```

### 当前机器上出现过的真实故障
#### `MOONSHOT_API_KEY` 缺失
这台机器日志里出现过：
- `Environment variable "MOONSHOT_API_KEY" is missing or empty`
- `Gateway failed to start`

这说明：
- 某些 provider 配置引用了环境变量
- 但运行时没有解析出来
- Gateway 启动可能直接失败

### 第三步：看 `.env`
```bash
cat ~/.openclaw/.env
```

如果缺关键 key，就算 `openclaw.json` 写了 `${MOONSHOT_API_KEY}` 也没用。

### 第四步：看 Gateway 绑定方式
当前机器实际是：
- `gateway.mode = local`
- `gateway.bind = loopback`

所以正常访问方式应该是：
```bash
http://127.0.0.1:18789/
```

不是公网地址。

***

## 6. Web UI / Control UI 看起来卡死怎么查

### 常见现象
- 页面像卡住
- 点了没反应
- 回复明显变慢
- 不是完全挂掉，但体验很钝

### 优先判断
这种情况不一定是 Gateway 死了，也可能是：
1. 主会话上下文太大
2. 前端权限不足
3. 某个请求被拒绝
4. 某条消息处理很重

### 这台机器上出现过的真实迹象
- 当前主会话 token 一度到 **126k / 200k**
- UI 日志里有：
  - `missing scope: operator.read`

这说明：
- 一部分“像卡住”的现象，其实是权限不足
- 另一部分是会话太长导致响应变钝

### 排查方法

#### 看当前会话状态
```bash
openclaw status --deep
```

重点看：
- Sessions
- 当前主模型
- token 占用

#### 看日志里的 ws 响应
```bash
tail -n 120 ~/.openclaw/logs/gateway.log
```

如果是：
- `missing scope: operator.read`

说明不是卡死，而是请求被拒。

### 经验建议
- 长文档编辑、连续排障，尽量不要一直堆在同一个主会话里
- 重任务适合拆到新会话或短会话

***

## 7. 如果改了 `.env` 但还是不生效

这是非常常见的问题。

### 先确认 3 件事
1. `.env` 文件里确实改了
2. LaunchAgent 里真的吃到了
3. Gateway 已经重启

### 最短验证链路
```bash
cat ~/.openclaw/.env
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'HTTP_PROXY|HTTPS_PROXY|NO_PROXY'
openclaw status --deep
```

如果第 1 步对、第 2 步不对，通常就是：
- 需要重新 install / restart

***

## 8. 当前机器的已知状态总结

### 已验证正常
- Gateway 当前在运行
- Feishu：OK
- DingTalk：OK
- OpenAI 链路已恢复
- 飞书 / 钉钉已通过 `NO_PROXY` 直连

### 已知风险 / 待注意
- Feishu `groupPolicy=open`，安全面偏宽
- 主会话太长时，UI 体感会明显变慢
- 某些 Control UI 请求可能因为缺 `operator.read` scope 而被拒
- 某些 `gateway.nodes.denyCommands` 名称可能不精确，导致以为拦住其实没完全拦住

***

## 9. 最短故障判断模板

以后遇到问题，你可以按这个顺序判断：

### 模型不通
```bash
cat ~/.openclaw/.env
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'HTTP_PROXY|HTTPS_PROXY|NO_PROXY'
openclaw status --deep
```

### 飞书不通
```bash
openclaw status --deep
tail -n 120 ~/.openclaw/logs/gateway.log
```

### 钉钉不通
```bash
openclaw status --deep
tail -n 120 ~/.openclaw/logs/gateway.err.log
```

### Gateway 起不来
```bash
openclaw status --deep
tail -n 120 ~/.openclaw/logs/gateway.err.log
cat ~/.openclaw/.env
```

### UI 像卡死
```bash
openclaw status --deep
tail -n 120 ~/.openclaw/logs/gateway.log
```

***

## 10. 一句话总结

**排障时先别猜，先看 `status --deep`、`.env`、LaunchAgent 实际环境变量和最近日志。多数问题都能很快归类到：网络、权限、配置、目标对象错误，或者会话过重。**

***

## 相关阅读 / 索引链接

- [OpenClaw 配置文件详解](./openclaw-config-guide.md)
- [OpenClaw 网络代理说明](./OpenClaw%20网络代理说明.md)
