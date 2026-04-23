interface QuestionCardProps {
  currentIdx: number;
  total: number;
  currentQ: any;
  answers: Record<string, number>;
  isPaused: boolean;
  onAnswer: (score: number) => void;
}

export default function QuestionCard({ currentIdx, total, currentQ, answers, isPaused, onAnswer }: QuestionCardProps) {
  return (
    <div className="mist-panel flex min-h-[360px] flex-col rounded-[1.5rem] p-5 sm:rounded-[1.65rem] sm:p-6 md:min-h-[400px] md:rounded-[1.75rem] md:p-8">
      <span className="mb-4 text-sm font-bold text-[#517d84]">
        问题 {currentIdx + 1} / {total}
      </span>
      <h2 className="mb-6 text-lg font-medium leading-8 text-slate-800 sm:mb-8 sm:text-xl">{currentQ.text}</h2>

      <div className="mt-auto space-y-3">
        {currentQ.options.map((opt: any, idx: number) => (
          <button
            key={idx}
            onClick={() => onAnswer(opt.score)}
            disabled={isPaused}
            className={`w-full rounded-[1.15rem] border-2 p-3.5 text-left text-sm leading-6 transition-all sm:rounded-[1.25rem] sm:p-4 sm:text-base ${
              answers[currentQ.id] === opt.score
                ? 'border-[#8cb8b4] bg-[#eef6f5]'
                : 'border-white/70 bg-white/80 hover:border-[#c0dcd8]'
            } ${isPaused ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
