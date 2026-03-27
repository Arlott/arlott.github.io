---
title: "Prompt Engineering 提示词工程：系统化指南"
date: "2026-03-10"
category: "AI"
tags: ["ai", "prompt", "llm", "工程化", "chatgpt"]
description: "从基础技巧到高级模式，系统讲解如何设计高质量 Prompt，涵盖 Few-Shot、Chain-of-Thought、结构化输出等核心技术。"
---

# Prompt Engineering 提示词工程：系统化指南

Prompt Engineering（提示词工程）是指通过精心设计输入文本，引导大语言模型产生更准确、更符合预期输出的技术。尽管最新的模型越来越智能，好的 Prompt 依然是提升 LLM 应用质量的最高性价比手段。

## 为什么 Prompt 设计如此重要？

同样的问题，不同的表达方式会得到截然不同的答案：

```
❌ 差的 Prompt：
"给我写段代码"

✅ 好的 Prompt：
"请用 TypeScript 编写一个函数，接收一个字符串数组，
返回其中长度大于 5 的字符串，按字母顺序排列。
要求：使用函数式编程风格，添加 JSDoc 注释。"
```

一个优秀的 Prompt 通常包含以下要素：

| 要素 | 说明 | 示例 |
|------|------|------|
| **角色（Role）** | 让模型扮演特定专家 | "你是一位资深 TypeScript 工程师" |
| **任务（Task）** | 明确具体要做什么 | "请审查以下代码并找出潜在问题" |
| **上下文（Context）** | 提供必要背景信息 | "这是一个高并发的金融交易系统" |
| **格式（Format）** | 指定输出结构 | "以 Markdown 表格格式返回结果" |
| **约束（Constraints）** | 设定边界条件 | "回答不超过 200 字，不使用专业术语" |

## 基础技巧

### 1. 角色扮演（Role Prompting）

给模型分配一个专业角色，能显著提升特定领域的输出质量：

```
你是一位拥有 15 年经验的系统架构师，精通分布式系统设计和微服务架构。
请从架构可扩展性、可维护性和性能角度，评估以下系统设计方案：

[系统设计方案...]
```

### 2. 明确输出格式

```
分析以下用户评论的情感倾向，以 JSON 格式返回结果：

评论："这个产品质量还不错，但物流太慢了，客服态度很好"

请按照以下格式返回：
{
  "overall": "正面/负面/中性",
  "aspects": [
    {"name": "产品质量", "sentiment": "正面/负面/中性", "score": 0-10},
    ...
  ],
  "summary": "一句话总结"
}
```

### 3. 提供示例（Few-Shot Learning）

通过提供输入-输出示例，让模型理解任务模式：

```
将以下非正式文本改写为正式商务语言。

示例 1：
输入：这个方案不行，太烂了
输出：该方案存在明显不足，建议重新评估并优化。

示例 2：
输入：你们的东西超级棒，下次还来
输出：贵司产品质量优异，服务专业，我们期待未来继续合作。

示例 3：
输入：这个价格有点贵，能不能便宜点
输出：目前报价略高于预算，能否在价格方面提供一定的灵活空间？

现在请改写：
输入：这个功能好用，但是 bug 有点多，希望快点修
输出：
```

## 高级技巧

### Chain-of-Thought（思维链）

对于需要多步推理的复杂问题，引导模型"展示思考过程"能大幅提升准确率：

```
❌ 直接问（容易出错）：
"一个商品原价 240 元，先打八折，再打九折，最终售价是多少？"

✅ 思维链（准确率更高）：
"一个商品原价 240 元，先打八折，再打九折，最终售价是多少？
请一步步计算：
第一步：计算打八折后的价格
第二步：在第一步结果基础上计算打九折后的价格
第三步：给出最终答案"
```

在代码中自动添加思维链触发词：

```python
def add_cot_prompt(question: str) -> str:
    """为复杂问题自动添加思维链触发"""
    return f"{question}\n\n请一步步思考，展示你的推理过程，最后给出结论。"

# 或者使用更简单的魔法短语
cot_triggers = [
    "让我们一步步思考",
    "Let's think step by step",
    "请详细说明推理过程",
]
```

::: tip Zero-Shot CoT
研究发现，仅仅在 Prompt 末尾加上 **"Let's think step by step"** 这句话，就能显著提升模型在复杂推理任务上的表现，这被称为 Zero-Shot Chain-of-Thought。
:::

### Self-Consistency（自洽性）

对同一问题采样多个回答，通过投票选出最一致的答案，提升推理可靠性：

```python
import asyncio
from collections import Counter
from openai import AsyncOpenAI

client = AsyncOpenAI()

async def self_consistency(question: str, n_samples: int = 5) -> str:
    """生成多个答案并投票选出最一致的结果"""
    tasks = [
        client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "user", "content": f"{question}\n请一步步推理后给出答案。"}
            ],
            temperature=0.7,  # 使用较高 temperature 增加多样性
        )
        for _ in range(n_samples)
    ]
    
    responses = await asyncio.gather(*tasks)
    answers = [r.choices[0].message.content for r in responses]
    
    # 提取最终答案（实际应用中需要更精细的答案提取逻辑）
    # 这里简化为选择出现最多的答案
    answer_counter = Counter(answers)
    return answer_counter.most_common(1)[0][0]
```

### Tree-of-Thought（思维树）

对于需要探索多种可能性的问题，Tree-of-Thought 让模型同时评估多条推理路径：

```
请解决以下问题，使用思维树方法：

问题：如何为一个月活 1000 万的电商平台设计优惠券系统？

请按以下步骤进行：
1. 提出 3 种不同的设计思路
2. 分别评估每种思路的优缺点（从性能、成本、用户体验三个维度）
3. 选择最优方案并给出详细设计
```

## 结构化输出控制

### 使用 JSON Mode

现代 LLM API 通常支持强制 JSON 输出模式：

```python
from openai import OpenAI
import json

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    response_format={"type": "json_object"},  # 强制 JSON 输出
    messages=[
        {
            "role": "system",
            "content": "你是一个数据分析助手，所有回答必须是合法的 JSON 格式。"
        },
        {
            "role": "user", 
            "content": """分析以下销售数据并以 JSON 格式返回：
            数据：1月100万，2月120万，3月80万，4月150万
            
            返回格式：
            {
                "total": 总销售额,
                "average": 月均销售额,
                "peak_month": "最高月份",
                "trend": "增长/下降/波动"
            }"""
        }
    ]
)

result = json.loads(response.choices[0].message.content)
print(result)
```

### 使用 Structured Outputs（OpenAI 最新特性）

```python
from pydantic import BaseModel
from openai import OpenAI

class SalesAnalysis(BaseModel):
    total: float
    average: float
    peak_month: str
    trend: str
    insights: list[str]

client = OpenAI()

completion = client.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[...],
    response_format=SalesAnalysis,  # 直接传入 Pydantic 模型
)

analysis = completion.choices[0].message.parsed
print(analysis.peak_month)  # 类型安全，有 IDE 补全
```

## System Prompt 设计最佳实践

System Prompt 是对话系统中最重要的 Prompt，决定了模型的整体行为基调：

```python
SYSTEM_PROMPT = """
你是「智析」，一位专业的数据分析助手，专为电商运营团队服务。

## 核心能力
- SQL 查询生成与优化
- 数据可视化建议（基于 ECharts）
- 业务指标解读与异动分析
- 竞品数据对比分析

## 行为准则
1. 始终使用中文回答
2. 数据分析结论必须附带置信度说明
3. 遇到数据异常时，主动提示可能的原因
4. 当问题超出数据分析范围时，礼貌说明并引导到正确方向

## 输出格式
- SQL 代码必须包含注释说明
- 分析报告使用 Markdown 格式，包含摘要、详细分析和建议三个部分
- 数字统一使用千分位格式（例：1,234,567）

## 禁止行为
- 不得编造或估算数据，未知数据应明确说明
- 不得给出超出数据范围的结论
"""
```

## 常见 Prompt 反模式

::: warning 避免这些常见错误

**1. 过于模糊的指令**
```
❌ "帮我优化这段代码"
✅ "请优化以下 Python 函数的性能，重点关注时间复杂度，
   保持函数签名不变，并说明优化原理"
```

**2. 假设模型有隐含知识**
```
❌ "按照我们公司的规范写"（模型不知道你公司的规范）
✅ "按照 Google Python 风格指南编写，具体要求：..."
```

**3. 一次性要求太多**
```
❌ "帮我写一个完整的电商系统，包含用户、商品、订单、
    支付、物流、评价、推荐所有模块"
✅ 拆分为多个子任务，逐一处理
```

**4. 没有提供反例**
对于分类任务，同时提供正例和反例能显著提升准确率。
:::

## Prompt 测试与迭代

Prompt 设计是一个需要持续迭代的工程过程：

```python
# 建立评估数据集
test_cases = [
    {
        "input": "苹果公司2023年营收是多少",
        "expected_type": "数字答案",
        "evaluation_criteria": ["包含具体数字", "说明数据来源", "使用正确单位"],
    },
    {
        "input": "解释量子计算",
        "expected_type": "概念解释",
        "evaluation_criteria": ["深度合适", "举有具体例子", "避免过度简化"],
    },
]

def evaluate_prompt(prompt_template: str, test_cases: list) -> dict:
    """评估 Prompt 在测试集上的表现"""
    results = []
    for case in test_cases:
        response = call_llm(prompt_template.format(input=case["input"]))
        score = manual_or_llm_evaluate(response, case["evaluation_criteria"])
        results.append({"case": case["input"], "score": score, "response": response})
    
    return {
        "average_score": sum(r["score"] for r in results) / len(results),
        "details": results,
    }

# 对比不同版本的 Prompt
v1_score = evaluate_prompt(PROMPT_V1, test_cases)
v2_score = evaluate_prompt(PROMPT_V2, test_cases)
print(f"V1: {v1_score['average_score']:.2f}, V2: {v2_score['average_score']:.2f}")
```

## 总结

Prompt Engineering 的本质是**降低歧义、提供充足上下文、引导模型沿正确路径推理**。核心原则：

1. **具体胜于模糊**：尽可能明确任务要求、输出格式和约束条件
2. **示例胜于描述**：用具体例子说明你想要的效果
3. **分解复杂任务**：将复杂问题拆解为模型能可靠完成的子任务
4. **持续测试迭代**：建立评估数据集，量化改进效果
5. **了解模型特性**：不同模型对 Prompt 的敏感度不同，需要针对性调整

随着模型能力的持续提升，Prompt Engineering 的重心正在从"让模型理解任务"转向"让模型以正确方式完成任务"——这种能力将长期保持其工程价值。
