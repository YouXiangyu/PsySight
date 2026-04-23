export default function EncouragementScreen() {
  return (
    <main className="mist-page flex min-h-screen items-center justify-center p-4">
      <div className="mist-container mist-panel w-full max-w-md rounded-[2rem] p-8 text-center">
        <p className="mb-2 text-sm text-[#517d84]">你完成了很重要的一步</p>
        <h2 className="text-xl font-semibold text-slate-800">谢谢你认真对待自己的感受</h2>
        <p className="mt-3 text-sm text-slate-500">报告正在整理中，我们马上带你查看结果。</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#d9ebe7]">
          <div className="h-full w-1/2 animate-pulse bg-[#6a9ba0]" />
        </div>
      </div>
    </main>
  );
}
