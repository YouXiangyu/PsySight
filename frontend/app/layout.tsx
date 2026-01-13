import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PsySight - 心理委员俺不得劲',
  description: 'AI 心理健康助手',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
