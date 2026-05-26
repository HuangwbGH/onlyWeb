---
name: vgm-declaration
description: 船政出口业务工具：将销售订单发货表.xlsx 导入 SQLite，并自动生成 Container VGM Declaration 申报文件。当用户需要处理销售订单发货表、生成 VGM 申报单、填写集装箱重量申报、处理船名航次/SO号/柜号数据时触发此 skill。
---

# VGM Declaration 生成工具

## 目录结构

```
vgm-declaration/
├── SKILL.md
├── scripts/
│   ├── import_sales_data.py   # 导入 xlsx → SQLite
│   └── generate_vgm.py        # 从 SQLite 生成 VGM Declaration
├── assets/
│   └── template/
│       └── Container VGM Declaration.xlsx   # VGM 申报模板
└── output/                    # 生成结果（sales.db 和 VGM xlsx 均存放于此）
```

所有路径均为相对路径，脚本从 `scripts/` 目录运行时自动定位。

## 工作流程

### 第一步：导入销售订单发货表

```bash
python3 scripts/import_sales_data.py <xlsx_path> [db_path]
```

- `xlsx_path`：销售订单发货表.xlsx 路径
- `db_path`（可选）：SQLite 输出路径，**默认：`output/sales.db`**
- 重复导入会清空并重建表

### 第二步：生成 VGM Declaration

```bash
python3 scripts/generate_vgm.py [db_path] [output_dir] [--template <path>]
```

- `db_path`（可选）：默认 `output/sales.db`
- `output_dir`（可选）：默认 `output/`，生成结果存放于此
- 按「船名航次 + SO号」分组，每组生成一个 xlsx 文件
- 输出文件名：`Container VGM Declaration_<vessel>_<so>.xlsx`
- `--template`（可选）：自定义模板路径，默认使用 `assets/template/` 中的内置模板

## 关键规则

### VGM 计算公式

```
VGM = 柜重 + Σ(单箱毛重KG × 箱数)   按柜号分组求和
```

### 模板填写位置

| 位置 | 内容 |
|------|------|
| D6   | 船名航次（Vessel Voyage） |
| D7   | SO号（Liner Booking #） |
| B13起 | Item No.（序号，从1开始） |
| C13起 | Container Number（柜号） |
| E13起 | Container Type（柜型） |
| F13起 | Verified Gross Mass in kg（VGM） |

### 多柜处理

同一船名航次 + SO号下存在多个柜号时，从第13行起每柜占一行，序号递增。

## 数据库表结构

表名：`销售订单发货表`

| 字段名 | 列名 | 类型 |
|--------|------|------|
| 订单号 | order_no | TEXT |
| 客户 | customer | TEXT |
| 船名航次 | vessel_voyage | TEXT |
| 提单号 | bill_of_lading | TEXT |
| SO号 | so_no | TEXT |
| 柜号 | container_no | TEXT |
| 封签 | seal_no | TEXT |
| 柜重 | container_weight | REAL |
| 客户订单编号 | customer_order_no | TEXT |
| 柜型 | container_type | TEXT |
| 目的港 | destination_port | TEXT |
| 货号 | item_no | TEXT |
| 客户货号 | customer_item_no | TEXT |
| 商品英文名 | product_name_en | TEXT |
| 销售数量 | sales_qty | REAL |
| 箱数 | carton_qty | REAL |
| 单箱数量 | qty_per_carton | REAL |
| 箱子长cm | carton_length | REAL |
| 箱子宽cm | carton_width | REAL |
| 箱子高cm | carton_height | REAL |
| 体积m³ | volume_cbm | REAL |
| 单箱净重KG | net_weight_per_carton | REAL |
| 单箱毛重KG | gross_weight_per_carton | REAL |
| 净重 | total_net_weight | REAL |
| 毛重 | total_gross_weight | REAL |
| 销售单价 | unit_price | REAL |
| 实际销售金额 | actual_amount | REAL |

> 注意：销售订单发货表第1行为辅助行，第2行为表头，数据从第3行开始。毛重字段在 Excel 中为公式，脚本自动按 `单箱毛重KG × 箱数` 计算。
