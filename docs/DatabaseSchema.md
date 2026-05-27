# onlyWeb Database Schema

## 目录

- [概述](#概述)
- [admin_users](#admin_users)
- [app_settings](#app_settings)
- [profiles](#profiles)
- [projects](#projects)
- [experiences](#experiences)
- [skills](#skills)
- [resume_pages](#resume_pages)
- [软删除字段](#软删除字段)
- [project_documents](#project_documents)
- [profiles 联系方式扩展字段](#profiles-联系方式扩展字段)

## 概述

数据库使用 SQLite，默认文件路径：`data/onlyweb.db`。

Docker 部署时数据库文件位于容器内：

```txt
/app/data/onlyweb.db
```

并通过 `./data:/app/data` 绑定挂载持久化到项目目录 `data/`。

正式 schema 定义在：

```txt
src/db/schema.sql
```

数据库初始化和种子数据逻辑在：

```txt
src/db/sqlite.ts
```

## admin_users

管理员账号表。

| 字段 | 含义 | 影响范围 |
| --- | --- | --- |
| id | 管理员主键 | 后台登录、操作归属 |
| email | 登录邮箱 | 登录账号、唯一约束 |
| password_hash | 密码哈希 | 登录校验，禁止明文存储 |
| created_at | 创建时间 | 审计展示 |
| updated_at | 更新时间 | 审计展示 |


## app_settings

应用运行配置表。用于保存可以在后台页面维护的配置项，优先级高于对应环境变量。

| 字段 | 含义 | 影响范围 |
| --- | --- | --- |
| key | 配置键，主键 | 配置读取和覆盖规则 |
| value | 配置值 | 具体功能的运行参数 |
| description | 配置说明 | 后台维护和排查 |
| created_at | 创建时间 | 审计展示 |
| updated_at | 更新时间 | 配置变更排查 |

当前用于保存 Wiki 配置：`WIKI_VAULT_PATH`、`WIKI_PUBLIC`、`WIKI_EXCLUDE_DIRS`。后台 `/admin/wiki` 修改后会写入该表，并优先生效。

## profiles

个人资料表。MVP 阶段维护一条记录。

| 字段 | 含义 | 影响范围 |
| --- | --- | --- |
| id | 主键 | 资料引用 |
| name | 姓名 | 首页、简历页、联系页 |
| title | 职业标题 | 首页、简历页 |
| bio | 个人简介 | 首页、关于页、简历页 |
| email | 邮箱 | 联系入口、HR 页面 |
| phone | 手机 | 联系页、HR 联系方式，可选 |
| wechat_id | 微信号 | HR 联系方式，可选 |
| wechat_qr_url | 微信二维码图片地址 | HR 联系方式，可选 |
| location | 所在地 | 简历页、联系页、HR 联系方式 |
| github_url | GitHub 链接 | 联系页、作品页 |
| linkedin_url | LinkedIn 链接 | 联系页 |
| website_url | 个人网站链接 | 联系页 |
| avatar_url | 头像地址 | 首页或关于页，后续使用 |
| created_at | 创建时间 | 审计展示 |
| updated_at | 更新时间 | 审计展示 |

## projects

作品表。

| 字段 | 含义 | 影响范围 |
| --- | --- | --- |
| id | 主键 | 作品引用、简历页关联 |
| title | 作品标题 | 作品列表、详情、简历页 |
| slug | 作品 URL 标识 | `/projects/:slug` 路由，唯一 |
| summary | 作品摘要 | 列表卡片、简历页 |
| description | 作品详情 | 作品详情页 |
| cover_image_url | 封面图 | 作品卡片，后续上传功能 |
| tech_stack | JSON 数组字符串 | 标签展示、岗位匹配 |
| role | 个人职责 | 作品详情页 |
| highlights | JSON 数组字符串 | 作品详情页、简历页 |
| demo_url | 演示链接 | 作品详情页 |
| effect_demo_type | 效果演示类型，`video` 或 `document` | 作品详情页效果演示模块 |
| effect_demo_title | 效果演示标题 | 作品详情页效果演示模块 |
| effect_demo_description | 效果演示说明 | 作品详情页效果演示模块 |
| effect_demo_url | 效果演示链接 | 作品详情页效果演示模块 |
| business_title | 面向非技术读者的业务成果展示标题 | 作品详情页首屏标题；为空时回退到作品标题或自动推断 |
| business_tagline | 首屏说明 | 作品详情页首屏标题下方说明；为空时回退到效果文档或作品详情 |
| business_scenario | 使用场景 | 作品详情页首屏指标卡 |
| business_core_value | 核心价值 | 作品详情页首屏指标卡 |
| business_delivery_form | 交付形式 | 作品详情页首屏指标卡 |
| business_pain_points | JSON 数组字符串，业务痛点 | 作品详情页“为什么要做”模块 |
| business_solution_steps | JSON 数组字符串，解决步骤 | 作品详情页“怎么解决”流程模块 |
| business_result | 使用效果，一句话结果 | 作品详情页首屏说明和“使用效果”模块 |
| business_values | JSON 数组字符串，项目价值 | 作品详情页“项目价值”模块 |
| business_contributions | JSON 数组字符串，个人贡献 | 作品详情页“我负责什么”模块 |
| business_audience_focus | JSON 数组字符串，管理者关注点 | 作品详情页侧栏“看这个项目重点看什么”模块 |
| business_resource_labels | JSON 数组字符串，资料入口标签 | 预留字段；作品详情页资料入口主要由 `project_documents` 和上传文档生成 |
| business_tech_notes | JSON 数组字符串，技术实现标签 | 作品详情页侧栏“技术实现”模块 |
| github_url | 代码链接 | 作品详情页 |
| docs_url | 外部文档链接 | 作品详情页 |
| show_description | 是否展示项目介绍，0/1 | 作品详情页模块展示配置 |
| show_role | 是否展示个人职责，0/1 | 作品详情页模块展示配置 |
| show_effect_demo | 是否展示效果演示，0/1 | 作品详情页模块展示配置 |
| show_highlights | 是否展示项目亮点，0/1 | 作品详情页模块展示配置 |
| show_tech_stack | 是否展示技术栈，0/1 | 作品详情页右侧模块 |
| show_links | 是否展示相关链接/文档，0/1 | 作品详情页右侧模块 |
| is_featured | 是否精选，0/1 | 首页精选作品 |
| is_published | 是否发布，0/1 | 前台可见性 |
| deleted_at | 软删除时间 | 回收站过滤 |
| created_at | 创建时间 | 后台排序、审计 |
| updated_at | 更新时间 | 后台排序、审计 |

## experiences

经历表。

| 字段 | 含义 | 影响范围 |
| --- | --- | --- |
| id | 主键 | 简历页关联 |
| company | 公司名称 | 简历页展示 |
| role | 职位名称 | 简历页展示 |
| start_date | 开始时间 | 时间线展示 |
| end_date | 结束时间 | 时间线展示，空值表示至今 |
| summary | 经历摘要 | 简历页展示 |
| highlights | JSON 数组字符串 | 简历页展示 |
| skills | JSON 数组字符串 | 岗位匹配、标签展示 |
| is_published | 是否发布，0/1 | 前台可见性 |
| deleted_at | 软删除时间 | 回收站过滤 |
| created_at | 创建时间 | 后台排序、审计 |
| updated_at | 更新时间 | 后台排序、审计 |

## skills

技能表。

| 字段 | 含义 | 影响范围 |
| --- | --- | --- |
| id | 主键 | 简历页关联 |
| name | 技能名称 | 标签展示 |
| category | 技能分类 | 后台分组、前台分组 |
| level | 熟练度 | 后续图形化展示 |
| sort_order | 排序值 | 后台和前台排序 |
| created_at | 创建时间 | 审计展示 |
| updated_at | 更新时间 | 审计展示 |

## resume_pages

定制简历页表。

| 字段 | 含义 | 影响范围 |
| --- | --- | --- |
| id | 主键 | 定制页引用 |
| company_name | 公司名称 | 定制页标题、后台列表 |
| company_slug | 公司 URL 标识 | 管理员预览路径 `/for/:companySlug/:positionSlug` |
| position_name | 岗位名称 | 定制页标题、后台列表 |
| position_slug | 岗位 URL 标识 | 管理员预览路径 `/for/:companySlug/:positionSlug` |
| headline | 页面主标题 | 定制页首屏 |
| intro | 定制化介绍 | 定制页首屏 |
| motivation | 岗位匹配说明 | 定制页核心说明 |
| share_token | HR 分享 token | `/r/:shareToken` 访问校验，唯一 |
| project_ids | JSON 数组字符串 | 关联展示的作品 ID |
| experience_ids | JSON 数组字符串 | 关联展示的经历 ID |
| skill_ids | JSON 数组字符串 | 关联展示的技能 ID |
| is_published | 是否发布，0/1 | HR 链接是否可访问 |
| created_at | 创建时间 | 后台排序、审计 |
| updated_at | 更新时间 | 后台排序、审计 |


## 软删除字段

以下表包含 `deleted_at` 字段：

- `projects`
- `experiences`
- `resume_pages`

`deleted_at` 为空表示正常内容；不为空表示已进入回收站。前台和后台常规列表默认过滤已删除内容，回收站页面读取并恢复这些记录。


## project_documents

作品上传文档表。一个作品可以关联多个上传文档。

| 字段 | 说明 |
| --- | --- |
| id | 主键 |
| project_id | 关联作品 ID |
| file_name | 原始文件名，保存时不改名 |
| file_url | 文件访问路径 |
| document_kind | 文档类型，`project` 表示普通项目文档，`effect_demo` 表示效果演示文档 |
| mime_type | 文件 MIME 类型 |
| size | 文件大小 |
| deleted_at | 软删除字段，删除后不在列表展示 |
| created_at | 创建时间 |
| updated_at | 更新时间 |

同一作品下 `project_id + file_name + document_kind` 唯一；普通项目文档和效果演示文档即使同名也不会互相覆盖。再次上传同类型同名文件会覆盖并更新记录。Markdown、PDF、Word `.doc/.docx` 文档通过 `/projects/:slug/docs?doc=<documentId>` 在线预览；PDF 和 Word 预览走 `/projects/:slug/docs/preview?doc=<documentId>`，Word 会转换为 PDF；原始文档通过 `/projects/:slug/docs/download?doc=<documentId>` 强制下载。


## profiles 联系方式扩展字段

`profiles` 表包含微信联系方式字段，已合并到 profiles 字段表中：

| 字段 | 说明 |
| --- | --- |
| wechat_id | 微信号 |
| wechat_qr_url | 微信二维码图片地址 |
