'use client';

import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import ProfileForm from '@/features/profile/components/ProfileForm';
import { useProfilePage } from '@/features/profile/hooks/useProfilePage';

export default function ProfilePage() {
  const {
    loading,
    saving,
    authenticated,
    username,
    publicName,
    gender,
    age,
    region,
    showNickname,
    message,
    errorMsg,
    setGender,
    setAge,
    setRegion,
    setShowNickname,
    handleSubmit,
  } = useProfilePage();

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
          <ProfileForm
            username={username}
            publicName={publicName}
            gender={gender}
            age={age}
            region={region}
            showNickname={showNickname}
            saving={saving}
            message={message}
            errorMsg={errorMsg}
            onSubmit={handleSubmit}
            onGenderChange={setGender}
            onAgeChange={setAge}
            onRegionChange={setRegion}
            onShowNicknameChange={setShowNickname}
          />
        )}
      </main>
    </div>
  );
}
