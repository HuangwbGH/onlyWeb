---
name: u8-db
description: U8 ERP 数据库连接和查询工具。用于连接 SQL Server 数据库、执行查询、导出数据等操作。支持多个账套切换。
metadata:
  openclaw:
    emoji: "🗄️"
    requires:
      bins: ["python3"]
      python_packages: ["pymssql"]
    entries:
      u8db:
        path: scripts/u8db.py
        description: U8 数据库 CLI 工具
---

# U8 数据库 Skill

U8 ERP 数据库连接和查询工具，支持 SQL Server 数据库操作。

## 功能

- **连接管理**: 自动连接 U8 SQL Server 数据库
- **多账套支持**: 支持切换不同账套 (100, 101, 104, 888 等)
- **SQL 查询**: 执行自定义 SQL 查询
- **表结构查看**: 查看数据库表列表和表结构
- **人员搜索**: 快速搜索 person 表

## 使用方法

### 命令行工具

```bash
# 测试连接
python3 ~/.openclaw/workspace/skills/u8-db/scripts/u8db.py

# 指定账套连接
python3 ~/.openclaw/workspace/skills/u8-db/scripts/u8db.py -d 101

# 执行 SQL 查询
python3 ~/.openclaw/workspace/skills/u8-db/scripts/u8db.py -q "SELECT * FROM person"

# 列出所有表
python3 ~/.openclaw/workspace/skills/u8-db/scripts/u8db.py --tables

# 查看表结构
python3 ~/.openclaw/workspace/skills/u8-db/scripts/u8db.py -s person

# 搜索人员
python3 ~/.openclaw/workspace/skills/u8-db/scripts/u8db.py --search-person 张三

# 输出 JSON 格式
python3 ~/.openclaw/workspace/skills/u8-db/scripts/u8db.py --tables --json
```

### Python API

```python
import sys
sys.path.insert(0, '~/.openclaw/workspace/skills/u8-db/scripts')
from u8db import connect, query, get_tables

# 连接数据库
conn = connect('888')  # 使用账套号
# 或
conn = connect('UFDATA_101_2018')  # 使用完整数据库名

# 执行查询
results = query("SELECT * FROM person", database='888')
for row in results:
    print(row['cPersonName'])

# 获取表列表
tables = get_tables('888')
```

## 账套列表

| 账套号 | 数据库名 | 说明 |
|--------|----------|------|
| 100 | UFDATA_100_2018 | 厦缝 |
| 101 | UFDATA_101_2018 | 吉信隆 |
| 104 | UFDATA_104_2018 | 总部贸易 |
| 105 | UFDATA_105_2019 | 吉信德科技 |
| 888 | UFDATA_888_2018 | 比圣电商 (测试库) |
| ... | ... | ... |

## 连接配置

默认连接信息从 `TOOLS.md` 读取：
- 服务器: 192.168.1.135
- 端口: 1433
- 用户名: testreadonly
- 权限: 只读

## 常用 SQL 示例

```sql
-- 查询人员
SELECT cPersonCode, cPersonName, cDepCode FROM person

-- 查询供应商
SELECT TOP 10 cVenCode, cVenName FROM Vendor

-- 查询存货
SELECT TOP 10 cInvCode, cInvName FROM Inventory

-- 查询销售订单
SELECT TOP 10 * FROM SO_SOMain
```
