const moduleShellClass =
  'mist-panel-bubble rounded-[1.85rem] px-4 py-4 sm:rounded-[2.15rem] sm:px-5 sm:py-5 md:rounded-[2.45rem] md:px-7 md:py-7';

const subBubbleClass =
  'mist-bubble-card rounded-[1.35rem] px-4 py-4 sm:rounded-[1.75rem] sm:px-5 sm:py-5';

const softInsetClass =
  'mist-bubble-card-soft rounded-[1.4rem] px-4 py-4 sm:rounded-[1.8rem] sm:px-5 sm:py-5';

function InsightCardSkeleton() {
  return (
    <div className={subBubbleClass}>
      <div className="h-10 w-10 rounded-[1.1rem] bg-slate-100 sm:h-11 sm:w-11 sm:rounded-2xl" />
      <div className="mt-4 h-3 w-20 rounded-full bg-slate-100" />
      <div className="mt-3 h-6 w-32 rounded-full bg-slate-100" />
      <div className="mt-3 h-3 w-full rounded-full bg-slate-100" />
      <div className="mt-2 h-3 w-5/6 rounded-full bg-slate-100" />
    </div>
  );
}

function SectionSkeleton({ columns = 2, inset = false }: { columns?: number; inset?: boolean }) {
  const cardClass = inset ? softInsetClass : subBubbleClass;

  return (
    <section className={moduleShellClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="h-11 w-11 rounded-[1.2rem] bg-slate-100 sm:h-12 sm:w-12 sm:rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="h-4 w-20 rounded-full bg-slate-100" />
          <div className="mt-3 h-5 w-40 rounded-full bg-slate-100" />
          <div className="mt-3 h-3 w-full rounded-full bg-slate-100" />
          <div className="mt-2 h-3 w-2/3 rounded-full bg-slate-100" />
        </div>
      </div>
      <div className={`mt-5 grid gap-4 sm:mt-6 ${columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {[0, 1, 2, 3].slice(0, columns === 3 ? 3 : 2).map((item) => (
          <div key={item} className={cardClass}>
            <div className="h-3 w-16 rounded-full bg-slate-100" />
            <div className="mt-4 h-4 w-24 rounded-full bg-slate-100" />
            <div className="mt-4 h-3 w-full rounded-full bg-slate-100" />
            <div className="mt-2 h-3 w-4/5 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function StatsBoardSkeleton() {
  return (
    <div className="flex flex-col gap-10 lg:gap-12">
      <section className={moduleShellClass}>
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="h-6 w-44 rounded-full bg-slate-100" />
            <div className="mt-4 h-8 w-72 rounded-full bg-slate-100" />
            <div className="mt-3 h-3 w-full rounded-full bg-slate-100" />
            <div className="mt-2 h-3 w-5/6 rounded-full bg-slate-100" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className={subBubbleClass}>
                <div className="h-3 w-16 rounded-full bg-slate-100" />
                <div className="mt-3 h-4 w-24 rounded-full bg-slate-100" />
                <div className="mt-4 h-6 w-20 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InsightCardSkeleton />
        <InsightCardSkeleton />
        <InsightCardSkeleton />
      </section>

      <SectionSkeleton columns={3} />
      <SectionSkeleton columns={2} />
      <SectionSkeleton columns={2} inset />
      <SectionSkeleton columns={2} inset />
    </div>
  );
}
