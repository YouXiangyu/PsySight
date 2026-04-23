'use client';

import Link from 'next/link';
import { RefreshCcw } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import LoadingPanel from '@/components/LoadingPanel';
import StatePanel from '@/components/StatePanel';
import ProfileForm from '@/features/profile/components/ProfileForm';
import { useProfilePage } from '@/features/profile/hooks/useProfilePage';
import { commonCopy, profileCopy } from '@/shared/copy/app-copy';

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
    notice,
    errorMsg,
    setGender,
    setAge,
    setRegion,
    setShowNickname,
    handleSubmit,
    reloadProfile,
  } = useProfilePage();

  return (
    <div className="mist-page min-h-screen">
      <div className="mist-container min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">{profileCopy.title}</h1>
              <p className="mt-1 text-sm text-slate-500">{profileCopy.description}</p>
            </div>
            <Link href="/chat" className="mist-link text-sm">
              {commonCopy.actions.backToChat}
            </Link>
          </div>

          {loading ? (
            <LoadingPanel className="mt-6" message={profileCopy.loading} />
          ) : !authenticated ? (
            <div className="mt-6">
              <StatePanel
                title={profileCopy.loginRequiredTitle}
                description={profileCopy.loginRequiredDescription}
                actions={
                  <Link href="/" className="mist-primary-button inline-flex rounded-full px-4 py-2 text-xs font-semibold">
                    {commonCopy.actions.goToLogin}
                  </Link>
                }
              />
            </div>
          ) : errorMsg && !username ? (
            <div className="mt-6">
              <StatePanel
                title={profileCopy.loadErrorTitle}
                description={errorMsg}
                tone="danger"
                actions={
                  <button
                    type="button"
                    onClick={() => void reloadProfile()}
                    className="mist-primary-button inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
                  >
                    <RefreshCcw size={14} />
                    {commonCopy.actions.reload}
                  </button>
                }
              />
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
              notice={notice}
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
    </div>
  );
}
