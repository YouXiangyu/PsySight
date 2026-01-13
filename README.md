# PsySight (心理委员俺不得劲)

**更新时间**: 2026-01-13
**项目状态**: 开发中

## 1. 项目概述
PsySight 是一个基于 Next.js 和 Flask 构建的心理健康辅助工具。它通过 AI 聊天、心理量表测评、人脸表情监测以及绘画投射分析，为用户提供多维度的心理状态评估。

> **⚠️ 重要免责声明**: 
> 本工具仅供心理支持与筛查参考，其生成的任何报告和建议均不构成医疗诊断或专业心理治疗建议。如有严重心理困扰，请务必寻求专业医疗机构的帮助。

## 2. 核心功能
- **智能分诊聊天**: 基于 Gemini 3 Flash 的 AI 助手，提供情绪安抚并推荐相关心理量表。
- **多模态测评**: 在进行标准心理量表（如 PHQ-9）测试时，通过 `face-api.js` 在客户端实时监测表情。
- **AI 综合报告**: 整合得分、聊天背景及测评时的情绪数据，生成个性化的 Markdown 报告。
- **绘画分析**: 提供绘图板，利用视觉 AI 对用户画作进行“房树人”心理投射分析。

## 3. 技术栈
- **前端**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **后端**: Flask, SQLAlchemy (MySQL), Gemini API SDK
- **算法**: `face-api.js`

## 4. 快速开始 (开发环境)

### 后端设置
1. 进入 `backend` 目录。
2. 创建虚拟环境: `python -m venv venv`。
3. 安装依赖: `pip install -r requirements.txt` (待生成)。
4. 配置 `.env` 文件。
5. 运行迁移或种子脚本: `python seed.py`。

### 前端设置
1. 进入 `frontend` 目录。
2. 安装依赖: `npm install`。
3. 启动开发服务器: `npm run dev`。

---
© 2026 PsySight Team. Course Project.
