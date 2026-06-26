'use client';

import { useState, useEffect } from 'react';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Custom display states
  const [isVisible, setIsVisible] = useState(false); // Controls whether prompt is shown (minimized or expanded)
  const [isMinimized, setIsMinimized] = useState(false); // Controls minimized vs expanded state
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('PWA Service Worker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.error('PWA Service Worker registration failed:', err);
        });
    }

    // 2. Check if already installed / running in standalone mode
    const standaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 4. Handle standard PWA prompt listener (Android/Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Auto-show when prompt is available
      if (!standaloneMode) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Handle app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsStandalone(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 6. Auto-show helper for iOS or generic browser installation after 2 seconds
    const minimized = sessionStorage.getItem('pwa_minimized') === 'true';
    
    if (!standaloneMode) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setIsMinimized(minimized);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // 7. Monitor keyboard/input focus to hide floating layout when writing
    const handleFocusIn = (e: FocusEvent) => {
      const tagName = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = () => {
      setIsInputFocused(false);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install response outcome: ${outcome}`);

    setDeferredPrompt(null);
    setIsMinimized(true); // Minimize to tab instead of hiding completely
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    sessionStorage.setItem('pwa_minimized', 'true');
  };

  const handleExpand = () => {
    setIsMinimized(false);
    sessionStorage.setItem('pwa_minimized', 'false');
  };

  // Do not render if standalone or keyboard is open
  if (isStandalone || isInputFocused || !isVisible) return null;

  return (
    <>
      {/* ────────────────────────────────────────────────────────────────
          STATE A: MINIMIZED FLOATING BADGES (STILL THERE)
          ──────────────────────────────────────────────────────────────── */}
      {isMinimized && (
        <>
          {/* Desktop Minimized Tab: Vertical Tab on Right Edge */}
          <div 
            onClick={handleExpand}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] hidden lg:flex flex-col items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-4 rounded-l-xl cursor-pointer shadow-2xl transition-all border-y border-l border-white/20 select-none animate-in fade-in slide-in-from-right-5 duration-300 group"
          >
            <span className="text-sm font-bold animate-bounce">📥</span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest [writing-mode:vertical-lr] text-center select-none group-hover:text-indigo-100">
              Install App
            </span>
          </div>

          {/* Mobile Minimized FAB: Round Button in Bottom-Right Corner */}
          <div 
            onClick={handleExpand}
            className="fixed bottom-6 right-6 z-[100] lg:hidden w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-2xl cursor-pointer border border-white/20 animate-in scale-in duration-300 hover:scale-105 active:scale-95"
          >
            <span className="text-xl leading-none animate-pulse">📥</span>
          </div>
        </>
      )}

      {/* ────────────────────────────────────────────────────────────────
          STATE B: EXPANDED PROMPT CARDS
          ──────────────────────────────────────────────────────────────── */}
      {!isMinimized && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="glass bg-[#12141C]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />

            {/* Header controls (Minimize only) */}
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">App Install</span>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleMinimize}
                  className="text-white/40 hover:text-white/80 transition-colors px-2 py-0.5 rounded text-xs hover:bg-white/5 font-semibold"
                  title="Minimize to side"
                >
                  Minimize ➖
                </button>
              </div>
            </div>

            {/* Content Details */}
            <div className="flex gap-4 items-start">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-bold text-white text-base">
                SZ
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-white text-sm">Install StreamZone App</h4>
                <p className="text-white/60 text-xs mt-1 leading-relaxed break-words">
                  Add StreamZone to your Home Screen for fast, optimized, full-screen live sports streaming.
                </p>
              </div>
            </div>

            {/* Install trigger actions */}
            {deferredPrompt ? (
              /* Native Chrome/Android Install Trigger */
              <div className="flex gap-2 justify-end mt-1">
                <button
                  onClick={handleMinimize}
                  className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors border border-transparent"
                >
                  Minimize
                </button>
                <button
                  onClick={handleInstallClick}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/15 transition-all"
                >
                  Install App
                </button>
              </div>
            ) : isIOS ? (
              /* iOS Safari Manual Instructions */
              <div className="mt-1 bg-white/5 border border-white/5 rounded-xl p-3 text-[11px] text-white/70 flex items-center gap-2.5 leading-normal">
                <span className="text-sm shrink-0">💡</span>
                <span>
                  Tap the share button <strong className="text-white">📤</strong> in Safari, then select <strong className="text-white">Add to Home Screen ➕</strong>.
                </span>
              </div>
            ) : (
              /* Android Non-Chrome / Generic Desktop Manual Instructions */
              <div className="mt-1 bg-white/5 border border-white/5 rounded-xl p-3 text-[11px] text-white/70 flex items-center gap-2.5 leading-normal">
                <span className="text-sm shrink-0">💡</span>
                <span>
                  Tap your browser menu <strong className="text-white">⋮</strong> or <strong className="text-white">⋯</strong>, then select <strong className="text-white">Add to Home screen</strong>.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
