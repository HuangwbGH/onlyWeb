# onlyWeb 服务器部署与域名代理指南

本文档用于在任意 Linux 服务器上快速部署 onlyWeb，并通过域名访问。

## 1. 前置条件

服务器需要安装：

- Git
- Docker
- Docker Compose v2
- 一个已经解析到服务器公网 IP 的域名，例如 `onlyweb.example.com`

开放端口：

- `80`：HTTP，用于反向代理和申请 HTTPS 证书
- `443`：HTTPS
- 应用内部端口只建议监听本机，例如默认 `18473`

## 2. 环境变量

复制环境变量文件：

```bash
cp .env.example .env
```

示例 `.env`：

```env
APP_PORT=18473
APP_URL=https://onlyweb.example.com
DATABASE_PATH=/app/data/onlyweb.db
SESSION_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
```

说明：

| 变量 | 说明 |
| --- | --- |
| `APP_PORT` | 应用监听和 Docker 映射端口，默认 `18473` |
| `APP_URL` | 对外访问地址；正式域名部署时必须设置为 `https://你的域名` |
| `DATABASE_PATH` | SQLite 数据库路径，Docker 中默认 `/app/data/onlyweb.db` |
| `SESSION_SECRET` | 登录 Cookie 签名密钥，生产环境必须改成随机长字符串 |
| `ADMIN_EMAIL` | 管理员邮箱 |
| `ADMIN_PASSWORD` | 管理员密码 |

> `APP_URL` 会影响 HR 分享链接生成，以及登录 Cookie 的 `secure` 策略。使用 HTTPS 域名时会启用 Secure Cookie。

## 3. 启动应用

```bash
docker compose up -d --build
```

查看状态：

```bash
docker compose ps
docker compose logs -f app
```

如果服务器本机测试：

```bash
curl -I http://127.0.0.1:18473
```

如果修改端口，例如使用 `19000`：

```env
APP_PORT=19000
APP_URL=https://onlyweb.example.com
```

然后重新启动：

```bash
docker compose up -d --build
```

## 4. 推荐代理方案：Caddy

Caddy 可以自动申请和续期 HTTPS 证书，配置最简单。

### 4.1 安装 Caddy

Ubuntu / Debian 可参考：

```bash
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

### 4.2 Caddyfile

编辑：

```bash
sudo nano /etc/caddy/Caddyfile
```

写入：

```caddyfile
onlyweb.example.com {
  reverse_proxy 127.0.0.1:18473
}
```

如果你把 `APP_PORT` 改成了 `19000`，则代理到：

```caddyfile
onlyweb.example.com {
  reverse_proxy 127.0.0.1:19000
}
```

重载 Caddy：

```bash
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

访问：

```txt
https://onlyweb.example.com
```

后台：

```txt
https://onlyweb.example.com/admin/login
```

## 5. Nginx 代理方案

如果服务器已经使用 Nginx，可以这样配置。

### 5.1 HTTP 反向代理

创建配置：

```bash
sudo nano /etc/nginx/sites-available/onlyweb.conf
```

写入：

```nginx
server {
    listen 80;
    server_name onlyweb.example.com;

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

启用：

```bash
sudo ln -s /etc/nginx/sites-available/onlyweb.conf /etc/nginx/sites-enabled/onlyweb.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 5.2 HTTPS

使用 Certbot：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d onlyweb.example.com
```

申请完成后，把 `.env` 中的 `APP_URL` 设置为 HTTPS：

```env
APP_URL=https://onlyweb.example.com
```

然后重启应用：

```bash
docker compose up -d
```

## 6. 备份

SQLite 数据和上传文件都在 Docker volume 中：

- `sqlite_data`：数据库
- `uploads_data`：上传文件，包括作品文档和微信二维码

示例备份：

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

## 7. 常见问题

### 7.1 登录后保存资料被跳回登录页

检查 `APP_URL` 是否与实际访问协议一致：

- HTTP 局域网访问：`APP_URL=http://服务器IP:端口`
- HTTPS 域名访问：`APP_URL=https://你的域名`

### 7.2 域名访问生成的 HR 链接不对

检查 `.env`：

```env
APP_URL=https://onlyweb.example.com
```

修改后重启：

```bash
docker compose up -d
```

### 7.3 上传文件过大失败

如果使用 Nginx，确认配置中包含：

```nginx
client_max_body_size 50m;
```
