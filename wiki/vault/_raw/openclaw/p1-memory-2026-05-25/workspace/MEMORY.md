# 长期记忆

> 最后更新: 2026-03-29

## 用户档案
- 工作领域：软件开发 / AI 应用
- 常用语言：中文
- 时区：北京时间 GMT+8
- 任务管理：Notion
- 通信工具：钉钉、飞书

## 稳定偏好
- 界面偏好：简洁清晰；钉钉消息尽量避免表格
- 安全偏好：重视检查与确认
- 通知偏好：自动执行型定时任务默认静默，仅在失败或需要确认时提醒
- 投资关注：A股 ETF、美股市场
- 常见需求：数据整理、Excel 处理

## 当前重点

- OpenClaw 技能管理与配置
- 定时任务系统（学习推送、备份、日报 / 周报 / 月报）
- RustDesk 搭建（远程桌面服务部署）
- 围绕销售订单交付兑现，推进采购材料执行进度跟踪表与生产计划执行跟踪表的分析、设计与 OpenClaw 结合逻辑
- 关注国内 skill 市场网站 `skillhub`（对标 `clawhub`）
- 使用 wiki 将 `/Users/mac/Desktop/吉信德知识库文件` 按专题整理为知识库，原始文件先复制到 `raw/` 再 ingest

## 已确认的长期规则
- 安装任何 skill 前必须：先做安全检查、生成安全报告、提交用户确认、获得明确确认后再安装，并记录安装日志
- 会话延续规则：当用户说“继续上次/昨天的话题”时，先按当前通道对应 session 检索；当前通道没有，再明确征求是否允许跨通道检索
- 会话隔离规则已确认：`session.dmScope = per-channel-peer`；钉钉 connector 使用会话隔离，不共享不同会话记忆

## 业务口径
- 吉信德整个集团的材料成本核算口径为“全月平均价”（已与财务确认）

## 备注
- OpenClaw 可单独配置代理；详细操作步骤不放这里，按需查本地专用文件或知识库
- 获取 OpenClaw 的 gateway token 以打开 WebUI，可使用命令：`openclaw dashboard --no-open`
- OpenClaw 对接钉钉机器人插件仓库：`https://github.com/DingTalk-Real-AI/dingtalk-openclaw-connector`
- personal-wiki 流程规则：原始文件先复制到 wiki 的 `raw/` 目录，再基于 `raw/` ingest，`source_file` 必须写为 `raw/...` 相对路径
- 吉信德相关信息：sunnypet 邮箱入口为 `http://mail.sunnypet.com/`
- 吉信德集团内部系统入口：标签打印 `https://code.zestrade.com/`；Gemini 地址 `http://gemini.zestrade.com:32179/`、`http://192.168.66.149:32179/`

## Promoted From Short-Term Memory (2026-04-19)

<!-- openclaw-memory-promotion:memory:memory/2026-04-12.md:8:8 -->
- 本周完成 35 个会话的工作 [score=0.826 recalls=0 avg=0.620 source=memory/2026-04-12.md:8-8]
<!-- openclaw-memory-promotion:memory:memory/2026-04-12.md:11:11 -->
- *由 OpenClaw 自动生成* [score=0.826 recalls=0 avg=0.620 source=memory/2026-04-12.md:11-11]
<!-- openclaw-memory-promotion:memory:memory/2026-04-13.md:3:4 -->
- ## Light Sleep <!-- openclaw:dreaming:light:start --> - Candidate: Reflections: Theme: `user` kept surfacing across 689 memories.; confidence: 0.89; evidence: memory/.dreams/session-corpus/2026-04-06.txt:1-1, memory/.dreams/session-corpus/2026-04-06.txt:3-3, memory/.dreams/session-corpus/2026-04-06.txt:5-5; note: reflection - confidence: 0.00 - evidence: memory/2026-04-13.md:332-335 - recalls: 0 - status: staged - Candidate: 00:04 CST Heartbeat: created today's daily memory file.; 14:11 CST 知识沉淀：根据用户提供的总结，整理并归档《Open XML SDK 与 pandas 适用场景对比》到 `archive/技术沉淀/2026-04-13-OpenXML-SDK-vs-pandas-适用场景对比.md`。 [score=0.825 recalls=0 avg=0.620 source=memory/2026-04-13.md:6-13]
<!-- openclaw-memory-promotion:memory:memory/2026-04-13.md:333:335 -->
- - Candidate: Possible Lasting Truths: - 业务规则：该文件属于吉信德东孚厂（东缝）回复销售的交期表，当前以 Excel 形式每周更新一次；每周需要确认是否能够正常交货，并持续归档留存。 - 已将该业务规则沉淀到吉信德知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-东孚厂（东缝）交期回复规则.md`。 - 已将 101账套“采购在途”SQL 的业务分析沉淀到吉信德知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-101账套-采购在途SQL分析.md`。 - 已将 101账套“请购在途”S - confidence: 0.00 - evidence: memory/2026-04-13.md:338-340 [score=0.825 recalls=0 avg=0.620 source=memory/2026-04-13.md:23-25]
<!-- openclaw-memory-promotion:memory:memory/2026-04-11.md:3:3 -->
- - 00:12 CST Heartbeat: created today's daily memory file. [score=0.816 recalls=0 avg=0.620 source=memory/2026-04-11.md:3-3]
<!-- openclaw-memory-promotion:memory:memory/2026-04-12.md:3:3 -->
- - 00:05 CST Heartbeat: created today's daily memory file. [score=0.816 recalls=0 avg=0.620 source=memory/2026-04-12.md:3-3]
<!-- openclaw-memory-promotion:memory:memory/2026-04-14.md:3:3 -->
- - 00:04 CST Heartbeat: created today's daily memory file. [score=0.808 recalls=0 avg=0.620 source=memory/2026-04-14.md:3-3]

## Promoted From Short-Term Memory (2026-04-20)

<!-- openclaw-memory-promotion:memory:memory/2026-04-14.md:332:334 -->
- - Candidate: Possible Lasting Truths: - 业务规则：该文件属于吉信德东孚厂（东缝）回复销售的交期表，当前以 Excel 形式每周更新一次；每周需要确认是否能够正常交货，并持续归档留存。 - 已将该业务规则沉淀到吉信德知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-东孚厂（东缝）交期回复规则.md`。 - 已将 101账套“采购在途”SQL 的业务分析沉淀到吉信德知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-101账套-采购在途SQL分析.md`。 - 已将 101账套“请购在途”S - confidence: 0.00 - evidence: memory/2026-04-14.md:337-339 [score=0.839 recalls=0 avg=0.620 source=memory/2026-04-14.md:22-24]

## Promoted From Short-Term Memory (2026-04-21)

<!-- openclaw-memory-promotion:memory:memory/2026-04-15.md:251:252 -->
- - Candidate: 临时记录: 15:51 用户新增 worklog：开发物料标签打印以及外网扫码可查询物料基础信息。; 15:52 用户将 worklog WL-0074 标记为已完成。 - confidence: 0.00 [score=0.817 recalls=0 avg=0.620 source=memory/2026-04-15.md:8-9]
<!-- openclaw-memory-promotion:memory:memory/2026-04-15.md:267:269 -->
- - Candidate: Possible Lasting Truths: - 业务规则：该文件属于吉信德东孚厂（东缝）回复销售的交期表，当前以 Excel 形式每周更新一次；每周需要确认是否能够正常交货，并持续归档留存。 - 已将该业务规则沉淀到吉信德知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-东孚厂（东缝）交期回复规则.md`。 - 已将 101账套“采购在途”SQL 的业务分析沉淀到吉信德知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-101账套-采购在途SQL分析.md`。 - 已将 101账套“请购在途”S - confidence: 0.00 - evidence: memory/2026-04-15.md:277-279 [score=0.817 recalls=0 avg=0.620 source=memory/2026-04-15.md:18-20]

## Promoted From Short-Term Memory (2026-04-26)

- 用户要求使用 wiki 将 `/Users/mac/Desktop/吉信德知识库文件` 下文件整理成知识库，并明确要求 personal-wiki 流程先将原始文件复制到 wiki 的 `raw/` 目录，再基于 `raw/` 进行 ingest，`source_file` 必须写为 `raw/...` 相对路径。
- 已将 `/Users/mac/Desktop/吉信德知识库文件/openclaw` 目录的 OpenClaw 相关文档整理进 personal-wiki，原始文件归档到 `mcp/personal-wiki/knowledge/personal-wiki/raw/openclaw/`，并修正 source 页 `source_file` 指向 `raw/...`。
- 已将误放入 `raw/openclaw/` 的非 OpenClaw 文件 `petco_h1_2027_trend_summary.md` 移出，改放到 `raw/misc/`，保持专题目录纯净。
- 已开始将 `/Users/mac/Desktop/吉信德知识库文件` 整体按专题整理进 wiki，已覆盖 `openclaw`、`U8-ERP`、`孚盟crm` 等目录，完成原始资料归档、文本类 source 页批量导入，以及部分实体页和概念页初始化。
- 已批量导入约 149 个可直接读取文件，重点为 `U8-ERP` 下的 `sql/txt/md` 和部分 `doc/docx/pdf`；复杂格式如 `xls/xlsx/xmind/chm/exe/zip` 尚待后续专项处理。

## Promoted From Short-Term Memory (2026-04-22)

<!-- openclaw-memory-promotion:memory:memory/2026-04-16.md:290:292 -->
- - Candidate: Possible Lasting Truths: - 业务规则：该文件属于吉信德东孚厂（东缝）回复销售的交期表，当前以 Excel 形式每周更新一次；每周需要确认是否能够正常交货，并持续归档留存。 - 已将该业务规则沉淀到吉信德知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-东孚厂（东缝）交期回复规则.md`。 - 已将 101账套“采购在途”SQL 的业务分析沉淀到吉信德知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-101账套-采购在途SQL分析.md`。 - 已将 101账套“请购在途”S - confidence: 0.62 - evidence: memory/2026-04-15.md:267-269 [score=0.817 recalls=0 avg=0.620 source=memory/2026-04-16.md:20-22]

## Promoted From Short-Term Memory (2026-04-23)

<!-- openclaw-memory-promotion:memory:memory/2026-04-17.md:322:322 -->
- - 10:03 CST 记录吉信德采购插件业务规则：插件中的制单人与左下角显示用户为同一身份；如需修改，需使用 admin 登录 U8，在 系统管理 → 权限管理 中修改对应用户。已沉淀到知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-采购插件-制单人与左下角用户一致规则.md`。 [score=0.817 recalls=0 avg=0.620 source=memory/2026-04-17.md:322-322]
<!-- openclaw-memory-promotion:memory:memory/2026-04-17.md:324:324 -->
- - 15:21 CST 记录吉信德报销流程样例：以淘宝购买 Mac mini 为例，需准备发票（开票信息路径 `\\192.168.1.26\Y1.Public\01.开票资料\吉信德`）、OA 物品申购审批单、购买记录截图、报销凭证，全部打印后先交直属上级签字，再提交财务。已沉淀到知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-报销流程-淘宝购买Mac mini示例.md`。 [score=0.817 recalls=0 avg=0.620 source=memory/2026-04-17.md:324-324]

## Promoted From Short-Term Memory (2026-04-24)

<!-- openclaw-memory-promotion:memory:memory/2026-04-17.md:326:326 -->
- - 15:22 CST 已将吉信德报销流程与《吉信德付款单及报销单模板.xlsx》结合沉淀到知识库。模板包含 `中行`（付款通知单）与 `集团-报销`（费用支出报销凭证）两个 sheet；其中淘宝购买 Mac mini 的报销流程更直接对应 `集团-报销` sheet。知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-报销流程与付款单报销单模板说明.md`。 [score=0.841 recalls=0 avg=0.620 source=memory/2026-04-17.md:326-326]

## Promoted From Short-Term Memory (2026-04-25)

<!-- openclaw-memory-promotion:memory:memory/2026-04-17.md:341:343 -->
- - Candidate: Possible Lasting Truths: - 业务规则：该文件属于吉信德东孚厂（东缝）回复销售的交期表，当前以 Excel 形式每周更新一次；每周需要确认是否能够正常交货，并持续归档留存。 - 已将该业务规则沉淀到吉信德知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-东孚厂（东缝）交期回复规则.md`。 - 已将 101账套“采购在途”SQL 的业务分析沉淀到吉信德知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-101账套-采购在途SQL分析.md`。 - 已将 101账套“请购在途”S - confidence: 0.62 - evidence: memory/2026-04-16.md:290-292 [score=0.856 recalls=0 avg=0.620 source=memory/2026-04-17.md:15-17]

## Promoted From Short-Term Memory (2026-04-26)

<!-- openclaw-memory-promotion:memory:memory/2026-04-19.md:10:10 -->
- 本周完成 64 个会话的工作 [score=0.849 recalls=0 avg=0.620 source=memory/2026-04-19.md:10-10]
<!-- openclaw-memory-promotion:memory:memory/2026-04-19.md:13:13 -->
- *由 OpenClaw 自动生成* [score=0.849 recalls=0 avg=0.620 source=memory/2026-04-19.md:13-13]

## Promoted From Short-Term Memory (2026-04-27)

<!-- openclaw-memory-promotion:memory:memory/2026-04-21.md:3:3 -->
- - 00:04 CST Heartbeat: created today's daily memory file. [score=0.855 recalls=0 avg=0.620 source=memory/2026-04-21.md:3-3]

## Promoted From Short-Term Memory (2026-04-28)

<!-- openclaw-memory-promotion:memory:memory/2026-04-22.md:3:3 -->
- - 00:04 CST Heartbeat: created today's daily memory file. [score=0.830 recalls=0 avg=0.620 source=memory/2026-04-22.md:3-3]

## Promoted From Short-Term Memory (2026-04-29)

<!-- openclaw-memory-promotion:memory:memory/2026-04-23.md:3:3 -->
- - 00:04 CST Heartbeat: created today's daily memory file. [score=0.830 recalls=0 avg=0.620 source=memory/2026-04-23.md:3-3]

## Promoted From Short-Term Memory (2026-04-30)

<!-- openclaw-memory-promotion:memory:memory/2026-04-24.md:3:3 -->
- - 00:04 CST Heartbeat: created today's daily memory file. [score=0.830 recalls=0 avg=0.620 source=memory/2026-04-24.md:3-3]

## Promoted From Short-Term Memory (2026-05-02)

<!-- openclaw-memory-promotion:memory:memory/2026-04-26.md:11:11 -->
- 本周完成 49 个会话的工作 [score=0.840 recalls=0 avg=0.620 source=memory/2026-04-26.md:11-11]
<!-- openclaw-memory-promotion:memory:memory/2026-04-26.md:14:14 -->
- *由 OpenClaw 自动生成* [score=0.840 recalls=0 avg=0.620 source=memory/2026-04-26.md:14-14]

## Promoted From Short-Term Memory (2026-05-14)

<!-- openclaw-memory-promotion:memory:memory/2026-05-06.md:3:3 -->
- - 10:34 CST Heartbeat: created today's daily memory file. [score=0.881 recalls=0 avg=0.620 source=memory/2026-05-06.md:3-3]

## Promoted From Short-Term Memory (2026-05-20)

<!-- openclaw-memory-promotion:memory:memory/2026-05-13.md:3:3 -->
- - 14:34 CST Heartbeat: created today's daily memory file. [score=0.861 recalls=0 avg=0.620 source=memory/2026-05-13.md:3-3]
<!-- openclaw-memory-promotion:memory:memory/2026-05-14.md:3:3 -->
- - 16:34 CST Heartbeat: created today's daily memory file. [score=0.841 recalls=0 avg=0.620 source=memory/2026-05-14.md:3-3]

## Promoted From Short-Term Memory (2026-05-21)

<!-- openclaw-memory-promotion:memory:memory/2026-05-15.md:3:3 -->
- - 09:04 CST Heartbeat: created today's daily memory file. [score=0.841 recalls=0 avg=0.620 source=memory/2026-05-15.md:3-3]

## Promoted From Short-Term Memory (2026-05-23)

<!-- openclaw-memory-promotion:memory:memory/2026-05-18.md:2:2 -->
- - 08:36 CST 记录吉信德集团内部系统入口：标签打印 `https://code.zestrade.com/`；Gemini 地址 `http://gemini.zestrade.com:32179/`、`http://192.168.66.149:32179/`。已沉淀到知识库文件：`memory/u8-docs/openclaw学习资料/吉信德-内部系统入口汇总.md`。 [score=0.870 recalls=0 avg=0.620 source=memory/2026-05-18.md:2-2]
