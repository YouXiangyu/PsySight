# PsySight (心理委员俺不得劲) 项目规划书

**创建时间**: 2026-01-13
**状态**: 规划阶段

## 1. 项目简介
PsySight 是一款智能心理健康助手，旨在通过多模态交互（文本聊天、人脸表情监测、绘画投射）为用户提供心理筛查与支持。

> **重要声明**: 本项目为非医疗工具，仅用于支持与筛查，不作为医学诊断依据。

## 2. 技术架构
- **前端**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **后端**: Flask (Python), MySQL, SQLAlchemy
- **AI**: Google Gemini 3 Flash (Text & Vision)
- **多模态**: `face-api.js` (前端情绪识别), `react-signature-canvas` (心理绘画)

## 3. 核心目录结构规划

### 后端 (backend/)
- `app.py`: Flask 应用入口，定义路由与接口。
- `models.py`: SQLAlchemy 数据库模型 (User, Scale, AssessmentRecord)。
- `seed.py`: 数据库初始化脚本，预填心理量表数据。
- `.env`: 环境变量 (数据库连接、Gemini API Key)。

### 前端 (frontend/)
- `app/`: Next.js App Router 页面结构。
- `components/`: 可复用组件 (ChatWindow, FaceMonitor, ScaleForm, DrawingCanvas)。
- `lib/`: 工具类与 API 请求配置 (Axios/Fetch)。

## 4. 开发计划
- [ ] **Step 1**: 后端基础架构与数据库模型 (models.py, seed.py)。
- [ ] **Step 2**: 后端 API 逻辑集成 Gemini (chat, submit, analyze)。
- [ ] **Step 3**: 前端项目初始化与 API 层封装。
- [ ] **Step 4**: 聊天与测评界面开发，集成 FaceMonitor。
- [ ] **Step 5**: 绘图板与报告详情页。
