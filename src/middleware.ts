import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = [
  '/dashboard',
  '/paycheck',
  '/goal',
  '/afford',
  '/coming',
  '/tax',
  '/profile',
  '/import',
];

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isProtected && !req.auth) {
    const signInUrl = new URL('/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/paycheck/:path*',
    '/goal/:path*',
    '/afford/:path*',
    '/coming/:path*',
    '/tax/:path*',
    '/profile/:path*',
    '/import/:path*',
  ],
};
