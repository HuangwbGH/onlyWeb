---
name: po-pdf-spec-compare
description: Compare carton spec dimensions between a procurement Excel order (XLS) and corresponding PDF carton design files. Use when a user provides an `.xls`/`.XLS` purchase order plus multiple `.pdf` carton design files and asks to validate that purchase specs match what's printed in the PDFs. Trigger phrases include "核对采购订单与 PDF 规格"、"对比 Excel 物料规格与 PDF 图档"、"检查纸箱尺寸是否一致"、"采购规格核对"、"PO PDF 比对"、"Excel PDF 规格型号对比". The skill prepares structured data (Excel rows + PDF text + first-page images) for the agent to compare, then writes an xlsx report with red/yellow row coloring for mismatches and conflicts.
---

# PO-PDF Spec Compare

把采购订单（Excel）登记的纸箱规格型号，与对应 PDF 图档中的规格做自动核对。

这个 skill 采用 **三段式工作流**：
1. `scripts/prepare.py` 做确定性数据准备
2. `scripts/fill_results.py` 逐行做 **文本对比 + PDF 矢量展开图 / OCR / 视觉混合对比**，并把结果稳定写回 `prepared/results.json`
3. `scripts/write_report.py` 把对比结果写成最终 xlsx 报告

## 目录与关键文件

| 路径 | 用途 |
|---|---|
| `input/` | 本次任务的工作输入目录；代码会自动整理成只含 Excel + PDF |
| `prepared/extraction.json` | Step 1 产出的结构化中间结果 |
| `prepared/<seq>_<material_code>/page1.png` | 每条记录对应 PDF 首页渲染图 |
| `prepared/<seq>_<material_code>/page1_images.png` | 每条记录对应 PDF 第一页内嵌图片对象区域；无图片对象时不生成 |
| `prepared/results.json` | agent 完成 Part 1 / Part 2 后写回的结果 |
| `output/<YYYYMMDDHHmmss>.xlsx` | 本次最终报告，代码默认按当前时间到秒命名 |
| `history/<YYYYMMDDHHmmss>/...` | 历史归档；代码会保存原始压缩包、整理后的输入、输出结果 |
| `references/comparison_rules.md` | **必须先读**，包含尺寸取舍规则、判定口径、JSON Schema |
| `scripts/prepare.py` | Step 1：整理输入、解析 Excel / 匹配 PDF / 抽文本 / 渲染首页 PNG |
| `scripts/init_results.py` | Step 2 前置：基于 extraction.json 初始化可填写的 results.json 模板 |
| `scripts/fill_results.py` | Step 2 协调器：管理待处理行、提示下一条、自动回填、逐条落盘、打印每条耗时，并串联校验与生成报告 |
| `scripts/vision_row.py` | Part 2 接口脚本：对单条记录执行图示判定；优先使用 PDF 矢量展开图尺寸链，其次 OCR，再走 OpenClaw CLI 图片理解，失败时工程化降级到 OCR 或稳定失败结构 |
| `scripts/validate_results.py` | Step 2 后校验：检查 results.json 是否达到可生成报告的最低要求 |
| `scripts/write_report.py` | Step 3：根据结果 JSON 生成 xlsx 报告并归档 |
| `方案.md` | 设计说明；需要理解整体架构或为什么这样设计时再读 |

## 输入约定

把全部输入文件放到 `input/` 目录。

支持两种输入形态：
- 直接放 1 份 `.xls` / `.XLS` + 多份 `.pdf`
- 放 1 个压缩包，其中包含上述 Excel + PDF 文件

当前代码已支持的常见压缩格式包括：
- `.zip`
- `.7z`
- `.rar`
- `.tar`
- `.tar.gz` / `.tgz`
- `.tar.bz2` / `.tbz2`
- `.tar.xz` / `.txz`

Excel 期望在 sheet1 中包含这些表头：
- `序号`
- `物料编码`
- `规格型号`
- `存货代码`（用于提取型号代码，缺失时可能为空）

PDF 文件名应尽量包含 Excel 行里的 **物料编码**，脚本按“物料编码字符串是 PDF 文件名子串”进行匹配。

### 接收到压缩文件时的处理方式

这部分现在由代码负责，不需要人工手动搬运流程。

`scripts/prepare.py` 会自动：
1. 扫描 `input/` 下的受支持压缩包
2. 如果检测到新的压缩包输入，先清空 `prepared/` 与 `output/` 里的历史工作文件，避免串数据
3. 将原始压缩包归档到 `history/<YYYYMMDDHHmmss>/`
4. 把压缩包解压到临时整理区
5. 从解压结果中识别本次有效的 Excel + PDF
6. 重新整理 `input/`，使其中只保留本次处理需要的 Excel + PDF
7. 将整理后的工作输入副本归档到 `history/<YYYYMMDDHHmmss>/input/`

因此：
- `input/` **不保留压缩包本体**
- 原始输入压缩包留在 `history/<YYYYMMDDHHmmss>/`
- 整理后的工作输入也会留档，便于追溯

如果代码发现多个 Excel，会直接报错停止，而不是擅自选一个继续跑。

## 标准执行流程

### Step 0：先读规则

先读：`references/comparison_rules.md`

不要跳过。这个文件定义了：
- 尺寸单位换算口径
- 顺序不同何时算一致
- PDF 内多组三元组时该取哪组
- 哪些 MEAS / 历史变更值必须排除
- Part 1 / Part 2 的合法 `verdict` 取值
- 最终报告的综合判定矩阵

### Step 1：准备数据

在 skill 根目录执行：

```bash
python3 scripts/prepare.py
```

脚本会：
- 自动整理 `input/`（包括压缩包归档、解压、筛出有效 Excel + PDF）
- 提取每行 `seq / material_code / model_code / spec_text`
- 按文件名子串规则匹配 PDF
- 抽取 PDF 全文文本
- 把 PDF 首页渲染成 PNG
- 尝试提取 PDF 第一页内嵌图片对象区域 `page1_images.png`
- 尝试从 PDF 矢量文字坐标解析纸箱展开图尺寸链 `pdf_vector_layout`
- 写出 `prepared/extraction.json`

如果用户给的是压缩包，直接放到 `input/` 即可，`prepare.py` 会自己处理。

### Step 2：agent 逐行对比

先执行：

```bash
python3 scripts/init_results.py prepared/extraction.json prepared/results.json
python3 scripts/fill_results.py status
python3 scripts/fill_results.py next
```

这一步会先生成一个结构完整、可回填的 `prepared/results.json` 模板；然后用协调器查看进度、提示下一条待处理记录。

随后读取 `prepared/results.json`（其内容基于 `prepared/extraction.json` 初始化）。

对每条记录：
- 如果 `match_status != "ok"`，不要硬做 Part 1 / Part 2，直接保留该状态给报告阶段处理
- 如果 `match_status == "ok"`，做下面两部分

#### Part 1：文本对比

输入：
- `spec_text`
- `material_code`
- `pdf_filename`
- `pdf_text`

按 `references/comparison_rules.md` 规则输出 `part1`：

```json
{
  "filename_contains_material_code": true,
  "excel_dimensions_mm": [490, 65, 310],
  "pdf_dimensions_mm": [490, 65, 310],
  "pdf_label_used": "外箱尺寸",
  "pdf_other_dimensions_mm": [[480, 65, 310]],
  "verdict": "一致",
  "reasoning": "..."
}
```

重点要求：
- 先把 Excel 规格解析成 **整数 mm 三元组**
- 优先找带标签的采购规格尺寸
- 必须排除 `MEAS` / `MEASUREMENT`
- 必须排除“由 X 改为 Y”中的旧值 `X`
- 严格相等，0 容差
- 三个值相同但顺序不同，判 `一致(顺序不同)`
- `reasoning` 简短，聚焦证据，不要写成长篇分析

#### Part 2：PDF 矢量展开图 + OCR + 视觉混合对比

输入：
- `spec_text`
- `pdf_image_path` 对应的 `page1.png`
- `pdf_image_path2` 对应的 `page1_images.png`（如果 PDF 第一页存在内嵌图片对象，OCR 优先识别它；否则回退 `pdf_image_path`）
- `pdf_vector_layout`（如果能从 PDF 矢量文字坐标解析出展开图尺寸链，Part 2 优先使用它）

优先使用 PDF 矢量文字坐标解析展开图尺寸链；解析失败时再读取图片做 OCR + 视觉混合判断，输出 `part2`：

```json
{
  "diagram_dimensions_mm": [490, 65, 310],
  "verdict": "一致",
  "reasoning": "..."
}
```

重点要求：
- 第一优先级是 `pdf_vector_layout`：从 PDF 矢量文字坐标中识别展开图尺寸链，例如横向 `40mm 45cm 29cm 45cm 29cm`、纵向 `14.5cm 44cm 14.5cm`，去掉糊口/摇盖后得到长宽高。
- 如果 `pdf_vector_layout.diagram_dimensions_mm` 是稳定三元组，Part 2 直接使用它，`auto_source = "pdf-vector-layout"`。
- 对竖排/反向尺寸文字，矢量解析会兼容 `pdfplumber` 常见输出形态，例如 `mm053`→`350mm`、`mm09`→`90mm`、逐字竖排 `1 8 c m`→`18cm`、反向逐字 `m c 8 1`→`18cm`。
- 矢量解析失败后再 OCR；OCR 优先识别 `pdf_image_path2`（PDF 内嵌图片对象区域），不存在时识别 `pdf_image_path`（整页渲染图）。
- 若 OCR 已命中且与 Excel 一致，可短路返回 `auto_source = "ocr-short-circuit"`。
- 若 OCR 未稳定命中，再看图识别图示里明确标注的长宽高，优先 `openclaw infer image describe`，必要时回退 `openclaw infer model run`。
- 默认不指定 `--model`，交给 OpenClaw 使用本机配置；只有设置 `PO_PDF_VISION_MODEL=<provider/model>` 时才作为模型 override。
- OCR 文本仅作为辅助定位，不能压过图片本身。
- 接受 `mm` 或 `cm`，统一换算成整数 mm。
- 同样排除 `MEAS` 与历史旧值。
- 当视觉链路失败但 OCR 可提取出候选三元组时，可降级输出 OCR 结果，并标记 `needs_manual_review = true`。
- 当矢量解析、OCR 与视觉都无法稳定确认时，判 `图示无法识别`。

### Step 2.5：写回 results.json

把所有行结果写回 `prepared/results.json`。

推荐结构：保留 `extraction.json` 原字段，并在 `match_status == "ok"` 的行上补全 `part1` 与 `part2` 字段。

写完后执行校验：

```bash
python3 scripts/validate_results.py prepared/results.json
```

或者直接通过协调器执行：

```bash
python3 scripts/fill_results.py validate
python3 scripts/fill_results.py report
```

其中：
- `fill_results.py validate` 会调用校验脚本
- `fill_results.py report` 会先校验，通过后再生成最终报告
- `fill_results.py auto` 会自动回填 Part 1，并通过 `vision_row.py` 执行 Part 2 的 PDF 矢量展开图 / OCR / 视觉混合判定
- 批量 `auto` 模式会按行即时落盘，避免长耗时视觉/OCR过程中途失败时整批结果丢失
- `fill_results.py auto` 会打印每条记录的 `seq / part1 / part2 / source / dims / elapsed`，方便定位慢点与异常条目

只有校验通过，才进入 Step 3 生成最终报告。

示意：

```json
{
  "rows": [
    {
      "seq": "1",
      "material_code": "9101019715",
      "model_code": "DCC1800265L1",
      "spec_text": "49*6.5*31cm",
      "match_status": "ok",
      "pdf_filename": "DCC1800265L1 黑色 纸箱 9101019715.pdf",
      "pdf_path": "input/...",
      "pdf_text": "...",
      "pdf_image_path": "prepared/1_9101019715/page1.png",
      "pdf_image_path2": "prepared/1_9101019715/page1_images.png",
      "pdf_vector_layout": {
        "diagram_dimensions_mm": [490, 65, 310],
        "reasoning": "矢量展开图尺寸链：横向 40mm、490mm、65mm、490mm、65mm；纵向 65mm、310mm、65mm；解析为 490×65×310mm"
      },
      "part1": {"...": "..."},
      "part2": {"...": "..."}
    }
  ],
  "unmatched_pdfs": []
}
```

### Step 3：生成报告

默认执行：

```bash
python3 scripts/write_report.py prepared/results.json
```

脚本会自动：
- 生成 `output/<YYYYMMDDHHmmss>.xlsx`
- 文件名精确到秒，例如 `20260507092715.xlsx`
- 应用综合判定矩阵
- 写 14 列结果
- 对红底 / 黄底做着色
- 将输出副本归档到 `history/<YYYYMMDDHHmmss>/output/`

如果确实有需要，也可以显式传第二个参数覆盖输出路径；但默认推荐直接让脚本自动命名。

## 判定口径摘要

完整规则以 `references/comparison_rules.md` 为准；这里只保留最重要的执行提醒：

- **严格相等**：0 容差
- **统一换算到整数 mm** 后再比较
- **顺序不同算一致**
- PDF 中优先取以下标签附近的三元组：
  - `纸箱制作尺寸 / 制作尺寸`
  - `外箱尺寸 / 外箱大小`
  - `纸箱尺寸 / 纸箱大小`
  - `成品尺寸 / 成品大小`
- 必须排除：
  - `MEAS / MEASUREMENT`
  - 历史变更中的旧值

## 结果写作要求

当你在 Step 2 产出 `part1` / `part2` 时：
- 使用规则文件里定义的合法 `verdict`
- `reasoning` 只写证据链，不写泛泛解释
- `reasoning` 尽量控制在 200 字内，便于后续进报告
- 找不到尺寸时明确写清是“Excel 未找到”“PDF 未找到”还是“图示无法识别”

## 压缩包场景的额外约束

昨天的实际使用里，这个 skill 遇到过“用户直接给压缩包”的情况。现在规则已经下放到代码：

- 不假设压缩包解压后就是平铺结构
- 不假设压缩包里只有 1 个 Excel
- `prepare.py` 会在真正解析前先整理输入，并在收到新的压缩包时清理 `prepared/`、`output/` 旧数据
- `fill_results.py auto` 现已具备自动模式；Part 2 通过 `vision_row.py` 先用 `pdf_vector_layout` 做 PDF 矢量展开图尺寸链判定，成功则返回 `pdf-vector-layout`
- 若矢量解析未稳定命中，再尝试 OCR；OCR 优先 `pdf_image_path2`，再回退整页 `pdf_image_path`；若 OCR 已命中且与 Excel 一致，则返回 `ocr-short-circuit`
- 若 OCR 未稳定命中，再尝试 OpenClaw CLI 图片理解，优先 `openclaw infer image describe`，必要时回退 `openclaw infer model run`，再不行则降级到 OCR 或稳定失败结构，而不是留空
- `vision_row.py` 会缓存 OpenClaw 能力探测结果，避免每条记录重复做 `model list` / auth probe
- `fill_results.py` 兼容 `vision_row.py` 直接返回业务 JSON，以及 OpenClaw CLI 外层 wrapper JSON（会自动解包 `outputs[].text` 中的业务 JSON）
- `input/` 中不保留压缩包本体
- 原始压缩包归档到 `history/<YYYYMMDDHHmmss>/`
- 当压缩包里混有无关文件时，代码只提取本次核对需要的 Excel 和 PDF
- 如果发现多个 Excel，代码直接报错，避免误选
- `prepare.py` 已支持 `.zip`、`.7z`、`.rar`、`.tar`、`.tar.gz/.tgz`、`.tar.bz2/.tbz2`、`.tar.xz/.txz`
- 对 `.gz/.bz2/.xz` 这类单文件压缩，当前不会直接当“资料包”处理；若遇到这种情况，需要先转成常规归档包
- `write_report.py` 默认按当前时间到秒命名输出，例如 `20260507092715.xlsx`
- 本次输入与输出处理完成后都会归档到 `history/<YYYYMMDDHHmmss>/`

推荐使用方式：
**把压缩包丢进 input → 跑 prepare.py → agent 写 results.json → 跑 write_report.py**

## 常见异常处理

### 1. 压缩包解压后结构混乱
- 先识别本次要用的 Excel 和 PDF
- 必要时整理到一个清晰子目录或 `input/` 根目录
- 不要带着一堆无关文件直接进入比对

### 2. 压缩包内出现多个 Excel
- 不要默认选第一个
- 先看文件名、修改时间、sheet1 表头是否符合采购订单格式
- 仍无法确认时，停下来问用户

### 3. 历史归档目录不存在
- 先创建 `history/<YYYYMMDDHHmmss>/`
- 再保存原始压缩包与本次输出
- 不要把历史文件散落在 `input/` 或 `output/`

### 4. `match_status = "缺 PDF"`
说明没有任何 PDF 文件名命中该物料编码。
- 不做 Part 1 / Part 2
- 保留给 Step 3 自动输出红底

### 5. `match_status = "PDF 重复"`
说明同一物料编码命中了多个 PDF。
- 不要擅自挑一个继续比对
- 先让报告标红，必要时再人工复核 `pdf_candidates`

### 6. `Excel 物料编码为空`
- 视为输入异常
- 不做 Part 1 / Part 2

### 7. Excel 规格解析失败
- Part 1 输出 `Excel未找到尺寸`
- Part 2 仍可尝试基于图示判断，但不要伪造 Excel 三元组

### 8. PDF 文本找不到有效尺寸，但图示能看出来
- Part 1 输出 `PDF未找到尺寸`
- Part 2 正常给出图示结论
- 报告阶段会自动落到黄底的“文本未找到但图示一致”或其它异常组合

### 9. 文本与视觉冲突
- 不要自行调和
- 保持两路判断原样写入
- 让 `write_report.py` 输出红底冲突结果

## 实操建议

- 先跑 `prepare.py`，确认 `prepared/extraction.json`、`page1.png`、以及可选的 `pdf_vector_layout` / `page1_images.png` 生成情况，再开始逐行判断
- 行数多时，按 `rows` 顺序稳定处理，避免漏行
- 看图前先看 `spec_text`，有助于聚焦目标尺寸
- 文本里如果有多组三元组，优先按标签与上下文判断，不要见到第一个数字组就下结论
- 如果需要理解整体设计权衡，再读 `方案.md`；通常执行任务时不需要先读它

## 这个 skill 的边界

这个 skill 用来做 **纸箱采购规格 vs PDF 图档规格** 的核对，不负责：
- 修改原 Excel / PDF 内容
- 自动修复错误规格
- 绘制新的纸箱图档
- 替用户决定冲突时哪一方一定正确

它的职责是：
- 把可比对的数据准备好
- 让 agent 做双路判断
- 把异常显式暴露到报告里，方便人工复核
