import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getAdminSession } from './session';
import type { AdminSessionData } from '@/types/api';

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; admin?: AdminSessionData }> {
  const admin = await db.admin.findUnique({ where: { email } });

  if (!admin) {
    return { success: false, error: 'Invalid credentials' };
  }

  const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordMatch) {
    return { success: false, error: 'Invalid credentials' };
  }

  const session = await getAdminSession();
  session.admin = {
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
  await session.save();

  return { success: true, admin: session.admin };
}

export async function logoutAdmin(): Promise<void> {
  const session = await getAdminSession();
  session.destroy();
}

export async function requireAdmin(): Promise<AdminSessionData> {
  const session = await getAdminSession();
  if (!session.admin) {
    throw new Error('Unauthorized: Admin session required');
  }
  return session.admin;
}

export async function getCurrentAdmin(): Promise<AdminSessionData | null> {
  const session = await getAdminSession();
  return session.admin ?? null;
}
