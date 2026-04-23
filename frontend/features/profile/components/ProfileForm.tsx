import type { FormEvent } from 'react';
import LoadingButton from '@/components/LoadingButton';
import NoticeBanner from '@/components/NoticeBanner';
import { profileCopy } from '@/shared/copy/app-copy';
import type { NoticeState } from '@/shared/ui/request-state';

interface ProfileFormProps {
  username: string;
  publicName: string;
  gender: string;
  age: string;
  region: string;
  showNickname: boolean;
  saving: boolean;
  notice: NoticeState | null;
  errorMsg: string;
  onSubmit: (event: FormEvent) => void;
  onGenderChange: (value: string) => void;
  onAgeChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onShowNicknameChange: (value: boolean) => void;
}

export default function ProfileForm({
  username,
  publicName,
  gender,
  age,
  region,
  showNickname,
  saving,
  notice,
  errorMsg,
  onSubmit,
  onGenderChange,
  onAgeChange,
  onRegionChange,
  onShowNicknameChange,
}: ProfileFormProps) {
  return (
    <form onSubmit={onSubmit} className="mist-panel mt-6 space-y-4 rounded-[1.75rem] p-6">
      <div className="rounded-[1.25rem] border border-[#d9ebe7] bg-[#f3f9f8] px-4 py-3 text-sm text-slate-600">
        {profileCopy.form.accountLabel}
        <span className="font-semibold text-slate-800">{username}</span>
        <span className="mx-2">·</span>
        {profileCopy.form.publicNameLabel}
        <span className="font-semibold text-[#517d84]">{publicName || profileCopy.form.publicNameFallback}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="text-slate-600">{profileCopy.form.age}</span>
          <input
            type="number"
            min={10}
            max={100}
            value={age}
            onChange={(event) => onAgeChange(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 outline-none transition focus:border-[#76a7a7] focus:ring-2 focus:ring-[#d7ecea]"
            placeholder={profileCopy.form.agePlaceholder}
          />
        </label>

        <label className="text-sm">
          <span className="text-slate-600">{profileCopy.form.gender}</span>
          <select
            value={gender}
            onChange={(event) => onGenderChange(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 outline-none transition focus:border-[#76a7a7] focus:ring-2 focus:ring-[#d7ecea]"
          >
            {profileCopy.genders.map((item) => (
              <option key={item.value || 'empty'} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="text-slate-600">{profileCopy.form.region}</span>
        <input
          value={region}
          onChange={(event) => onRegionChange(event.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 outline-none transition focus:border-[#76a7a7] focus:ring-2 focus:ring-[#d7ecea]"
          placeholder={profileCopy.form.regionPlaceholder}
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={showNickname} onChange={(event) => onShowNicknameChange(event.target.checked)} />
        {profileCopy.form.nicknameToggle}
      </label>

      {errorMsg ? <NoticeBanner tone="danger" title={profileCopy.saveErrorTitle} description={errorMsg} /> : null}
      {notice ? <NoticeBanner tone={notice.tone} title={notice.title} description={notice.description} /> : null}

      <LoadingButton
        type="submit"
        loading={saving}
        loadingText={profileCopy.form.saving}
        className="mist-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm"
      >
        {profileCopy.form.save}
      </LoadingButton>
    </form>
  );
}
