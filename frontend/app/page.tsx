'use client';

import ChatWindow from '@/components/ChatWindow';
import AppHeader from '@/components/AppHeader';
import OnboardingGuide from '@/components/OnboardingGuide';
import StatsBoard from '@/components/StatsBoard';
import { getStatsSummary, type StatsSummary } from '@/lib/api';
import { useEffect, useState } from 'react';

const ONBOARDING_SEEN_KEY = 'psysight_onboarding_seen_v1';

export default function Home() {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    getStatsSummary()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(ONBOARDING_SEEN_KEY);
      if (!seen) {
        setShowOnboarding(true);
      }
    } catch {
      setShowOnboarding(false);
    }
  }, []);

  const finishOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    } catch {
      // 忽略 localStorage 不可用场景。
    }
    setShowOnboarding(false);
  };

  return (
    <div className="h-screen bg-[#eef2f7] flex flex-col">
      <AppHeader />

      {stats && (
        <section className="px-4 pt-3">
          <div className="mx-auto max-w-6xl">
            <StatsBoard stats={stats} />
          </div>
        </section>
      )}

      <main className="flex-1 min-h-0 px-4 pb-4 pt-3">
        <div className="mx-auto max-w-6xl h-full rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <ChatWindow />
        </div>
      </main>
      <OnboardingGuide open={showOnboarding} onFinish={finishOnboarding} />
    </div>
  );
}
