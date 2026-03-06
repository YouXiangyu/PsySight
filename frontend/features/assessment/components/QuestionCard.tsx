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
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
      <span className="text-indigo-600 font-bold text-sm mb-4">
        问题 {currentIdx + 1} / {total}
      </span>
      <h2 className="text-xl font-medium text-slate-800 mb-8 leading-relaxed">{currentQ.text}</h2>

      <div className="space-y-3 mt-auto">
        {currentQ.options.map((opt: any, idx: number) => (
          <button
            key={idx}
            onClick={() => onAnswer(opt.score)}
            disabled={isPaused}
            className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
              answers[currentQ.id] === opt.score ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'
            } ${isPaused ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
