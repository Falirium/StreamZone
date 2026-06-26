'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { submitEmailForOtp, submitOtpForVerification } from './actions';

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/my-access';

  // State Management
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI Status Flags
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Auto-focus Ref
  const otpInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Transition Auto-focus Trigger
  useEffect(() => {
    if (otpSent) {
      otpInputRef.current?.focus();
    }
  }, [otpSent]);

  // Clean OTP input of non-digits
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const digitsOnly = val.replace(/[^0-9]/g, '').slice(0, 6);
    if (val !== digitsOnly) {
      e.target.value = digitsOnly;
    }
    setOtpCode(digitsOnly);
  };

  // Submit email and request code
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailVal = emailInputRef.current?.value || email;
    if (!emailVal) return;

    setIsSendingOtp(true);
    setError(null);

    const formData = new FormData();
    formData.set('email', emailVal.trim());

    try {
      const result = await submitEmailForOtp(formData);
      if (!result.success) {
        setError(result.error || 'Failed to send verification code');
      } else {
        setOtpSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Submit and verify code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeVal = otpInputRef.current?.value || otpCode;
    if (!codeVal || codeVal.length !== 6) return;

    setIsVerifying(true);
    setError(null);

    const emailVal = emailInputRef.current?.value || email;

    const formData = new FormData();
    formData.set('email', emailVal.trim());
    formData.set('code', codeVal);

    try {
      const result = await submitOtpForVerification(formData);
      if (!result.success) {
        setError(result.error || 'Invalid verification code');
      } else {
        window.location.href = returnUrl;
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full px-4 py-8 flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/5 bg-[#12141C] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

        <h1 className="text-2xl font-bold text-white mb-2">Welcome to StreamZone</h1>
        <p className="text-white/60 mb-8 text-sm break-words">
          {!otpSent 
            ? 'Enter your email address to log in or create your account.' 
            : <>We sent a 6-digit confirmation code to <span className="font-semibold text-white break-all">{email}</span></>}
        </p>

        {otpSent && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex gap-3 text-xs text-indigo-200/90 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-base select-none">📩</span>
            <div>
              <p className="font-semibold text-white mb-0.5">Check your inbox & spam folder</p>
              <p>
                The email was dispatched. If the code does not arrive in your **inbox** within 60 seconds, please check your **Spam / Junk** folder.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Step 1: Email Input */}
          <form onSubmit={handleSendOtp} className="space-y-6">
            {!otpSent && (
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent || isSendingOtp}
                  placeholder="your@email.com"
                  className="w-full h-[50px] px-4 rounded-xl bg-[#0B0C10] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 transition-opacity outline-none text-sm"
                  required
                />
              </div>
            )}

            {!otpSent && (
              <button
                type="submit"
                disabled={isSendingOtp || !email}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/15"
              >
                {isSendingOtp ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            )}
          </form>

          {/* Step 2: OTP Verification */}
          {otpSent && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 pt-4 border-t border-white/5 animate-fadeIn">
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2">
                  6-Digit OTP Code
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  onChange={handleOtpChange}
                  placeholder="123456"
                  maxLength={6}
                  disabled={isVerifying}
                  className="w-full h-[50px] px-4 rounded-xl bg-[#0B0C10] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 transition-opacity outline-none text-sm tracking-widest text-center font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isVerifying || otpCode.length !== 6}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/15"
                >
                  {isVerifying ? 'Verifying Code...' : 'Verify & Login'}
                </button>
                
                <button
                  type="button"
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl transition-colors border border-white/5"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setError(null);
                  }}
                >
                  Change email address
                </button>
              </div>
            </form>
          )}

          {/* Sandbox code disclosure panel */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs">
              <strong>Developer Sandbox:</strong> Check your local server/dev console logs to find the generated OTP verification code!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
