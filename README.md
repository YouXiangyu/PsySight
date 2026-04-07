# PsySight

**创建时间**: 2026-01-14 | **更新时间**: 2026-04-06
**版本**: v6.0 | **状态**: LangGraph Agent 架构已集成

## 1. 项目概述

**PsySight** 是一个面向大学生的智能心理健康助理系统。系统提供倾诉对话、专业量表、情绪辅助分析、心理报告与危机守护能力，帮助用户在低门槛、低压力的环境中完成心理自助筛查与支持。

- 匿名或登录状态下的情绪倾诉与 AI 对话
- 常见心理量表的作答、评分与报告查看
- 危机关键词识别与求助提示
- 绘画表达、房树人等非文字化表达
- 匿名群体统计展示与管理员导出

> **免责声明**
> 本系统仅用于心理健康筛查、情绪支持与自助建议，不构成医疗诊断或治疗方案。若存在自伤/自杀风险，请立即联系专业机构与紧急热线。

## 2. 系统架构

项目采用三服务架构：

```
Next.js (8003)          ← 前端 UI
  ├── /api/agent/*  →  FastAPI (8005)   ← AI Agent (LangGraph)
  └── /api/*        →  Flask   (8004)   ← 业务后端
```

| 服务 | 端口 | 职责 |
|------|------|------|
| **Next.js 14** | 8003 | 前端页面、rewrite 代理 |
| **Flask** | 8004 | 用户认证、量表 CRUD、报告、统计、数据持久化 |
| **FastAPI** | 8005 | LangGraph Agent、意图路由、共情对话、量表 RAG 推荐、会话总结 |

## 3. 核心能力

### 3.1 AI Agent (LangGraph)
- **意图路由**：自动识别用户意图（倾诉/想测试/拒绝测试/危机/寒暄）
- **共情对话**：基于用户长期画像动态调整语气，提供温暖专业的心理支持
- **智能量表推荐**：双检索模式（关键词索引 / BGE 向量 RAG），自然语言推荐
- **双模型切换**：DeepSeek V3.2（快速）与 DeepSeek V3.2-exp-think（深度思考），前端一键切换
- **危机检测**：硬规则优先，零延迟，命中即阻断并展示热线
- **会话总结**：对话结束后 LLM 自动提取用户画像，跨会话记忆

### 3.2 智能倾诉空间
- 共情对话 + 规则兜底推荐量表
- 登录用户支持历史会话列表与上下文恢复
- 每条 AI 回复支持点赞/点踩反馈记录
- 危机关键词触发强提醒求助卡片

### 3.3 专业评测与报告
- 44 个心理量表库，分类展示，含题目数与预计用时
- 作答过程支持进度、预计剩余时间、暂停与继续
- 人脸情绪采集为可选能力（默认关闭）
- 报告包含总分、严重程度、个性化建议、情绪分布可视化
- 报告页支持浏览器打印导出 PDF

### 3.4 创意表达与投射分析
- 画板支持画笔、橡皮、颜色、清空、撤销
- 支持房树人引导勾选与自述补充
- 基于绘画元数据 + 文本描述生成温暖解读

### 3.5 安全守护
- 全局固定"紧急求助"入口
- 内置心理援助热线列表
- 高分值时报告顶部优先展示专业求助建议

## 4. 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Next.js 14 (App Router), TypeScript, Tailwind CSS, face-api.js, Lucide Icons |
| 业务后端 | Flask, SQLAlchemy, SQLite |
| AI Agent | FastAPI, LangGraph, LangChain, DeepSeek V3.2 API |
| 量表检索 | BGE-small-zh (sentence-transformers), NumPy 内存向量计算 |
| 通信 | REST API, httpx (agent → flask 内部通信) |

## 5. 本地开发

### 5.1 业务后端 (Flask)
```bash
cd backend
pip install -r requirements.txt
copy .env.example .env   # 填写 DEEPSEEK_API_KEY 等
python seed.py            # 导入量表数据
python run.py             # 默认端口 8004
```

### 5.2 AI Agent (FastAPI)
```bash
cd agent
pip install -r requirements.txt
# 共用 backend/.env 或单独配置环境变量
python main.py            # 默认端口 8005
```

### 5.3 前端 (Next.js)
```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev               # 默认端口 8003
```

### 5.4 启动顺序
1. Flask (8004) — 数据服务先启动
2. FastAPI (8005) — Agent 依赖 Flask 内部 API
3. Next.js (8003) — 前端代理到两个后端

## 6. 关键环境变量

### 业务后端 (backend/.env)
| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 |
| `DEEPSEEK_MODEL` | 模型名（默认 deepseek-reasoner，旧版兼容） |
| `DATABASE_URL` | 数据库连接串（默认 sqlite:///psysight.db） |
| `SECRET_KEY` | Flask session 密钥 |
| `FRONTEND_ORIGIN` | CORS 允许的前端 origin |
| `ADMIN_EXPORT_TOKEN` | 管理员导出 token |
| `INTERNAL_API_TOKEN` | Agent 服务内部通信 token |

### AI Agent (agent/ 环境变量)
| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 |
| `DEEPSEEK_MODEL_FAST` | 快速模型（默认 deepseek-chat，可按控制台改名） |
| `DEEPSEEK_MODEL_THINK` | 推理/思考模型（默认 deepseek-reasoner） |
| `FLASK_INTERNAL_URL` | Flask 内部 API 地址（默认 http://127.0.0.1:8004） |
| `INTERNAL_API_TOKEN` | 内部通信 token（需与 Flask 一致） |
| `AGENT_PORT` | Agent 服务端口（默认 8005） |

### 前端 (frontend/.env.local)
| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_API_BASE_URL` | API base URL（默认 /api） |
| `BACKEND_URL` | Flask 代理目标（默认 http://127.0.0.1:8004） |
| `AGENT_URL` | Agent 代理目标（默认 http://127.0.0.1:8005） |

## 7. 项目结构

```
PsySight/
├── frontend/          Next.js 14 前端
│   ├── app/           页面路由
│   ├── components/    全局组件
│   ├── features/      业务模块 (chat/assessment/canvas/...)
│   └── shared/api/    API 客户端
├── backend/           Flask 业务后端
│   ├── api/routes/    路由层
│   ├── application/   服务层
│   ├── domain/rules/  领域规则
│   ├── infrastructure/ai/  旧版 AI 调用（保留兼容）
│   └── data/scales/   量表 JSON 源数据
├── agent/             FastAPI AI Agent
│   ├── graph/         LangGraph 图定义与节点
│   ├── retrieval/     量表检索（索引 + RAG）
│   ├── llm/           DeepSeek 客户端与 Prompt
│   ├── models/        PsyState 与 Pydantic 模型
│   └── memory/        LangGraph 状态持久化
└── docs/              项目文档与架构图
```

---

&copy; 2026 PsySight Team. Course Project.
