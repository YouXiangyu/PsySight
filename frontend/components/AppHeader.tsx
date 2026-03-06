'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, PenTool, Scale, UserCircle2, FileText } from 'lucide-react';
import { getMe, logout } from '@/lib/api';

interface HeaderUser {
  id: number;
  username: string;
}

export default function AppHeader() {
  const router = useRouter();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [loadingLogout, setLoadingLogout] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((res) => {
        if (cancelled) return;
        if (res.authenticated && res.user) {
          setUser({ id: res.user.id, username: res.user.username });
          return;
        }
        setUser(null);
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await logout();
      setUser(null);
      router.replace('/');
      router.refresh();
    } catch {
      // 退出失败时保持当前状态，避免影响主流程。
    } finally {
      setLoadingLogout(false);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">P</div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800">PsySight</h1>
            <p className="text-xs text-slate-400">大学生智能心理支持系统</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 text-sm">
          <Link href="/scales" className="rounded-md px-3 py-1.5 hover:bg-slate-100 text-slate-600 flex items-center gap-1">
            <Scale size={14} />
            量表库
          </Link>
          <Link href="/canvas" className="rounded-md px-3 py-1.5 hover:bg-slate-100 text-slate-600 flex items-center gap-1">
            <PenTool size={14} />
            绘画投射
          </Link>

          {!user ? (
            <Link href="/auth" className="rounded-md px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700">
              登录 / 注册
            </Link>
          ) : (
            <>
              <Link href="/reports" className="rounded-md px-3 py-1.5 hover:bg-slate-100 text-slate-600 flex items-center gap-1">
                <FileText size={14} />
                我的报告
              </Link>
              <Link href="/profile" className="rounded-md px-3 py-1.5 hover:bg-slate-100 text-slate-600 flex items-center gap-1">
                <UserCircle2 size={14} />
                {user.username}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loadingLogout}
                className="rounded-md px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-60 flex items-center gap-1"
              >
                <LogOut size={14} />
                {loadingLogout ? '退出中' : '退出'}
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
