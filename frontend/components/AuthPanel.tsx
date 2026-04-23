'use client';

import { getMe, login, logout, register } from '@/lib/api';
import LoadingButton from '@/components/LoadingButton';
import NoticeBanner from '@/components/NoticeBanner';
import StatePanel from '@/components/StatePanel';
import { authCopy } from '@/shared/copy/app-copy';
import type { NoticeState } from '@/shared/ui/request-state';
import { getErrorMessage } from '@/shared/ui/request-state';
import { ArrowRight, Loader2, LogOut, UserCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

type AuthMode = 'login' | 'register';
type PendingAction = 'initializing' | 'submit' | 'logout' | 'guest' | 'enter' | null;

interface AuthPanelProps {
  redirectTo?: string;
  className?: string;
  allowGuest?: boolean;
}

export default function AuthPanel({
  redirectTo = '/chat',
  className = '',
  allowGuest = false,
}: AuthPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>('initializing');
  const [authenticated, setAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const isBusy = pendingAction !== null;
  const emailValue = email.trim();
  const passwordValue = password.trim();
  const usernameValue = username.trim();
  const canSubmit = !isBusy && !!emailValue && !!passwordValue;

  useEffect(() => {
    let cancelled = false;

    const loadAuthState = async () => {
      setPendingAction('initializing');

      try {
        const res = await getMe();
        if (cancelled) {
          return;
        }

        setAuthenticated(res.authenticated);
        setDisplayName(res.user?.username || '');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setAuthenticated(false);
        setDisplayName('');
        setNotice({
          tone: 'danger',
          title: authCopy.notices.authCheckFailed.title,
          description: getErrorMessage(error, authCopy.notices.authCheckFailed.description),
        });
      } finally {
        if (!cancelled) {
          setPendingAction(null);
        }
      }
    };

    void loadAuthState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setNotice(null);
  }, [mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setPendingAction('submit');
    setNotice(null);

    try {
      if (mode === 'login') {
        await login({ email: emailValue, password: passwordValue });
        setAuthenticated(true);
        setNotice({ tone: 'success', ...authCopy.notices.loginSuccess });
      } else {
        await register({
          email: emailValue,
          password: passwordValue,
          username: usernameValue || undefined,
        });
        setAuthenticated(true);
        setDisplayName(usernameValue);
        setNotice({ tone: 'success', ...authCopy.notices.registerSuccess });
      }

      router.push(redirectTo);
    } catch (error) {
      setNotice({
        tone: 'danger',
        title: mode === 'login' ? authCopy.fallbackErrors.loginTitle : authCopy.fallbackErrors.registerTitle,
        description: getErrorMessage(
          error,
          mode === 'login' ? authCopy.fallbackErrors.login : authCopy.fallbackErrors.register
        ),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleGuestEnter = () => {
    if (isBusy) {
      return;
    }

    setPendingAction('guest');
    setNotice({ tone: 'success', ...authCopy.notices.guestEntering });
    router.push(redirectTo);
  };

  const handleLogout = async () => {
    if (isBusy) {
      return;
    }

    setPendingAction('logout');
    setNotice(null);

    try {
      await logout();
      setAuthenticated(false);
      setDisplayName('');
      setEmail('');
      setPassword('');
      setNotice({ tone: 'success', ...authCopy.notices.logoutSuccess });
    } catch (error) {
      setNotice({
        tone: 'danger',
        title: authCopy.fallbackErrors.logoutTitle,
        description: getErrorMessage(error, authCopy.fallbackErrors.logout),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleEnter = () => {
    if (isBusy) {
      return;
    }

    setPendingAction('enter');
    router.push(redirectTo);
  };

  return (
    <section className={`rounded-[2rem] border border-white/70 bg-white px-6 py-7 shadow-[0_24px_80px_rgba(98,138,145,0.18)] backdrop-blur ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{authCopy.badge}</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-800">
            {authenticated ? authCopy.signedInTitle : authCopy.signedOutTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {authenticated ? authCopy.signedInDescription : authCopy.signedOutDescription}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dff0ee] text-[#3f7c7a]">
          <UserCircle2 size={24} />
        </div>
      </div>

      {pendingAction === 'initializing' ? (
        <StatePanel
          className="mt-8"
          icon={<Loader2 className="animate-spin" size={18} />}
          title={authCopy.checkingState.title}
          description={authCopy.checkingState.description}
        />
      ) : authenticated ? (
        <div className="mt-8 space-y-3">
          <div className="rounded-2xl border border-[#d7e8e5] bg-[#f2f8f7] px-4 py-3 text-sm text-slate-600">
            {authCopy.currentUserLabel}
            <span className="ml-1 font-semibold text-slate-800">{displayName || authCopy.signedInFallbackName}</span>
          </div>

          <LoadingButton
            type="button"
            onClick={handleEnter}
            loading={pendingAction === 'enter'}
            loadingText={authCopy.actions.enteringChat}
            icon={<ArrowRight size={16} />}
            className="mist-primary-button flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium"
          >
            {authCopy.actions.enterChat}
          </LoadingButton>

          <LoadingButton
            type="button"
            onClick={handleLogout}
            loading={pendingAction === 'logout'}
            loadingText={authCopy.actions.loggingOut}
            icon={<LogOut size={15} />}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {authCopy.actions.logout}
          </LoadingButton>
        </div>
      ) : (
        <>
          <div className="mt-8 flex rounded-2xl bg-[#edf4f4] p-1.5">
            <button
              type="button"
              onClick={() => setMode('login')}
              disabled={isBusy}
              className={`flex-1 rounded-[1rem] px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                mode === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              {authCopy.actions.login}
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              disabled={isBusy}
              className={`flex-1 rounded-[1rem] px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                mode === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              {authCopy.actions.register}
            </button>
          </div>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={authCopy.fields.nickname}
                disabled={isBusy}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#76a7a7] focus:ring-2 focus:ring-[#d7ecea] disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            ) : null}

            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={authCopy.fields.email}
              disabled={isBusy}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#76a7a7] focus:ring-2 focus:ring-[#d7ecea] disabled:cursor-not-allowed disabled:bg-slate-50"
            />

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={authCopy.fields.password}
              type="password"
              disabled={isBusy}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#76a7a7] focus:ring-2 focus:ring-[#d7ecea] disabled:cursor-not-allowed disabled:bg-slate-50"
            />

            <LoadingButton
              type="submit"
              disabled={!canSubmit}
              loading={pendingAction === 'submit'}
              loadingText={mode === 'login' ? authCopy.actions.loggingIn : authCopy.actions.registering}
              className="mist-primary-button flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium"
            >
              {mode === 'login' ? authCopy.actions.loginAndEnter : authCopy.actions.registerAndEnter}
            </LoadingButton>
          </form>

          {allowGuest ? (
            <>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs uppercase tracking-[0.24em] text-slate-400">{authCopy.actions.guestDivider}</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <LoadingButton
                type="button"
                onClick={handleGuestEnter}
                loading={pendingAction === 'guest'}
                loadingText={authCopy.actions.guestEntering}
                className="mist-secondary-button mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium"
              >
                {authCopy.actions.guestEnter}
              </LoadingButton>

              <p className="mt-3 text-xs leading-5 text-slate-400">{authCopy.guestHint}</p>
            </>
          ) : null}
        </>
      )}

      {notice ? (
        <NoticeBanner
          className="mt-4"
          tone={notice.tone}
          title={notice.title}
          description={notice.description}
        />
      ) : null}
    </section>
  );
}
