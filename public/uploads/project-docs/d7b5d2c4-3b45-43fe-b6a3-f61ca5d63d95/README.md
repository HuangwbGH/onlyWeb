# 插件管理系统

基于 FastAPI + SQL Server 的内部插件用户授权管理后台。替代手工 SQL 操作，提供 Web 界面完成插件申请审批、用户增删改查、插件分发下载。

## 功能特性

- **申请审批**：自动列出 `Equip_A01` 中的待审申请，一键审批同时更新申请表状态并写入 `User_A01` 授权表
- **用户管理**：对 `User_A01` 表的完整 CRUD（无刷新 AJAX 删除）
- **插件下载**：动态扫描 `static/plugins/` 目录，自动按文件名前缀关联说明文档与操作手册
- **使用说明**：内置 `/help` 页面，包含数据流图与字段说明
- **双主题**：白天 / 夜晚主题切换，默认夜晚主题，选择持久化到 localStorage
- **客户端表格排序**：所有列表点击列名即可按数值或字符串排序
- **跨平台**：macOS 与 Linux 通过 Docker 一键运行

## 技术栈

| 层 | 选择 |
|---|---|
| 后端 | Python 3.11 + FastAPI + Uvicorn |
| 数据库驱动 | pyodbc + FreeTDS ODBC（系统级） |
| 前端 | Bootstrap 5 + Bootstrap Icons + 原生 JS（Jinja2 模板） |
| 容器化 | Docker + docker-compose |

## 目录结构

```
plugin-manager/
├── Dockerfile              # 容器镜像定义（含 FreeTDS 配置）
├── docker-compose.yml      # 服务编排
├── requirements.txt        # Python 依赖
├── freetds.conf            # FreeTDS 配置（TDS 7.0 用于 SQL Server 2008 R2）
├── config.env              # 数据库连接配置（敏感，不提交，需手动创建）
├── config.env.example      # 配置模板
├── README.md
├── .gitignore
├── app/
│   ├── __init__.py
│   ├── main.py             # FastAPI 入口
│   ├── db.py               # 数据库连接
│   ├── routes/
│   │   ├── applications.py # 申请审批路由
│   │   ├── users.py        # 用户 CRUD 路由
│   │   └── plugins.py      # 插件下载路由
│   └── templates/
│       ├── base.html
│       ├── applications_pending.html
│       ├── applications_approved.html
│       ├── users.html
│       ├── plugins.html
│       └── help.html
└── static/
    └── plugins/            # 插件 .exe 与文档（手动放入）
```

## 环境要求

- **Docker** 20+ 与 **Docker Compose** v2+
- 可访问目标 SQL Server 的网络（默认 `192.168.**.***:***`）

无需在宿主机安装 Python、FreeTDS 等任何依赖，全部封装在容器内。

## 部署运行

### 1. 克隆仓库

```bash
git clone <repo-url>
cd plugin-manager
```

### 2. 配置数据库连接

```bash
cp config.env.example config.env
# 然后用编辑器修改 config.env，填入实际的数据库地址、用户名、密码
```

`config.env` 字段说明：

| 字段 | 说明 |
|---|---|
| `DB_HOST` | SQL Server 地址，默认 `192.168.*.***` |
| `DB_NAME` | 数据库名，默认 `APP_JXD` |
| `DB_USER` / `DB_PASSWORD` | 只读账号，用于查询 |
| `DB_WRITE_USER` / `DB_WRITE_PASSWORD` | 读写账号，用于审批 / 用户增删改 |

### 3. 放置插件文件

把 `.exe` 插件放入 `static/plugins/` 目录，命名规范：

- 插件本体：`{prefix}.exe`（如 `20250623-U8物料关联查询.exe`）
- 关联文档：`{prefix}-XXX.{md,pdf,txt,doc,docx}` 同前缀文件会自动归到该插件下

新增 / 删除文件后刷新页面即可看到变化（无需重启容器）。

### 4. 启动服务

```bash
docker compose up -d --build
```

首次构建约 1-3 分钟（取决于网络）。后续启动只需：

```bash
docker compose up -d
```

### 5. 访问

打开浏览器：[http://localhost:18732](http://localhost:18732)

服务端口为 `18732`（非常用端口，避免冲突）。需要修改在 `docker-compose.yml` 调整 `ports` 映射。

### 6. 常用运维命令

```bash
# 查看实时日志
docker compose logs -f

# 重启服务（修改 config.env 后需要）
docker compose restart

# 停止服务
docker compose down

# 进入容器调试
docker compose exec web bash
```

## SQL Server 兼容性

代码默认使用 **TDS 7.0** 协议（兼容 SQL Server 2008 R2 及以上）。

如需对接更新版本的 SQL Server（2012+），可修改 `freetds.conf`：

```ini
[global]
tds version = 7.3   # 或 7.4
text size = 4294967295
```

修改后重新构建：`docker compose up -d --build`

## 数据库表说明

| 表名 | 用途 | 关键字段 |
|---|---|---|
| `Equip_A01` | 插件申请记录（含电脑信息） | `EquipID`、`UserName`、`RoleID`（`-1` 待审批，`>=1000` 已审批）|
| `User_A01` | 已授权用户 | `UserID`（主键）、`ComputerID`、`AppID`、`MultiDB`、`DefaultDB` |
| `App_A01` | 插件清单 | `AppID`、`AppName`、`AppNote` |
| `App_B01` | 插件功能 | `AppID`、`AppFuncDesc` |
| `App_C01` | 数据库账套 | `DBID`、`DBName`、`DBNote` |

## 业务流程

```
新员工电脑首次打开插件
  └─→ 自动向 Equip_A01 提交申请（RoleID = -1）
        └─→ 管理员在 /applications 看到待审申请
              └─→ 点击「审批」填写授权信息
                    ├─→ UPDATE Equip_A01 SET RoleID = 1001
                    └─→ INSERT INTO User_A01 (...)
                          └─→ 员工重新打开插件即可使用
```

## Linux 部署注意事项

代码和 Docker 配置都使用相对路径，可直接拷贝到 Linux 服务器运行：

```bash
# 在 Linux 上
git clone <repo-url> /opt/plugin-manager
cd /opt/plugin-manager
cp config.env.example config.env
vim config.env             # 填写实际数据库账号
docker compose up -d --build
```

如希望开机自启，可把 `restart: unless-stopped`（已配置）配合 systemd 管理 docker 服务即可。

## 故障排查

### 页面打开报 `Internal Server Error`

查看日志：`docker compose logs --tail=50`

常见原因：
- **数据库连接失败**：检查 `config.env` 的账号密码、网络可达性
- **TDS 协议版本不匹配**：根据 SQL Server 版本调整 `freetds.conf` 后重新 build

### 数据库连接成功但写操作失败

确认 `config.env` 的 `DB_WRITE_USER` 是有写权限的账号（审批和用户管理需要写权限）。

### 插件 `.exe` 不显示

确认文件名以 `.exe` 结尾且放在 `static/plugins/` 下。检查文件权限（容器需要可读）：

```bash
chmod -R a+r static/plugins/
```

## 安全提示

- `config.env` **不要提交** 到 Git（已在 `.gitignore` 中忽略）
- 服务默认无登录鉴权，仅适合**内网部署**。如需暴露到公网，请前置 nginx + basic auth 或其他鉴权层
- 数据库账号建议遵循最小权限原则，写账号仅授予 `Equip_A01` 与 `User_A01` 两张表的 `INSERT/UPDATE/DELETE` 权限
