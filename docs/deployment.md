# onlyWeb LinuxOS 与 macOS 部署、域名代理指南

本文档说明 onlyWeb 在 macOS 本机和 LinuxOS / Linux 服务器上的部署设置方式，并说明域名、HTTPS、Wiki vault 挂载和备份方式。

## 目录

- [1. 部署方式总览](#1-部署方式总览)
- [2. 通用环境变量](#2-通用环境变量)
- [3. macOS 本机部署](#3-macos-本机部署)
- [4. LinuxOS 服务器部署](#4-linuxos-服务器部署)
- [5. 域名和 HTTPS 代理](#5-域名和-https-代理)
- [6. Wiki vault 挂载](#6-wiki-vault-挂载)
- [7. 备份和恢复](#7-备份和恢复)
- [8. 更新程序](#8-更新程序)
- [9. 常见问题](#9-常见问题)

## 1. 部署方式总览

onlyWeb 推荐统一使用 Docker Compose 部署。这样 macOS、LinuxOS 和常见 Linux 服务器的运行方式一致。

| 场景 | 推荐访问方式 | 说明 |
| --- | --- | --- |
| macOS 本机开发 / 预览 | `http://localhost:18473` | 适合本机验证功能 |
| macOS 局域网访问 | `http://本机局域网IP:18473` | 适合同一局域网内其他电脑访问 |
| LinuxOS / Linux 服务器内网访问 | `http://服务器IP:18473` | 可用于临时测试 |
| LinuxOS / Linux 服务器正式访问 | `https://你的域名` | 推荐 Caddy 或 Nginx 反向代理 |

应用 Docker 镜像会安装 LibreOffice Writer 和中文字体，用于 Word `.doc/.docx` 转 PDF 在线预览。因此首次构建镜像会比普通 Node.js 应用更慢，镜像体积也更大。

## 2. 通用环境变量

首次部署前复制环境变量：

```bash
cp .env.example .env
```

完整示例：

```env
APP_PORT=18473
APP_URL=http://localhost:18473
DATABASE_PATH=/app/data/onlyweb.db
SESSION_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
WIKI_HOST_VAULT_PATH=../wiki/vault
WIKI_HOST_BROWSE_ROOT=../wiki
WIKI_CONTAINER_BROWSE_ROOT=/host-browse
WIKI_VAULT_PATH=/app/wiki-vault
WIKI_PUBLIC=false
WIKI_EXCLUDE_DIRS=.obsidian,_raw,.git
```

说明：

| 变量 | macOS 本机建议 | LinuxOS / Linux 服务器建议 | 说明 |
| --- | --- | --- | --- |
| `APP_PORT` | `18473` | `18473` | 应用监听和 Docker 映射端口，可改成其他不常用端口 |
| `APP_URL` | `http://localhost:18473` 或 `http://本机局域网IP:18473` | `https://你的域名` | 必须与实际访问协议和域名一致 |
| `DATABASE_PATH` | `/app/data/onlyweb.db` | `/app/data/onlyweb.db` | Docker 内 SQLite 数据库路径，通常不改 |
| `SESSION_SECRET` | 随机长字符串 | 随机长字符串 | 登录 Cookie 签名密钥，不能使用默认值 |
| `ADMIN_EMAIL` | 管理员邮箱 | 管理员邮箱 | 初始化管理员账号 |
| `ADMIN_PASSWORD` | 强密码 | 强密码 | 初始化管理员密码 |
| `WIKI_HOST_VAULT_PATH` | `../wiki/vault` | 服务器上的 vault 路径 | 宿主机 Obsidian vault 路径，挂载进容器；后台上传会写入该目录 |
| `WIKI_VAULT_PATH` | `/app/wiki-vault` | `/app/wiki-vault` | 容器内读取 Wiki 的路径，通常不改 |
| `WIKI_PUBLIC` | `false` | `false` | `false` 表示仅管理员可访问 `/wiki` |
| `WIKI_EXCLUDE_DIRS` | `.obsidian,_raw,.git` | `.obsidian,_raw,.git` | Wiki 扫描忽略目录 |

生成随机 `SESSION_SECRET`：

```bash
openssl rand -base64 32
```

> `APP_URL` 会影响后台生成的公开链接和登录 Cookie 策略。HTTPS 域名访问时必须设置为 `https://你的域名`。

## 3. macOS 本机部署

### 3.1 安装工具

需要安装：

- Docker Desktop for Mac
- Git
- Node.js 22，可选；只用 Docker 运行时不必须安装

确认 Docker Desktop 已启动：

```bash
docker --version
docker compose version
```

### 3.2 获取代码并配置

```bash
cd workspace
git clone <你的仓库地址> onlyWeb
cd onlyWeb
cp .env.example .env
```

如果代码已经在本机，直接进入项目目录：

```bash
cd workspace/onlyWeb
cp .env.example .env
```

macOS 本机访问推荐配置：

```env
APP_PORT=18473
APP_URL=http://localhost:18473
DATABASE_PATH=/app/data/onlyweb.db
SESSION_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
WIKI_HOST_VAULT_PATH=../wiki/vault
WIKI_HOST_BROWSE_ROOT=../wiki
WIKI_CONTAINER_BROWSE_ROOT=/host-browse
WIKI_VAULT_PATH=/app/wiki-vault
WIKI_PUBLIC=false
WIKI_EXCLUDE_DIRS=.obsidian,_raw,.git
```

如果需要局域网其他电脑访问，把 `APP_URL` 改成：

```env
APP_URL=http://本机局域网IP:18473
```

### 3.3 启动

```bash
docker compose up -d --build
docker compose ps
```

访问：

```txt
http://localhost:18473
http://localhost:18473/admin/login
http://localhost:18473/wiki
```

局域网访问：

```txt
http://本机局域网IP:18473
```

### 3.4 macOS 常见设置

如果局域网无法访问：

- 确认 Docker Desktop 正在运行。
- 确认 macOS 防火墙允许 Docker 或终端接收传入连接。
- 确认使用本机局域网 IP，不要在其他电脑上使用 `localhost`。
- 确认 `.env` 中 `APP_URL` 与实际访问地址一致。

停止和重启：

```bash
docker compose down
docker compose up -d
docker compose up -d --build
```

## 4. LinuxOS 服务器部署

以下流程适用于 LinuxOS、Ubuntu、Debian 等常见 Linux 服务器。核心要求是安装 Docker 和 Docker Compose v2。

### 4.1 准备服务器

建议最低配置：

```txt
CPU：1 核及以上
内存：1 GB 及以上，建议 2 GB+
磁盘：10 GB 及以上
系统：LinuxOS / Ubuntu 22.04+ / Debian 12+
```

服务器需要开放端口：

```txt
22    SSH 登录
80    HTTP，用于域名访问和 HTTPS 证书申请
443   HTTPS，用于正式访问
```

如果不使用反向代理、直接通过端口访问，还需要开放 `APP_PORT`，默认 `18473`。正式部署更推荐只开放 `80` 和 `443`，由 Caddy 或 Nginx 代理到应用端口。

### 4.2 安装 Docker 和 Git

Ubuntu / Debian / LinuxOS 可优先尝试：

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable docker
sudo systemctl start docker
docker --version
docker compose version
```

如果当前用户需要直接执行 Docker：

```bash
sudo usermod -aG docker $USER
```

执行后重新登录 SSH。

### 4.3 获取代码

从 Git 仓库拉取：

```bash
mkdir -p workspace
cd workspace
git clone <你的仓库地址> onlyWeb
cd onlyWeb
```

或者从本机上传项目目录：

```bash
scp -r onlyWeb 用户名@服务器IP:~/workspace/onlyWeb
ssh 用户名@服务器IP
cd workspace/onlyWeb
```

### 4.4 配置 `.env`

```bash
cp .env.example .env
nano .env
```

服务器正式域名访问推荐配置：

```env
APP_PORT=18473
APP_URL=https://hkkwebonly.xyz
DATABASE_PATH=/app/data/onlyweb.db
SESSION_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
WIKI_HOST_VAULT_PATH=../wiki/vault
WIKI_HOST_BROWSE_ROOT=../wiki
WIKI_CONTAINER_BROWSE_ROOT=/host-browse
WIKI_VAULT_PATH=/app/wiki-vault
WIKI_PUBLIC=false
WIKI_EXCLUDE_DIRS=.obsidian,_raw,.git
```

如果服务器上的 vault 不在 `../wiki/vault`，把 `WIKI_HOST_VAULT_PATH` 改成服务器实际路径。

### 4.5 启动和验证

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

服务器本机验证：

```bash
curl -I http://127.0.0.1:18473
```

如果临时直接用 IP 和端口访问：

```txt
http://服务器IP:18473
```

同时需要把 `.env` 中 `APP_URL` 设置为：

```env
APP_URL=http://服务器IP:18473
```

## 5. 域名和 HTTPS 代理

### 5.1 DNS 解析

在域名服务商处新增 DNS 解析记录：

```txt
记录类型：A
主机记录：@
记录值：服务器公网 IP
```

如果需要 `www`：

```txt
记录类型：A
主机记录：www
记录值：服务器公网 IP
```

等待 DNS 生效后验证：

```bash
dig hkkwebonly.xyz
```

### 5.2 推荐方案：Caddy

Caddy 可以自动申请和续期 HTTPS 证书。

安装：

```bash
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

编辑 Caddy 配置：

```bash
sudo nano /etc/caddy/Caddyfile
```

写入：

```caddyfile
hkkwebonly.xyz {
    reverse_proxy 127.0.0.1:18473
}
```

如果同时支持 `www`：

```caddyfile
hkkwebonly.xyz, www.hkkwebonly.xyz {
    reverse_proxy 127.0.0.1:18473
}
```

检查并重启：

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable caddy
sudo systemctl restart caddy
sudo systemctl status caddy
```

访问：

```txt
https://hkkwebonly.xyz
https://hkkwebonly.xyz/admin/login
```

### 5.3 Nginx 方案

安装：

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

创建站点配置：

```bash
sudo nano /etc/nginx/sites-available/onlyweb
```

写入：

```nginx
server {
    listen 80;
    server_name hkkwebonly.xyz www.hkkwebonly.xyz;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:18473;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

启用并申请证书：

```bash
sudo ln -s /etc/nginx/sites-available/onlyweb /etc/nginx/sites-enabled/onlyweb
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d hkkwebonly.xyz -d www.hkkwebonly.xyz
```

申请完成后确认 `.env`：

```env
APP_URL=https://hkkwebonly.xyz
```

然后重启：

```bash
docker compose up -d
```

## 6. Wiki vault 挂载

`docker-compose.yml` 已经包含：

```yaml
- ${WIKI_HOST_VAULT_PATH:-../wiki/vault}:${WIKI_VAULT_PATH:-/app/wiki-vault}
```

### 6.1 macOS 示例

如果目录结构是：

```txt
workspace/
  onlyWeb/
  wiki/
    vault/
```

则配置：

```env
WIKI_HOST_VAULT_PATH=../wiki/vault
WIKI_HOST_BROWSE_ROOT=../wiki
WIKI_CONTAINER_BROWSE_ROOT=/host-browse
WIKI_VAULT_PATH=/app/wiki-vault
```

### 6.2 LinuxOS 示例

如果服务器目录结构是：

```txt
workspace/
  onlyWeb/
  wiki/
    vault/
```

则同样配置：

```env
WIKI_HOST_VAULT_PATH=../wiki/vault
WIKI_HOST_BROWSE_ROOT=../wiki
WIKI_CONTAINER_BROWSE_ROOT=/host-browse
WIKI_VAULT_PATH=/app/wiki-vault
```

如果 vault 放在其他位置，使用服务器实际路径即可。LinuxOS 项目位于 `/root/onlyweb` 时，推荐 `WIKI_HOST_VAULT_PATH=/root/onlyweb/wiki/vault`、`WIKI_HOST_BROWSE_ROOT=/root/onlyweb`、`WIKI_CONTAINER_BROWSE_ROOT=/host-browse`。后台知识库管理入口为 `/admin/wiki`，可点击“知识库根目录路径”后用弹窗浏览服务器目录并选择容器内 vault 路径，通过选项维护公开状态、忽略目录，并上传 Markdown 文档；上传目录从当前知识库已有目录中选择。忽略目录选择“不忽略任何目录”时会覆盖 `.env` 默认值。

### 6.3 权限设置

Wiki 使用读写挂载，后台上传 Markdown 文档会写入 vault。后台保存知识库配置时也会在 `/app-config/.env` 存在且可写时同步更新 `.env`。需要确保 Docker 运行用户可以读写 vault，并且如需同步 `.env`，需要让容器内 UID 1001 可写 `.env`：

```bash
# 推荐：让容器内 nextjs 用户 UID 1001 拥有写入权限
sudo chown 1001:1001 .env
sudo chown -R 1001:1001 ../wiki/vault
chmod -R u+rwX ../wiki/vault

# 如果不方便修改属主，可临时放宽目录权限
# chmod -R a+rwX ../wiki/vault
```


### 6.4 LinuxOS 路径大小写和错误配置恢复

Linux 文件系统大小写敏感，`/root/onlyWeb` 和 `/root/onlyweb` 不是同一个目录。`WIKI_HOST_VAULT_PATH`、`WIKI_HOST_BROWSE_ROOT` 必须使用服务器真实目录大小写。

如果数据库中保存过错误的 Wiki 配置，例如 `WIKI_VAULT_PATH=/`，数据库配置会覆盖 `.env`。可执行：

```bash
docker-compose exec app node -e "const Database=require('better-sqlite3'); const db=new Database(process.env.DATABASE_PATH||'/app/data/onlyweb.db'); db.prepare("delete from app_settings where key like 'WIKI_%'").run(); console.log('wiki settings reset')"
docker-compose restart app
```

程序会拒绝扫描 `/`、`/proc`、`/sys`、`/dev`、`/run`、`/boot`、`/tmp` 等系统目录，并跳过符号链接，避免错误配置导致页面 500。

## 7. 备份和恢复

SQLite 数据和上传文件都在 Docker volume 中：

- `sqlite_data`：数据库
- `uploads_data`：上传文件，包括普通项目文档、效果演示文档、Word 预览缓存和微信二维码

查看实际 volume 名称：

```bash
docker volume ls | grep onlyweb
```

备份：

```bash
mkdir -p ~/onlyweb-backup

docker run --rm \
  -v onlyweb_sqlite_data:/data \
  -v ~/onlyweb-backup:/backup \
  alpine tar czf /backup/sqlite_data.tgz -C /data .

docker run --rm \
  -v onlyweb_uploads_data:/uploads \
  -v ~/onlyweb-backup:/backup \
  alpine tar czf /backup/uploads_data.tgz -C /uploads .
```

> 如果项目目录名不是 `onlyweb`，Compose 生成的 volume 名称可能不同，请先用 `docker volume ls` 确认。

Wiki vault 是宿主机目录；后台上传的 Markdown 文档也会写入该目录，请按自己的 Obsidian vault 备份方式单独备份。


## 8. 更新程序

### 8.1 Docker Compose v2

如果服务器支持 `docker compose` 命令：

```bash
cd workspace/onlyWeb
git pull
docker compose up -d --build
```

### 8.2 docker-compose V1

如果 LinuxOS 服务器使用的是 `docker-compose` V1，建议更新代码后先删除旧容器，再重新构建：

```bash
cd workspace/onlyWeb
git pull
docker-compose down
docker-compose up -d --build
```

说明：`docker-compose down` 会删除旧容器和默认网络，但不会删除 `sqlite_data`、`uploads_data` 这类命名 volume，所以数据库和上传文件仍会保留。不要在更新时执行 `docker-compose down -v`，否则会删除数据 volume。

## 9. 常见问题

### 9.1 登录后保存资料被跳回登录页

检查 `APP_URL` 是否与实际访问协议一致：

- HTTP 局域网访问：`APP_URL=http://服务器IP:端口`
- HTTPS 域名访问：`APP_URL=https://你的域名`

### 9.2 域名访问生成的 HR 链接不对

检查 `.env`：

```env
APP_URL=https://hkkwebonly.xyz
```

修改后重启：

```bash
docker compose up -d
```

### 9.3 上传文件过大失败

如果使用 Nginx，确认配置中包含：

```nginx
client_max_body_size 50m;
```

### 9.4 Word 文档无法在线预览

Word `.doc/.docx` 在线预览依赖 Docker 镜像内置的 LibreOffice Writer。

确认当前容器中可以执行：

```bash
docker compose exec app soffice --version
```

如果命令不存在，需要重新构建：

```bash
docker compose up -d --build
```

### 9.5 `/wiki` 打不开或看不到内容

检查：

```bash
docker compose exec app sh -lc 'echo $WIKI_VAULT_PATH && find $WIKI_VAULT_PATH -maxdepth 2 -name "*.md" | head'
```

如果没有输出 Markdown 文件，检查 `WIKI_HOST_VAULT_PATH` 是否指向正确 vault 目录。
