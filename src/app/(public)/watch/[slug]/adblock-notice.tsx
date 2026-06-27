'use client';

import { useState, useEffect } from 'react';

export function AdblockNotice() {
  const [device, setDevice] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [isDismissed, setIsDismissed] = useState<boolean>(true); // Start as true to prevent layout shift on SSR, check in useEffect

  useEffect(() => {
    // 1. Detect device type
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /android/.test(ua);

    if (isIOS) {
      setDevice('ios');
    } else if (isAndroid) {
      setDevice('android');
    } else {
      setDevice('desktop');
    }

    // 2. Check dismissal state
    const dismissed = localStorage.getItem('streamzone_adblock_dismissed');
    if (dismissed !== 'true') {
      setIsDismissed(false);
    }
  }, []);

  if (isDismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem('streamzone_adblock_dismissed', 'true');
    setIsDismissed(true);
  };

  // Get Brave App Store / Play Store URL
  const getBraveUrl = () => {
    if (device === 'ios') {
      return 'https://apps.apple.com/app/brave-private-web-browser/id1052879175';
    }
    if (device === 'android') {
      return 'https://play.google.com/store/apps/details?id=com.brave.browser';
    }
    return 'https://brave.com/';
  };

  const getButtonText = () => {
    if (device === 'ios') return 'Get Brave (App Store) ⚡';
    if (device === 'android') return 'Get Brave (Play Store) ⚡';
    return 'Get Brave Browser ⚡';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl glass p-5 sm:p-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 border border-brand-500/20 shadow-[0_0_30px_rgba(76,110,245,0.05)]">
      {/* Dynamic decorative glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-white/40 hover:text-white/80 p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
        aria-label="Dismiss notice"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex gap-4 items-start">
        {/* Shield Icon Container */}
        <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20 shrink-0 hidden sm:block">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <div className="flex-1 space-y-3">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-brand-500/10 text-brand-400 rounded-lg border border-brand-500/20 sm:hidden">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <h4 className="font-extrabold text-white tracking-tight text-sm sm:text-base">
                Pro-Tip: Defeat the Corporate Ad-Jacks 🛡️
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed pt-1">
              Corporate broadcast networks want us shut down, and external providers force annoying, tracking-heavy pop-up ads to monetize. While we fight their scripts on our end, they always find ways to hijack the player.
            </p>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              <span className="text-brand-300 font-medium">Take control with your secret weapon:</span> run a privacy-first browser like <strong className="text-white">Brave</strong>. It completely wipes out pop-up redirects and trackers, unlocking a flawless, 100% ad-free premium viewing experience.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href={getBraveUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/15 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              {getButtonText()}
            </a>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
            >
              I'll manage the pop-ups
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
