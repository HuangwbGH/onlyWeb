# PO PDF 规格比对 Skill 架构说明

这份文档只讲架构。

它重点回答这几个问题：
- 这个 skill 由哪些模块组成
- 模块之间怎么调用
- 数据怎么流
- 控制怎么流
- 哪些地方是确定性逻辑，哪些地方依赖 OCR / LLM
- 哪些文件是核心状态文件，哪些只是产物或缓存

如果你想看怎么实际跑一遍，请看 `RUNBOOK.md`。
如果你想看怎么使用，请看 `README.md`。
如果你想看项目目标、边界、优化背景，请看 `PRO.md`。

---

# 1. 总体设计原则

这个 skill 的架构原则很简单：

1. **准备阶段与判定阶段分离**
2. **文本判定与图像判定分离**
3. **确定性逻辑优先，OCR/LLM 作为补充**
4. **中间状态落盘，避免黑盒长链路**
5. **失败也输出结构化结果，不让流程断在半路**

所以它不是单体脚本，而是一个分层流水线。

---

# 2. 模块总览

核心模块可以分成 4 层：

## 第一层：输入整理层
- `scripts/prepare.py`

职责：
- 接收压缩包或 Excel/PDF 直接输入
- 清理旧工作目录
- 归档新任务输入
- 解压和筛选有效文件
- 解析 Excel
- 匹配 PDF
- 抽取 PDF 文本
- 渲染 PDF 首页图片

输出：
- `prepared/extraction.json`
- `prepared/<seq>_<material_code>/page1.png`
- `prepared/<seq>_<material_code>/page1_images.png`（PDF 第一页存在内嵌图片对象时）
- `prepared/latest_history_dir.txt`

## 第二层：结果骨架层
- `scripts/init_results.py`

职责：
- 基于 `extraction.json` 生成统一结构的 `results.json`
- 固化 Step 2 的输入输出契约

输出：
- `prepared/results.json`

## 第三层：判定执行层
- `scripts/fill_results.py`
- `scripts/vision_row.py`

职责：
- `fill_results.py`：总协调器，做 Part 1 文本判定，调 Part 2，逐条落盘
- `vision_row.py`：Part 2 单条视觉/OCR/LLM 执行器

输出：
- 回填后的 `prepared/results.json`
- `prepared/vision_probe_cache.json`
- `prepared/<seq>_<material_code>/vision_crops/*.png`
- `prepared/<seq>_<material_code>/vision_ocr/*.png`

## 第四层：校验与产出层
- `scripts/validate_results.py`
- `scripts/write_report.py`
- `scripts/report_writer.py`

职责：
- 校验结果结构是否合法
- 计算综合判定
- 生成最终 Excel 报告
- 归档 output

输出：
- `output/<YYYYMMDDHHmmss>.xlsx`
- `history/<task>/output/<YYYYMMDDHHmmss>.xlsx`

---

# 3. 模块调用关系

可以把调用关系理解成下面这样：

```text
用户输入（压缩包 / Excel + PDF）
        ↓
prepare.py
        ↓
extraction.json
        ↓
init_results.py
        ↓
results.json（空模板）
        ↓
fill_results.py
   ├─ Part 1：本地规则判定
   └─ Part 2：调用 vision_row.py
                ├─ OCR
                ├─ OpenClaw 能力探测
                ├─ openclaw infer image describe
                ├─ fallback: openclaw infer model run
                └─ 解析/降级/返回 JSON
        ↓
results.json（已填写）
        ↓
validate_results.py
        ↓
write_report.py
        ↓
output/*.xlsx + history/*/output/*.xlsx
```

这里最重要的结构关系是：

- `fill_results.py` 是 Step 2 的调度中心
- `vision_row.py` 是 Step 2 的视觉子执行器
- `write_report.py` 不负责识别，只负责汇总和输出

---

# 4. 目录职责划分

## `input/`
本次任务的工作输入目录。

特点：
- 只保留当前任务需要的 Excel 和 PDF
- 不保留原始压缩包本体
- 新任务开始时会被整理和清理

## `prepared/`
中间工作目录。

这是整个 skill 最重要的状态目录。

里面通常有：
- `extraction.json`
- `results.json`
- `latest_history_dir.txt`
- 每条记录的 `page1.png`
- OCR 中间图
- 裁图结果
- 视觉探测缓存

可以理解为：
**prepared 是整个任务的中间状态中心。**

## `output/`
当前任务最终输出目录。

特点：
- 新任务开始时清空
- 同一任务重复生成报告时，应只保留最新报告
- 默认输出命名到秒

## `history/`
历史任务归档目录。

每次任务一个时间戳目录：

```text
history/<task_stamp>/
  ├─ input/
  └─ output/
```

它是追溯目录，不是运行目录。

---

# 5. 核心状态文件

## 5.1 `prepared/extraction.json`

这是 Step 1 的结构化事实文件。

作用：
- 固化原始输入的解析结果
- 给后续 Part 1 / Part 2 提供统一输入
- 让 Step 2 可以反复调试而不用重跑 prepare

它描述的是“看到什么”。

## 5.2 `prepared/results.json`

这是 Step 2 的结果文件。

作用：
- 保存每行最终 Part 1 / Part 2 判定
- 保存自动/人工处理进度
- 作为报告生成的直接输入

它描述的是“判断成什么”。

## 5.3 `prepared/latest_history_dir.txt`

作用：
- 把本次 prepare 对应的 history 任务目录传给后续脚本
- 让 `write_report.py` 知道报告该归档到哪个任务目录

这是一个很小但很关键的跨脚本上下文桥。

## 5.4 `prepared/vision_probe_cache.json`

作用：
- 缓存 OpenClaw 视觉能力探测结果
- 避免批量 auto 时每条记录都重新探测模型和认证

这是性能优化点，不是核心业务结果文件。

---

# 6. 数据流架构

这个项目的数据流可以分成 3 段。

## 6.1 输入数据流

```text
压缩包 / Excel + PDF
  ↓
prepare.py 识别和整理
  ↓
input/ 中只留下有效工作文件
```

这一段的重点是“收敛输入”。

## 6.2 中间证据流

```text
Excel 行数据 + PDF 文本 + PDF 首页图片
  ↓
写入 extraction.json
  ↓
init_results.py 补成 results.json 骨架
```

这一段的重点是“证据结构化”。

## 6.3 判定与产物流

```text
results.json 空模板
  ↓
fill_results.py 写入 part1
  ↓
vision_row.py 返回 part2
  ↓
results.json 完整化
  ↓
validate_results.py 校验
  ↓
write_report.py 生成 xlsx
```

这一段的重点是“判断落盘”和“结果输出”。

---

# 7. 控制流架构

除了数据流，这个项目还有一条控制流。

## 7.1 主控制流

```text
prepare → init_results → fill_results(auto) → validate → report
```

这是正常闭环主路径。

## 7.2 Part 2 子控制流

Part 2 并不是直接在 `fill_results.py` 内部做完，而是分叉出去：

```text
fill_results.py
   ↓
_run_part2()
   ↓
vision_row.py <seq>
   ↓
stdout JSON
   ↓
fill_results.py 解析并写回 results.json
```

这是一条“子进程控制流”。

这样做的意义：
- 视觉逻辑隔离
- 失败边界清楚
- 单条回归方便

---

# 8. Part 1 架构：纯规则判定层

Part 1 完全属于确定性逻辑。

它的输入是：
- `spec_text`
- `pdf_text`
- `material_code`
- `pdf_filename`

它的核心模块包括：
- Excel 三元组解析
- PDF 文本候选提取
- 标签优先级排序
- 变更语义处理
- 最终比较

关键特点：
- 不依赖模型
- 不依赖 OCR
- 全本地执行
- 输出稳定
- 可重复

可以把它理解成：
**文本证据判定引擎。**

---

# 9. Part 2 架构：OCR + 视觉混合层

Part 2 是整个 skill 唯一真正的不确定区域。

它的输入是：
- `spec_text`
- `pdf_image_path`
- `pdf_image_path2`：PDF 第一页内嵌图片对象区域；存在时 Part 2 OCR 优先识别它

但它内部不是直接把图片丢给模型，而是分成几层：

## 9.1 OCR 层
- 先尝试 Tesseract OCR
- 生成多个增强版本图片
- 从 OCR 文本里抽三元组
- 命中时作为短路或降级依据

## 9.2 能力探测层
- 检查 OpenClaw CLI 是否存在
- 检查模型是否支持 image
- 检查认证是否可用
- 结果写入 probe cache

## 9.3 LLM 调用层
- 优先 `openclaw infer image describe`
- 必要时回退 `openclaw infer model run`
- 传原图或局部裁图
- 要求严格输出 JSON

## 9.4 解析与归一化层
- 解析 JSON / fenced JSON / wrapper JSON
- 提取 `diagram_dimensions_mm`
- 必要时从 reasoning 兜底抽三元组

## 9.5 降级层
- OCR fallback
- vision fallback
- `needs_manual_review = true`

这 5 层串起来，才是完整的 Part 2。

---

# 10. LLM 集成架构

这个项目里的 LLM 不是全局核心，而是局部能力模块。

也就是说，LLM 只出现在 Part 2。

## 10.1 调用入口

由 `vision_row.py` 控制，统一通过 OpenClaw CLI 间接接入。

不是直接 SDK 写死，不是临时 curl，也不是 shell 拼接一堆不可控逻辑。

## 10.2 首选路由

```text
openclaw infer image describe
```

适合已有图片的描述/识别任务。

## 10.3 回退路由

```text
openclaw infer model run
```

当上层图片描述能力不可用时，作为兜底。

## 10.4 返回契约

期望返回业务 JSON：

```json
{
  "diagram_dimensions_mm": [490, 65, 310],
  "verdict": "一致",
  "reasoning": "..."
}
```

但实际架构上允许兼容：
- 外层 wrapper
- `outputs[].text`
- fenced JSON
- reasoning 中带尺寸而字段缺失

所以接收层不是“严格吃纯 JSON”，而是“尽量收敛成统一业务 JSON”。

---

# 11. 为什么要把失败也结构化

这是架构层面的一个关键决定。

很多脚本项目的问题在于：
- 成功路径有结构
- 失败路径只有报错字符串

这样会导致：
- 下游没法继续处理
- 批量任务里一条失败拖死整批
- 日志难归一

这个 skill 现在选的路线是：

```json
{
  "diagram_dimensions_mm": [],
  "verdict": "图示无法识别",
  "reasoning": "...",
  "auto_source": "vision-fallback",
  "needs_manual_review": true,
  "probe": {...}
}
```

这样做的结果是：
- 流程不断
- 报表还能生成
- 失败可审计
- 人工后续能复核

---

# 12. 缓存与中间产物架构

这个项目有一些不是最终结果，但很重要的中间产物。

## OCR 中间图
目录：
- `prepared/<row>/vision_ocr/`

作用：
- 给 OCR 增强识别使用
- 方便排查 OCR 为什么识别不到

## 裁图中间图
目录：
- `prepared/<row>/vision_crops/`

作用：
- 给视觉模型提供更聚焦的输入
- 方便排查为什么原图不行、局部图行或不行

## probe cache
文件：
- `prepared/vision_probe_cache.json`

作用：
- 节省重复探测成本
- 暴露真实能力状态

这些文件不是用户最终要看的，但对维护非常有价值。

---

# 13. 为什么 `fill_results.py` 和 `vision_row.py` 要双层解 wrapper

这是个典型的工程兼容设计。

原因是 OpenClaw CLI 的返回在不同场景下可能并不完全一样：
- 有时直接给业务 JSON
- 有时外面包一层 wrapper
- 有时 wrapper 里文本再包一层 JSON

如果只在一层做解析：
- 某次返回结构一变，就会断链

现在采取双层兼容：
- `vision_row.py` 内部先解一次
- `fill_results.py` 收到后再兜一次

这是为了提高整个链路的抗格式漂移能力。

---

# 14. 为什么批量模式必须逐条落盘

从架构角度看，这是“长链路任务的状态持久化”。

`auto` 模式里最怕的不是慢，而是：
- 第 11 条很慢
- 第 12 条报错
- 最后整批没保存

逐条落盘后，整个任务从“内存态批处理”变成“可恢复批处理”：
- 前面成功的结果不会丢
- 失败条目容易定位
- 可以从中间继续

所以这是稳定性架构，不只是一个实现细节。

---

# 15. 综合判定为什么放到 write_report.py

Part 1 和 Part 2 的职责是各自给出局部结论。

综合判定放在报表层有几个好处：
- 避免前面脚本掺杂展示口径
- 统一最终业务规则出口
- 以后改综合矩阵时，不需要动识别逻辑

也就是说，这里把：
- **证据判断**
- **业务汇总**

分开了。

这是合理的分层。

---

# 16. 当前架构的边界

这套架构现在已经能稳定覆盖主要场景，但也有边界：

- Part 2 当前仍是单页首页图为主，不是全 PDF 多页视觉解析
- OCR 依赖 Tesseract，本地环境缺失时只能降级
- LLM 返回虽然做了多层兼容，但依然依赖上游大体守约
- PDF 匹配目前核心还是文件名命中物料编码，不是语义匹配
- 输出目录“同任务仅保留最新一个 xlsx”的规则还应继续做强约束验证

这些不是架构错误，而是当前范围边界。

---

# 17. 一句话总结这个架构

如果只用一句话总结：

**这是一个以 `prepared/` 为中间状态中心、以 `fill_results.py` 为调度中心、以 `vision_row.py` 为视觉子执行器、以 `write_report.py` 为最终汇总出口的分层流水线架构。**

再说直白一点：

- `prepare.py` 负责把材料备齐
- `init_results.py` 负责把空表搭好
- `fill_results.py` 负责推进整条链
- `vision_row.py` 负责最难的看图部分
- `validate_results.py` 负责守门
- `write_report.py` 负责出最终结果

这就是整个 skill 的骨架。
