# OpenClaw Control UI 局域网 HTTPS 代理完整过程总结与复现教程

## 目录

- [1. 文档目标](#1-文档目标)
- [2. 最终成果](#2-最终成果)
- [3. 整体架构](#3-整体架构)
- [4. 时间线总结：昨天到今天做了什么](#4-时间线总结昨天到今天做了什么)
  - [4.1 最初状态：只能本机访问 HTTP](#41-最初状态只能本机访问-http)
  - [4.2 昨天：修改 `openclaw.json`，让 gateway 面向局域网并启用 token](#42-昨天修改-openclawjson让-gateway-面向局域网并启用-token)
  - [4.3 昨天：引入 Caddy，建立局域网 HTTPS 入口](#43-昨天引入-caddy建立局域网-https-入口)
  - [4.4 昨天：Caddy 成功签发证书，但根证书自动安装失败](#44-昨天caddy-成功签发证书但根证书自动安装失败)
  - [4.5 昨天：代理初期曾出现 502/EOF，不是一次成型](#45-昨天代理初期曾出现-502eof不是一次成型)
  - [4.6 今天：Windows 接入时暴露出 UFW 阻断问题](#46-今天windows-接入时暴露出-ufw-阻断问题)
  - [4.7 今天：UFW 放开后，又暴露出 Caddy 白名单阻断问题](#47-今天ufw-放开后又暴露出-caddy-白名单阻断问题)
  - [4.8 今天：HTTPS 打通后，还要通过安全上下文、token 和 pairing](#48-今天https-打通后还要通过安全上下文token-和-pairing)
- [5. 关键配置与改动汇总](#5-关键配置与改动汇总)
  - [5.1 OpenClaw 配置层](#51-openclaw-配置层)
  - [5.2 Caddy 代理层](#52-caddy-代理层)
  - [5.3 UFW 防火墙层](#53-ufw-防火墙层)
  - [5.4 Pairing 层](#54-pairing-层)
- [6. 复现教程：如何从本机 HTTP 搭成局域网 HTTPS 访问](#6-复现教程如何从本机-http-搭成局域网-https-访问)
  - [6.1 前提条件](#61-前提条件)
  - [6.2 第一步：确认 OpenClaw 本体在本机可用](#62-第一步确认-openclaw-本体在本机可用)
  - [6.3 第二步：配置 OpenClaw 为局域网可访问并启用 token](#63-第二步配置-openclaw-为局域网可访问并启用-token)
  - [6.4 第三步：安装并配置 Caddy 作为 HTTPS 反向代理](#64-第三步安装并配置-caddy-作为-https-反向代理)
  - [6.5 第四步：配置 UFW 放行目标客户端访问](#65-第四步配置-ufw-放行目标客户端访问)
  - [6.6 第五步：在 Windows 上测试 HTTP/HTTPS 连通性](#66-第五步在-windows-上测试-httphttps-连通性)
  - [6.7 第六步：使用 HTTPS 打开 Control UI](#67-第六步使用-https-打开-control-ui)
  - [6.8 第七步：填入 gateway token](#68-第七步填入-gateway-token)
  - [6.9 第八步：批准 pairing](#69-第八步批准-pairing)
  - [6.10 第九步：最终验证](#610-第九步最终验证)
- [7. 常见故障排查清单](#7-常见故障排查清单)
- [8. 最容易误判的点](#8-最容易误判的点)
- [9. 最终访问方式](#9-最终访问方式)
- [10. 当前结论](#10-当前结论)

---

## 1. 文档目标

这份文档做两件事：

1. **完整总结**这次从“只能本机访问 OpenClaw Control UI”到“Windows 通过局域网 HTTPS 成功登录”的全过程
2. **提供复现教程**，以后如果需要重新搭一遍，可以直接照着做

---

## 2. 最终成果

最终实现了以下目标：

- Linux 本机仍可访问：
  - `http://127.0.0.1:18789/`
- Windows 局域网机器可通过 HTTPS 访问并成功登录：
  - `https://192.168.66.198:18790/`

这个结果不是单靠“网页打开”达成的，而是同时满足了：

- 网络可达
- HTTPS 安全上下文成立
- gateway token 正确
- pairing 批准完成

---

## 3. 整体架构

这套方案最终的结构是：

1. **OpenClaw Gateway / Control UI 本体**运行在 Linux 主机的 `18789` 端口
2. **Caddy** 监听 `18790`，为局域网 IP 提供 HTTPS
3. **Caddy 反向代理**把 `18790` 的 HTTPS 请求转发到本机的 `127.0.0.1:18789`
4. **UFW 防火墙**控制哪些来源 IP 可以访问 `18789` / `18790`
5. **OpenClaw token + pairing** 负责最终应用层认证与设备信任

可以把它理解为：

- OpenClaw 本体提供 HTTP 服务
- Caddy 负责把它包装成 HTTPS 局域网入口
- UFW 和 Caddy 白名单负责访问控制
- OpenClaw 自己再负责 token 与设备信任

---

## 4. 时间线总结：昨天到今天做了什么

### 4.1 最初状态：只能本机访问 HTTP

OpenClaw Control UI 一开始实际上是正常运行的，只是只能在本机 HTTP 环境中直接使用：

- `http://127.0.0.1:18789/`

后续验证中，Linux 本机访问以下地址都返回 `200 OK` 和完整 Control UI 页面：

```bash
curl -i http://127.0.0.1:18789/
curl -i http://192.168.66.198:18789/
```

这说明：

- OpenClaw 本体没有挂
- 18789 一直是好的
- 问题不在应用本身，而在“如何让局域网远程机器安全可用地接入”

但 Control UI 并不是“页面能打开就算完成”。它要求某些功能运行在**安全上下文**下，也就是：

- HTTPS
- 或 localhost

所以：

- `http://127.0.0.1:18789/` 在本机可用
- `http://192.168.66.198:18789/` 虽然页面可达，但远程机器上无法满足 device identity / secure context 要求

这也是后来出现下面报错的原因：

```text
control ui requires device identity (use HTTPS or localhost secure context)
```

---

### 4.2 昨天：修改 `openclaw.json`，让 gateway 面向局域网并启用 token

核对文件信息后确认：

- 文件：`/root/.openclaw/openclaw.json`
- 修改时间：`2026-03-27 17:27:47 +0800`

这说明 `openclaw.json` **昨天确实改过**，不是今天改的。

当前能确认的关键配置包括：

- `gateway.bind = "lan"`
- `gateway.auth.mode = "token"`
- `gateway.auth.token = ...`

这意味着昨天已经完成了 OpenClaw 自身配置层的关键部分：

1. **让 gateway 绑定到局域网可访问模式**
2. **启用 token 认证**

也就是说，昨天的目标已经很明确：

- 不再只允许本机访问
- 要让局域网内的客户端可访问
- 同时通过 token 做认证保护

---

### 4.3 昨天：引入 Caddy，建立局域网 HTTPS 入口

从 Caddy 日志可以确认：

- `caddy.service` 已在昨天启动
- 昨天发生过至少两次 `reload`
- Caddy 为 `192.168.66.198` 成功签发了内部证书

日志中出现过的关键信息包括：

- `enabling HTTP/3 listener addr=:18790`
- `enabling automatic TLS certificate management domains=["192.168.66.198"]`
- `obtaining certificate`
- `certificate obtained successfully`

这说明昨天已经建立起这条 HTTPS 入口：

- `https://192.168.66.198:18790`

并且它的设计就是用来反代本地 OpenClaw 控制台。

---

### 4.4 昨天：Caddy 成功签发证书，但根证书自动安装失败

Caddy 日志还显示了一个重要细节：

- `installing root certificate`
- `caddy : user NOT in sudoers`
- `failed to install root certificate`

这说明：

- Caddy 已经成功为 `192.168.66.198` 这个站点签发了证书
- 但它想把自己的本地 CA 根证书安装进系统信任库时失败了

所以这里的结果不是“HTTPS 起不来”，而是：

- HTTPS 服务是存在的
- 但客户端未必天然信任这张证书

这也解释了后续你在 Windows 上看到的：

- `certlm.msc` 里没有那张 Caddy 根证书

---

### 4.5 昨天：代理初期曾出现 502/EOF，不是一次成型

昨天 Caddy 日志中还出现过多次：

- `502`
- `EOF`
- `reverseproxy.statusError`

且请求目标包含：

- `/`
- `/chat?session=main`
- `host=192.168.66.198:18790`

这说明昨天刚搭这套代理时，`18790 -> 18789` 的反代过程曾出现过不稳定阶段。

合理推断有两种可能：

1. OpenClaw 后端当时正处于重载/启动切换中
2. 前端 websocket/chat 流量在那个时间点未被后端稳定接住

无论具体是哪一种，都可以确认：

- 昨天这套 HTTPS 局域网代理不是“一次成型就稳定可用”
- 它经历过至少一次 `502/EOF` 的调试阶段

---

### 4.6 今天：Windows 接入时暴露出 UFW 阻断问题

Windows 客户端信息：

- IP：`192.168.1.218`

Linux 服务器信息：

- IP：`192.168.66.198`

这两个地址不在同一子网：

- `192.168.1.0/24`
- `192.168.66.0/24`

Windows 上的路由追踪显示：

```text
192.168.1.218 -> 192.168.1.253 -> 192.168.66.198
```

说明三层路由是通的，不是“找不到机器”。

但最初在 Windows 上测试时出现了这些现象：

- `Invoke-WebRequest https://192.168.66.198:18790/` 报：
  - `基础连接已经关闭: 发送时发生错误`
- `Test-NetConnection 192.168.66.198 -Port 18790`
  - `PingSucceeded : True`
  - `TcpTestSucceeded : False`
- `curl.exe -i http://192.168.66.198:18789/` 卡住
- `curl.exe -vk https://192.168.66.198:18790/` 卡住或无法继续

这说明最初卡住的并不是 OpenClaw 应用本身，而是：

## **Windows 到 Linux 的 TCP 访问被拦了**

---

### 4.7 今天：UFW 放开后，又暴露出 Caddy 白名单阻断问题

在 Linux 上检查 UFW 后发现：

- 默认策略：`deny (incoming)`
- 当时只允许：
  - `18790/tcp` 来自 `192.168.66.0/24`
- **没有允许 18789**
- **没有允许来自 `192.168.1.218` 的访问**

因此：

#### 对 18789
- 服务在监听
- 但 UFW 没放行
- 所以 Windows 无法访问

#### 对 18790
- 服务在监听
- 但 UFW 只允许 `192.168.66.0/24`
- Windows 是 `192.168.1.218`
- 所以一样被挡

为解决这个问题，执行了：

```bash
sudo ufw allow from 192.168.1.218 to any port 18789 proto tcp
sudo ufw allow from 192.168.1.218 to any port 18790 proto tcp
sudo ufw reload
```

这一步之后，Windows 到 Linux 的网络层入口终于放开。

但 UFW 放开后，Windows 访问：

```powershell
curl.exe -vk https://192.168.66.198:18790/
```

已经能建立 TLS，却返回：

- `HTTP/1.1 403 Forbidden`
- `Server: Caddy`

这说明：

- TCP 已通
- HTTPS 握手已通
- 但被 Caddy 应用层规则拒绝

查 `/etc/caddy/Caddyfile` 后确认，原先规则只允许：

- `192.168.66.0/24`
- `127.0.0.1/32`
- `::1`

并不包括 Windows 的：

- `192.168.1.218`

为解决这个问题，修改了 Caddy 配置。

把：

```caddy
@lan remote_ip 192.168.66.0/24 127.0.0.1/32 ::1
```

改成：

```caddy
@lan remote_ip 192.168.66.0/24 192.168.1.218/32 127.0.0.1/32 ::1
```

然后重载：

```bash
systemctl reload caddy
```

这样，Windows 才被真正纳入 HTTPS 代理入口的允许名单。

---

### 4.8 今天：HTTPS 打通后，还要通过安全上下文、token 和 pairing

当 Windows 可以访问 `18789` 时，页面报错：

```text
control ui requires device identity (use HTTPS or localhost secure context)
```

这一步说明：

- `http://192.168.66.198:18789/` 虽然页面能打开
- 但并不能满足 Control UI 的 device identity 要求

所以最终远程正式访问不能靠：

- `http://192.168.66.198:18789/`

而必须靠：

- `https://192.168.66.198:18790/`

当 `https://192.168.66.198:18790/` 真正打通后，页面又报错：

```text
unauthorized: gateway token missing (open the dashboard URL and paste the token in Control UI settings)
```

这表示：

- HTTPS 已通
- Control UI 已通
- Caddy 反代已通
- 但应用层认证还没完成

由于 `openclaw.json` 中已经在昨天设置了：

- `gateway.auth.mode = token`
- `gateway.auth.token = ...`

所以这一步的处理方式就是：

- 把对应 gateway token 粘贴到 Control UI 的设置中

完成后，认证进入下一阶段。

当 token 填入之后，又出现报错：

```text
pairing required
```

这说明：

- token 已经正确
- 但这个浏览器/设备身份还没有被 OpenClaw 信任

因此执行了：

```bash
openclaw devices approve --latest
```

实际批准结果为：

- 指纹：`1e71a256bf86d7aa04f6a82f177bb6acf1d2fcd58f2e9ec9eba1f6250b81b634`
- 设备 ID：`361eb8ac-06fb-45b9-a217-281f57446a47`

这一步完成后，Control UI 的设备身份正式完成 pairing。

---

## 5. 关键配置与改动汇总

### 5.1 OpenClaw 配置层

文件：`/root/.openclaw/openclaw.json`

关键项：

- `gateway.bind = "lan"`
- `gateway.auth.mode = "token"`
- `gateway.auth.token = ...`

作用：

- 允许 gateway 以局域网模式提供服务
- 使用 token 做认证

---

### 5.2 Caddy 代理层

文件：`/etc/caddy/Caddyfile`

最终配置：

```caddy
https://192.168.66.198:18790 {
    @lan remote_ip 192.168.66.0/24 192.168.1.218/32 127.0.0.1/32 ::1
    handle @lan {
        reverse_proxy 127.0.0.1:18789
    }
    respond "Forbidden" 403
    tls internal
}
```

作用：

- 提供局域网 HTTPS 访问入口
- 反代到本机 OpenClaw HTTP 端口
- 限制允许访问的来源 IP

---

### 5.3 UFW 防火墙层

执行：

```bash
sudo ufw allow from 192.168.1.218 to any port 18789 proto tcp
sudo ufw allow from 192.168.1.218 to any port 18790 proto tcp
sudo ufw reload
```

作用：

- 允许 Windows 客户端访问 OpenClaw HTTP 端口和 Caddy HTTPS 端口

---

### 5.4 Pairing 层

执行：

```bash
openclaw devices approve --latest
```

作用：

- 批准最新待配对设备
- 完成浏览器/设备身份信任

---

## 6. 复现教程：如何从本机 HTTP 搭成局域网 HTTPS 访问

### 6.1 前提条件

开始前，确认你具备以下条件：

1. Linux 服务器上已经安装并运行 OpenClaw
2. Linux 服务器有一个局域网 IP，例如：`192.168.66.198`
3. Windows 客户端的来源 IP 已知，例如：`192.168.1.218`
4. Linux 上已安装 Caddy
5. Linux 上使用 UFW 管理防火墙（如果不用 UFW，则按你的防火墙方案放行等效规则）

---

### 6.2 第一步：确认 OpenClaw 本体在本机可用

先确认 OpenClaw 自己没问题：

```bash
openclaw status
openclaw gateway status
ss -ltnp | grep 18789
curl -i http://127.0.0.1:18789/
```

如果这里拿不到 `200 OK`，先不要继续配代理，先把 OpenClaw 本体修好。

---

### 6.3 第二步：配置 OpenClaw 为局域网可访问并启用 token

确认 `~/.openclaw/openclaw.json` 中至少有类似配置：

```json
{
  "gateway": {
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "你的token"
    }
  }
}
```

关键点：

- `bind = lan`：允许 gateway 面向局域网提供服务
- `auth.mode = token`：Control UI 连接时要求 token

改完后，重启或确认 gateway 生效。

---

### 6.4 第三步：安装并配置 Caddy 作为 HTTPS 反向代理

编辑 `/etc/caddy/Caddyfile`：

```caddy
https://192.168.66.198:18790 {
    @lan remote_ip 192.168.66.0/24 192.168.1.218/32 127.0.0.1/32 ::1
    handle @lan {
        reverse_proxy 127.0.0.1:18789
    }
    respond "Forbidden" 403
    tls internal
}
```

说明：

- `https://192.168.66.198:18790`：让 Caddy 在这个 IP + 端口上提供 HTTPS
- `reverse_proxy 127.0.0.1:18789`：把 HTTPS 请求转到本机 OpenClaw HTTP 端口
- `remote_ip ...`：只允许指定来源访问
- `tls internal`：用 Caddy internal CA 签发局域网证书

然后重载 Caddy：

```bash
systemctl reload caddy
systemctl status caddy --no-pager
```

如果需要看监听状态：

```bash
ss -ltnp | grep 18790
```

---

### 6.5 第四步：配置 UFW 放行目标客户端访问

如果 Linux 启用了 UFW，而且默认入站拒绝，那么必须放行目标客户端。

例如放行单台 Windows：

```bash
sudo ufw allow from 192.168.1.218 to any port 18789 proto tcp
sudo ufw allow from 192.168.1.218 to any port 18790 proto tcp
sudo ufw reload
sudo ufw status verbose
```

如果你未来需要允许整个来源网段，也可以改成放行网段，但安全性会更宽。

---

### 6.6 第五步：在 Windows 上测试 HTTP/HTTPS 连通性

在 Windows PowerShell 上测试：

```powershell
Test-NetConnection 192.168.66.198 -Port 18789
Test-NetConnection 192.168.66.198 -Port 18790
curl.exe -i http://192.168.66.198:18789/
curl.exe -vk https://192.168.66.198:18790/
```

判断方法：

- `18789` 应至少能拿到页面内容或响应头
- `18790` 应至少能完成 TLS 握手
- 如果 `18790` 返回 `403 Forbidden`，优先检查 Caddy `remote_ip` 是否把 Windows 来源 IP 排除在外
- 如果 `18789/18790` 都连不上，优先检查 UFW

---

### 6.7 第六步：使用 HTTPS 打开 Control UI

正式访问请使用：

```text
https://192.168.66.198:18790/
```

不要把远程正式入口建立在：

```text
http://192.168.66.198:18789/
```

因为 Control UI 需要安全上下文，否则会报：

```text
control ui requires device identity (use HTTPS or localhost secure context)
```

---

### 6.8 第七步：填入 gateway token

如果页面报：

```text
unauthorized: gateway token missing
```

就把 `openclaw.json` 中配置好的 gateway token 粘贴到 Control UI 的设置里。

如果不记得 token，可以在服务器上查看相关配置。

---

### 6.9 第八步：批准 pairing

如果页面报：

```text
pairing required
```

在 Linux 服务器上执行：

```bash
openclaw devices list
openclaw devices approve --latest
```

如果需要更精细地确认设备，再根据 `devices list` 输出指定批准对象。

---

### 6.10 第九步：最终验证

完成以上步骤后，在 Windows 上验证：

1. 浏览器可以打开：
   - `https://192.168.66.198:18790/`
2. 不再提示：
   - `gateway token missing`
   - `pairing required`
3. Control UI 能正常进入并显示内容

如果全部满足，说明复现成功。

---

## 7. 常见故障排查清单

### 场景 1：Windows 上 `TcpTestSucceeded = False`
优先检查：

- UFW 是否放行目标来源 IP 到目标端口
- 路由是否存在
- Linux 是否真的在监听 `18789` / `18790`

建议命令：

```bash
ss -ltnp | grep -E '18789|18790'
sudo ufw status verbose
```

---

### 场景 2：`https://...:18790/` 返回 `403 Forbidden`
优先检查：

- `/etc/caddy/Caddyfile` 中的 `remote_ip` 白名单

如果 Windows IP 不在白名单中，就会 TLS 能握手，但最后返回 403。

---

### 场景 3：`http://...:18789/` 页面能开，但提示 secure context / device identity
这不是 OpenClaw 挂了，而是访问方式不对。

请改用：

- `https://服务器IP:18790/`

---

### 场景 4：打开 HTTPS 后提示 `gateway token missing`
说明：

- HTTPS 入口没问题
- 但还没配置 token

处理：

- 找到 `gateway.auth.token`
- 粘贴到 Control UI 设置

---

### 场景 5：填 token 后提示 `pairing required`
说明：

- token 已经对了
- 还差设备批准

处理：

```bash
openclaw devices approve --latest
```

---

### 场景 6：Windows 不信任 HTTPS 证书
如果浏览器提示证书不受信任，通常是因为：

- Caddy internal CA 根证书没有安装到 Windows 信任库

这不一定阻止临时访问，但会影响信任体验。需要的话可后续再导出并安装 Caddy root CA。

---

## 8. 最容易误判的点

### 1. 误以为只是证书问题
一开始看起来像是 HTTPS 证书不对，但实际更早卡住的是：

- UFW 未放行
- Caddy `remote_ip` 白名单未放行

### 2. 误以为 HTTP 页面能打开就算完成
不行。Control UI 对远程访问要求安全上下文，必须走 HTTPS。

### 3. 误以为 HTTPS 通了就能直接登录
也不行。后面还必须通过：

- gateway token
- pairing approval

### 4. 误以为 ping 通就说明网页一定能打开
不对。ICMP 可达不代表 TCP 端口已开放，也不代表反代白名单允许。

---

## 9. 最终访问方式

### Linux 本机临时访问

```text
http://127.0.0.1:18789/
```

### Windows / 局域网正式访问

```text
https://192.168.66.198:18790/
```

---

## 10. 当前结论

这次并不是“修一个网页打不开”的小问题，而是完整完成了以下工作：

1. 把 OpenClaw Control UI 从本机 HTTP 使用模式，扩展到局域网 HTTPS 使用模式
2. 通过 Caddy 给局域网 IP 提供内部 CA TLS 证书
3. 通过 UFW 和 Caddy `remote_ip` 两层限制，控制允许访问的客户端来源
4. 通过 OpenClaw token 和 pairing，完成应用层与设备层信任
5. 最终让 Windows 成功通过 HTTPS 打开并登录 Control UI

这套局域网代理现在已经跑通，并且具备基础的安全控制，而不是简单裸开端口。
