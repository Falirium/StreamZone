'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { redeemCode } from './actions';

export function RedeemClient({ initialCode }: { initialCode?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await redeemCode(formData);
      if (!result.success) {
        setError(result.error || 'Failed to redeem code');
        setSuccess(false);
      } else {
        setError(null);
        setSuccess(true);
        setTimeout(() => router.push('/my-access'), 2000);
      }
    });
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-12 sm:mt-24 p-8 bg-surface-800/50 backdrop-blur-xl border border-brand-500/30 rounded-3xl text-center shadow-[0_0_40px_rgba(76,110,245,0.15)] animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          ✓
        </div>
        <h1 className="text-3xl font-extrabold mb-3 text-white">Access Granted</h1>
        <p className="text-white/60 font-medium">Your pass is active. Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 sm:mt-24 p-6 sm:p-10 bg-surface-800/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-600/30 blur-[60px] rounded-full pointer-events-none" />
      
      <div className="relative z-10">
        <h1 className="text-3xl font-extrabold mb-3 text-white">Redeem Code</h1>
        <p className="text-white/60 mb-8 font-medium">
          Enter your 8-character access code below to unlock live sports.
        </p>

        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Access Code</label>
            <input
              name="code"
              type="text"
              required
              defaultValue={initialCode || ''}
              placeholder="XXXX-XXXX"
              className="w-full bg-surface-900 border-2 border-white/10 rounded-xl px-6 py-5 text-center text-2xl font-mono uppercase tracking-[0.2em] text-white placeholder:text-white/20 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 focus:outline-none transition-all"
            />
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
              <p className="text-sm font-semibold text-red-400">{error}</p>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isPending}
            className="w-full py-4 rounded-xl bg-white hover:bg-gray-100 text-black font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isPending ? (
              <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              'Unlock Access'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
