import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText: string;
  icon?: ReactNode;
}

export default function LoadingButton({
  children,
  className = '',
  disabled,
  loading = false,
  loadingText,
  icon,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : icon}
      <span>{loading ? loadingText : children}</span>
    </button>
  );
}
