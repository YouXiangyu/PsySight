export const reportDetailCopy = {
  loading: '正在生成你的专属报告...',
  actions: {
    savePdf: '保存为 PDF',
  },
  hero: {
    badge: 'PsySight 心理评估报告',
    title: '心理测评分析报告',
    description: '这份报告结合你的量表结果与可用辅助数据生成，用于帮助你更清晰地理解当前状态。',
    encouragement: '完成测评已经是一次认真照顾自己的行动。',
  },
  meta: {
    subject: '测评对象',
    completedAt: '完成时间',
    assessmentType: '测评类型',
    anonymousUser: '匿名用户',
    signedInUser: '登录用户',
    aiComposite: 'AI 综合评估',
  },
  urgent: {
    title: '建议优先寻求专业帮助',
    helperText: '如有需要，请优先联系学校心理中心、医院精神心理科或当地危机干预热线。',
  },
  metrics: {
    totalScore: '总分',
    severity: '严重程度',
    emotionConsent: '情绪采集',
    consentEnabled: '已开启',
    consentDisabled: '未开启',
    severityFallback: '待评估',
  },
  scoreExplanation: {
    title: '分值说明',
  },
  reportContent: {
    title: 'AI 报告解读',
    description: '结合本次量表结果、分级和辅助分析，帮助你快速把握当前状态与重点关注方向。',
    emptyTitle: '报告内容暂时不可用',
    emptyDescription: '这份报告的正文暂时没有成功加载，可以稍后重试或先返回聊天室。',
  },
  emotionSection: {
    title: '作答期间的情绪分布',
    description: '仅在本次测评开启情绪采集时显示，用于辅助理解作答过程中的情绪波动。',
    emptyTitle: '本次测评未记录情绪分布',
    emptyDescription: '如果后续需要，你可以在新的测评中开启情绪采集，以获得更细的状态参考。',
  },
  disclaimer: {
    title: '非医疗声明',
    description:
      '本报告由人工智能生成，基于统计概率和通用心理学原则，仅供自我观察与支持参考，不构成正式医学建议、心理诊断或治疗方案。如你感到明显痛苦、出现自伤想法或现实风险，请立即联系专业医疗机构。',
  },
  stats: {
    title: '相关匿名统计观察',
    description: '下方统计数据用于提供整体样本背景，帮助你把这份报告放回更广的趋势视角中理解。',
  },
  fallbackErrors: {
    load: '报告加载失败，请稍后重试。',
    invalidId: '报告编号无效。',
  },
} as const;
