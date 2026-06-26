import { LoginClient } from './login-client';
import { getCurrentUser } from '@/lib/auth/user-auth';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Login — StreamZone' };

interface Props {
  searchParams: Promise<{ returnUrl?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { returnUrl } = await searchParams;
  const user = await getCurrentUser();
  if (user) {
    redirect(returnUrl || '/my-access');
  }

  return <LoginClient />;
}
