'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { ShieldCheck, FileText, Calendar, User, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

export default function ReportPage() {
  const { id } = useParams();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 这里我们假设后端有一个获取单个记录的接口，或者通过 ID 模拟
    // 实际项目中可以添加 GET /api/records/<id>
    // 暂时用 Mock 或从数据库逻辑推断
    const fetchReport = async () => {
      try {
        // 实际上后端目前没写这个 GET 接口，我们为了演示先从后端 models 结构推断获取方式
        // 正常开发中需要后端配合
        const response = await api.get(`/report/${id}`);
        setRecord(response.data);
      } catch (e) {
        console.error("Report fetch failed");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

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
            <p className="opacity-80 text-sm">此报告由 Gemini 3 Flash AI 引擎根据您的测评数据深度生成。</p>
          </div>

          {/* 信息条 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <User size={16} className="text-slate-400" />
              <div className="text-xs">
                <p className="text-slate-400">测评对象</p>
                <p className="font-bold text-slate-700">匿名用户</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-slate-400" />
              <div className="text-xs">
                <p className="text-slate-400">完成时间</p>
                <p className="font-bold text-slate-700">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FileText size={16} className="text-slate-400" />
              <div className="text-xs">
                <p className="text-slate-400">评估类型</p>
                <p className="font-bold text-indigo-600">AI 多模态综合分析</p>
              </div>
            </div>
          </div>

          {/* 正文内容 */}
          <div className="p-8 md:p-12">
            {record ? (
              <article className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
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
          </div>
        </div>
      </div>
    </main>
  );
}
