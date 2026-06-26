import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/user-auth';
import { redirect } from 'next/navigation';
import { WhopClient } from './whop-client';

export const metadata = { title: 'Secure Checkout — StreamZone' };

interface Props {
  searchParams: Promise<{ plan?: string; country?: string }>;
}

export default async function PayWhopPage({ searchParams }: Props) {
  const session = await requireUser();
  const { plan, country } = await searchParams;

  if (!plan || !country) {
    redirect('/pricing');
  }

  const selectedPlan = await db.plan.findUnique({
    where: { id: plan },
    include: {
      prices: {
        where: { country: { code: country } },
        include: { country: true },
      },
    },
  });

  if (!selectedPlan || selectedPlan.prices.length === 0) {
    redirect('/pricing?error=invalid_selection');
  }

  const price = selectedPlan.prices[0];
  const hasWhopKey = !!process.env.WHOP_API_KEY;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-center mb-8 text-white">Secure Checkout</h1>
      <WhopClient 
        plan={selectedPlan} 
        price={price} 
        userId={session.userId} 
        userPhone={session.phone} 
        hasWhopKey={hasWhopKey}
      />
    </div>
  );
}
