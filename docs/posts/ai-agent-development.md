---
title: "AI Agent 开发实践：从原理到落地"
date: "2026-03-20"
category: "AI"
tags: ["ai", "agent", "llm", "langchain", "openai"]
description: "深入探讨 AI Agent 的核心概念、常见架构模式（ReAct、Plan-and-Execute）以及基于 LangChain 的工程化落地实践。"
---

# AI Agent 开发实践：从原理到落地

AI Agent（智能代理）是当前大模型应用落地最热门的方向之一。相比单纯的问答式调用，Agent 能够**自主规划任务、调用外部工具、迭代执行**，从而解决更复杂的实际问题。本文将从原理、架构模式到工程实践，系统梳理 AI Agent 开发的核心知识。

## 什么是 AI Agent？

AI Agent 是一种以大语言模型（LLM）为"大脑"，能够感知环境、制定计划、调用工具并持续行动以实现目标的自主系统。它与普通 LLM 调用的核心区别在于：

| 对比项 | 普通 LLM 调用 | AI Agent |
|---|---|---|
| 交互方式 | 单轮问答 | 多轮迭代 |
| 工具使用 | 不支持 | 支持调用外部工具 |
| 记忆能力 | 无 | 有短期/长期记忆 |
| 自主规划 | 无 | 能拆解子任务并执行 |
| 适合场景 | 文本生成、摘要 | 复杂任务自动化 |

一个完整的 Agent 系统通常包含以下四个核心模块：

- **Planning（规划）**：将用户目标拆解为可执行的子任务序列
- **Memory（记忆）**：存储对话历史、执行结果等上下文信息
- **Tools（工具）**：搜索引擎、代码执行、数据库查询等外部能力
- **Action（行动）**：按规划调用工具并将结果反馈给模型

## ReAct 架构：最主流的 Agent 模式

ReAct（Reasoning + Acting）是目前最广泛使用的 Agent 架构，其核心思想是让 LLM 在**推理（Thought）、行动（Action）、观察（Observation）** 三个步骤之间循环，直到任务完成。

```
用户问题 → [Thought] 我需要先查天气 → [Action] 调用天气 API
         → [Observation] 北京今天 25°C，晴
         → [Thought] 已拿到结果，可以回答了
         → [Final Answer] 北京今天天气晴，气温 25°C
```

### 使用 LangChain 实现 ReAct Agent

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain_community.tools import DuckDuckGoSearchRun
from langchain.tools import tool
from langchain import hub

# 1. 定义自定义工具
@tool
def calculator(expression: str) -> str:
    """计算数学表达式，输入必须是合法的 Python 数学表达式"""
    try:
        result = eval(expression, {"__builtins__": {}}, {})
        return str(result)
    except Exception as e:
        return f"计算错误: {e}"

# 2. 组合工具列表
tools = [
    DuckDuckGoSearchRun(),
    calculator,
]

# 3. 初始化模型与 ReAct Prompt
llm = ChatOpenAI(model="gpt-4o", temperature=0)
prompt = hub.pull("hwchase17/react")

# 4. 创建 Agent 与执行器
agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=10,
    handle_parsing_errors=True,
)

# 5. 运行
result = agent_executor.invoke({
    "input": "搜索一下 LangChain 的最新版本，并计算 42 的平方根"
})
print(result["output"])
```

### 工具定义最佳实践

工具描述（`docstring`）对 Agent 的决策质量至关重要，LLM 完全依赖描述来判断何时、如何使用工具。

```python
@tool
def query_database(sql: str) -> str:
    """
    执行 SQL 查询并返回结果。
    
    适用场景：
    - 查询用户订单数量、销售数据等结构化信息
    - 支持 SELECT 语句，不支持 INSERT/UPDATE/DELETE
    
    参数：
    - sql: 标准 SQL SELECT 语句，表名需与数据库实际一致
    
    返回：
    - JSON 格式的查询结果，或错误信息
    
    示例输入：SELECT COUNT(*) FROM orders WHERE status = 'paid'
    """
    # 实际数据库查询逻辑
    ...
```

## Plan-and-Execute：面向复杂任务的分层架构

对于步骤较多、需要全局规划的任务，ReAct 的"边想边做"方式容易陷入局部最优。**Plan-and-Execute** 架构将规划与执行解耦：

```
① Planner（规划者）：基于用户目标，一次性生成完整执行计划
    ↓
② Executor（执行者）：逐步执行每个子任务，并将结果更新到计划中
    ↓
③ Replanner（重规划）：根据执行结果，动态调整后续计划
    ↓
④ 判断：任务是否完成？否 → 回到②  是 → 输出最终结果
```

```python
from langchain_experimental.plan_and_execute import (
    PlanAndExecute,
    load_agent_executor,
    load_chat_planner,
)

# 规划者：使用强推理能力的模型
planner = load_chat_planner(ChatOpenAI(model="gpt-4o", temperature=0))

# 执行者：可以使用更快/便宜的模型
executor = load_agent_executor(
    ChatOpenAI(model="gpt-4o-mini", temperature=0),
    tools,
    verbose=True,
)

agent = PlanAndExecute(planner=planner, executor=executor, verbose=True)
result = agent.invoke({"input": "分析最近一周的销售数据，找出增长最快的商品类目"})
```

## Multi-Agent：多智能体协作

对于非常复杂的任务，单个 Agent 往往难以胜任，**Multi-Agent** 架构通过多个专业 Agent 协作来解决问题。

```
                    ┌─────────────────┐
                    │   Supervisor    │  ← 分配任务、协调各 Agent
                    └────────┬────────┘
           ┌─────────────────┼─────────────────┐
           ↓                 ↓                 ↓
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ 搜索 Agent  │  │ 代码 Agent  │  │ 分析 Agent  │
    └─────────────┘  └─────────────┘  └─────────────┘
```

使用 LangGraph 实现多 Agent 工作流：

```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import create_react_agent
from typing import TypedDict, Annotated
import operator

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    next: str

# 创建专业 Agent
search_agent = create_react_agent(llm, [DuckDuckGoSearchRun()])
code_agent = create_react_agent(llm, [PythonREPLTool()])

def supervisor_node(state: AgentState):
    """Supervisor 决定下一个执行的 Agent"""
    # 基于当前状态决定路由
    ...

# 构建工作流图
workflow = StateGraph(AgentState)
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("search", lambda s: search_agent.invoke(s))
workflow.add_node("code", lambda s: code_agent.invoke(s))

workflow.set_entry_point("supervisor")
workflow.add_conditional_edges(
    "supervisor",
    lambda s: s["next"],
    {"search": "search", "code": "code", "FINISH": END},
)
workflow.add_edge("search", "supervisor")
workflow.add_edge("code", "supervisor")

app = workflow.compile()
```

## Agent 记忆管理

记忆是 Agent 保持上下文连贯性的关键，分为以下几种类型：

### 短期记忆（In-Context Memory）

直接存储在 LLM 上下文窗口中，成本高但访问快，适合单次会话内的状态跟踪：

```python
from langchain.memory import ConversationBufferWindowMemory

# 只保留最近 5 轮对话
memory = ConversationBufferWindowMemory(k=5, return_messages=True)
```

### 长期记忆（External Memory）

借助向量数据库实现语义检索，适合跨会话的知识积累：

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.memory import VectorStoreRetrieverMemory

embeddings = OpenAIEmbeddings()
vectorstore = Chroma(embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# 每次检索与当前输入最相关的 3 条历史记忆
memory = VectorStoreRetrieverMemory(retriever=retriever)
```

## 工程化关键实践

### 1. 设置合理的执行限制

```python
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    max_iterations=15,          # 防止无限循环
    max_execution_time=60,      # 最长执行 60 秒
    early_stopping_method="generate",  # 超限时生成最终答案而非报错
)
```

### 2. 错误处理与重试

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
)
def run_agent_with_retry(query: str):
    return agent_executor.invoke({"input": query})
```

### 3. 结构化输出

使用 Pydantic 约束 Agent 的输出格式，提高下游处理的可靠性：

```python
from pydantic import BaseModel, Field
from langchain_core.output_parsers import PydanticOutputParser

class AnalysisResult(BaseModel):
    summary: str = Field(description="分析摘要，不超过 100 字")
    key_findings: list[str] = Field(description="3-5 条关键发现")
    confidence: float = Field(description="置信度，0-1 之间", ge=0, le=1)

parser = PydanticOutputParser(pydantic_object=AnalysisResult)
```

### 4. 可观测性：Tracing 与监控

```python
import langsmith
from langchain.callbacks import LangChainTracer

# 启用 LangSmith 追踪（需设置 LANGCHAIN_API_KEY 环境变量）
tracer = LangChainTracer(project_name="my-agent-project")

result = agent_executor.invoke(
    {"input": query},
    config={"callbacks": [tracer]},
)
```

## 常见问题与调试技巧

::: warning 工具调用失败
LLM 生成的工具参数格式可能不符合预期。解决方案：
- 在工具描述中提供**具体示例**
- 使用 `handle_parsing_errors=True` 让 Agent 自动重试
- 对关键工具添加参数校验和清晰的错误提示
:::

::: tip 减少 Token 消耗
- 使用 `ConversationSummaryMemory` 压缩长对话历史
- 对工具返回结果进行截断或摘要，避免大量原始内容占满上下文
- 对简单任务使用 `gpt-4o-mini` 等轻量模型，复杂规划才用 `gpt-4o`
:::

## 总结

AI Agent 开发的核心在于**任务分解 + 工具调用 + 迭代执行**。选择合适的架构模式是成功的关键：

- **ReAct**：适合中等复杂度、工具调用次数有限的任务
- **Plan-and-Execute**：适合步骤多、需要全局规划的长任务
- **Multi-Agent**：适合需要多领域专业能力协作的复杂任务

随着 LangChain、LangGraph、AutoGen 等框架的成熟，AI Agent 的工程化门槛正在快速降低，但**工具设计的质量**和**对 LLM 能力边界的理解**依然是决定 Agent 表现的核心因素。
