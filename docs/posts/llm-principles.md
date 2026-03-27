---
title: "大语言模型核心原理：从 Transformer 到 ChatGPT"
date: "2026-03-15"
category: "AI"
tags: ["ai", "llm", "transformer", "gpt", "原理"]
description: "系统梳理大语言模型（LLM）的技术发展脉络，深入讲解 Transformer 架构、预训练与微调机制，以及 RLHF 对齐技术。"
---

# 大语言模型核心原理：从 Transformer 到 ChatGPT

大语言模型（Large Language Model，LLM）是当前 AI 浪潮的核心驱动力。理解其底层原理，不仅有助于更好地使用模型，也能在工程实践中做出更合理的技术决策。本文将从 Transformer 架构出发，逐层拆解 LLM 的工作机制。

## Transformer 架构：LLM 的基石

2017 年，Google 提出的 Transformer 架构彻底改变了自然语言处理领域。其核心创新是**自注意力机制（Self-Attention）**，使模型能够并行处理序列中任意位置的依赖关系，打破了 RNN/LSTM 的顺序处理瓶颈。

### 自注意力机制

自注意力的核心思想是：计算序列中每个位置与其他所有位置的相关性，并以此加权聚合信息。

```
输入序列: ["我", "喜欢", "自然", "语言", "处理"]

对于"自然"这个词，模型计算它与其他词的注意力权重：
- "我"    → 0.05
- "喜欢"  → 0.10
- "自然"  → 0.15  ← 自身
- "语言"  → 0.55  ← 强相关（组成"自然语言"）
- "处理"  → 0.15  ← 较强相关

最终"自然"的表示 = 加权求和所有词的值向量（Value）
```

数学上，注意力计算公式为：

```
Attention(Q, K, V) = softmax(QK^T / √d_k) × V
```

其中 Q（Query）、K（Key）、V（Value）分别是输入经过不同线性变换得到的矩阵，`√d_k` 是缩放因子，防止点积结果过大导致梯度消失。

### 多头注意力（Multi-Head Attention）

单个注意力头只能捕捉一种类型的依赖关系。多头注意力通过并行运行 `h` 个注意力头，让模型同时从不同角度理解输入：

```python
# 伪代码示意
def multi_head_attention(Q, K, V, num_heads=8):
    head_outputs = []
    for i in range(num_heads):
        # 每个头有独立的线性变换参数
        Q_i = linear_q[i](Q)
        K_i = linear_k[i](K)
        V_i = linear_v[i](V)
        head_outputs.append(attention(Q_i, K_i, V_i))
    
    # 拼接所有头的输出并做最终线性变换
    return linear_out(concat(head_outputs))
```

### Transformer 解码器（GPT 的核心）

GPT 系列模型使用的是 **Transformer Decoder-Only** 架构，与编码器的关键区别是使用**因果掩码（Causal Mask）**：在预测第 `t` 个 token 时，只能看到位置 `1` 到 `t-1` 的信息，这保证了自回归生成的合理性。

```
输入:  ["<BOS>", "今天", "天气"]
预测:   ["今天",   "天气",  "很好"]
             ↑       ↑       ↑
         每个位置只能看到它左边的所有 token
```

## 预训练：海量数据中学习语言规律

LLM 的强大能力来源于在**超大规模语料**上进行**自监督预训练**。以 GPT 为代表的自回归语言模型的训练目标很简单：

> **给定前面的 token 序列，预测下一个 token 的概率分布**

这个看似简单的目标，迫使模型学习语法、语义、逻辑推理、世界知识等几乎所有语言理解能力。

### 训练规模的影响

研究表明，模型参数量和训练数据量的增加会带来**涌现能力（Emergent Abilities）**——一些能力只在模型规模超过某个阈值后才突然出现，例如：

| 模型规模 | 典型涌现能力 |
|---------|------------|
| ~7B 参数 | 基础指令跟随、简单推理 |
| ~70B 参数 | 复杂推理、代码生成、多步骤规划 |
| ~175B+ 参数 | 少样本学习、类比推理、跨语言迁移 |

### Tokenization：文本的数字化表示

LLM 处理的不是原始字符，而是**Token**。主流的 BPE（Byte Pair Encoding）算法通过统计高频字节对，将文本分割为子词单元：

```python
# 示例：使用 tiktoken（OpenAI 的 tokenizer）
import tiktoken

enc = tiktoken.encoding_for_model("gpt-4o")
tokens = enc.encode("大语言模型")
print(tokens)  # [14149, 35882, 17082, 9211]
print(len(tokens))  # 4 个 token

# 中文通常每个汉字对应 1-2 个 token
# 英文单词通常对应 1-3 个 token
```

理解 Tokenization 对于成本控制和 Prompt 优化非常重要：**中文通常比英文消耗更多 Token**。

## 有监督微调（SFT）：让模型学会对话

预训练完成的"基础模型"（Base Model）虽然知识丰富，但不会遵循指令，也不会以对话方式回答问题。**有监督微调（Supervised Fine-Tuning, SFT）** 通过在高质量的"指令-回复"对数据上继续训练，让模型学会如何有用地回应用户。

```
SFT 数据示例：
{
  "instruction": "用一句话解释什么是量子纠缠",
  "output": "量子纠缠是指两个粒子之间存在一种特殊关联，无论相距多远，对其中一个粒子的测量会瞬间影响另一个粒子的状态。"
}
```

### LoRA：高效微调技术

全量微调需要更新数十亿参数，成本极高。**LoRA（Low-Rank Adaptation）** 通过只训练低秩分解矩阵，以极少的可训练参数实现接近全量微调的效果：

```python
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3-8B")

lora_config = LoraConfig(
    r=16,                   # 低秩矩阵的秩
    lora_alpha=32,          # 缩放系数
    target_modules=["q_proj", "v_proj"],  # 应用 LoRA 的层
    lora_dropout=0.05,
    task_type="CAUSAL_LM",
)

# 只有约 0.1% 的参数是可训练的
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# trainable params: 4,194,304 || all params: 8,030,261,248 || trainable%: 0.05%
```

## RLHF：对齐人类偏好

即便经过 SFT，模型仍可能产生不准确、有害或不符合用户期望的回答。**RLHF（Reinforcement Learning from Human Feedback，基于人类反馈的强化学习）** 通过以下三个阶段解决对齐问题：

```
阶段一：SFT
收集人工编写的高质量回复 → 有监督微调基础模型

阶段二：训练奖励模型（Reward Model）
人工标注员对同一问题的多个回复进行排序
→ 训练一个能预测人类偏好分数的奖励模型

阶段三：PPO 强化学习
以奖励模型的评分作为反馈信号
→ 使用 PPO 算法优化 SFT 模型
→ 同时加入 KL 散度约束，防止模型偏离太远
```

### DPO：RLHF 的简化替代方案

RLHF 的训练流程复杂，稳定性差。**DPO（Direct Preference Optimization）** 将偏好学习简化为一个分类损失，无需单独训练奖励模型：

```python
# DPO 损失函数示意
def dpo_loss(chosen_logprobs, rejected_logprobs, ref_chosen_logprobs, ref_rejected_logprobs, beta=0.1):
    """
    chosen: 人类偏好的回复
    rejected: 人类不偏好的回复
    ref_*: 参考模型（SFT 模型）的对数概率
    """
    chosen_ratio = chosen_logprobs - ref_chosen_logprobs
    rejected_ratio = rejected_logprobs - ref_rejected_logprobs
    loss = -torch.log(torch.sigmoid(beta * (chosen_ratio - rejected_ratio)))
    return loss.mean()
```

## 推理阶段：生成策略的影响

LLM 生成文本时，每步从词表概率分布中采样下一个 Token，不同的采样策略会显著影响输出质量：

```python
from transformers import pipeline

generator = pipeline("text-generation", model="gpt2")

# 贪心解码：每步选概率最高的 token，输出确定但容易重复
output = generator(prompt, do_sample=False)

# Top-K 采样：只从概率最高的 K 个 token 中采样
output = generator(prompt, do_sample=True, top_k=50)

# Top-P（核采样）：从累计概率达到 P 的最小 token 集中采样
output = generator(prompt, do_sample=True, top_p=0.9)

# Temperature：调节概率分布的"平坦程度"
# temperature < 1：更集中，输出更确定
# temperature > 1：更分散，输出更多样
output = generator(prompt, do_sample=True, temperature=0.7)
```

::: tip 参数选择建议
- **代码生成、数学计算**：低 temperature（0.1~0.3），确保准确性
- **创意写作、头脑风暴**：高 temperature（0.7~1.0），增加多样性
- **通用对话**：temperature 0.7 + top_p 0.9 是常用组合
:::

## 上下文窗口与长文本处理

早期 GPT 模型的上下文窗口只有 4K tokens，而最新模型已扩展到数百万 tokens。但更长的上下文并不总是更好：

| 挑战 | 说明 |
|------|------|
| 计算复杂度 | 注意力计算是 O(n²)，长文本推理成本极高 |
| "迷失在中间" | 模型更容易关注开头和结尾，中间信息易被忽略 |
| 幻觉增加 | 上下文过长时，模型产生幻觉的概率上升 |

::: warning 实践建议
对于长文档处理任务，通常更好的选择是使用 **RAG（检索增强生成）** 而非直接填满上下文窗口，这样既能降低成本，又能提高答案的准确性。
:::

## 总结

理解 LLM 的技术原理，可以帮助我们在工程实践中做出更好的决策：

- **Transformer 的自注意力机制** 使模型能够捕捉长距离依赖，是理解 LLM 能力的基础
- **预训练的规模** 决定了模型的知识储备和基础推理能力
- **SFT + RLHF/DPO** 让模型从"知识库"变成"有用的助手"
- **采样策略和 Temperature** 直接影响输出质量，需要针对不同任务调整
- **上下文窗口** 的合理使用是控制成本和提升质量的关键工程考量
