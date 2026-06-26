import { RedeemClient } from './redeem-client';
import { requireUser } from '@/lib/auth/user-auth';

export const metadata = { title: 'Redeem Code — StreamZone' };

interface Props {
  searchParams: Promise<{ code?: string }>;
}

export default async function RedeemPage({ searchParams }: Props) {
  await requireUser();
  const { code } = await searchParams;
  return <RedeemClient initialCode={code} />;
}
