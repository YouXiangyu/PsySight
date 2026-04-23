'use client';

import { getMe, logout } from '@/lib/api';
import {
  BarChart3,
  FileText,
  LogIn,
  LogOut,
  type LucideIcon,
  MessageSquare,
  PenTool,
  Scale,
  UserCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface HeaderUser {
  id: number;
  username: string;
}

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

function HeaderNavLink({
  href,
  label,
  icon: Icon,
  active,
  compact = false,
}: NavItem & { compact?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
        active
          ? 'bg-[#e7f1f1] text-[#406f76]'
          : 'text-slate-600 hover:bg-white/70 hover:text-slate-800'
      }`}
    >
      <Icon size={15} className="shrink-0" />
      <span className={compact ? 'max-w-[7.5rem] truncate' : 'truncate'}>{label}</span>
    </Link>
  );
}

export default function AppHeader() {
  const pathname = usePathname();
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

  const primaryNav = useMemo<NavItem[]>(
    () => [
      {
        href: '/chat',
        label: '倾诉空间',
        icon: MessageSquare,
        active: pathname === '/chat',
      },
      {
        href: '/stats',
        label: '统计数据',
        icon: BarChart3,
        active: pathname === '/stats',
      },
      {
        href: '/scales',
        label: '量表库',
        icon: Scale,
        active: pathname === '/scales' || pathname.startsWith('/scale/') || pathname.startsWith('/scale-code/'),
      },
      {
        href: '/canvas',
        label: '绘画投射',
        icon: PenTool,
        active: pathname === '/canvas',
      },
    ],
    [pathname]
  );

  const secondaryNav = useMemo<NavItem[]>(
    () => [
      {
        href: '/reports',
        label: '报告中心',
        icon: FileText,
        active: pathname === '/reports' || pathname.startsWith('/report/'),
      },
      {
        href: '/profile',
        label: user?.username || '个人中心',
        icon: UserCircle2,
        active: pathname === '/profile',
      },
    ],
    [pathname, user?.username]
  );

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await logout();
      setUser(null);
      router.replace('/');
      router.refresh();
    } catch {
      // Ignore logout errors and keep current state.
    } finally {
      setLoadingLogout(false);
    }
  };

  return (
    <header className="border-b border-white/70 bg-white/68 px-3 py-3 backdrop-blur-xl sm:px-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3.5 sm:gap-4">
        <div className="flex items-start justify-between gap-3 sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <Link href="/" className="flex min-w-0 items-center gap-3 rounded-full px-1 py-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6ca7a3,#5d83a0)] text-sm font-semibold text-white shadow-sm">
                P
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-slate-800">PsySight</h1>
                <p className="hidden text-xs text-slate-500 sm:block">对话、测评与自我探索</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 lg:flex">
              {primaryNav.map((item) => (
                <HeaderNavLink key={item.href} {...item} />
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-sm">
            <nav className="hidden items-center gap-2 lg:flex">
              {user &&
                secondaryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
                      item.active
                        ? 'bg-[#517d84] text-white'
                        : 'text-slate-600 hover:bg-white/70 hover:text-slate-800'
                    }`}
                  >
                    <item.icon size={15} className="shrink-0" />
                    <span className="max-w-[7.5rem] truncate">{item.label}</span>
                  </Link>
                ))}
            </nav>

            {!user ? (
              <>
                <span className="hidden rounded-full bg-[#eef5f5] px-3 py-1.5 text-xs font-medium text-[#4b7c81] md:inline-flex">
                  游客模式
                </span>
                <Link
                  href="/"
                  className="mist-primary-button inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs sm:px-4 sm:text-sm"
                >
                  <LogIn size={15} />
                  登录 / 注册
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                disabled={loadingLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3.5 py-2 text-xs text-slate-600 transition hover:bg-white disabled:opacity-60 sm:px-4 sm:text-sm"
              >
                <LogOut size={15} />
                {loadingLogout ? '退出中...' : '退出登录'}
              </button>
            )}
          </div>
        </div>

        <nav className="flex w-full items-center gap-2 overflow-x-auto pb-1 lg:hidden">
          {primaryNav.map((item) => (
            <HeaderNavLink key={item.href} {...item} compact />
          ))}
          {user &&
            secondaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                  item.active
                    ? 'bg-[#517d84] text-white'
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-800'
                }`}
              >
                <item.icon size={15} className="shrink-0" />
                <span className="max-w-[7.5rem] truncate">{item.label}</span>
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
