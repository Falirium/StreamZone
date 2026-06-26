'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { redeemCode } from '../../redeem/actions';
import { Button } from '@/components/ui/button';

export function WatchDrawer({ slug }: { slug: string }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 8) {
      value = value.slice(0, 8);
    }
    // Format as XXXX-XXXX
    if (value.length > 4) {
      value = `${value.slice(0, 4)}-${value.slice(4)}`;
    }
    setCode(value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.replace('-', '').length !== 8) {
      setError('Code must be exactly 8 characters (e.g., ABCD-1234).');
      return;
    }

    const formData = new FormData();
    formData.append('code', code);

    startTransition(async () => {
      const result = await redeemCode(formData);
      if (!result.success) {
        // Handle specific errors for yellow/amber highlights vs red
        setError(result.error || 'Invalid access code. Please verify the characters or contact your payment agent.');
      } else {
        setSuccess(true);
        setError(null);
        setTimeout(() => {
          window.location.reload();
        }, 1800);
      }
    });
  };

  // Check if error is device limit to apply amber highlight
  const isDeviceLimitError = error?.toLowerCase().includes('device limit') || error?.toLowerCase().includes('active on other');

  return (
    <div className="w-full max-w-md mx-auto bg-surface-800 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
      {/* Glow Decorator */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-600/20 blur-xl rounded-full pointer-events-none" />

        {success ? (
          <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              ✓
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">Access Unlocked!</h3>
            <p className="text-white/60 text-sm">Preparing stream broadcast...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-extrabold text-white">Enter Access Pass</h3>
              <p className="text-white/60 text-sm mt-1">
                This event requires an active pass. Redeem your 8-character code below to watch.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider pl-1">
                Access Code
              </label>
              <input
                type="text"
                value={code}
                onChange={handleInputChange}
                disabled={isPending}
                placeholder="ABCD-1234"
                className={`w-full bg-surface-900 border-2 rounded-xl px-5 py-4 text-center text-xl font-mono uppercase tracking-[0.25em] text-white placeholder:text-white/10 focus:outline-none transition-all ${
                  error
                    ? isDeviceLimitError
                      ? 'border-amber-500/60 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20'
                      : 'border-red-500/60 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                    : 'border-white/10 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20'
                }`}
              />
            </div>

            {error && (
              <div
                className={`border rounded-xl p-3 text-center transition-colors ${
                  isDeviceLimitError
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                <p className="text-xs font-semibold leading-relaxed">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 bg-white hover:bg-white/90 text-black font-extrabold text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              {isPending ? (
                <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                'Unlock Access'
              )}
            </Button>

            <div className="text-center pt-2">
              <a
                href="/pricing"
                className="text-xs text-brand-400 hover:underline font-semibold"
              >
                Don't have a code? View plans & pricing
              </a>
            </div>
          </form>
        )}
    </div>
  );
}
