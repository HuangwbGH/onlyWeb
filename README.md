# onlyWeb

## 目录

- [功能介绍](#功能介绍)
- [产品定位](#产品定位)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [运行环境](#运行环境)
- [程序部署方式](#程序部署方式)
- [操作方式](#操作方式)
- [常用命令](#常用命令)
- [前端原型](#前端原型)
- [开发阶段](#开发阶段)
- [环境变量](#环境变量)
- [设计原则](#设计原则)


## 功能介绍

onlyWeb 是一个面向个人求职与作品展示的小型网站系统。

它的核心目标是：

1. 为不同公司、不同岗位动态生成定制化简历页面。
2. 统一管理和展示个人作品，作为个人作品集入口。
3. 使用 Docker 部署，方便迁移、备份和长期维护。

## 产品定位

onlyWeb 不是一个简单的静态个人主页，而是一个小型内容管理系统。

系统面向两类用户：

- 访客：HR、面试官、合作方、朋友。
- 管理员：网站所有者本人。

访客可以查看公开页面；管理员可以在后台维护个人资料、项目作品、工作经历、技能标签和定制简历页面。

## 核心功能

### 前台展示

- 首页
- 关于我
- 通用简历页
- 作品集列表
- 作品详情页
- 针对公司和岗位的定制简历页
- 联系方式展示

### 后台管理

- 管理员登录
- 个人资料管理
- 作品管理
- 工作经历管理
- 技能管理
- 定制简历页管理
- 发布 / 隐藏内容

### 定制简历页

管理员可以针对一次投递创建一个定制页面，并生成 HR 专属分享链接。

管理员预览地址示例：

```txt
/for/bytedance/frontend-engineer
/for/tencent/fullstack-engineer
```

HR 实际访问地址示例：

```txt
/r/hr-bytedance-frontend-2026
/r/hr-tencent-fullstack-2026
```

每个定制页面可以配置：

- 公司名称
- 岗位名称
- 页面标题
- 定制化开场介绍
- 岗位匹配说明
- 关联项目
- 关联经历
- 关联技能
- 是否发布
- HR 专属分享 token
- 是否需要访问码，后续增强

访问规则：

- 定制页管理只对管理员可见。
- `/for/:companySlug/:positionSlug` 是管理员预览地址，需要登录。
- `/r/:shareToken` 是 HR 专属访问地址，不展示其他定制页入口。

## 技术栈

本项目采用方案 A：完整 Docker 化的小型系统。

建议技术栈：

- Web 框架：TanStack Start 或 Next.js
- 语言：TypeScript
- 数据库：SQLite
- 数据访问：better-sqlite3
- 样式：Tailwind CSS
- 认证：自定义管理员登录或 Auth.js
- 文件存储：Docker volume 本地存储，后续可迁移到 S3 / MinIO
- 部署：Docker Compose
- 反向代理：Caddy 或 Nginx，后续加入

> 当前实现：Next.js + SQLite + better-sqlite3 + Docker Compose。

## 计划中的 Docker 服务

MVP 阶段：

```txt
app        Web 应用，内置 SQLite 文件数据库
```

后续增强：

```txt
caddy      反向代理和 HTTPS
backup     数据库备份
minio      对象存储，可选
```


## 运行环境

本项目正式程序当前使用：

- Node.js 22+
- npm 10+
- Next.js 16
- React
- TypeScript
- SQLite 文件数据库，默认 `data/onlyweb.db`
- Docker / Docker Compose，生产部署需要

当前实现状态：

- 正式应用目录：`src/`
- 前端原型目录：`webMock/`
- 数据库 schema：`src/db/schema.sql`
- 数据库说明：`docs/DatabaseSchema.md`


### 端口和域名配置

项目默认使用非常用端口，但所有端口都可以通过环境变量覆盖：

| 服务 | 默认端口 | 配置变量 | 说明 |
| --- | --- | --- | --- |
| Web 应用 | `18473` | `APP_PORT` / `PORT` | Docker 使用 `APP_PORT`，本地 `npm run dev/start` 可使用 `PORT` |
| webMock 原型 | `18475` | `WEBMOCK_PORT` | 前端 Mock 原型开发端口 |
| webMock 预览 | `18476` | `WEBMOCK_PREVIEW_PORT` | 前端 Mock 原型预览端口 |

对外访问域名通过 `APP_URL` 配置。正式部署时建议设置为 HTTPS 域名，例如：

```env
APP_PORT=18473
APP_URL=https://onlyweb.example.com
```

`APP_URL` 用于生成 HR 分享链接，并决定登录 Cookie 是否使用 Secure 策略。

## 程序部署方式

### 本地开发

```bash
npm install
npm run dev
```

访问：

```txt
http://localhost:18473
# 如果设置 PORT=19000，则访问 http://localhost:19000
```

### Docker 部署

首次部署前复制环境变量：

```bash
cp .env.example .env
```

启动：

```bash
docker compose up -d --build
```

停止：

```bash
docker compose down
```

SQLite 数据通过 Docker volume `sqlite_data` 持久化。

## 操作方式

当前正式程序已接入 SQLite，后台可以维护个人资料、作品、经历、技能和定制简历页。

常用页面：

```txt
/                                      首页
/projects                              作品列表
/projects/onlyweb-resume-system        作品详情示例
/projects/:slug/docs                  Markdown 项目文档在线查看
/projects/:slug/docs/download         原始项目文档强制下载接口
/uploads/profile/:fileName            个人微信二维码等资料图片访问接口
/resume                                通用简历
/contact                               联系页
/admin/login                           管理员登录
/admin                                 后台
/admin/projects                        新版作品管理，需要登录
/admin/experiences                     新版经历管理，需要登录
/admin/custom-pages                   新版定制页管理，需要登录
/admin/recycle-bin                    回收站，需要登录
/for/bytedance/frontend-engineer        管理员预览地址，需要登录
/r/hr-bytedance-frontend-2026           HR 专属定制页示例
```

管理员登录：

```txt
admin@example.com
password
```

当前登录已使用服务端 HTTP-only Cookie 会话；账号密码来自环境变量 `ADMIN_EMAIL` / `ADMIN_PASSWORD`。如果修改 `ADMIN_EMAIL` / `ADMIN_PASSWORD`，应用启动时会同步内置管理员账号。

后台表单提交说明：保存或删除后会停留在后台当前页面，刷新页面数据，并在操作成功后显示成功提示。新版作品管理和新版经历管理均采用“左侧列表 + 右侧分区编辑”的独立页面；技能管理采用列表行内编辑，便于快速维护。

删除说明：作品、经历和定制简历页使用软删除。删除后内容会进入 `/admin/recycle-bin` 回收站，前台和管理列表中不再展示，但可以在回收站恢复。

局域网访问说明：如果在其他电脑通过 `http://<本机局域网 IP>:18473` 访问后台，保持 `APP_URL` 为 HTTP 地址即可；系统会按 `APP_URL` 协议设置登录 Cookie，避免局域网 HTTP 访问时保存资料后被判定为未登录。

后台当前支持：

- 编辑个人资料
- 个人资料支持维护手机号、微信号和微信二维码；HR 定制页会展示统一风格的完整联系方式，微信二维码完整显示不裁剪
- 通过独立页面新增 / 编辑 / 软删除作品
- 每个作品支持上传多个项目文档，保留上传时的原始文件名，Markdown 文档可在线查看，已上传文档可以在作品管理页删除
- Markdown 在线查看支持标题、列表、代码块、表格、引用、图片和链接
- Markdown 在线查看页的“下载原始文档”会通过下载接口强制触发浏览器下载
- 通过独立页面新增 / 编辑 / 软删除经历
- 新增 / 编辑 / 删除技能，技能管理采用列表行编辑模式，便于快速维护
- 通过独立页面新增 / 编辑 / 软删除定制简历页
- 在新版定制页管理中按“投递信息 / 页面文案 / 展示内容”分区编辑
- 为定制简历页关联作品、经历和技能
- 定制简历页中的项目卡片可以打开对应作品详情
- 复制 HR 专属分享链接
- 在回收站查看和恢复已删除的作品、经历和定制页

## 常用命令

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务
npm run build        # 生产构建
npm run start        # 启动生产服务
npm run typecheck    # TypeScript 检查
docker compose up -d --build  # Docker 构建并启动
docker compose down           # 停止 Docker 服务
```

## 文档

- [产品需求文档](./docs/PRD.md)
- [系统架构文档](./docs/architecture.md)
- [开发路线图](./docs/roadmap.md)
- [服务器部署与域名代理指南](./docs/deployment.md)


## 前端原型

当前已落地一个独立的前端 Mock 原型，位于：

```txt
webMock/
```

原型用于确认页面风格、信息架构和核心交互，不连接数据库，所有数据来自：

```txt
webMock/src/mockData.ts
```

启动方式：

```bash
cd webMock
npm install
npm run dev
# 访问 http://localhost:18475
```

构建验证：

```bash
cd webMock
npm run build
```

当前原型包含：

- 首页
- 作品列表页
- 作品详情页
- 通用简历页
- 联系页
- 管理员登录 Mock
- 后台管理 Mock
- 定制页管理 Mock
- HR 专属定制页访问 Mock

### 定制页访问规则

定制页不是公开列表页，也不会在前台导航中暴露。

管理员登录后才能看到定制页管理，并可以复制某个岗位对应的 HR 专属链接。

管理员预览地址示例：

```txt
/for/bytedance/frontend-engineer
```

HR 实际收到的访问地址示例：

```txt
/r/hr-bytedance-frontend-2026
```

HR 只能通过收到的专属 token 链接访问对应页面，不能看到其他公司或岗位的定制页，也不能看到定制页列表。

## 开发阶段

### Phase 1：项目初始化

目标：系统能通过 Docker Compose 启动。

验收标准：

- `docker compose up -d` 可以启动应用，SQLite 数据通过 volume 持久化。
- 应用首页可访问。
- 数据库连接正常。

### Phase 2：数据模型与后台基础

目标：可以管理核心内容。

验收标准：

- 管理员可以登录。
- 可以维护个人资料、作品、经历、技能。

### Phase 3：前台展示

目标：访客可以访问个人网站。

验收标准：

- 首页、作品列表、作品详情、通用简历页可访问。
- 页面适配桌面端和移动端。

### Phase 4：定制简历页

目标：可以动态生成投递页面。

验收标准：

- 可以在后台创建定制简历页。
- 可以选择关联项目、经历、技能。
- 可以生成稳定的 HR 专属访问链接。

### Phase 5：部署增强

目标：适合长期运行。

验收标准：

- 支持 HTTPS。
- 数据库有备份方案。
- 上传文件持久化。
- 环境变量配置清晰。

## 环境变量

`.env.example` 当前包含：

```env
APP_PORT=18473
APP_URL=http://localhost:18473
DATABASE_PATH=/app/data/onlyweb.db
SESSION_SECRET=change-me
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password
```

## 设计原则

- 简单优先：先完成可用 MVP，不提前建设复杂 CMS。
- 数据驱动：页面由数据库内容生成，而不是为每个岗位写一个页面。
- 可迁移：使用 Docker 和 SQLite，数据库文件便于备份与迁移。
- 可长期维护：功能模块清晰，避免过度设计。
