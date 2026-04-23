'use client';

import AuthPanel from '@/components/AuthPanel';
import { commonCopy } from '@/shared/copy/app-copy';
import Link from 'next/link';

export default function AuthPage() {
  return (
    <main className="mist-page px-4 py-8 md:px-8">
      <div className="mist-container mx-auto max-w-md">
        <Link href="/chat" className="mist-link text-sm">
          {commonCopy.actions.backToChat}
        </Link>
        <AuthPanel allowGuest className="mt-4" />
      </div>
    </main>
  );
}
