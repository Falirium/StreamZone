'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { simulateWhopPayment, createWhopCheckoutSession } from './actions';
import { Decimal } from '@prisma/client/runtime/library';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
}

interface Price {
  amount: Decimal;
  currency: string;
  whopPlanId: string | null;
}

interface Props {
  plan: Plan;
  price: Price;
  userId: string;
  userPhone: string;
  hasWhopKey: boolean;
}

export function WhopClient({ plan, price, userId, userPhone, hasWhopKey }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchasedCode, setPurchasedCode] = useState<string | null>(null);

  const onCheckoutRedirect = async () => {
    if (!price.whopPlanId) return;
    setLoading(true);
    setError(null);

    try {
      if (hasWhopKey) {
        // Official way: Create dynamic checkout configuration via Whop API
        const result = await createWhopCheckoutSession(plan.id, price.whopPlanId, userId, userPhone, window.location.origin);
        if (result.success && result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        } else {
          setError(result.error || 'Failed to initialize secure checkout session');
          setLoading(false);
        }
      } else {
        // Smart fallback way: Direct Link Checkout with prefilled phone number as email
        const cleanPhone = encodeURIComponent(userPhone.replace(/\s+/g, ''));
        const directCheckoutUrl = `https://whop.com/checkout/${price.whopPlanId}?email=${cleanPhone}@streamzone.local`;
        window.location.href = directCheckoutUrl;
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during redirect');
      setLoading(false);
    }
  };

  const handleSimulatedPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await simulateWhopPayment(
        plan.id,
        userId,
        userPhone,
        Number(price.amount),
        price.currency
      );

      if (result.success && result.code) {
        setPurchasedCode(result.code);
      } else {
        setError(result.error || 'Payment processing failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (purchasedCode) {
    return (
      <div className="rounded-3xl p-8 border border-emerald-500/20 bg-emerald-500/5 text-center max-w-lg mx-auto shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Payment Succeeded!</h2>
        <p className="text-white/60 mb-6 text-sm">
          Your payment was processed securely. We have generated an access pass for you.
        </p>

        <div className="bg-[#0B0C10] border border-white/10 rounded-2xl p-6 mb-8">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold">Your Access Code</p>
          <p className="text-3xl font-mono font-bold tracking-widest text-indigo-400 select-all">{purchasedCode}</p>
          <p className="text-xs text-white/40 mt-3">Copy this code and redeem it on the watch page to unlock your stream.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push('/my-access')}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors"
          >
            Go to My Access
          </button>
          <button
            onClick={() => router.push('/redeem')}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-colors"
          >
            Redeem Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start bg-[#0B0C10] p-1 rounded-3xl">
      {/* Plan Summary Card */}
      <div className="md:col-span-2 rounded-3xl p-8 border border-white/5 bg-[#12141C] relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
        <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4">You are buying</h2>
        <h3 className="text-2xl font-extrabold mb-2 text-white">{plan.name}</h3>
        <p className="text-sm text-white/60 mb-6">{plan.description}</p>
        
        <div className="pt-6 border-t border-white/5 flex justify-between items-baseline">
          <span className="text-white/50 text-sm">Total Due:</span>
          <div>
            <span className="text-4xl font-black text-white">{Number(price.amount).toFixed(2)}</span>
            <span className="text-lg text-white/50 ml-1.5 font-bold uppercase">{price.currency}</span>
          </div>
        </div>
      </div>

      {/* Checkout Area */}
      <div className="md:col-span-3 space-y-6">
        {/* Secure Payment Gateway Card */}
        <div className="rounded-3xl p-8 border border-white/5 bg-[#12141C] shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <span>🛡️</span> Secure Payment Gateway
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {price.whopPlanId ? (
            <div className="space-y-6">
              <p className="text-sm text-white/70 leading-relaxed">
                You will be securely routed to our verified global billing portal to complete your order over an encrypted link.
              </p>
              
              <button
                onClick={onCheckoutRedirect}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold rounded-2xl text-base transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {loading ? 'Initializing Secure Connection...' : 'Proceed to Payment'}
              </button>

              <div className="text-center pt-2">
                <span className="text-[10px] text-white/40 font-mono tracking-wide">
                  🔒 256-Bit SSL Encrypted Connection • Instant Digital Code Allocation
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400">
              ⚠️ **Configuration Pending**: The administrator has not configured a payment key for this region. Please try again later.
            </div>
          )}
        </div>

        {/* Local Sandbox Simulator (Rendered ONLY in development mode) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-3xl p-8 border border-white/5 bg-white/5 opacity-60 hover:opacity-100 transition-opacity">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-white">
              <span>🧪</span> Local Sandbox Simulator
            </h2>
            <p className="text-sm text-white/50 mb-4">
              This testing panel is active only in your local development environment (`NODE_ENV === 'development'`).
            </p>
            <button
              onClick={handleSimulatedPayment}
              disabled={loading}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-2xl text-sm transition-colors"
            >
              Confirm Payment (Local Mock Simulation)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
