# po-pdf-spec-compare

把采购订单里的纸箱规格，和对应 PDF 图档里的规格做自动核对，并输出 Excel 报告。

这份文档是**使用说明**。

文档分工：
- `README.md`：怎么使用，怎么放文件，怎么执行
- `PRO.md`：项目目标、实现现状、优化点、边界与限制
- `RUNBOOK.md`：完整运行过程、关键代码逻辑、数据流转、LLM 调用与接收过程
- `ARCHITECTURE.md`：模块关系、调用关系、目录职责、数据流与控制流

如果你想看内部实现、脚本分工、性能优化、已知限制，请继续看 `PRO.md`、`RUNBOOK.md`、`ARCHITECTURE.md`。

---

# 目录

- [这个 skill 现在能做什么](#这个-skill-现在能做什么)
- [最适合什么场景](#最适合什么场景)
- [目录结构](#目录结构)
  - [输入目录](#输入目录)
  - [中间结果目录](#中间结果目录)
  - [输出目录](#输出目录)
  - [历史目录](#历史目录)
- [最常用的跑法](#最常用的跑法)
  - [跑法 1：用户给你一个压缩包](#跑法-1用户给你一个压缩包)
  - [跑法 2：用户直接给你 Excel + PDF](#跑法-2用户直接给你-excel--pdf)
- [每一步是干什么的](#每一步是干什么的)
  - [Step 1：`prepare.py`](#step-1preparepy)
  - [Step 2：`init_results.py`](#step-2init_resultspy)
  - [Step 3：`fill_results.py auto`](#step-3fill_resultspy-auto)
  - [Step 4：`validate_results.py`](#step-4validate_resultspy)
  - [Step 5：`write_report.py`](#step-5write_reportpy)
- [Part 1 是怎么做的](#part-1-是怎么做的)
- [Part 2 是怎么做的](#part-2-是怎么做的)
- [现在为什么比之前快了很多](#现在为什么比之前快了很多)
- [历史归档规则](#历史归档规则)
- [使用时最容易踩的坑](#使用时最容易踩的坑)
- [输出口径](#输出口径)
- [推荐实际使用流程](#推荐实际使用流程)

---

# 这个 skill 现在能做什么

现在已经能完成一整条闭环：

1. 接收一个压缩包，或者直接接收 1 份 Excel + 多份 PDF
2. 自动整理 `input/`
3. 自动提取 Excel 行数据
4. 自动匹配 PDF
5. 自动抽取 PDF 文本
6. 自动渲染 PDF 首页图片
7. 自动做 Part 1 文本比对
8. 自动做 Part 2 PDF 矢量展开图 / OCR / 视觉混合比对
9. 自动校验 `results.json`
10. 自动生成最终报告 `.xlsx`
11. 自动归档本次任务的 `input/` 和 `output/`

换句话说：
**现在已经不是半手工流程，而是能从“压缩包输入”直接跑到“报告输出”的完整流程。**

---

# 最适合什么场景

适合这种场景：

- 你有一份采购订单 Excel
- Excel 里每一行都有纸箱规格，例如 `49*6.5*31cm`
- 你同时拿到一批对应的纸箱 PDF 图档
- 你想知道：
  - Excel 规格和 PDF 图档规格是否一致
  - 哪些行有问题
  - 哪些行需要人工复核
  - 最后输出一份清楚的 Excel 报告

---

# 目录结构

## 输入目录

- `input/`
  - 本次任务的工作输入目录
  - 最终只保留本次任务需要的 Excel 和 PDF
  - **不保留压缩包本体**

## 中间结果目录

- `prepared/`
  - 中间结果目录
  - 主要文件：
    - `prepared/extraction.json`
    - `prepared/results.json`
    - `prepared/<seq>_<material_code>/page1.png`
    - `prepared/<seq>_<material_code>/page1_images.png`（PDF 第一页存在内嵌图片对象时生成，供 OCR 优先识别）
    - `prepared/latest_history_dir.txt`
    - `prepared/vision_probe_cache.json`

## 输出目录

- `output/`
  - 本次任务输出目录
  - 保存本次最新生成的报告
  - 开始新任务时会被清空

## 历史目录

- `history/<YYYYMMDDHHmmss>/`
  - 每次任务一个独立历史目录
  - 里面应该包含：
    - `input/`
    - `output/`
    - 原始压缩包（如果这次任务是从压缩包开始）

---

# 最常用的跑法

## 跑法 1：用户给你一个压缩包

把压缩包放到：

- `input/`

然后执行：

```bash
python3 scripts/prepare.py
python3 scripts/init_results.py prepared/extraction.json prepared/results.json
python3 scripts/fill_results.py auto --include-done
python3 scripts/validate_results.py prepared/results.json
python3 scripts/write_report.py prepared/results.json
```

这是标准完整流程。

---

## 跑法 2：用户直接给你 Excel + PDF

把：
- 1 份 `.xls` / `.XLS`
- 多份 `.pdf`

直接放进：

- `input/`

然后跑同样的命令：

```bash
python3 scripts/prepare.py
python3 scripts/init_results.py prepared/extraction.json prepared/results.json
python3 scripts/fill_results.py auto --include-done
python3 scripts/validate_results.py prepared/results.json
python3 scripts/write_report.py prepared/results.json
```

---

# 每一步是干什么的

## Step 1：`prepare.py`

命令：

```bash
python3 scripts/prepare.py
```

它负责：

- 开始新任务时清空 `prepared/` 和 `output/`
- 识别 `input/` 里的压缩包
- 把压缩包归档到 `history/<任务时间戳>/`
- 解压压缩包
- 整理输入，只保留本次要用的 Excel + PDF
- 把整理后的输入副本归档到 `history/<任务时间戳>/input/`
- 解析 Excel
- 匹配 PDF
- 抽取 PDF 文本
- 渲染 PDF 首页整页图片 `page1.png`
- 如 PDF 第一页存在内嵌图片对象，生成 `page1_images.png`
- 从 PDF 矢量文字坐标解析展开图尺寸链 `pdf_vector_layout`
- 生成 `prepared/extraction.json`
- 记录这次任务对应的历史目录到 `prepared/latest_history_dir.txt`

### 这一步的重要规则

#### 1）开始新任务就清空旧工作文件
现在代码已经按这个规则执行：

- 清空 `prepared/`
- 清空 `output/`

#### 2）`input/` 不保留压缩包本体
压缩包会被归档到 `history/<任务时间戳>/`

#### 3）发现多个 Excel 直接报错
不会自作主张挑一个继续跑。

---

## Step 2：`init_results.py`

命令：

```bash
python3 scripts/init_results.py prepared/extraction.json prepared/results.json
```

它负责：

- 根据 `prepared/extraction.json` 初始化 `prepared/results.json`
- 给后续 Part 1 / Part 2 回填准备结构

这一步很快，主要是模板初始化。

---

## Step 3：`fill_results.py auto`

命令：

```bash
python3 scripts/fill_results.py auto --include-done
```

这是整个流程最核心的一步。

它负责：

- 自动做 Part 1 文本判定
- 自动做 Part 2 PDF 矢量展开图 / OCR / 视觉混合判定
- 逐条把结果写回 `prepared/results.json`
- 每处理一条就立即落盘，避免中途失败时整批丢结果
- 打印每条记录的耗时与来源

输出示例大概像这样：

```text
seq=1 part1=一致 part2=一致 source=ocr-short-circuit dims=[490, 65, 310] elapsed=0.93s
```

这行信息非常有用，可以直接看出：

- 第几条
- 文本结论
- 图示结论
- 这条是走矢量展开图、OCR 短路，还是走视觉桥接
- 最终尺寸是多少
- 这条耗时多少秒

---

# Part 1 是怎么做的

Part 1 是**文本比对**。

输入主要来自：

- Excel 里的 `spec_text`
- PDF 文本里的尺寸信息

Part 1 会做这些事：

- 先把 Excel 规格转成整数 mm 三元组
- 再从 PDF 文本里找合适的尺寸三元组
- 优先找带标签的尺寸
- 排除无效尺寸
- 最后比较两边是否一致

## Part 1 会重点排除这些内容

- `MEAS`
- `MEASUREMENT`
- 历史旧值
- “由 X 改为 Y”里的旧值 `X`

## Part 1 可能的结论

- `一致`
- `一致(顺序不同)`
- `不一致`
- `PDF未找到尺寸`
- `Excel未找到尺寸`
- `异常`

---

# Part 2 是怎么做的

Part 2 是 **PDF 矢量展开图 + OCR + OpenClaw 视觉混合判定**。

它的目标不是只看 PDF 顶部文字，而是尽量读出纸箱展开图中标注的长宽高。

## 当前判定顺序

### 第一层：PDF 矢量展开图尺寸链

`prepare.py` 会先从 PDF 第一页的矢量文字坐标中解析 `pdf_vector_layout`。

典型展开图尺寸链包括：

```text
横向：40mm 52cm 36cm 52cm 36cm
纵向：18cm 46cm 18cm
```

解析规则：

- 横向最左侧小尺寸通常是糊口 / 搭边，例如 `40mm`，不作为纸箱规格。
- 横向重复的两个主尺寸作为长、宽，例如 `52cm` 和 `36cm`。
- 纵向如果是 `摇盖 + 高 + 摇盖`，取中间值作为高度，例如 `18cm 46cm 18cm` 取 `46cm`。
- 所有尺寸统一换算成整数 mm。

如果矢量展开图解析成功，Part 2 直接使用这个结果，不再 OCR，也不再调用视觉模型。

这时 `source` 会显示：

- `pdf-vector-layout`

示例：

```text
source=pdf-vector-layout dims=[520, 360, 460]
```

### 竖排 / 反向文字兼容

有些 PDF 的高度标注是竖着的，`pdfplumber` 可能读成不同形态。当前已兼容：

```text
mm053  -> 350mm
mm09   -> 90mm
1 8 c m -> 18cm
m c 8 1 -> 18cm
mc64   -> 46cm
```

也就是说，类似 `/Users/mac/Desktop/3.pdf`、`/Users/mac/Desktop/4.pdf` 这种竖排或反向竖排尺寸，也可以通过矢量解析得到展开图规格。

### 第二层：OCR

如果 `pdf_vector_layout` 没有稳定解析出三元组，才进入 OCR。

OCR 优先顺序：

1. `pdf_image_path2`：PDF 第一页内嵌图片对象区域，即 `page1_images.png`
2. `pdf_image_path`：PDF 第一页整页渲染图，即 `page1.png`

如果 OCR 已经抽到有效三元组，并且和 Excel 一致，就直接短路，不再继续走重的视觉流程。

这时 `source` 会显示：

- `ocr-short-circuit`

### 第三层：OpenClaw 图片理解

如果 OCR 没稳定命中，才会继续走：

```bash
openclaw infer image describe --json --file <image> --prompt <prompt>
```

必要时回退：

```bash
openclaw infer model run --json --file <image> --prompt <prompt>
```

默认不指定 `--model`，交给 OpenClaw 使用本机配置。只有设置环境变量时才覆盖模型：

```bash
PO_PDF_VISION_MODEL=<provider/model>
```

这时 `source` 可能显示：

- `openclaw-cli-vision-bridge`
- `ocr+vision-hybrid`
- `ocr-fallback`
- `vision-fallback`

## Part 2 可能的结论

- `一致`
- `一致(顺序不同)`
- `不一致`
- `图示无法识别`

如果 Part 1 文本一致，但 Part 2 从展开图读到不一致，最终报告会标红：

```text
冲突：文本一致 / 图示不一致
```

# 现在为什么比之前快了很多

之前 Part 2 慢，主要是因为：

- 每条都重复探测 OpenClaw 能力
- 每条都可能跑多张裁图
- 每条都可能重复走 `image describe`
- 有些成功结果没有被正确解包，导致明明识别成功，还继续跑后面的慢路径

现在已经做了优化：

## 已做的优化

### 1）OpenClaw 探测缓存
缓存到：

- `prepared/vision_probe_cache.json`

同一批任务里，不再每条重复 `model list` 和 auth probe。

### 2）矢量 / OCR 短路
如果 `pdf_vector_layout` 已稳定解析出展开图尺寸，直接结束；否则如果 OCR 已命中且与 Excel 一致，也直接结束。

### 3）减少 OCR / 视觉调用
矢量展开图解析成功时，不再 OCR / 调视觉模型；OCR 已命中时，也不再无脑把所有变体和视觉路径跑满。

### 4）wrapper JSON 解包
现在 `vision_row.py` 已经能正确解 OpenClaw 外层 wrapper，避免“明明成功了却当失败继续跑”。

---

# Step 4：`validate_results.py`

命令：

```bash
python3 scripts/validate_results.py prepared/results.json
```

它负责检查：

- `results.json` 结构是否合法
- `part1.verdict` 是否合法
- `part2.verdict` 是否合法
- 生成报告前的数据是否完整

如果这一步不过，后面的报告不应该继续出。

---

# Step 5：`write_report.py`

命令：

```bash
python3 scripts/write_report.py prepared/results.json
```

它负责：

- 生成 `output/<时间戳>.xlsx`
- 把报告归档到本次任务对应的 `history/<任务时间戳>/output/`
- 给报告做红底 / 黄底 / 正常结果分类

现在已经修正为：

- 会优先复用 `prepare.py` 记录下来的本次任务 history 目录
- 不会再乱开一个新的 history 时间戳目录

---

# 历史归档规则

现在的正确规则是：

每次任务对应一个：

- `history/<YYYYMMDDHHmmss>/`

里面应保留：

- `input/`
- `output/`
- 原始压缩包（如果有）

## 不该再出现的东西

- `input_staging`
- 其它临时目录

这些曾经出现过，但现在已经改掉了，不应该再出现在最终 history 目录里。

---

# 使用时最容易踩的坑

## 1）压缩包里有多个 Excel
现在会直接报错停下。

这是故意的。
因为多个 Excel 时，系统不能替你猜哪个才是主订单。

## 2）PDF 文件名没带物料编码
当前匹配规则主要还是：

- Excel 物料编码出现在 PDF 文件名里

如果文件名里没有物料编码，就容易匹配不到。

## 3）`part2` 慢，不一定是模型差
有时是：

- OCR 没命中
- 图上尺寸分散
- OpenClaw 返回 wrapper JSON
- 需要回退到更慢的视觉路径

## 4）报告是对比结果，不是自动修复结果
这个 skill 的职责是：

- 帮你发现一致 / 不一致 / 可疑项

不是：

- 自动替你修 Excel
- 自动替你改 PDF
- 自动替你决定谁一定对

---

# 输出口径

最终报告里你应该这样理解结果：

- `一致`：文本和图示都支持 Excel 规格
- `一致(顺序不同)`：三元组值相同，但顺序不同
- `不一致`：存在明确差异
- `图示无法识别`：矢量展开图、OCR、视觉路径都没能稳定确认
- 红底：问题更明显，需要优先看
- 黄底：有疑点，但不一定是实质错误

---

# 推荐实际使用流程

如果你只是想稳定跑一单任务，推荐直接这么做：

```bash
python3 scripts/prepare.py
python3 scripts/init_results.py prepared/extraction.json prepared/results.json
python3 scripts/fill_results.py auto --include-done
python3 scripts/validate_results.py prepared/results.json
python3 scripts/write_report.py prepared/results.json
```

就按这个顺序，不要乱跳。

---

# 这份 README 故意写得直白

因为这个 skill 已经从“设计中”走到了“能实际处理压缩包并出报告”的阶段，最需要的是：

- 说人话
- 讲清楚脚本职责
- 讲清楚怎么跑
- 讲清楚哪里快、哪里慢、哪里会翻车

如果你想看更偏维护、实现和性能分析的版本，请继续看：

- `PRO.md`
