import { Loader2 } from 'lucide-react';

interface LoadingPanelProps {
  message: string;
  className?: string;
}

export default function LoadingPanel({ message, className = '' }: LoadingPanelProps) {
  return (
    <div className={`mist-panel rounded-[1.5rem] p-6 ${className}`}>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Loader2 className="animate-spin" size={16} />
        {message}
      </div>
    </div>
  );
}
