import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7525/ingest/8186c146-50ba-4c5d-af64-3be4a99a03d3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'e5d1e6',
    },
    body: JSON.stringify({
      sessionId: 'e5d1e6',
      hypothesisId: 'H5',
      location: 'middleware.ts',
      message: 'next_received_api_agent',
      data: {
        path: request.nextUrl.pathname,
        method: request.method,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return NextResponse.next();
}

export const config = {
  matcher: '/api/agent/:path*',
};
