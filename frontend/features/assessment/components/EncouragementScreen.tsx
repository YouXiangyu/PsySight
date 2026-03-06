export default function EncouragementScreen() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full rounded-2xl border border-indigo-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-indigo-600 mb-2">你完成了很重要的一步</p>
        <h2 className="text-xl font-semibold text-slate-800">谢谢你认真对待自己的感受</h2>
        <p className="mt-3 text-sm text-slate-500">报告正在整理中，我们马上带你查看结果。</p>
        <div className="mt-6 h-2 rounded-full bg-indigo-100 overflow-hidden">
          <div className="h-full w-1/2 bg-indigo-500 animate-pulse" />
        </div>
      </div>
    </main>
  );
}
