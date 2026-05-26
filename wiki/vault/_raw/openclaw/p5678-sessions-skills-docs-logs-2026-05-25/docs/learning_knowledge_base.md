# 每日学习知识点库
# 格式：主题 | 时间段 | 标题 | 内容

## OpenClaw
openclaw | morning | OpenClaw 核心架构 | OpenClaw 采用模块化设计，核心组件包括 Gateway（网关）、Agent（代理）和 Skills（技能）。Gateway 负责通信管理，Agent 处理对话逻辑，Skills 提供具体功能扩展。
openclaw | morning | OpenClaw 安装配置 | 安装 OpenClaw：brew install openclaw 或 npm install -g @openclaw/cli。配置文件位于 ~/.openclaw/config.yaml，支持多渠道集成（Telegram、Discord、钉钉等）。
openclaw | afternoon | OpenClaw Skills 系统 | Skills 是 OpenClaw 的功能扩展单元，位于 ~/.openclaw/skills/ 目录。每个 Skill 包含 SKILL.md 说明文件和对应的实现，支持动态加载和卸载。
openclaw | afternoon | OpenClaw 内存管理 | OpenClaw 使用三层记忆系统：L1（每日日志）、L2（长期记忆）、L3（向量搜索）。memory_search 工具支持语义搜索，memory_get 用于精确读取。
openclaw | evening | OpenClaw 消息路由 | 消息通过 message 工具发送，支持多种渠道（telegram、discord、dingtalk 等）。channel 参数指定目标渠道，action=send 表示发送消息。
openclaw | evening | OpenClaw 子代理机制 | sessions_spawn 用于创建独立子代理会话，适合复杂任务的并行处理。subagents 工具用于管理子代理的生命周期。

## LangChain
langchain | morning | LangChain 核心概念 | LangChain 是一个 AI 应用开发框架，核心组件包括：Models（模型）、Prompts（提示词）、Chains（链）、Memory（记忆）和 Agents（代理）。
langchain | morning | LangChain Model I/O | Model I/O 包含 PromptTemplates（模板）、LLM/ChatModel（语言模型）和 OutputParsers（输出解析）。这是构建对话应用的基础。
langchain | afternoon | LangChain Chains | Chains 是 LangChain 的核心执行单元，将多个组件串联工作。常见链：LLMChain、SequentialChain、RouterChain。LCEL（LangChain Expression Language）是新的声明式链定义方式。
langchain | afternoon | LangChain Memory | Memory 模块提供对话状态持久化。类型包括：ConversationBufferMemory、EntityMemory、KnowledgeGraphMemory。支持跨会话记忆共享。
langchain | evening | LangChain Agents | Agents 是能够自主决策和调用工具的智能体。使用 ReAct 模式，结合推理和行动。Tools 是 Agent 可调用的外部能力接口。
langchain | evening | LangChain RAG | RAG（检索增强生成）流程：DocumentLoader → TextSplitter → VectorStore → Retriever → Prompt → LLM → OutputParser。关键：向量化检索和上下文注入。

## ComfyUI
comfyui | morning | ComfyUI 基础架构 | ComfyUI 是一个基于节点的 Stable Diffusion WebUI。核心概念：Nodes（节点）、Edges（边）、Workflows（工作流）。支持完全自定义的图像生成流程。
comfyui | morning | ComfyUI 安装启动 | 安装：git clone https://github.com/comfyanonymous/ComfyUI.git && cd ComfyUI && pip install -r requirements.txt。启动：python main.py，默认端口 8188。
comfyui | afternoon | ComfyUI 核心节点 | 基础节点：Load Checkpoint（加载模型）、CLIP Text Encode（提示词编码）、KSampler（采样器）、VAE Decode（解码图像）。理解节点间的数据流向是掌握 ComfyUI 的关键。
comfyui | afternoon | ComfyUI 采样器配置 | KSampler 参数：steps（步数，20-50）、cfg（提示词权重，1-20）、sampler（采样方法，euler、dpmpp_2m 等）、scheduler（调度器，normal、karras）、denoise（去噪强度）。
comfyui | evening | ComfyUI 模型管理 | 模型存放目录：ComfyUI/models/checkpoints/（主模型）、ComfyUI/models/loras/（LoRA）、ComfyUI/models/controlnet/（ControlNet）。支持 .safetensors 格式。
comfyui | evening | ComfyUI 自定义节点 | 自定义节点安装：git clone 到 ComfyUI/custom_nodes/ 目录。常用节点包：ComfyUI-Manager（管理界面）、was-node-suite（高级节点集合）。

## RAG
rag | morning | RAG 基础原理 | RAG（Retrieval-Augmented Generation）= 检索 + 生成。核心思想：将外部知识库与 LLM 结合，解决知识截止日期和幻觉问题，提高回答准确性。
rag | morning | RAG 技术栈 | 完整 RAG 流程：数据采集 → 文档加载 → 文本切分 → 向量化 → 向量存储 → 相似检索 → 上下文注入 → LLM 生成。常用工具：LangChain、LlamaIndex、ChromaDB、FAISS。
rag | afternoon | 文本向量化 | Text Embedding 将文本转为高维向量。常用模型：OpenAI text-embedding-ada-002、sentence-transformers/all-MiniLM-L6-v2、BAAI/bge-large-zh。向量维度：384-1536 维。
rag | afternoon | 向量数据库 | 主流向量数据库：Pinecone（云服务）、Chroma（本地）、FAISS（Facebook）、Weaviate（开源）、Milvus（云+本地）。选型考虑：数据规模、查询性能、部署方式。
rag | evening | 检索策略 | 检索优化：BM25（关键词检索）+ 向量检索（语义检索）混合检索。查询改写（Query Rewrite）、重排序（Reranker）提升检索精度。Top-K 检索 K=3-5 为佳。
rag | evening | RAG 高级优化 | 高级技术：Chunk 优化（滑动窗口、重叠）、元数据过滤、混合检索、递归检索、路由机制。评估指标：Hit Rate、MRR、NDCG。
