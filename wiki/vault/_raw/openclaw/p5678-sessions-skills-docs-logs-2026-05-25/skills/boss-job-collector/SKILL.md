---
name: boss-job-collector
description: Boss 直聘岗位信息自动采集工具。用于从 Boss 直聘批量采集岗位列表和详情信息，支持多条件组合搜索（关键词、城市、学历、经验、薪资、行业、规模），模拟人类浏览行为，结果同时保存到 Excel 和 SQLite。适用场景：(1) 需要批量采集指定条件的 Boss 直聘岗位；(2) 需要采集岗位详情（描述、公司信息、活跃状态等）；(3) 需要将岗位数据结构化存储供后续分析。
---

# Boss 直聘岗位采集

## 工作流程

```
1. 填写配置文件  →  2. 运行脚本  →  3. 人工登录  →  4. 自动采集列表
→  5. 筛选/剔除  →  6. 逐条补全详情  →  7. 保存 Excel + SQLite
```

## 快速开始

### 1. 准备配置

复制 `config/跑批设置模板.txt` 为 `config/跑批设置.txt`，填写参数：

```
boss搜索词: 数据分析,风控策略
城市: 北京,上海
筛选词: 分析,策略
剔除词: 工程师,开发
公司规模(code): 301,302,303
公司行业(手动/不限): 不限
学历要求(code/不限): 不限
工作经验(code/不限): 102,103
薪资要求(code/不限): 不限
列表采集上限(条/0不限): 100
详情采集上限(条/0不限): 50
```

| 参数 | 说明 |
|---|---|
| `列表采集上限` | 阶段1最多采集多少条岗位（去重后计数），达到后停止翻页；`0` = 不限 |
| `详情采集上限` | 阶段2本次最多补全多少条详情页；`0` = 不限；断点续跑时从未补全的继续计数 |

其余参数说明见模板文件注释。城市名须与 `assets/省市区数据.xlsx` 中 `city_name` 列一致。

### 2. 安装依赖

```bash
pip install DrissionPage pandas openpyxl tqdm
```

### 3. 运行

```bash
cd <skill目录>
python scripts/collect_jobs.py
```

脚本启动后：
1. 自动启动（或连接）Chrome 并跳转到 Boss 直聘
2. **人工完成登录**（脚本等待回车确认）
3. 若配置行业为"手动"，手动在浏览器选择行业后按回车
4. 脚本自动采集，结果保存至 `output/` 目录

### 4. 输出文件

| 文件 | 说明 |
|---|---|
| `output/<任务名>.xlsx` | Excel，供人工审阅 |
| `output/<任务名>.db` | SQLite，字段与 Excel 一一对应 |
| `output/all_jobs.db` | 汇总库，自动合并所有任务 `.db`，按 `详情页` 去重，含 `task_name` 字段 |

每次采集完成后，脚本自动将本次任务 `.db` 合并进 `all_jobs.db`。也可手动触发合并：

```bash
python scripts/merge_db.py
```

只处理新增或有更新的任务 `.db` 文件（通过 `all_jobs.db` 内的 `merged_files` 表追踪），已合并且未变动的文件会跳过。

## 断点续跑

重启脚本、输入同名任务名、选 N（不重新开始），脚本自动跳过已有岗位描述的条目，继续补全剩余详情。

## 关键技术说明

- **列表采集**：监听 XHR 接口 `wapi/zpgeek/search/joblist.json` 直接获取 JSON，不解析 HTML
- **详情采集**：XPath 定位各字段，见 `references/key-methods.md`
- **人类行为模拟**：正态分布随机等待、随机滚动、偶发上翻，避免固定节奏
- **浏览器**：通过 `ChromiumOptions().set_local_port(9113)` 自动启动或连接 Chrome，登录由人工完成

## 反风控要点

详见 `references/key-methods.md` 第 7 节。核心原则：
- 等待时间用正态分布随机（8~16s），非固定值
- 每个详情页访问前随机滚动模拟阅读
- `ChromiumOptions().set_local_port(9113)` 自动启动 Chrome，规避裸 `WebPage()` 的自动化指纹

## 参考文档

- **`references/key-methods.md`**：从三个已验证程序中提炼的关键方法，含 XPath、接口、反风控方案
- **`config/跑批设置模板.txt`**：配置参数说明
- **`assets/省市区数据.xlsx`**：城市名称 → city_code / district_code 映射表
