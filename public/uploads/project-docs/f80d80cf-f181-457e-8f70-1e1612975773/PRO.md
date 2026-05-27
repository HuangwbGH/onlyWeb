# PO PDF 规格比对：PRO 技术说明

这份文档不是给第一次使用的人看的。

这份文档是给后续维护、继续开发、排查问题的人看的。尽量把这个 skill 现在到底做了什么、为什么这样做、慢点在哪里、已经修了什么、还有哪些边界，说清楚。

---

# 目录

- [1. 项目目标](#1-项目目标)
- [2. 当前完成状态](#2-当前完成状态)
- [3. 目录与核心文件分工](#3-目录与核心文件分工)
- [4. 实际数据流](#4-实际数据流)
- [5. 任务目录规则](#5-任务目录规则)
- [6. Part 1：文本尺寸比对说明](#6-part-1文本尺寸比对说明)
- [7. Part 2：PDF 矢量展开图 + OCR + 视觉混合链路说明](#7-part-2pdf-矢量展开图--ocr--视觉混合链路说明)
- [8. 为什么 Part 2 以前会慢](#8-为什么-part-2-以前会慢)
- [9. 已做的性能优化](#9-已做的性能优化)
- [10. 实测案例](#10-实测案例)
- [11. 已知限制](#11-已知限制)
- [12. 后续建议](#12-后续建议)
- [13. 一句话总结](#13-一句话总结)

---

# 1. 项目目标

这个 skill 的目标很明确：

> 输入一个压缩包，里面包含 1 份采购 Excel 和若干个对应 PDF 图档，自动完成“Excel 规格 vs PDF 规格”的比对，最后输出带颜色标记的 Excel 报告。

完整链路是：

1. 接收压缩包
2. 解压并整理输入文件
3. 从 Excel 提取采购规格
4. 从 PDF 提取文本、页面图像、内嵌图片对象区域、矢量展开图尺寸链
5. 初始化 `prepared/results.json`
6. 自动填充 Part 1（文本比对）
7. 自动填充 Part 2（图示尺寸比对，PDF 矢量展开图 + OCR + 视觉混合）
8. 校验结果结构
9. 生成最终报告
10. 将输入和输出归档到同一个 `history/<task>/` 目录

---

# 2. 当前完成状态

当前这条链路已经不是“半成品”，而是已经实际跑通过多轮测试。

已完成的关键能力：

- 能从压缩包开始跑完整流程
- 新任务开始时会清空 `prepared/` 和 `output/`
- 支持将本次任务归档到 `history/<YYYYMMDDHHmmss>/`
- 能自动初始化 `prepared/results.json`
- Part 1 已能自动比对 Excel 尺寸与 PDF 文本尺寸
- Part 2 已实现 **PDF 矢量展开图 + OCR + 视觉混合链路**
- 支持从 PDF 矢量文字坐标解析纸箱展开图尺寸链：
  - 横向如 `40mm 52cm 36cm 52cm 36cm`
  - 纵向如 `18cm 46cm 18cm`
  - 兼容竖排/反向文字，如 `mm053`、`mm09`、`1 8 c m`、`m c 8 1`
- 支持 OpenClaw 多模态调用：
  - `openclaw infer image describe`
  - 必要时回退 `openclaw infer model run`
- 已支持 OpenClaw wrapper JSON 自动解包
- `fill_results.py auto` 已支持逐条即时落盘
- `fill_results.py auto` 已支持打印每条耗时
- 已支持 `validate_results.py` 做结构校验
- 已支持 `write_report.py` 生成最终 Excel 报告并归档

---

# 3. 目录与核心文件分工

## 3.1 核心目录

- `input/`
  - 当前任务的工作输入目录
  - 只保留本次任务需要处理的 Excel / PDF
  - 不保留压缩包本体

- `prepared/`
  - 中间结果目录
  - 包含：
    - `extraction.json`
    - `results.json`
    - `latest_history_dir.txt`
    - `vision_probe_cache.json`
    - `prepared/<seq>_<material_code>/page1.png`
    - `prepared/<seq>_<material_code>/page1_images.png`（PDF 第一页有内嵌图片对象时）
    - `pdf_vector_layout`（写在 extraction/results 行内）

- `output/`
  - 当前任务最终报告输出目录
  - 新任务开始时会清空

- `history/<task>/`
  - 每次任务的归档目录
  - 正常情况下应包含：
    - `input/`
    - `output/`
    - 原始压缩包文件（如果本次输入来自压缩包）

## 3.2 核心脚本

### `scripts/prepare.py`
负责：

- 扫描输入压缩包
- 清理上一次任务的工作目录脏数据
- 解压压缩包
- 识别 Excel / PDF
- 检查 Excel 数量是否合法
- 将本次任务归档到 `history/<task>/`
- 提取 Excel / PDF 基础数据
- 渲染 PDF 第一页整页图 `page1.png`
- 提取 PDF 第一页内嵌图片对象区域 `page1_images.png`（如果存在）
- 解析 PDF 矢量展开图尺寸链 `pdf_vector_layout`
- 生成 `prepared/extraction.json`
- 写入 `prepared/latest_history_dir.txt`

### `scripts/init_results.py`
负责：

- 基于 `prepared/extraction.json`
- 初始化 `prepared/results.json`
- 为每一条记录创建 `part1` / `part2` 框架

### `scripts/fill_results.py`
负责：

- 作为 Step 2 的协调器
- 支持人工 / agent 半自动流程
- 支持自动流程：`auto` / `auto-row`
- 自动回填 Part 1
- 自动调用 `scripts/vision_row.py` 回填 Part 2
- 每处理一条就立即写回 `prepared/results.json`
- 打印每条记录耗时

### `scripts/vision_row.py`
负责：

- 对单条记录执行 Part 2 图示判定
- 优先使用 `pdf_vector_layout` 做展开图尺寸判定
- 矢量解析失败后，OCR 提取图中尺寸候选
- 必要时调用 OpenClaw 多模态能力进行图像理解
- 做 PDF 矢量展开图 + OCR + 视觉混合判定
- 输出业务 JSON 给 `fill_results.py`

### `scripts/validate_results.py`
负责：

- 检查 `prepared/results.json` 的结构是否合法
- 检查 `part1.verdict` / `part2.verdict` 是否在允许集合内
- 检查尺寸字段格式是否正确

### `scripts/write_report.py`
负责：

- 读取 `prepared/results.json`
- 按规则生成最终 Excel 报告
- 写到 `output/<timestamp>.xlsx`
- 并归档到当前任务的 `history/<task>/output/`

### `scripts/excel_io.py`
负责：

- Excel 读取
- 采购规格相关字段提取
- 基础结构化处理

### `scripts/pdf_io.py`
负责：

- PDF 文本提取
- PDF 页面图像生成 / 读取
- PDF 内嵌图片对象区域生成
- PDF 矢量展开图尺寸链解析
- 为后续 Part 1 / Part 2 提供基础输入

### `scripts/report_writer.py`
负责：

- 报告 Excel 的具体写入逻辑
- 颜色标记
- 表格格式输出

---

# 4. 实际数据流

这条 skill 的实际数据流是：

```text
压缩包
  ↓
prepare.py
  ↓
prepared/extraction.json
  ↓
init_results.py
  ↓
prepared/results.json
  ↓
fill_results.py auto
  ├─ Part 1 文本比对
  └─ Part 2 PDF 矢量展开图 + OCR + 视觉混合比对
  ↓
validate_results.py
  ↓
write_report.py
  ↓
output/<timestamp>.xlsx
  ↓
history/<task>/output/<timestamp>.xlsx
```

---

# 5. 任务目录规则

这是这条 skill 很容易出错的地方，单独写清楚。

## 5.1 新任务开始时清理规则

新任务开始时，`prepare.py` 会清空：

- `prepared/`
- `output/`

目的是避免把上一次任务的中间结果和报告混到这次任务里。

## 5.2 `input/` 规则

- `input/` 只保留当前任务需要处理的 Excel 和 PDF
- 原始压缩包不会留在 `input/`
- 如果压缩包里有多个 Excel，直接报错并停止，不会擅自选一个继续

## 5.3 `history/<task>/` 规则

每次任务都应该归档到一个独立目录，例如：

- `history/20260507175011/`

这个目录里正常应包含：

- `input/`
- `output/`
- 原始压缩包本体（如果有）

## 5.4 关于曾经出现过的 `input_staging`

之前修目录归档逻辑时，曾经出现过把临时目录也带进 `history/<task>/` 的情况，导致用户看到一个任务目录下出现两个 input 相关目录。

这个已经修掉了。

现在的原则是：

- 临时 staging 目录只允许存在于内部过程里
- 最终归档到 `history/<task>/` 的内容，只保留用户真正关心的 `input/` 和 `output/`

---

# 6. Part 1：文本尺寸比对说明

Part 1 的目标是：

> 从 Excel 和 PDF 文本里各自抽出尺寸三元组，然后比对两边是否一致。

## 6.1 Part 1 允许的 verdict

`fill_results.py` 中的 `PART1_ALLOWED`：

- `一致`
- `一致(顺序不同)`
- `不一致`
- `PDF未找到尺寸`
- `Excel未找到尺寸`
- `异常`

## 6.2 Excel 尺寸抽取

Excel 侧会先解析规格文本，例如：

- `400*90*350`
- `400×90×350`
- 带 `mm` / `cm` 的写法

内部正则会归一化为毫米三元组。

## 6.3 PDF 文本尺寸抽取

PDF 文本侧会从多个候选文本片段中抽尺寸。

这里不是简单粗暴地全文搜，而是会配合标签优先级和过滤规则。

### 标签优先级
当前 `LABEL_PRIORITY`：

- `纸箱制作尺寸`
- `制作尺寸`
- `外箱尺寸`
- `外箱大小`
- `纸箱尺寸`
- `纸箱大小`
- `成品尺寸`
- `成品大小`

如果文本中有明确标签，会优先使用高优先级标签附近的尺寸。

## 6.4 过滤规则

### 排除 `MEAS/MEASUREMENT`
当前 `MEAS_KEYWORDS`：

- `MEAS`
- `MEASUREMENT`

这些字段通常不是要拿来和采购规格比对的“制作尺寸”，容易把运输尺寸 / 成品外观尺寸 / 其它测量值误当成目标值，所以默认排除。

### 排除历史旧值 / 修改前值
当前 `HISTORY_KEYWORDS` 包括：

- `由`
- `原`
- `旧`
- `之前`
- `修改前`
- `old`
- `original`
- `previous`
- `was`

这类关键词出现时，通常意味着这段文本在描述历史尺寸，不应该被当成当前有效规格。

## 6.5 Part 1 判定结果

抽到两边尺寸后，会比较：

- 完全一致 → `一致`
- 三个值相同但顺序不同 → `一致(顺序不同)`
- 值不同 → `不一致`
- 一边没抽到 → `PDF未找到尺寸` / `Excel未找到尺寸`

---

# 7. Part 2：PDF 矢量展开图 + OCR + 视觉混合链路说明

Part 2 的目标是：

> 不只看 PDF 文本，而是看图纸页面本身，尽量从纸箱展开图里识别出尺寸三元组，再和 Excel 比较。

这是整个 skill 最复杂、也最容易慢的部分。当前 Part 2 已经不是单纯 OCR/LLM，而是先做确定性的 PDF 矢量解析，失败后再进入 OCR 与视觉模型。

## 7.1 Part 2 允许的 verdict

`fill_results.py` 中的 `PART2_ALLOWED`：

- `一致`
- `一致(顺序不同)`
- `不一致`
- `图示无法识别`

## 7.2 当前 Part 2 的实际执行顺序

真实顺序是：

```text
pdf_vector_layout
  → pdf_image_path2 OCR
  → pdf_image_path OCR
  → openclaw infer image describe
  → openclaw infer model run
  → OCR fallback / vision fallback
```

## 7.3 第一层：PDF 矢量展开图尺寸链

`prepare.py` 会调用 `pdf_io.extract_first_page_carton_layout_dims()`，从 PDF 第一页矢量文字坐标中解析 `pdf_vector_layout`。

典型尺寸链：

```text
横向：40mm 52cm 36cm 52cm 36cm
纵向：18cm 46cm 18cm
```

解析规则：

- 横向最左侧小尺寸通常是糊口 / 搭边，例如 `40mm`，不作为纸箱规格。
- 横向重复出现的两个主尺寸作为长、宽，例如 `52cm` 和 `36cm`。
- 纵向如果是 `摇盖 + 高 + 摇盖`，取中间值作为高度，例如 `18cm 46cm 18cm` 取 `46cm`。
- 所有尺寸统一换算成整数 mm。

如果 `pdf_vector_layout.diagram_dimensions_mm` 是稳定三元组，`vision_row.py` 会直接返回：

```json
{
  "diagram_dimensions_mm": [520, 360, 460],
  "verdict": "一致",
  "auto_source": "pdf-vector-layout",
  "needs_manual_review": false
}
```

这时不会再 OCR，也不会调用 OpenClaw 视觉模型。

## 7.4 竖排 / 反向文字兼容

有些 PDF 的高度标注是竖排或反向竖排，`pdfplumber` 抽出来的形态可能不是正常的 `350mm`。

当前已兼容：

```text
mm053    -> 350mm
mm09     -> 90mm
1 8 c m  -> 18cm
m c 8 1  -> 18cm
mc64     -> 46cm
```

这解决了 `/Users/mac/Desktop/3.pdf`、`/Users/mac/Desktop/4.pdf` 这类竖排/反向竖排尺寸标注。

## 7.5 第二层：OCR

只有当 `pdf_vector_layout` 没有稳定解析出三元组时，才进入 OCR。

OCR 输入优先级：

1. `pdf_image_path2`：PDF 第一页内嵌图片对象区域，即 `page1_images.png`
2. `pdf_image_path`：PDF 第一页整页渲染图，即 `page1.png`

如果 OCR 已经提取到有效三元组，并且和 Excel 规格判定为 `一致`，则直接短路返回：

- `auto_source = "ocr-short-circuit"`

## 7.6 第三层：OpenClaw 图像理解

如果矢量解析失败，OCR 也没稳定命中，才会进入视觉链路。

优先尝试：

```bash
openclaw infer image describe --file <image> --json --prompt <prompt>
```

如果必要，再回退：

```bash
openclaw infer model run --file <image> --json --prompt <prompt>
```

模型选择：

- 默认不传 `--model`，交给 OpenClaw 根据本机配置和图片理解路由选择模型。
- 如确实需要强制指定，可设置 `PO_PDF_VISION_MODEL=<provider/model>`；脚本才会追加 `--model`。

## 7.7 OpenClaw 探测缓存

早期版本有一个明显问题：

- 每一条记录都重新探测一次 `openclaw` 是否可用
- 每一条都重新测模型能力 / auth

这很浪费时间。

现在已改成：

- 探测结果缓存到 `prepared/vision_probe_cache.json`
- 同一批任务里后续记录直接复用

这样可以明显减少无意义的重复探测。

## 7.8 OpenClaw wrapper JSON 解包

这是之前造成慢问题的关键 bug 之一。

早期版本的问题是：

- OpenClaw 返回的是外层 wrapper JSON
- 真实业务 JSON 藏在 `outputs[].text` 里
- 代码没有正确解包
- 结果是“模型其实已经识别成功，但脚本以为没成功”

现在 `vision_row.py` 已经补了 wrapper JSON 解包逻辑：

- 能自动识别外层 wrapper
- 能自动从 `outputs[].text` 提取内部业务 JSON
- 一旦拿到有效三元组，就停止后续慢路径

## 7.9 裁图逻辑

如果矢量解析失败、OCR 没短路、整页视觉又没拿到稳定结果，才会进一步尝试裁图。

裁图一般包括：

- 整页图
- 中央主体区域
- 下半区域
- 右下区域

优化后原则是：

- 优先矢量解析
- 再优先 OCR
- 再优先整页视觉
- 必要时才追加裁图

## 7.10 Part 2 输出来源说明

当前常见 `auto_source`：

- `pdf-vector-layout`
  - PDF 矢量展开图尺寸链已稳定解析，最快也最确定。

- `ocr-short-circuit`
  - OCR 已命中并直接短路。

- `ocr+vision-hybrid`
  - OCR 和视觉混合后得到结果。

- `openclaw-cli-vision-bridge`
  - 主要由 OpenClaw 视觉链路给出结果。

- `ocr-fallback`
  - 视觉链路失败，但 OCR 有候选尺寸，降级采用 OCR，并标记需要人工复核。

- `vision-fallback`
  - 矢量、OCR、视觉都无法稳定识别时的工程化降级结构。

---

# 8. 为什么 Part 2 以前会慢

这一段很重要，因为后面继续优化时，基本都会回到这几个点。

## 8.1 以前慢的主要原因

### 原因 1：每条都重复探测 OpenClaw
每个 `seq` 都重新跑：

- CLI 存在性检查
- 模型能力探测
- auth probe

这是纯浪费。

### 原因 2：OCR 变体太多
早期会对同一张图跑多种预处理再 OCR：

- 原图
- 灰度图
- 自动增强图
- 二值图

虽然提高了命中率，但明显拖慢速度。

### 原因 3：裁图路径太保守
会尝试：

- 整页
- 多个局部 crop
- 每张都调一次模型

如果没有早停，很容易一条记录跑很多次模型调用。

### 原因 4：wrapper JSON 没解包
这点是最坑的。

模型明明已经返回成功结果，但代码没有认出来，于是继续把后面的慢路径都跑完。

---

# 9. 已做的性能优化

## 9.1 探测缓存
已增加：

- `prepared/vision_probe_cache.json`

效果：

- 整批任务只探测一次
- 后续记录直接复用

## 9.2 矢量解析 / OCR 短路优先
现在的原则是：

- 先解析 PDF 矢量展开图尺寸链
- 如果 `pdf_vector_layout` 已经得到稳定三元组，就直接返回，不再 OCR / 视觉调用
- 如果矢量解析失败，再 OCR
- 如果 OCR 已经抽到尺寸三元组，且和 Excel 判定 `一致`，也直接返回

这也是为什么很多记录现在可以在 1 秒内完成。

## 9.3 减少 OCR 无意义分支
现在不是所有 OCR 变体都默认跑满。

思路是：

- 先用最直接的 OCR 尝试
- 如果已经得到有效候选，就尽量早点停

## 9.4 减少视觉调用次数
优化后的原则是：

- 优先矢量解析
- 矢量成功就停
- 矢量失败再 OCR
- OCR / 整页视觉成功就停
- 只有整页不行才追加 crop
- 不再默认把所有分支跑满

## 9.5 wrapper JSON 解包
这是一个修复 bug 同时也提速的优化。

### 典型案例：`seq=11`
修复前：

- 总耗时：`52.58s`
- 结果：`图示无法识别`

原因：

- 实际 `image describe` 已成功
- 但 wrapper JSON 没解包
- 代码没识别到成功结果
- 继续跑了一整套慢路径

修复后：

- 总耗时：`12.11s`
- 结果：`一致`
- 尺寸：`[460, 155, 345]`

这条记录非常能说明：

> 很多时候“慢”并不是识别真的难，而是代码没有及时停下来。

## 9.6 批量 auto 逐条落盘
早期 `fill_results.py auto` 是整批处理完再统一保存。

问题是：

- 某条很慢或报错时，前面的结果可能还没真正落盘

现在已改成：

- 每处理一条，就立即写回 `prepared/results.json`

这提升的不是速度，而是稳定性。

## 9.7 每条耗时输出
现在跑：

```bash
python3 scripts/fill_results.py auto --include-done
```

会输出类似：

```text
seq=3 part1=一致 part2=一致 source=ocr-short-circuit dims=[435, 75, 235] elapsed=0.79s
```

这能让后续排查性能问题直接定位到具体哪一条慢。

---

# 10. 实测案例

## 10.1 测试压缩包

- `DF20260408008 鑫达盛 电商 交期05-16.rar`

## 10.2 修复后的整批测试结果

### 步骤耗时
- `prepare.py`：`6.58s`
- `init_results.py`：`0.03s`
- `fill_results.py auto`：约 `28.72s`
- `validate_results.py`：`0.031s`
- `write_report.py`：`0.186s`
- **总时间**：`35.549s`

### 结果统计
- 总数：`11`
- 一致：`11`
- 黄底：`0`
- 红底：`0`

### 输出文件
- `output/20260507175047.xlsx`
- `history/20260507175011/output/20260507175047.xlsx`

### 当前来源摘要
近期回归测试中，Part 2 来源大致为：

- 多数行：`pdf-vector-layout`，约 0.3s/行
- 部分行：`ocr-short-circuit`，约 0.9s/行
- 少数复杂行：`openclaw-cli-vision-bridge`，约 10~16s/行

具体数量会随输入 PDF 的矢量文字质量变化。

---

# 11. 已知限制

这部分必须诚实，不要写得像已经全解决了。

## 11.1 token usage 目前无法真实统计
用户明确要过：

- 每个步骤 token
- 总 token

但当前实际情况是：

- CLI / 脚本链路没有统一暴露 usage / token 字段
- 因此现在不能给真实 token 总数
- 只能诚实写：`未暴露 / 无法统计`

这不是文档问题，是链路里还没有统一把 usage 采出来。

## 11.2 PDF 匹配仍依赖文件名规则
当前 Excel 行和 PDF 的匹配，主要还是依赖物料编码 / 文件名特征。

如果 PDF 命名非常乱，匹配成功率会下降。

## 11.3 多 Excel 仍然直接报错停下
这是故意的，不是 bug。

因为用户已经明确要求：

- 如果发现多个 Excel，必须报错停下
- 不能擅自选一个继续

## 11.4 矢量解析 / OCR 并不是永远足够
当前已支持典型横向尺寸链、竖排尺寸、反向竖排尺寸。

但如果图纸结构非常规、尺寸标注被转成路径、或尺寸链不完整，`pdf_vector_layout` 可能为空；如果 OCR 也无法稳定命中，仍然需要视觉模型兜底。

## 11.5 同一任务内重复出报告，可能出现多个归档输出文件
跨任务时，`output/` 会在新任务开始时清空。

但同一任务里如果多次执行 `write_report.py`，历史归档下可能保留多个版本的输出文件，这是当前实现的真实行为。

如果后续要进一步收紧，可以再加“同任务只保留最新一个归档 output”的规则，但目前还没有这么做。

---

# 12. 后续建议

如果后面还要继续迭代，这几个方向最值得做：

## 12.1 usage / token 采集工程化
如果要满足“每一步 token、总 token”这个要求，后面要补：

- OpenClaw CLI 返回 usage 时，把 usage 结构写入结果 JSON
- `vision_row.py` / `fill_results.py` 汇总 usage
- 最后在报告或日志中统一输出 token 统计

## 12.2 更细粒度的视觉早停策略
虽然现在已经比之前快很多，但仍然可以继续优化：

- 如果整页已明确成功，就不再做 crop
- 如果 OCR 候选和视觉候选高度接近，可以直接确认
- 对明显高质量图纸减少无意义分支

## 12.3 更清晰的运行日志
目前已经有每条耗时输出。

后面还可以继续加：

- 每条记录具体走了哪些分支
- OCR 命中了哪些候选
- 为什么进入视觉
- 为什么进入 fallback

这样排障会更快。

---

# 13. 一句话总结

这个 skill 现在已经具备完整闭环：

- 能从压缩包开始
- 跑到最终报告
- Part 1 和 Part 2 都能自动处理
- Part 2 已不是空占位，而是真正的 **PDF 矢量展开图 + OCR + 视觉混合链路**
- 性能已经比早期版本明显改善

但也要保持清醒：

- token usage 统计还没真正接通
- 文件匹配与视觉识别仍然有边界
- 后续还可以继续优化速度和可观测性

这才是现在这条 skill 的真实状态。