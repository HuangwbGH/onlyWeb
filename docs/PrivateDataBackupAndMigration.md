# onlyWeb 文件夹数据存储、私有备份与迁移恢复流程

## 目录

- [1. 文档目的](#1-文档目的)
- [2. 当前存储方式](#2-当前存储方式)
- [3. GitHub 上传规则](#3-github-上传规则)
- [4. 旧 Mac：导出加密数据包](#4-旧-mac导出加密数据包)
- [5. 旧 Mac：提交到 GitHub Private](#5-旧-mac提交到-github-private)
- [6. 新 Mac：拉取项目](#6-新-mac拉取项目)
- [7. 新 Mac：解密并解压数据包](#7-新-mac解密并解压数据包)
- [8. 新 Mac：恢复数据到文件夹](#8-新-mac恢复数据到文件夹)
- [9. 新 Mac：启动和验证](#9-新-mac启动和验证)
- [10. LinuxOS 服务器恢复方式](#10-linuxos-服务器恢复方式)
- [11. 日常更新流程](#11-日常更新流程)
- [12. 常见问题](#12-常见问题)

## 1. 文档目的

onlyWeb 已改为文件夹持久化，不再把 SQLite 数据库和上传文件放到 Docker volume 中。

这样做的目标是：

```txt
数据位置更直观
迁移更简单
整机复制项目文件夹时更容易理解
仍然避免把裸数据库和上传文件直接提交到 GitHub
```

## 2. 当前存储方式

Docker Compose 现在使用项目目录绑定挂载：

```yaml
volumes:
  - ./data:/app/data
  - ./public/uploads:/app/public/uploads
```

对应关系：

```txt
data/           SQLite 数据库目录，对应容器内 /app/data
public/uploads/ 上传文件目录，对应容器内 /app/public/uploads
```

SQLite 默认文件路径仍然是容器内路径：

```env
DATABASE_PATH=/app/data/onlyweb.db
```

但因为有绑定挂载，实际文件会落在项目目录：

```txt
data/onlyweb.db
```

上传文件会落在项目目录：

```txt
public/uploads/
```

## 3. GitHub 上传规则

`.gitignore` 已配置为不上传运行数据目录：

```gitignore
data/
public/uploads/
```

也不上传明文敏感文件：

```gitignore
.env
*.db
backup/
private-backups/*
```

只允许上传加密后的备份包：

```txt
private-backups/onlyweb-private-data.tar.gz.enc
```

推荐规则：

```txt
GitHub Private：代码、文档、Docker 配置、加密备份包
不上传：.env 明文、data/、public/uploads/、裸数据库、明文备份文件
```

## 4. 旧 Mac：导出加密数据包

### 4.1 进入项目目录

```bash
cd /Users/mac/workspace/onlyWeb
```

### 4.2 确认数据文件夹存在

```bash
ls -la data
ls -la public/uploads
```

如果目录不存在，先启动一次项目让 Docker 自动创建：

```bash
docker compose up -d --build
```

### 4.3 执行一键导出脚本

```bash
./scripts/export-private-backup.sh
```

脚本会自动完成：

```txt
1. 检查 data/ 是否存在
2. 检查 public/uploads/ 是否存在
3. 把 data/ 打包为 sqlite_data.tar.gz
4. 把 public/uploads/ 打包为 uploads_data.tar.gz
5. 如果存在 .env，则复制为 .env.backup
6. 生成 MANIFEST.txt
7. 使用 openssl 加密成 onlyweb-private-data.tar.gz.enc
8. 删除导出过程中的明文临时文件
```

执行过程中会要求输入加密密码。

请记住这个密码。新 Mac 或 LinuxOS 恢复时必须使用同一个密码。

### 4.4 导出结果

成功后会生成：

```txt
private-backups/onlyweb-private-data.tar.gz.enc
```

这个文件可以提交到 GitHub Private。

## 5. 旧 Mac：提交到 GitHub Private

查看状态：

```bash
git status --short
```

提交代码、文档、脚本和加密包：

```bash
git add .
git commit -m "sync onlyweb folder storage and encrypted data backup"
git push
```

如果只想提交数据备份包：

```bash
git add private-backups/onlyweb-private-data.tar.gz.enc
git commit -m "update encrypted onlyweb data backup"
git push
```

## 6. 新 Mac：拉取项目

新 Mac 需要先安装：

```txt
Docker Desktop
Git
```

首次拉取：

```bash
cd /Users/mac/workspace

git clone 你的GitHub仓库地址 onlyWeb

cd onlyWeb
```

如果项目已经存在：

```bash
cd /Users/mac/workspace/onlyWeb

git pull
```

## 7. 新 Mac：解密并解压数据包

### 7.1 使用脚本解密解压

进入项目目录：

```bash
cd /Users/mac/workspace/onlyWeb
```

确认加密包存在：

```bash
ls -lh private-backups/onlyweb-private-data.tar.gz.enc
```

执行：

```bash
./scripts/decrypt-private-backup.sh
```

脚本会要求输入旧 Mac 导出时设置的加密密码。

解密解压结果默认放到：

```txt
private-backups/restore/
```

正常会看到：

```txt
private-backups/restore/sqlite_data.tar.gz
private-backups/restore/uploads_data.tar.gz
private-backups/restore/.env.backup
private-backups/restore/MANIFEST.txt
```

如果旧 Mac 导出时没有 `.env`，则不会有 `.env.backup`。

### 7.2 手动解密解压方式

如果不使用脚本，可以手动执行：

```bash
cd /Users/mac/workspace/onlyWeb
mkdir -p private-backups/restore

openssl enc -d -aes-256-cbc -pbkdf2 \
  -in private-backups/onlyweb-private-data.tar.gz.enc | \
  tar xzf - -C private-backups/restore
```

这条命令的含义：

```txt
openssl enc -d  负责解密 .enc 文件
tar xzf -       负责把解密后的 tar.gz 内容解压到 private-backups/restore/
```

## 8. 新 Mac：恢复数据到文件夹

### 8.1 恢复 `.env`

如果存在：

```txt
private-backups/restore/.env.backup
```

可以恢复为：

```bash
cp private-backups/restore/.env.backup .env
```

新 Mac 本地访问时，建议检查 `.env`：

```env
APP_URL=http://localhost:18473
```

如果要局域网访问，改成新 Mac 的局域网 IP：

```env
APP_URL=http://新Mac局域网IP:18473
```

### 8.2 恢复 SQLite 数据库目录

注意：下面命令会清空新 Mac 当前项目目录下的 `data/`。

```bash
mkdir -p data
rm -rf data/*
tar xzf private-backups/restore/sqlite_data.tar.gz -C data
```

### 8.3 恢复上传文件目录

注意：下面命令会清空新 Mac 当前项目目录下的 `public/uploads/`。

```bash
mkdir -p public/uploads
rm -rf public/uploads/*
tar xzf private-backups/restore/uploads_data.tar.gz -C public/uploads
```

## 9. 新 Mac：启动和验证

启动：

```bash
docker compose up -d --build
```

查看容器：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f
```

访问：

```txt
http://localhost:18473
```

验证作品是否存在：

```txt
http://localhost:18473/projects/po-pdf-spec-compare
```

如果能看到“采购订单规格自动核对助手”，说明数据同步成功。

## 10. LinuxOS 服务器恢复方式

LinuxOS 与新 Mac 的核心逻辑相同，只是通常使用 `docker-compose` V1。

### 10.1 拉取代码

```bash
cd /root/onlyWeb

git pull
```

### 10.2 解密解压

```bash
./scripts/decrypt-private-backup.sh
```

也可以手动执行：

```bash
mkdir -p private-backups/restore

openssl enc -d -aes-256-cbc -pbkdf2 \
  -in private-backups/onlyweb-private-data.tar.gz.enc | \
  tar xzf - -C private-backups/restore
```

### 10.3 恢复 `.env`

```bash
cp private-backups/restore/.env.backup .env
```

LinuxOS 上要根据真实访问地址检查 `.env`：

```env
APP_URL=http://服务器IP:18473
```

如果已经配置 HTTPS 域名：

```env
APP_URL=https://你的域名
```

### 10.4 恢复文件夹数据

停止容器：

```bash
docker-compose down
```

恢复数据库和上传文件：

```bash
mkdir -p data public/uploads
rm -rf data/* public/uploads/*
tar xzf private-backups/restore/sqlite_data.tar.gz -C data
tar xzf private-backups/restore/uploads_data.tar.gz -C public/uploads
chown -R 1001:1001 data public/uploads
```

其中 `chown -R 1001:1001 data public/uploads` 用于保证容器内 `nextjs` 用户可以写入绑定挂载目录。

启动：

```bash
docker-compose up -d --build
```

验证：

```bash
docker-compose ps
```

访问：

```txt
http://服务器IP:18473/projects/po-pdf-spec-compare
```

## 11. 日常更新流程

### 11.1 只更新代码

旧 Mac：

```bash
git add .
git commit -m "update onlyweb"
git push
```

新 Mac 或 LinuxOS：

```bash
git pull
```

macOS Docker Compose V2：

```bash
docker compose up -d --build
```

LinuxOS Docker Compose V1：

```bash
docker-compose down
docker-compose up -d --build
```

### 11.2 更新代码和数据

旧 Mac：

```bash
./scripts/export-private-backup.sh

git add .
git commit -m "update onlyweb code and encrypted data backup"
git push
```

新 Mac 或 LinuxOS：

```bash
git pull
./scripts/decrypt-private-backup.sh
```

然后按本文“恢复数据到文件夹”的步骤恢复 `data/` 和 `public/uploads/`。

## 12. 常见问题

### 12.1 现在还需要导出 Docker volume 吗？

不需要。

现在数据已经直接保存在项目目录：

```txt
data/
public/uploads/
```

备份脚本直接打包这两个文件夹。

### 12.2 只复制整个项目文件夹可以吗？

可以，但要注意：

```txt
data/
public/uploads/
.env
```

这些本地文件不会被 GitHub 同步。如果你是用 U 盘或内网直接复制整个项目文件夹，它们可以一起复制过去。

如果你是通过 GitHub 迁移，则需要使用加密备份包。

### 12.3 为什么不直接上传 `data/` 和 `public/uploads/`？

因为里面可能包含：

```txt
管理员账号
个人联系方式
微信二维码
简历内容
HR 定制页
项目附件
知识库配置
```

即使 GitHub 是 Private，也建议只上传加密包。

### 12.4 忘记加密密码怎么办？

无法从已有加密包恢复。

只能回到旧 Mac，重新执行：

```bash
./scripts/export-private-backup.sh
```

并设置新的密码。

### 12.5 `docker compose down` 会删除数据吗？

不会。

当前数据在项目目录中：

```txt
data/
public/uploads/
```

`docker compose down` 只删除容器和默认网络，不会删除这两个项目目录。
