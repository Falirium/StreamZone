'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function WhopPollStatus({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/checkout/poll?payment_id=${paymentId}`);
        const data = await res.json();
        
        if (data.status === 'success') {
          setStatus('success');
          clearInterval(interval);
          setTimeout(() => {
            // Remove search params from URL and reload/refresh page
            router.replace('/my-access');
            router.refresh();
          }, 1500);
        } else {
          setAttempts((prev) => {
            if (prev >= 15) { // 30 seconds max
              setStatus('error');
              clearInterval(interval);
              return prev;
            }
            return prev + 1;
          });
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    };

    // Check immediately, then every 2 seconds
    checkStatus();
    interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [paymentId, router]);

  if (status === 'success') {
    return (
      <div className="mb-8 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)] text-center animate-pulse">
        <h3 className="text-lg font-bold text-emerald-400">⚡ Payment Verified!</h3>
        <p className="text-sm text-white/80 mt-1">Your access pass has been automatically activated. Redirecting you...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mb-8 p-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
        <h3 className="text-lg font-bold text-amber-400">⌛ Payment Processing Delayed</h3>
        <p className="text-sm text-white/80 mt-1">
          Whop is taking longer than usual to confirm your payment. Don't worry! Your pass will appear here automatically once confirmed.
        </p>
        <p className="text-xs text-white/50 mt-2 font-mono">Reference: {paymentId}</p>
      </div>
    );
  }

  return (
    <div className="mb-8 p-6 rounded-2xl border border-brand-500/20 bg-brand-500/10 shadow-[0_0_20px_rgba(92,124,250,0.1)] flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-white">Verifying Whop Purchase...</h3>
          <p className="text-xs text-white/60 mt-0.5">Please wait while we activate your pass automatically.</p>
        </div>
      </div>
      <span className="text-[10px] text-white/40 font-mono">Attempt {attempts}/15</span>
    </div>
  );
}
