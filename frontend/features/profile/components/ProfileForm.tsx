import type { FormEvent } from 'react';

interface ProfileFormProps {
  username: string;
  publicName: string;
  gender: string;
  age: string;
  region: string;
  showNickname: boolean;
  saving: boolean;
  message: string;
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
  message,
  errorMsg,
  onSubmit,
  onGenderChange,
  onAgeChange,
  onRegionChange,
  onShowNicknameChange,
}: ProfileFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-xl border border-slate-200 bg-white p-6 space-y-4">
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
            onChange={(e) => onAgeChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
            placeholder="例如 20"
          />
        </label>

        <label className="text-sm">
          <span className="text-slate-600">性别</span>
          <select
            value={gender}
            onChange={(e) => onGenderChange(e.target.value)}
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
          onChange={(e) => onRegionChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
          placeholder="例如 北京/上海/广州"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={showNickname} onChange={(e) => onShowNicknameChange(e.target.checked)} />
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
  );
}
