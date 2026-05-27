# PO PDF 规格比对 Skill 运行全过程说明

这份文档专门讲 **这个 skill 从开始到结束到底怎么跑**。

它不是简单的使用说明，也不是只讲结论的技术文档。
它重点解释：

- 整体运行逻辑
- 各脚本和功能模块怎么分工
- 关键代码为什么这样写
- 数据在各阶段怎么流转
- Part 2 调用 LLM 的完整过程
- 脚本怎么接收 LLM 返回结果
- 失败时怎么降级，为什么这样降级

如果你只是想知道怎么用，先看 `README.md`。
如果你想看项目目标、规则、现状与边界，再看 `PRO.md`。
如果你要维护这个 skill、继续开发、排查链路问题，这份文档最适合。

---

# 1. 先说整体架构

这个 skill 不是一个“大脚本一把梭”，而是拆成了几段职责清晰的流水线：

1. `scripts/prepare.py`
   - 接收输入
   - 整理压缩包 / Excel / PDF
   - 提取 Excel 行数据
   - 匹配 PDF
   - 抽取 PDF 文本
   - 渲染 PDF 首页图片
   - 产出 `prepared/extraction.json`

2. `scripts/init_results.py`
   - 基于 `extraction.json` 生成结构完整的 `prepared/results.json`
   - 给 Step 2 自动/人工填写结果做统一模板

3. `scripts/fill_results.py`
   - 这是 Step 2 的协调器
   - 负责进度查看、下一条提示、自动填充、校验、出报告串联
   - Part 1 在这里直接做
   - Part 2 在这里调用 `vision_row.py`

4. `scripts/vision_row.py`
   - 这是 Part 2 的单条视觉/OCR判定执行器
   - 负责 OCR
   - 负责探测 OpenClaw 多模态链路是否可用
   - 负责真正调用 LLM 看图
   - 负责解析 LLM 返回 JSON
   - 负责失败时降级

5. `scripts/validate_results.py`
   - 检查 `results.json` 是否达到最低出报告要求

6. `scripts/write_report.py`
   - 把 `results.json` 转成最终 `xlsx`
   - 输出到 `output/`
   - 并归档到 `history/<task>/output/`

所以这个项目的核心思想很明确：

**确定性的事情，尽量用代码做死；不确定的图像理解，再交给 OCR + LLM。**

这样做的好处是：
- 稳定
- 可排错
- 可追溯
- LLM 只负责它真正擅长但又不稳定的那一小段

---

# 2. 一次完整运行到底发生了什么

一轮完整任务，推荐执行顺序是：

```bash
python3 scripts/prepare.py
python3 scripts/init_results.py prepared/extraction.json prepared/results.json
python3 scripts/fill_results.py auto
python3 scripts/fill_results.py validate
python3 scripts/fill_results.py report
```

也可以理解成下面这条数据链：

```text
压缩包 / Excel+PDF
    ↓
input/
    ↓ prepare.py
prepared/extraction.json + page1.png
    ↓ init_results.py
prepared/results.json（空模板）
    ↓ fill_results.py
Part 1 文本结果 + Part 2 视觉结果 回填到 results.json
    ↓ validate_results.py
结构校验通过
    ↓ write_report.py
output/<timestamp>.xlsx
    ↓
history/<task>/input + output 归档
```

这条链里，最关键的中间文件其实只有两个：

- `prepared/extraction.json`
- `prepared/results.json`

前者是“准备好的原始证据和结构化素材”，后者是“已经做出判断的结果文件”。

---

# 3. Step 1：prepare.py 在做什么

`prepare.py` 的定位是：**只做确定性准备，不做任何语义判定。**

它顶部文档字符串已经写得很明确：

- 整理输入
- 解析 Excel
- 匹配 PDF
- 抽全文
- 渲染第一页 PNG
- 输出 `prepared/extraction.json`

也就是说，这一步不负责判断“一致/不一致”，只负责把后续判断需要的材料准备好。

## 3.1 为什么要把 prepare 单独拆出来

因为这一步本质是工程问题，不是理解问题。

例如：
- 找压缩包
- 解压
- 清理旧文件
- 检查 Excel 数量
- 把 PDF 渲染成图片
- 提取 PDF 文本

这些都不该让 LLM 参与。

如果把这些混在“判断逻辑”里，会带来几个坏处：
- 一出错很难定位
- 每次重跑代价很大
- 中间证据难保留
- 后续调试 Part 1 / Part 2 时会反复重复准备工作

现在拆开后，调试效率会高很多。

## 3.2 prepare.py 的关键职责

### （1）识别新任务

当 `input/` 里发现新的压缩包时，它会把这次任务当成一个新任务来处理。

这里有几个明确规则：
- 清空 `prepared/`
- 清空 `output/`
- 清理 `input/` 里的旧工作 Excel/PDF
- 但 **不动 `history/`**

这就是为什么用户连续做两个任务时，不会把上一个任务的脏数据带进来。

### （2）处理压缩包

它支持：
- `.zip`
- `.7z`
- `.rar`
- `.tar`
- `.tar.gz/.tgz`
- `.tar.bz2/.tbz2`
- `.tar.xz/.txz`

但不直接接受单文件压缩格式 `.gz/.bz2/.xz` 作为资料包。

这样设计不是偷懒，而是为了避免歧义：
单文件压缩只能解出一个文件，不适合“1个 Excel + 多个 PDF”的任务模型。

### （3）归档输入

prepare 会生成 `history/<YYYYMMDDHHmmss>/`。

这里要求很严格：
- 历史目录必须包含 `input/`
- 最终生成报告后要有 `output/`
- 不能在 history 里暴露 `input_staging` 这种临时目录
- 不能出现两个 input 相关目录

也就是说，history 是给人追查任务链路看的，不是把内部脏目录直接丢进去。

### （4）检查 Excel 数量

如果发现多个 Excel，直接报错停下。

这点非常重要。

这里故意不做“智能选择第一个 Excel”，因为那种行为太危险：
- 可能选错单据
- 错了还不容易发现
- 最终报告会带着假正确感

这个 skill 在这里选的是保守路线：
**宁可停，不要偷偷继续。**

### （5）结构化提取

prepare 会把 Excel 每一行提成统一结构，并为每一行匹配 PDF、抽 PDF 全文、渲染首页图。

最后落到 `prepared/extraction.json`。

这个文件是整个 skill 的“原始事实层”。

---

# 4. extraction.json 长什么样，为什么它重要

`prepared/extraction.json` 是后续所有判断的输入基础。

每条记录通常会包含这些信息：

```json
{
  "seq": "1",
  "material_code": "9101019715",
  "model_code": "DCC1800265L1",
  "spec_text": "49*6.5*31cm",
  "match_status": "ok",
  "pdf_filename": "DCC1800265L1 黑色 纸箱 9101019715.pdf",
  "pdf_path": "input/...pdf",
  "pdf_text": "...",
  "pdf_image_path": "prepared/1_9101019715/page1.png",
  "pdf_image_path2": "prepared/1_9101019715/page1_images.png",
  "pdf_vector_layout": {
    "diagram_dimensions_mm": [450, 290, 440],
    "reasoning": "矢量展开图尺寸链..."
  }
}
```

关键字段的作用：

- `seq`：原 Excel 行序号，用来定位
- `material_code`：物料编码，是 PDF 匹配的主键之一
- `model_code`：型号代码，给人工复核时看
- `spec_text`：Excel 原始规格文本，Part 1 和 Part 2 都会用
- `match_status`：这条记录当前能不能进入对比流程
- `pdf_text`：Part 1 的主输入
- `pdf_image_path`：Part 2 的主输入
- `pdf_image_path2`：PDF 第一页内嵌图片对象区域；存在时 Part 2 OCR 优先识别它，不存在时回退 `pdf_image_path`
- `pdf_vector_layout`：PDF 第一页矢量展开图尺寸链解析结果；存在稳定三元组时 Part 2 优先使用它

为什么要把 `pdf_text` 和 `page1.png` 都提前准备好？

因为 Part 1 和 Part 2 其实是两条独立证据链：

- Part 1 看 **文本层证据**
- Part 2 看 **图像层证据**

只有把这两条链拆开，后面报告里才能看出：
- 是文本错了
- 还是图示错了
- 还是两边都对不上
- 还是其中一边压根提不到

---

# 5. Step 1.5：init_results.py 为什么存在

`init_results.py` 乍看很简单，但它很关键。

它的作用不是计算，而是 **把结果结构先钉死**。

## 5.1 它做了什么

它从 `extraction.json` 读取每一条记录，然后：

- 对 `match_status != ok` 的行，保留原始状态
- 对 `match_status == ok` 的行，补出空白的 `part1` 和 `part2` 模板

它内部直接定义了两个模板：

### Part 1 模板

```python
PART1_TEMPLATE = {
    "filename_contains_material_code": None,
    "excel_dimensions_mm": [],
    "pdf_dimensions_mm": [],
    "pdf_label_used": "",
    "pdf_other_dimensions_mm": [],
    "verdict": "",
    "reasoning": "",
}
```

### Part 2 模板

它会给图示判断也准备一个空结构。

## 5.2 为什么不能跳过这一步

因为如果不先统一结构，后面会有这些问题：
- 自动填充和人工填充字段可能不一致
- 某些行缺字段，校验和报表都容易炸
- 后续脚本要写一堆 if/else 兼容“缺字段”场景

所以 `init_results.py` 干的事情很朴素，但价值很大：

**先把 JSON 契约定死，后面所有脚本都按这个契约读写。**

---

# 6. Step 2 的核心：fill_results.py 是总协调器

`fill_results.py` 是整个项目真正的“中枢”。

它不只是一个填表脚本，而是负责：

- 看当前进度：`status`
- 提示下一条：`next`
- 标记完成：`done`
- 调校验脚本：`validate`
- 调出报告脚本：`report`
- 做批量自动判定：`auto`
- 做单条自动判定：`auto-row`

也就是说，Step 2 的几乎所有动作，都从这里进。

## 6.1 为什么要有这个协调器

因为 Part 1 和 Part 2 的执行代价不一样：
- Part 1 快、确定性高
- Part 2 慢、依赖 OCR / LLM / 外部桥接

如果没有协调器，用户要自己手动拼命令，链路就会散。

现在统一后：
- 进度可看
- 失败可追
- 逐行落盘
- 校验、出报告都能串起来

这也是后面稳定性的关键。

---

# 7. fill_results.py 的关键代码逻辑

## 7.1 `is_done()`：什么叫一条记录完成了

代码里定义得很直接：

```python
def is_done(row: dict) -> bool:
    if row.get("match_status") != "ok":
        return True
    p1 = row.get("part1") or {}
    p2 = row.get("part2") or {}
    return bool(p1.get("verdict")) and bool(p2.get("verdict"))
```

意思是：
- 只要不是 `ok` 行，就算流程上“完成”了，因为它不需要做比对
- 只有 `ok` 行才要求 Part 1 和 Part 2 都填完 verdict

这个定义很实用。

因为业务上，“缺 PDF”“PDF 重复”这些行不是没处理，而是已经得到明确状态了。

## 7.2 `build_part1()`：文本判定在这里完成

这是 Part 1 的主函数。

它做的事情分四步：

1. 解析 Excel 规格 `spec_text`
2. 从 `pdf_text` 中提取候选三元组
3. 给候选打分并选最优项
4. 和 Excel 三元组比较，生成 verdict

### Excel 规格怎么解析

代码用 `_parse_excel_dims()`：

```python
def _parse_excel_dims(spec_text: str) -> tuple[list[int], str | None]:
    triples = _parse_triples(spec_text or "", default_unit="cm")
```

这里有一个关键点：

**Excel 默认按 cm 解释。**

例如 `49*6.5*31cm` 会被统一转成 `[490, 65, 310]`。

最后比较时，全部都在 **整数 mm** 上完成。

这让后面比较规则非常清楚：
- 不搞浮点容差
- 不搞字符串比较
- 全部收敛到整数毫米三元组

### PDF 文本候选怎么提取

代码里有一个专门函数：`_extract_pdf_candidates()`。

这个函数会：
- 按行扫描 `pdf_text`
- 跳过包含 `MEAS` / `MEASUREMENT` 的行
- 找优先标签，比如 `纸箱制作尺寸`、`外箱尺寸` 等
- 特别处理“改为”这种变更语义，只取新值尾部三元组

这一步体现了这个项目最关键的一点：

**不是见到数字就拿，而是要带上下文筛选。**

如果没有这层规则，PDF 里一堆历史尺寸、MEAS 尺寸、测量尺寸都会混进来，误判会非常多。

### 候选怎么选最优

它不是简单取第一个，而是通过 `_candidate_score()` 打分。

核心分数来源：
- 有优先标签，加高分
- 有“改为”“变更”语义，再加分
- 三个值都不同，略加分

最后排序选第一项作为 `chosen`。

这套方法不是完美语义理解，但它足够稳定，而且可解释。

### 最终怎么产出 Part 1

`build_part1()` 最后会返回标准结构，例如：

```json
{
  "filename_contains_material_code": true,
  "excel_dimensions_mm": [490, 65, 310],
  "pdf_dimensions_mm": [490, 65, 310],
  "pdf_label_used": "外箱尺寸",
  "pdf_other_dimensions_mm": [[480, 65, 310]],
  "verdict": "一致",
  "reasoning": "Excel 490×65×310mm；PDF 第12行“外箱尺寸”提取 490×65×310mm",
  "auto_source": "rule-based-text"
}
```

也就是：
- 主结论
- 用了哪组 PDF 尺寸
- 其它候选是什么
- 证据说明是什么

这让后续人工追查时，不需要重新读整份 PDF 文本。

---

# 8. Part 1 为什么不交给 LLM

这点我建议在维护时始终坚持。

Part 1 天然适合规则化：
- 输入是文本
- 规则是确定的
- 标签优先级明确
- 比较口径固定

如果把这段交给 LLM：
- 成本更高
- 不稳定
- 难复盘
- 不好做批量一致性

所以现在这个项目的路线是对的：

**文本侧尽量规则化，图像侧再引入视觉模型。**

---

# 9. Step 2 的另一半：Part 2 为什么拆成 vision_row.py

Part 2 比 Part 1 复杂得多。

因为图示尺寸识别涉及：
- OCR 能不能抽到字
- OCR 抽到的字是不是对的
- 图里多个数字哪组三元组才是目标尺寸
- OpenClaw CLI 是否可用
- 模型是否支持图片
- 当前环境是否有认证
- LLM 返回的是不是合法 JSON

这些东西如果全部塞进 `fill_results.py`，脚本会迅速失控。

所以现在拆成：
- `fill_results.py` 负责总调度
- `vision_row.py` 负责单条视觉执行

这是非常对的设计。

它让 Part 2 可以独立调试、独立回归、独立扩展。

---

# 10. vision_row.py 的整体逻辑

`vision_row.py` 的执行顺序可以概括成：

```text
读取 results.json 指定 seq
    ↓
拿到 page1.png
    ↓
先做 OCR 探测
    ↓
探测 OpenClaw 视觉桥接是否可用
    ↓
如果 OCR 已和 Excel 一致，直接短路返回
    ↓
否则构造 prompt
    ↓
优先调用 openclaw infer image describe
    ↓
必要时回退 openclaw infer model run
    ↓
解析 JSON
    ↓
如果还拿不到稳定三元组，则降级到 OCR 或失败结构
    ↓
输出单个业务 JSON
```

这条链是整个项目最关键的“LLM 接入闭环”。

---

# 11. vision_row.py 的关键模块解释

## 11.1 `fallback()`：统一失败结构

代码先定义了统一的失败返回：

```python
def fallback(reason: str, *, probe: dict[str, Any] | None = None) -> dict:
    payload = {
        "diagram_dimensions_mm": [],
        "verdict": "图示无法识别",
        "reasoning": reason[:MAX_REASON_LEN],
        "auto_source": "vision-fallback",
        "needs_manual_review": True,
    }
```

这个设计非常重要。

因为它保证了：
- 失败也是结构化失败
- 不会返回一堆散乱 stderr
- 下游 `fill_results.py`、`validate_results.py`、`write_report.py` 都能继续工作

也就是说，这个项目不是“能识别就输出，不识别就崩”，而是“识别失败也输出合法结构”。

## 11.2 `_probe_openclaw()`：先探测链路，再决定是不是要调模型

这一步是为了避免伪装成“已接通”。

它会探测：
- CLI 在不在
- `openclaw infer model list` 能不能跑
- 指定模型是否支持 image 输入
- 当前环境是否能过认证

缓存文件在：

- `prepared/vision_probe_cache.json`

这样做有两个好处：

1. **真实性**
   - 没接通就是没接通
   - 原因写进 `probe`

2. **性能**
   - 不用每条记录都重新 `model list` 一遍
   - 批量模式会稳定很多

## 11.3 OCR 为什么先做

`try_openclaw_vision()` 里先跑的是：

```python
ocr = _ocr_text_from_image(image_path)
ocr_dims = _extract_dims_from_text(ocr.get("text", ""))
```

这是一个非常实际的优化。

因为很多 PDF 首页图其实是矢量转图片，尺寸数字非常清晰。
在这种情况下，让 LLM 先看图反而是浪费。

所以现在的策略是：
- 先 OCR
- 如果 OCR 已经稳定命中，而且和 Excel 一致
- 直接返回 `ocr-short-circuit`

这一段是 Part 2 速度提升的关键原因之一。

## 11.4 OCR 变体图为什么要生成

`_prepare_ocr_variants()` 会为原图生成多个 OCR 版本：
- gray
- autocontrast
- binary

原因很简单：
- 有的图灰度就能识别
- 有的图增强对比度后更清晰
- 有的图二值化后尺寸字反而更容易出来

这不是为了炫技巧，而是为了提高 OCR 的命中率，并降低必须走视觉模型的概率。

## 11.5 `_extract_dims_from_text()` 做了什么

这一步是 OCR 文本后的尺寸抽取。

它会：
- 用三元组正则识别 `a×b×c`
- 处理 mm / cm
- 如果出现“改为”“变更为”，优先取尾部新值
- 排除 `MEAS`

注意这里和 Part 1 的思想是统一的：

**不是只要看见三元组就收，要排除历史值和测量值。**

---

# 12. 什么时候会直接跳过 LLM

在 `try_openclaw_vision()` 里有一段关键短路：

```python
if ocr_dims and excel_dims and _compare(excel_dims, ocr_dims) == "一致":
    return {
        "diagram_dimensions_mm": ocr_dims,
        "verdict": "一致",
        "reasoning": ...,
        "auto_source": "ocr-short-circuit",
    }
```

意思是：
- OCR 抽到了合法三元组
- Excel 也解析成功
- 两边比较后已经是一致

那就没必要再调 LLM 了。

这个策略非常值。

它直接带来：
- 更快
- 更便宜
- 更稳定
- 更少外部依赖

也就是你前面要求的那个方向：
**能少调模型就少调模型，但不是假装模型接通。**

---

# 13. 真正调用 LLM 的过程

这部分就是这份文档必须讲清楚的重点。

## 13.1 调用入口

当 OCR 没有直接短路成功时，`vision_row.py` 才会进入 LLM 视觉调用。

优先命令：

```bash
openclaw infer image describe --json --file <image> --prompt <prompt>
```

必要时回退：

```bash
openclaw infer model run --json --file <image> --prompt <prompt>
```

代码分别对应：

- `_invoke_image_describe()`
- `_invoke_model_run()`

默认不指定模型，交给 OpenClaw 使用本机配置的图片理解/默认模型路由；只有设置 `PO_PDF_VISION_MODEL=<provider/model>` 时才会追加 `--model` 覆盖。

这条路是参考了 `infer-router` 的图片理解路由：

**已有图片时，优先 `image describe`。**

## 13.2 给 LLM 的 prompt 长什么样

由 `_vision_prompt()` 构造。

这段 prompt 不是泛泛地说“请识别图片”，而是把约束说得很死：

- 任务是找纸箱长宽高三元组
- 必须以图片为准
- OCR 只是辅助，不能压过图片
- 接受 mm / cm，但统一换成整数 mm
- 排除 `MEAS/MEASUREMENT`
- 排除历史旧值
- 多个候选时，优先选最像成品/制作/外箱尺寸的一组
- 识别不了就返回空数组，不准猜
- 输出必须是单个 JSON 对象

它甚至直接给了成功/失败 JSON 示例。

这样做的目的就是降低解析成本。

因为下游不是人在看自由文本，而是脚本在接 JSON。

## 13.3 为什么有裁图逻辑

如果 OCR 没抽到稳定三元组，代码会增加候选图片：
- 原图
- 中央主体区域
- 下半区域
- 右下区域

对应 `_crop_focus_regions()`。

原因很实际：
- 很多纸箱图的尺寸标注集中在局部区域
- 整页图给模型看，噪音太多
- 局部裁图有时更容易识别真正的尺寸三元组

所以调用 LLM 的不是死板地只看一张图，而是：
- 先原图
- 不行再尝试局部图
- 只要某一张返回了非空三元组，就停止

这就是你之前要求的“只发图片局部区域给模型，并继续做裁图”的实际落地。

---

# 14. 脚本怎么接收 LLM 返回结果

这部分是整个闭环里最容易出问题的地方。

因为模型返回的不一定总是“纯业务 JSON”。

有时返回的是：
- 纯 JSON
- fenced JSON
- OpenClaw 外层 wrapper JSON
- wrapper 里的 `outputs[].text` 再包一层业务 JSON

所以代码专门做了多层解析。

## 14.1 `_extract_json()`：统一抽 JSON

这个函数会按顺序尝试：
- 直接 `json.loads(text)`
- 提取 fenced JSON
- 用正则抓取第一个 `{...}` 块

这样处理，是为了兼容模型并不总是百分百听话的现实。

## 14.2 `_unwrap_openclaw_payload()`：解 OpenClaw wrapper

这是最近补强的重点之一。

当 CLI 返回的不是业务 JSON，而是类似：

```json
{
  "outputs": [
    {"text": "{...业务JSON...}"}
  ]
}
```

就会进入 `_unwrap_openclaw_payload()`：
- 遍历 `outputs`
- 取每个 item 的 `text`
- 再次执行 `_extract_json()`
- 成功后返回内部业务 JSON

同时还会把 wrapper 元信息记到：
- `probe.wrapped_response = true`
- `raw_wrapper.capability/provider/model`

这有两个价值：

1. **兼容真实返回格式**
2. **调试时知道这条结果到底是不是 wrapper 解出来的**

## 14.3 `_normalize_dims()`：把 LLM 输出收敛成统一维度数组

有的模型会老实输出：

```json
{"diagram_dimensions_mm":[490,65,310]}
```

但也可能只在 `reasoning` 里写了 `490x65x310mm`。

所以 `_normalize_dims()` 会：
- 优先读 `diagram_dimensions_mm`
- 如果没有，再尝试从 `reasoning` 中抓三元组

这样可以提高可用率，但仍然保持结构化输出目标。

---

# 15. LLM 调用失败时怎么降级

这是这个 skill 现在做得比较工程化的一块。

`try_openclaw_vision()` 的降级策略大致是：

## 15.1 CLI 不存在

如果本机就没有 `openclaw` CLI：
- 若 OCR 有结果，降级成 `ocr-fallback`
- 若 OCR 也没结果，输出 `vision-fallback`

## 15.2 模型探测失败 / 不支持图片

如果 `model list` 失败，或模型不支持 image：
- 不伪装继续
- 直接失败或降级到 OCR

## 15.3 认证不可用

如果链路存在，但当前子环境缺少认证：
- 有 OCR 就降级 OCR
- 没 OCR 就结构化失败

## 15.4 image describe 和 model run 都失败

同样：
- 有 OCR 结果，就 OCR 兜底
- 没 OCR 结果，就输出失败结构

## 15.5 模型返回非 JSON

如果调用成功，但返回内容无法稳定解析：
- 有 OCR，继续降级 OCR
- 没 OCR，就输出 `视觉桥接返回非 JSON，无法稳定解析`

这套策略的核心不是“尽量返回一个看起来像成功的东西”，而是：

**真实、可追踪、尽量不断链。**

---

# 16. fill_results.py 怎么接 vision_row.py 的结果

`fill_results.py` 通过 `_run_part2()` 调用：

```python
proc = subprocess.run([
    sys.executable, str(VISION_ROW_SCRIPT), seq
])
```

也就是说，Part 2 被当成一个独立脚本进程来跑。

这样做的好处是：
- 边界清楚
- 更容易单条调试
- Part 2 崩了，不会把整个协调器逻辑揉烂

## 16.1 `_run_part2()` 的解析逻辑

它会先检查：
- 子进程返回码是不是 0
- stdout 能不能 `json.loads`
- payload 是不是 dict

然后再兼容一种特殊情况：

如果 payload 是 OpenClaw wrapper 结构：

```python
if payload.get("ok") is True and isinstance(payload.get("outputs"), list):
```

它会再把 `outputs[].text` 拼起来解析成内部业务 JSON。

这就和 `vision_row.py` 里的 `_unwrap_openclaw_payload()` 形成了“双保险”：
- vision_row 内部会尽量解
- fill_results 外层也能再兜一次

## 16.2 为什么要双层兜底

因为 OpenClaw CLI 的外层返回和模型内容并不是完全等价的。

有时候：
- `vision_row.py` 能直接拿到业务 JSON
- 有时候它可能只把 wrapper 原样吐出来

为了防止这一层格式差异把整条链打断，`fill_results.py` 这里再兜一遍是合理的。

---

# 17. 为什么批量 auto 现在更稳定了

`run_auto()` 里有个关键动作：

**每处理一条，就立即 `save_results(data)` 落盘。**

这点非常重要。

因为 Part 2 可能慢，也可能在外部桥接阶段出问题。

如果整批都等最后一次性写入，会有两个大坑：
- 跑到一半挂了，前面结果全丢
- 很难知道到底卡在哪一条

现在改成逐条落盘后：
- 途中失败，前面结果还在
- 可以从断点继续
- 日志会打印每条的 `seq / part1 / part2 / source / dims / elapsed`
- 慢行会直接暴露出来

这也是你前面盯的稳定性问题里，最应该保留的一项改进。

---

# 18. validate_results.py 在守什么门

这个脚本的价值是：

**防止不完整、不合法的 results.json 进入出报告阶段。**

它主要检查：
- `part1.verdict` 是否在允许集合里
- `part2.verdict` 是否在允许集合里
- 尺寸字段是不是 `list[int]`

允许值在代码里写死了：

```python
ALLOWED_PART1 = {"一致", "一致(顺序不同)", "不一致", "PDF未找到尺寸", "Excel未找到尺寸", "异常"}
ALLOWED_PART2 = {"一致", "一致(顺序不同)", "不一致", "图示无法识别"}
```

这很关键。

因为如果不拦：
- 某条记录写了非法 verdict
- 某条记录尺寸里混进字符串或 float
- 某条记录结构不完整

最后报表阶段才炸，定位会很难看。

所以它其实是在做“格式防火墙”。

---

# 19. write_report.py 怎么把结果变成最终报告

`write_report.py` 做的不是判断，而是 **结果映射和归档**。

## 19.1 `_build_results()`：把 JSON 转成报表对象

它会遍历每一条 row，按 `match_status` 分支处理：

- `缺 PDF` → 直接标缺 PDF
- `PDF 重复` → 写候选文件名，标 PDF 重复
- `Excel 物料编码为空` → 直接标异常
- `ok` → 取 `part1` 和 `part2`，交给 `decide_final()` 计算综合判定

注意这里有个关键设计：

**最终结论不是在 fill_results.py 决定，而是在 write_report.py 汇总决定。**

这意味着：
- Part 1 / Part 2 只负责各自证据链结论
- 综合口径统一在报表层落地

这个分层是对的，不然前面脚本会越来越耦合。

## 19.2 为什么报告名要按秒命名

代码里默认是：

```python
def _output_name(now: datetime) -> str:
    return now.strftime("%Y%m%d%H%M%S") + ".xlsx"
