'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function WhopPollStatus({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'success' | 'error' | 'failed'>('pending');
  const [attempts, setAttempts] = useState(0);
  const [errorDetails, setErrorDetails] = useState<{
    reason: string;
    whopEmail?: string;
    loggedInEmail?: string;
  } | null>(null);
 
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
        } else if (data.status === 'failed') {
          setStatus('failed');
          setErrorDetails({
            reason: data.error,
            whopEmail: data.whopEmail,
            loggedInEmail: data.loggedInEmail,
          });
          clearInterval(interval);
        } else {
          setAttempts((prev) => {
            if (prev >= 30) { // 60 seconds max
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
 
  if (status === 'failed') {
    return (
      <div className="mb-8 p-6 rounded-2xl border border-red-500/20 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
        <h3 className="text-lg font-bold text-red-400">❌ Payment Verification Failed</h3>
        {errorDetails?.reason === 'EMAIL_MISMATCH' ? (
          <div className="mt-2 text-sm text-white/80 space-y-2">
            <p>
              The email used for Whop checkout does not match your logged-in StreamZone account:
            </p>
            <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1 font-mono text-xs">
              <div>
                <span className="text-white/40">Logged-in Account:</span>{' '}
                <span className="text-indigo-400 font-semibold">{errorDetails.loggedInEmail}</span>
              </div>
              <div>
                <span className="text-white/40">Whop Checkout Email:</span>{' '}
                <span className="text-amber-400 font-semibold">{errorDetails.whopEmail}</span>
              </div>
            </div>
            <p className="text-xs text-white/60">
              Please contact support or log in with the account matching your Whop checkout email.
            </p>
          </div>
        ) : (
          <p className="text-sm text-white/80 mt-1">
            Verification failed: {errorDetails?.reason || 'An unexpected error occurred.'}
          </p>
        )}
        <p className="text-xs text-white/50 mt-4 font-mono">Reference: {paymentId}</p>
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
      <span className="text-[10px] text-white/40 font-mono">Attempt {attempts}/30</span>
    </div>
  );
}
