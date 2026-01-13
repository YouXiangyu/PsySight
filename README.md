# PsySight (心理委员俺不得劲)

**版本**: v4.0 (提案对应版本) | **状态**: 核心功能已跑通 | **更新时间**: 2026-01-14

## 1. 项目概述

**PsySight** 是一个专为大学生群体设计的**智能心理健康助理系统**。针对传统校内咨询预约难、门槛高以及纸质量表枯燥乏味的问题，我们利用 AI 大模型与计算机视觉技术，提供一个全天候在线、温暖共情的心理支持平台。

> **⚠️ 重要免责声明**: 
> 本系统仅提供心理健康筛查、情绪支持与自助建议，**不具备医疗诊断功能**。系统生成的报告仅供参考，如有严重心理危机（如自伤/自杀倾向），请务必寻求专业医生或急救热线的帮助。

## 2. 核心功能模块

### 💬 模块一：智能对话与分诊 (Chat & Triage)
- **温暖陪伴**: 基于 Gemini 3 Flash 的 AI 助手，以共情、非评判的态度倾听用户困扰。
- **智能推荐**: 自动分析对话内容（如“失眠”、“焦虑”），精准推荐对应的专业心理量表。
- **UI 体验**: 采用仿 ChatGPT 的沉浸式全屏对话界面。

### 📹 模块二：多模态量表评测 (Multimodal Assessment)
- **动态量表**: 支持 PHQ-9 (抑郁)、GAD-7 (焦虑)、AIS (失眠) 等标准量表。
- **情绪监测**: 利用 `face-api.js` 在客户端实时捕捉面部情绪（Happy, Sad, Neutral 等），辅助判断用户答题时的真实状态。
- **隐私保护**: 摄像头数据仅在本地/内存处理，不进行持久化存储。

### 📊 模块三：AI 综合报告 (Report)
- **多维分析**: 结合“量表得分”与“测试期间平均情绪分布”，生成个性化的心理分析报告。
- **行动建议**: 提供睡眠卫生、运动助眠、正念冥想等具体可执行的生活建议。

### 🎨 模块四：创意画板 (Canvas - 开发中)
- **房树人投射**: 提供在线绘图板，计划利用视觉大模型分析用户画作中的心理投射（暂未实装 Vision 模型）。

## 3. 已集成量表库

1. **PHQ-9 抑郁症筛查量表** (ID: 1)
2. **GAD-7 焦虑症筛查量表** (ID: 2)
3. **AIS 阿森斯失眠量表** (ID: 3)

## 4. 技术栈

- **前端**: Next.js 14 (App Router), TypeScript, Tailwind CSS, face-api.js
- **后端**: Flask, SQLAlchemy (SQLite/MySQL), Google Gemini API
- **部署**: 前后端分离架构

## 5. 快速开始 (本地开发)

### 后端 (Backend)
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python seed.py  # 初始化数据库并填充量表
python app.py   # 启动服务 (端口 5000)
```

### 前端 (Frontend)
```bash
cd frontend
npm install
npm run dev     # 启动服务 (端口 3000)
```

---
© 2026 PsySight Team. Course Project.
