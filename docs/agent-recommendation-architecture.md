# Agent Recommendation Architecture

## 目标

这套架构要解决 5 个核心问题：

1. 用户明确说“我需要 xx 量表”时，首轮就能给出推荐。
2. 即便用户还没把意图说得很完整，也能在 2-3 轮内累计证据并推荐量表。
3. 不只听表层关键词，还能从“话中话”里提取隐藏需求，并给候选量表加分。
4. 同一主题下的量表要能按题量、深度、适用场景、紧迫性做区分。
5. Agent 不再只做泛泛共情，而是带着一个明确目标推进对话。

## 总体分层

推荐链路现在拆成 4 层：

1. `catalog`
   - 文件：`agent/recommendation/catalog.py`
   - 作用：维护量表画像。
   - 内容：`domains`、`focus_tags`、`clinical_focus`、`question_count`、`assessment_depth`、`question_style`、`clarifying_question` 等。

2. `engine`
   - 文件：`agent/recommendation/engine.py`
   - 作用：把用户当前输入和历史状态转成“推荐计划”。
   - 输出：`scale_scores`、`ranked_candidates`、`recommended_scales`、`conversation_goal`、`follow_up_question`。

3. `router / nodes`
   - `router` 负责规则优先路由，首轮显式量表需求直接进 `test_handoff`。
   - `empathy` 负责聊天中的渐进式推荐和目的性追问。
   - `test_handoff` 负责显式需求下的确定性输出。

4. `UI payload`
   - 后端返回推荐结果时，同时带回 `question_count`、`assessment_depth`、`reason` 等解释字段。
   - 前端推荐卡片可以展示“题量 + 定位 + 理由”。

## 推荐计划的数据结构

`build_recommendation_plan()` 会生成一份统一计划：

- `analysis`
  - `explicit_request`
  - `direct_signals`
  - `latent_needs`
  - `domains`
  - `urgency`
  - `duration`
  - `assessment_preference`
- `scale_scores`
  - 跨轮累计后的量表分数
- `ranked_candidates`
  - 当前最高优先级候选
- `recommended_scales`
  - 当前应该暴露给用户的量表
- `conversation_goal`
  - 这一轮回复的推进目标
- `follow_up_question`
  - 这一轮末尾应该落下的定向问题

这样做的关键点是：LLM 不再决定“该不该推荐”，而是只负责把计划说得自然。

## 打分模型

每个量表分数由 5 类信号组成：

1. 显式点名
   - 用户直接说出量表名、英文 code、或“我要一个失眠量表”这类明确需求。

2. 直接信号
   - 来自用户表层描述的关键词。
   - 例如：`失眠`、`夜醒`、`担心别人怎么看我`、`能躲就躲`。

3. 隐藏需求
   - 通过上下文抽取更深一层的意图。
   - 例如：`social_avoidance`、`chronic_sleep`、`brief_screening`、`deep_assessment`。

4. 推荐偏好
   - 题量偏好、紧迫性、希望快一点还是更完整。

5. 历史累积
   - `scale_scores` 会按衰减系数跨轮保留。
   - 这让“第一轮弱信号、第二轮补证据”的场景能稳定收敛。

## 决策节奏

### 首轮直推

当满足下面任一条件时，允许首轮直接推荐：

- 用户显式要求量表
- 某一主题的证据分明显超过阈值
- 某个量表被直接点名

### 2-3 轮内收敛

如果首轮信号不够强：

- 第一轮先记分，不急着推
- 第二轮继续累计
- 达到阈值后在 `empathy` 节点自然推荐

### 广谱兜底

如果用户明确想做量表，但方向还不够清楚：

- 先退到 `K10 / DASS-21 / SCL-90` 这类广谱筛查
- 避免“用户已经想测了，Agent 却一直不敢给”

## 目的性对话

每轮回复都有一个明确目标，而不是只做情绪性回应。

例如睡眠问题：

- 如果分数更偏 `AIS`
  - 追问目标：确认是不是长期入睡困难 / 夜醒 / 早醒
- 如果分数更偏 `PSQI`
  - 追问目标：确认是不是整体睡眠质量下降并影响白天

例如社交焦虑：

- 如果 `SIAS` 分更高
  - 追问目标：确认是“互动本身紧张”，还是更一般性的担心和压力

## 当前已落地的策略点

1. 规则优先路由
   - 显式“我要量表”直接走 `want_test`

2. 策略驱动共情
   - `empathy` 节点先算推荐计划，再让 LLM 生成回复

3. 隐藏需求加分
   - 例如 `social_avoidance`、`brief_screening`

4. 同域量表区分
   - 例如 `AIS` vs `PSQI`

5. 推荐解释字段下发
   - 前端可展示题量、深度、推荐理由

## 后续建议

还有 4 个自然的下一步：

1. 把 `catalog.py` 从硬编码迁到结构化配置
   - 例如 `agent/recommendation/catalog/*.yaml`
   - 方便产品和心理学侧共同维护

2. 增加“量表冲突抑制”
   - 同域候选太多时，避免一次推太多相近量表

3. 引入用户画像偏置
   - 结合 `user_profile` 给题量耐受度、沟通风格、学生场景加先验分

4. 建推荐回放日志
   - 把每轮的 `analysis / ranked_candidates / recommended_scales` 写入调试日志
   - 后续调参会非常快
