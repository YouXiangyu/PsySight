'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ShieldAlert, ShieldCheck, FileText, Calendar, User, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import StatsBoard from '@/features/stats/components/StatsBoard';
import { useReportDetail } from '@/features/report/hooks/useReportDetail';

export default function ReportPage() {
  const { id } = useParams();
  const { record, stats, loading, errorMsg, subjectName } = useReportDetail(Number(id));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium">正在生成您的专属报告...</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen p-4 md:p-12 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={18} className="mr-1" /> 返回首页
          </Link>
          <button onClick={() => window.print()} className="flex items-center text-sm font-bold text-indigo-600 bg-white px-4 py-2 rounded-lg border border-indigo-100 shadow-sm hover:shadow-md transition-all">
            <Download size={16} className="mr-2" /> 保存 PDF
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* 页眉 */}
          <div className="bg-indigo-600 p-8 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <ShieldCheck size={24} />
              </div>
              <span className="font-bold tracking-wider uppercase text-sm opacity-80">PsySight Assessment Report</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">心理健康评估报告</h1>
            <p className="opacity-80 text-sm">此报告由 DeepSeek R1 根据你的测评结果与情绪数据生成。</p>
            <p className="mt-3 text-sm bg-white/15 inline-block rounded-lg px-3 py-1">
              完成测评已经很勇敢了，你正在认真照顾自己。
            </p>
          </div>

          {/* 信息条 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <User size={16} className="text-slate-400" />
              <div className="text-xs">
                <p className="text-slate-400">测评对象</p>
                <p className="font-bold text-slate-700">{subjectName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-slate-400" />
              <div className="text-xs">
                <p className="text-slate-400">完成时间</p>
                <p className="font-bold text-slate-700">
                  {record?.created_at ? new Date(record.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FileText size={16} className="text-slate-400" />
              <div className="text-xs">
                <p className="text-slate-400">评估类型</p>
                <p className="font-bold text-indigo-600">{record?.scale?.title || 'AI 多模态综合分析'}</p>
              </div>
            </div>
          </div>

          {/* 正文内容 */}
          <div className="p-8 md:p-12">
            {!!record?.urgent_recommendation && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-center gap-2 text-rose-700 font-semibold">
                  <ShieldAlert size={16} />
                  专业求助优先建议
                </div>
                <p className="mt-2 text-sm text-rose-700">{record.urgent_recommendation}</p>
                <p className="mt-2 text-xs text-rose-600">可优先联系学校心理咨询中心或当地危机干预热线。</p>
              </div>
            )}

            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">总分</p>
                <p className="text-2xl font-semibold text-slate-800">{record?.total_score ?? '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">严重程度</p>
                <p className="text-2xl font-semibold text-indigo-700">{record?.severity_level || '待评估'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">情绪采集</p>
                <p className="text-2xl font-semibold text-slate-800">{record?.emotion_consent ? '已同意' : '未开启'}</p>
              </div>
            </div>
            {!!record?.score_explanation && (
              <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
                <p className="font-semibold">分值解释</p>
                <p className="mt-1">{record.score_explanation}</p>
              </div>
            )}

            {record?.emotion_consent && record?.emotion_log && Object.keys(record.emotion_log).length > 0 && (
              <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">答题期间情绪分布</h3>
                <div className="space-y-2">
                  {Object.entries(record.emotion_log).map(([key, value]) => {
                    const pct = Math.round(Number(value) * 100);
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{key}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!!errorMsg && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {errorMsg}
              </div>
            )}

            {record ? (
              <article className="max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm md:text-base">
                  {record.ai_report}
                </div>
              </article>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400">报告内容加载失败，请检查数据库连接。</p>
              </div>
            )}

            {/* 页脚免责声明 */}
            <div className="mt-12 pt-8 border-t border-slate-100">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start space-x-3">
                <ShieldCheck className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>非医疗免责声明：</strong> 本报告由人工智能生成，基于统计概率与心理学通用原则。报告结果仅供自我筛查与支持参考，不应视为正式的医学建议、心理诊断或治疗计划。如果您感到痛苦或有自残倾向，请立即寻求专业医疗帮助或联系危机干预热线。
                </p>
              </div>
            </div>

            {stats && (
              <div className="mt-6">
                <StatsBoard stats={stats} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
