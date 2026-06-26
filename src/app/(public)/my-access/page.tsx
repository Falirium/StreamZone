import { requireUser } from '@/lib/auth/user-auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { logoutAction } from './actions';
import { WhopPollStatus } from './poll-client';

export const metadata = { title: 'My Access — StreamZone' };

interface Props {
  searchParams: Promise<{
    receipt_id?: string;
    payment_id?: string;
    checkout_status?: string;
    status?: string;
    state_id?: string;
  }>;
}

export default async function MyAccessPage({ searchParams }: Props) {
  const session = await requireUser();
  const { receipt_id, payment_id, checkout_status, status } = await searchParams;

  const payId = payment_id || receipt_id;
  const showPoll = payId && (checkout_status === 'success' || status === 'success');

  const [entitlements, payments, assignedCodes] = await Promise.all([
    db.accessEntitlement.findMany({
      where: { userId: session.userId },
      orderBy: { startsAt: 'desc' },
      include: {
        plan: true,
        event: true,
      },
    }),
    db.payment.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    }),
    db.accessCode.findMany({
      where: {
        OR: [
          { assignedTo: session.email },
          ...(session.phone ? [{ assignedTo: session.phone }] : []),
        ],
        status: 'assigned',
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  const activeEntitlements = entitlements.filter(
    (e) => e.isActive && new Date(e.expiresAt) > new Date()
  );
  const pastEntitlements = entitlements.filter(
    (e) => !e.isActive || new Date(e.expiresAt) <= new Date()
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {showPoll && payId && <WhopPollStatus paymentId={payId} />}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Access</h1>
          <p className="text-white/60 font-mono text-sm">{session.email}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-white transition-colors">
            Sign Out
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Passes Ready to Activate (Assigned, but not yet redeemed) */}
          {assignedCodes.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-brand-400 flex items-center gap-2">
                <span>🎁</span> Passes Ready to Activate
              </h2>
              <div className="grid gap-4">
                {assignedCodes.map((code) => (
                  <div key={code.id} className="glass rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-brand-500/30 bg-brand-500/10 shadow-[0_0_20px_rgba(92,124,250,0.05)]">
                    <div>
                      <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest bg-brand-500/15 px-2 py-1 rounded-md">Pending Activation</span>
                      <h3 className="font-bold text-lg mt-2 text-white">{code.plan.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-white/50">Code:</span>
                        <code className="text-sm font-mono font-bold bg-surface-900 border border-white/5 px-2.5 py-1 rounded text-brand-300 tracking-wider select-all">{code.code}</code>
                      </div>
                    </div>
                    <Link href={`/redeem?code=${code.code}`} className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-colors whitespace-nowrap text-center shadow-lg shadow-brand-600/10">
                      Redeem Now
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold mb-4">Active Passes</h2>
            {activeEntitlements.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center border-dashed border-2 border-white/10">
                <p className="text-white/60 mb-4">You don't have any active access passes.</p>
                <div className="flex justify-center gap-4">
                  <Link href="/pricing" className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-colors">
                    Buy a Pass
                  </Link>
                  <Link href="/redeem" className="px-5 py-2.5 rounded-xl glass glass-hover text-white font-medium text-sm transition-colors">
                    Redeem Code
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeEntitlements.map((e) => (
                  <div key={e.id} className="glass rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-brand-500/20 bg-brand-500/5">
                    <div>
                      <h3 className="font-bold text-lg text-brand-400">{e.plan.name}</h3>
                      {e.event && <p className="text-sm text-white/80 mt-1">For: {e.event.title}</p>}
                      <p className="text-xs text-white/50 mt-2">
                        Valid until {new Date(e.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    <Link href="/events" className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-colors whitespace-nowrap text-center">
                      Watch Live
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {pastEntitlements.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-white/60">Past Passes</h2>
              <div className="grid gap-3">
                {pastEntitlements.map((e) => (
                  <div key={e.id} className="glass rounded-xl p-4 flex justify-between items-center opacity-60">
                    <div>
                      <p className="font-medium text-sm">{e.plan.name}</p>
                      <p className="text-xs text-white/50 mt-1">Expired {new Date(e.expiresAt).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge variant="neutral">Expired</StatusBadge>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div>
          <section className="glass rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-4">No payments found</p>
            ) : (
              <div className="space-y-4">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{Number(p.amount).toFixed(2)} {p.currency}</p>
                      <p className="text-xs text-white/50 mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge variant={getStatusVariant(p.status)}>
                      {p.status}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 pt-6 border-t border-white/10">
              <Link href="/pay" className="block text-center text-sm text-brand-400 hover:text-brand-300 transition-colors">
                Submit Manual Payment →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
