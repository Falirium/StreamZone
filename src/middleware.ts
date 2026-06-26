import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';

const ADMIN_LOGIN = '/admin/login';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Admin routes protection
  if (pathname.startsWith('/admin') && pathname !== ADMIN_LOGIN) {
    try {
      const cookieStore = {
        get: (name: string) => {
          const cookie = request.cookies.get(name);
          return cookie ? { name: cookie.name, value: cookie.value } : undefined;
        },
        set: () => {},
        delete: () => {},
      } as any;

      const session = await getIronSession<{ admin?: { role: string; email: string } }>(
        cookieStore,
        {
          password: process.env.ADMIN_SESSION_SECRET!,
          cookieName: 'admin_session',
          cookieOptions: {
            path: '/',
          },
        }
      );

      if (!session.admin || (session.admin.role !== 'admin' && session.admin.role !== 'super_admin')) {
        const loginUrl = new URL(ADMIN_LOGIN, request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch (err) {
      console.error('[Middleware Admin Auth Error]', err);
      return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));
    }
  }

  // User routes protection
  if (pathname.startsWith('/my-access') || pathname.startsWith('/pay')) {
    try {
      const cookieStore = {
        get: (name: string) => {
          const cookie = request.cookies.get(name);
          return cookie ? { name: cookie.name, value: cookie.value } : undefined;
        },
        set: () => {},
        delete: () => {},
      } as any;

      const session = await getIronSession<{ user?: { userId: string } }>(
        cookieStore,
        {
          password: process.env.USER_SESSION_SECRET!,
          cookieName: 'user_session',
          cookieOptions: {
            path: '/',
          },
        }
      );

      if (!session.user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnUrl', pathname + request.nextUrl.search);
        return NextResponse.redirect(loginUrl);
      }
    } catch (err) {
      console.error('[Middleware User Auth Error]', err);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/my-access/:path*',
    '/pay/:path*',
  ],
};
