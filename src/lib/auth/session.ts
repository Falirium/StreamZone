import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { AdminSessionData, UserSessionData } from '@/types/api';

export interface AdminSession {
  admin?: AdminSessionData;
}

export interface UserSession {
  user?: UserSessionData;
}

export async function getAdminSession(): Promise<IronSession<AdminSession>> {
  const cookieStore = await cookies();
  return getIronSession<AdminSession>(cookieStore, {
    password: process.env.ADMIN_SESSION_SECRET!,
    cookieName: 'admin_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    },
  });
}

export async function getUserSession(): Promise<IronSession<UserSession>> {
  const cookieStore = await cookies();
  return getIronSession<UserSession>(cookieStore, {
    password: process.env.USER_SESSION_SECRET!,
    cookieName: 'user_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  });
}
