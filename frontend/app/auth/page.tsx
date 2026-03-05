'use client';

import { getMe, login, logout, register } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    getMe()
      .then((res) => {
        setAuthenticated(res.authenticated);
        setDisplayName(res.user?.username || '');
      })
      .catch(() => setAuthenticated(false));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (mode === 'login') {
        await login({ email, password });
        setMessage('登录成功，正在返回首页...');
      } else {
        await register({ email, password, username });
        setMessage('注册成功，正在返回首页...');
      }
      setTimeout(() => router.push('/'), 800);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setAuthenticated(false);
      setMessage('已退出登录');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-slate-500 hover:text-indigo-600">
          ← 返回首页
        </Link>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-800">账号与隐私</h1>
          <p className="mt-1 text-xs text-slate-500">
            仅需邮箱和密码即可使用完整功能。你的密码会加密存储，且可匿名体验基础对话。
          </p>

          {authenticated ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-slate-700">
                当前已登录：<span className="font-semibold">{displayName || '用户'}</span>
              </p>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                退出登录
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6 flex gap-2 rounded-lg bg-slate-100 p-1">
                <button
                  onClick={() => setMode('login')}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm ${
                    mode === 'login' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
                  }`}
                >
                  登录
                </button>
                <button
                  onClick={() => setMode('register')}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm ${
                    mode === 'register' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
                  }`}
                >
                  注册
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {mode === 'register' && (
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="昵称（可选）"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  />
                )}
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="邮箱"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码（至少6位）"
                  type="password"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !email || !password}
                className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? '处理中...' : mode === 'login' ? '登录' : '注册并登录'}
              </button>
            </>
          )}

          {!!message && <p className="mt-4 text-sm text-indigo-700">{message}</p>}
        </div>
      </div>
    </main>
  );
}
