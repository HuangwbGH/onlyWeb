# onlyWeb 系统架构文档

## 目录

- [1. 架构目标](#1-架构目标)
- [2. 推荐技术栈](#2-推荐技术栈)
- [3. 当前前端 Mock 原型](#3-当前前端-mock-原型)
- [4. 系统组件](#4-系统组件)
- [5. 模块划分](#5-模块划分)
- [6. 建议目录结构](#6-建议目录结构)
- [7. 数据模型草案](#7-数据模型草案)
- [8. 路由设计](#8-路由设计)
- [9. Docker 架构](#9-docker-架构)
- [10. 认证设计](#10-认证设计)
- [11. 文件上传设计](#11-文件上传设计)
- [12. 部署设计](#12-部署设计)
- [13. 架构原则](#13-架构原则)
- [14. 当前正式程序结构](#14-当前正式程序结构)


## 1. 架构目标

onlyWeb 的架构目标是：

- 小型化：适合个人维护，不引入不必要的复杂系统。
- Docker 化：支持本地、服务器和 NAS 等环境部署。
- 数据驱动：页面内容来自数据库，而不是硬编码页面。
- 可扩展：后续可以加入访问统计、文件存储、备份和权限增强。

## 2. 推荐技术栈

当前采用方案 A：完整 Docker 化。

推荐组合：

```txt
Web 框架：TanStack Start
语言：TypeScript
数据库：SQLite
数据访问：better-sqlite3
样式：Tailwind CSS
认证：自定义管理员登录
部署：Docker Compose
```

如后续发现 TanStack Start 在部署或生态上不满足需求，可以切换为 Next.js，但数据库模型和产品结构保持不变。


## 3. 当前前端 Mock 原型

当前原型代码独立放在：

```txt
webMock/
```

用途：

- 验证页面风格。
- 验证前台信息架构。
- 验证后台管理范围。
- 验证定制页的管理员预览和 HR 专属访问流程。

当前原型不连接数据库，数据来自：

```txt
webMock/src/mockData.ts
```

`webMock/` 的 Mock 登录状态暂存在浏览器 `localStorage`。正式程序已使用服务端认证和 HTTP-only Cookie 会话。

## 4. 系统组件

```txt
Browser
  ↓
Web App
  ↓
SQLite
```

MVP Docker 服务：

```txt
app
SQLite 文件数据库
```

后续增强服务：

```txt
caddy / nginx
backup
minio
```

## 5. 模块划分

### 5.1 Public Frontend

负责公开页面展示。

包含：

- 首页
- 关于我
- 通用简历
- 作品列表
- 作品详情
- 定制简历页

### 5.2 Admin Dashboard

负责内容管理。

包含：

- 登录
- 个人资料管理
- 作品管理
- 经历管理
- 技能管理
- 定制简历页管理
- HR 专属分享链接生成与复制
- 管理员预览与 HR 视图切换

### 5.3 Server Layer

负责业务逻辑和数据访问。

包含：

- 认证与会话
- 数据校验
- 数据库读写
- 文件上传，后续

### 5.4 Database

使用 SQLite 文件数据库存储结构化数据。

核心数据：

- 管理员账号
- 个人资料
- 作品
- 经历
- 技能
- 定制简历页

## 6. 建议目录结构

```txt
onlyWeb/
  webMock/
    src/
      main.tsx
      mockData.ts
      styles.css
    package.json
    vite.config.ts

  src/
    routes/
      index.tsx
      about.tsx
      resume.tsx
      projects/
      for/
      admin/
    components/
      public/
      admin/
      ui/
    db/
      schema.sql
      sqlite.ts
    server/
      auth.ts
      validators.ts
    lib/
      slug.ts
      dates.ts
    styles/

  public/
    uploads/

  docs/
    prd.md
    architecture.md
    roadmap.md

  docker-compose.yml
  Dockerfile
  .env.example
  README.md
```

实际目录会根据框架约定微调。

## 7. 数据模型草案

### 7.1 admin_users

管理员账号。

```ts
{
  id: string
  email: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}
```

### 7.2 profiles

个人资料。MVP 可以只维护一条记录。

```ts
{
  id: string
  name: string
  title: string
  bio: string
  email: string
  phone?: string
  location?: string
  githubUrl?: string
  linkedinUrl?: string
  websiteUrl?: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}
```

### 7.3 projects

作品。

```ts
{
  id: string
  title: string
  slug: string
  summary: string
  description: string
  coverImageUrl?: string
  techStack: string[]
  role: string
  highlights: string[]
  demoUrl?: string
  githubUrl?: string
  docsUrl?: string
  isFeatured: boolean
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}
```

### 7.4 experiences

经历。

```ts
{
  id: string
  company: string
  role: string
  startDate: string
  endDate?: string
  summary: string
  highlights: string[]
  skills: string[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}
```

### 7.5 skills

技能。

```ts
{
  id: string
  name: string
  category: string
  level?: number
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}
```

### 7.6 resume_pages

定制简历页。SQLite MVP 中直接用 JSON 数组字段保存关联 ID，减少个人小系统的表复杂度。

```ts
{
  id: string
  companyName: string
  companySlug: string
  positionName: string
  positionSlug: string
  headline: string
  intro: string
  motivation?: string
  shareToken: string
  projectIds: string[]
  experienceIds: string[]
  skillIds: string[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}
```

## 8. 路由设计

### 8.1 前台路由

```txt
/                               首页
/about                          关于我
/resume                         通用简历
/projects                       作品列表
/projects/:slug                 作品详情
/r/:shareToken                  HR 专属定制简历页
/projects/:slug/docs            Markdown 项目文档在线查看
/projects/:slug/docs/download   原始项目文档下载接口
/uploads/profile/:fileName      个人资料图片访问接口
/contact                        联系方式
```

说明：

- `/r/:shareToken` 是发给 HR 的访问地址。
- 前台不提供定制页列表。
- HR 只能访问 token 对应的单个定制页。

### 8.2 后台路由

```txt
/admin/login                    登录
/admin                          后台首页、个人资料、技能列表行编辑
/admin/projects                 新版作品管理，支持新建、编辑、软删除、上传多个文档
/admin/experiences              新版经历管理，支持新建、编辑、软删除
/admin/custom-pages             新版定制页管理，支持新建、编辑、软删除
/admin/recycle-bin              回收站，查看和恢复已删除作品、经历、定制页
/for/:companySlug/:positionSlug 管理员预览定制简历页，需要登录
```

## 9. Docker 架构

MVP 预期：

```yaml
services:
  app:
    build: .
    ports:
      - "18473:18473"
    environment:
      DATABASE_PATH: /app/data/onlyweb.db
      APP_URL: http://localhost:18473
    volumes:
      - sqlite_data:/app/data
      - uploads_data:/app/public/uploads

volumes:
  sqlite_data:
  uploads_data:
```

实际文件在实现阶段创建。

## 10. 认证设计

MVP 使用单管理员账号。

建议：

- 密码使用 bcrypt 或 argon2 哈希。
- 会话使用 HTTP-only Cookie。
- 后台路由统一校验登录态。
- 管理员预览路由 `/for/:companySlug/:positionSlug` 需要登录态。
- HR 分享路由 `/r/:shareToken` 不需要登录，但 token 必须足够随机且不可枚举。
- 初始管理员可通过环境变量创建，或通过 seed 脚本创建。

## 11. 文件上传设计

MVP 可以先使用本地 volume。

```txt
uploads volume -> /app/public/uploads 或 /app/uploads
```

后续可迁移到：

- S3
- Cloudflare R2
- MinIO

## 12. 部署设计

### 12.1 MVP 部署

```bash
docker compose up -d
```

### 12.2 生产增强

后续加入：

- Caddy 自动 HTTPS
- 数据库定时备份
- 上传文件备份
- 日志轮转
- 健康检查

## 13. 架构原则

- 不为每个公司岗位创建单独页面文件。
- 不在前台暴露定制页列表。
- HR 只通过专属 token 链接访问单个定制页。
- 定制简历页必须由数据库记录驱动。
- 后台表单尽量简单，先满足个人使用。
- 优先使用关系型数据建模，避免早期引入复杂 CMS。

## 14. 当前正式程序结构

当前正式程序已开始落地：

```txt
src/
  app/
    page.tsx
    about/page.tsx
    projects/page.tsx
    projects/[slug]/page.tsx
    resume/page.tsx
    contact/page.tsx
    admin/login/page.tsx
    admin/page.tsx
    for/[companySlug]/[positionSlug]/page.tsx
    r/[shareToken]/page.tsx
  components/
    AppShell.tsx
    Layout.tsx
    Shared.tsx
    admin/
    resume/
  db/
    schema.sql
    sqlite.ts
  lib/
    mockData.ts
```

说明：

- `src/lib/mockData.ts` 仅用于首次初始化种子数据。
- `src/db/schema.sql` 是正式 SQLite schema。
- `src/db/sqlite.ts` 负责初始化数据库和种子数据。
- `/r/:shareToken` 使用专属分享视图，不显示普通站点导航。
- `/for/:companySlug/:positionSlug` 当前使用服务端 session 做管理员预览保护。


## 11. 软删除字段

`projects`、`experiences`、`resume_pages` 增加 `deleted_at` 字段。

- `deleted_at IS NULL`：正常内容。
- `deleted_at IS NOT NULL`：已进入回收站。
- 前台查询、定制页查询和后台管理列表默认只读取 `deleted_at IS NULL` 的内容。
- 回收站读取 `deleted_at IS NOT NULL` 的内容，并通过恢复操作把 `deleted_at` 置回 `NULL`。


## 12. 项目文档上传

作品外部文档链接继续复用 `projects.docs_url` 字段；上传的多个作品文档保存到 `project_documents` 表。上传文件保存到 `public/uploads/project-docs/<projectId>/`，Docker 中该目录由 `uploads_data` volume 持久化。

上传文件保存时保留原始文件名；同一作品下再次上传同名文件会覆盖该文件并更新对应文档记录。Markdown 文档通过 `/projects/:slug/docs?doc=<documentId>` 在线渲染；原始文档下载通过 `/projects/:slug/docs/download?doc=<documentId>` 返回 `Content-Disposition: attachment` 强制下载；非 Markdown 文档继续作为普通文档链接打开或下载。已上传文档删除时设置 `deleted_at`，不物理删除文件。


## 13. HR 联系方式与个人资料图片

`profiles` 表通过 `wechat_id` 和 `wechat_qr_url` 保存微信联系方式。后台个人资料页支持填写微信号、填写二维码链接或上传二维码图片。

微信二维码图片保存到 `public/uploads/profile/`，Docker 中通过 `uploads_data` volume 持久化。为了兼容中文文件名和运行时上传文件，图片访问走 `/uploads/profile/:fileName` 动态路由读取文件并返回正确图片类型。

HR 定制页 `/r/:shareToken` 展示统一风格的联系方式卡片，包括邮箱、手机号、微信号、所在地和微信二维码；底部旧联系方式模块在 HR 定制页中隐藏，避免重复。
