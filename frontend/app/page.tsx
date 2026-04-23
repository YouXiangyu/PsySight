import AuthPanel from '@/components/AuthPanel';
import { MessageCircle, PenTool, ShieldCheck, Sparkles } from 'lucide-react';

const featureCards = [
  {
    title: '倾诉陪伴',
    description: '从最近最压在心里的那件小事开始，先把感受说出来，让对话成为一个更柔和的入口。',
    icon: MessageCircle,
  },
  {
    title: '量表与报告',
    description: '把结构化测评、可读报告和匿名统计放到同一条体验链路里，方便持续观察自己的状态。',
    icon: Sparkles,
  },
  {
    title: '绘画投射',
    description: '当语言还不够顺畅时，可以先用简单线条和短句表达，再交给系统辅助整理感受。',
    icon: PenTool,
  },
];

export default function Home() {
  return (
    <main className="mist-page overflow-hidden">
      <div className="mist-container mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <section className="max-w-3xl lg:w-[54%]">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/65 bg-white/55 px-4 py-2 text-sm text-slate-600 shadow-[0_12px_40px_rgba(100,140,150,0.12)] backdrop-blur">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6ca7a3,#5d83a0)] text-base font-semibold text-white">
              P
            </span>
            面向心理倾诉与自我探索的网页空间
          </div>

          <div className="mt-8 space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#5f8e94]">PsySight</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-800 md:text-5xl md:leading-[1.12]">
                一个更放松、更柔和的入口
                <span className="block text-[#4e8187]">连接情绪支持、心理测评与自我表达</span>
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                PsySight 将聊天陪伴、量表测评、绘画投射与匿名统计整合到一个连续的网页体验中。
                想保存历史与报告，可以直接登录或注册；只想先试用，也可以以游客身份进入倾诉空间。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {featureCards.map(({ title, description, icon: Icon }) => (
                <article key={title} className="mist-panel rounded-[1.75rem] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#dfeeed] text-[#46797a]">
                    <Icon size={20} />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-800">{title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
                </article>
              ))}
            </div>

            <div className="mist-panel-soft rounded-[1.75rem] px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e4f1ef] text-[#4e7f84]">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">使用说明</p>
                  <p className="mt-1 text-sm leading-7 text-slate-500">
                    本系统用于情绪支持、自助筛查与表达引导，不能替代正式医疗诊断或危机干预。
                    如果存在现实危险、强烈自伤冲动或其他紧急情况，请优先联系线下专业机构。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-xl lg:w-[40%]">
          <AuthPanel allowGuest />
        </section>
      </div>
    </main>
  );
}
