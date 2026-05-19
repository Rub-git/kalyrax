import { NextRequest, NextResponse } from 'next/server';

function getStep(pathname: string): string {
  if (pathname === '/') return 'home';
  if (pathname === '/manifest.webmanifest') return 'manifest';
  if (pathname === '/sw.js') return 'service-worker';
  if (pathname === '/robots.txt') return 'robots';
  if (pathname.startsWith('/api/auth/')) return 'auth-api';
  if (pathname.startsWith('/api/')) return 'api';
  if (pathname === '/login' || pathname === '/signup') return 'auth-page';
  return 'page';
}

function shouldLog(request: NextRequest): boolean {
  if (process.env.APPNEXU_DEBUG_LOGS !== 'true') {
    return false;
  }

  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const isLikelyAppnexuClient =
    ua.includes('appnexu') ||
    ua.includes('webview') ||
    ua.includes('wv') ||
    ua.includes('okhttp') ||
    ua.includes('flutter') ||
    ua.includes('capacitor') ||
    ua.includes('cordova');

  return isLikelyAppnexuClient || request.nextUrl.searchParams.get('appnexu_debug') === '1';
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const step = getStep(request.nextUrl.pathname);

  if (shouldLog(request)) {
    const logPayload = {
      tag: 'appnexu-debug',
      step,
      method: request.method,
      host: request.headers.get('host'),
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search,
      referer: request.headers.get('referer') || null,
      userAgent: request.headers.get('user-agent') || null,
      forwardedFor: request.headers.get('x-forwarded-for') || null,
      requestId: request.headers.get('x-vercel-id') || null,
      ts: new Date().toISOString(),
    };

    console.log(JSON.stringify(logPayload));
    response.headers.set('x-kalyrax-appnexu-step', step);
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/manifest.webmanifest',
    '/sw.js',
    '/robots.txt',
    '/api/:path*',
  ],
};
