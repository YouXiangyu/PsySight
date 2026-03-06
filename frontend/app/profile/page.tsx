'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { getMe, updateMyProfile } from '@/lib/api';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [publicName, setPublicName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');
  const [showNickname, setShowNickname] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const me = await getMe();
        setAuthenticated(me.authenticated);
        if (!me.authenticated || !me.user) return;
        setUsername(me.user.username || '');
        setPublicName(me.user.public_name || '');
        setGender(me.user.gender || '');
        setAge(me.user.age ? String(me.user.age) : '');
        setRegion(me.user.region || '');
        setShowNickname(Boolean(me.user.show_nickname_in_stats));
      } catch (error) {
        setErrorMsg((error as Error).message || '加载个人资料失败');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setErrorMsg('');
    try {
      const response = await updateMyProfile({
        gender: gender || null,
        age: age ? Number(age) : null,
        region: region || null,
        show_nickname_in_stats: showNickname,
      });
      setPublicName(response.user.public_name || '');
      setMessage('资料已更新');
    } catch (error) {
      setErrorMsg((error as Error).message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">个人资料</h1>
            <p className="text-sm text-slate-500 mt-1">完善基础信息，并控制匿名统计中的昵称展示策略。</p>
          </div>
          <Link href="/" className="text-sm text-slate-500 hover:text-indigo-600">
            返回首页
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            正在加载资料...
          </div>
        ) : !authenticated ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">请先登录后再编辑个人资料。</p>
            <Link
              href="/auth"
              className="inline-flex mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              去登录 / 注册
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              当前账号：<span className="font-semibold text-slate-800">{username}</span>
              <span className="mx-2">·</span>
              匿名统计显示名：<span className="font-semibold text-indigo-700">{publicName || '未设置'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="text-slate-600">年龄</span>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
                  placeholder="例如 20"
                />
              </label>

              <label className="text-sm">
                <span className="text-slate-600">性别</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400 bg-white"
                >
                  <option value="">不填写</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                  <option value="非二元">非二元</option>
                  <option value="不便透露">不便透露</option>
                </select>
              </label>
            </div>

            <label className="text-sm block">
              <span className="text-slate-600">地区</span>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
                placeholder="例如 北京/上海/广州"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={showNickname}
                onChange={(e) => setShowNickname(e.target.checked)}
              />
              在匿名统计中显示我的昵称（关闭时将显示匿名别名）
            </label>

            {!!errorMsg && <p className="text-sm text-rose-700">{errorMsg}</p>}
            {!!message && <p className="text-sm text-emerald-700">{message}</p>}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? '保存中...' : '保存资料'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
