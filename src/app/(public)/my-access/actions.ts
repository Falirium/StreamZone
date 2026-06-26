'use server';

import { logoutUser } from '@/lib/auth/user-auth';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  await logoutUser();
  redirect('/');
}
