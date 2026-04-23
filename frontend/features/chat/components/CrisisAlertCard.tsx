import { AlertTriangle } from 'lucide-react';
import type { CrisisAlert } from '../types';

export default function CrisisAlertCard({ alert }: { alert: CrisisAlert }) {
  return (
    <div className="mx-auto mt-3 w-full max-w-3xl rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle size={16} />
        紧急支持提醒
      </div>
      <p className="mt-2">{alert.message}</p>
      <ul className="mt-2 space-y-1">
        {alert.hotlines.map((item) => (
          <li key={item.phone}>
            {item.name}：
            <a className="font-semibold underline" href={`tel:${item.phone}`}>
              {item.phone}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs">危机提醒会在当前会话中持续显示，结束会话后自动清除。</p>
    </div>
  );
}
