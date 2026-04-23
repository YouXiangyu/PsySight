'use client';

import AppHeader from '@/components/AppHeader';
import ChatWindow from '@/components/ChatWindow';
import OnboardingGuide from '@/components/OnboardingGuide';
import { useEffect, useState } from 'react';

const ONBOARDING_SEEN_KEY = 'psysight_onboarding_seen_v1';

export default function ChatPage() {
  const [showOnboarding, setShowOnboarding] = useState(false);

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
      // Ignore localStorage failures.
    }
    setShowOnboarding(false);
  };

  return (
    <div className="mist-page flex min-h-screen flex-col">
      <div className="mist-container flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
          <div className="mist-panel mx-auto flex min-h-[calc(100svh-5.75rem)] h-[calc(100dvh-5.75rem)] max-w-6xl overflow-hidden rounded-[1.6rem] sm:rounded-[1.85rem] md:min-h-[calc(100vh-6.5rem)] md:h-[calc(100vh-6.5rem)] md:rounded-[2rem]">
            <ChatWindow />
          </div>
        </main>
      </div>
      <OnboardingGuide open={showOnboarding} onFinish={finishOnboarding} />
    </div>
  );
}
