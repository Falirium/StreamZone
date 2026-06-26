'use client';

import { useState, useEffect, useRef } from 'react';
import { StreamEntry } from '@/lib/stream-provider';
import { Button } from '@/components/ui/button';

export function PlayerClient({ streams, isPreview = false }: { streams: StreamEntry[]; isPreview?: boolean }) {
  // Try to default to an English HD stream, or just the first one
  const defaultStream = 
    streams.find(s => s.language.toLowerCase().includes('en') && s.hd) ||
    streams.find(s => s.language.toLowerCase().includes('en')) ||
    streams[0];

  const [activeStream, setActiveStream] = useState<StreamEntry>(defaultStream);
  const [isOffline, setIsOffline] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isEvicted, setIsEvicted] = useState(false);
  const [evictionMessage, setEvictionMessage] = useState('');

  // 5-Minute Preview state
  const [previewSecondsLeft, setPreviewSecondsLeft] = useState<number>(300);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  const offlineTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>('');

  useEffect(() => {
    // Generate or retrieve a unique session ID for this browser tab
    let sessId = sessionStorage.getItem('stream_session_id');
    if (!sessId) {
      sessId = 'sess-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      sessionStorage.setItem('stream_session_id', sessId);
    }
    sessionIdRef.current = sessId;

    // Get event slug from URL pathname
    const slug = window.location.pathname.split('/').pop() || 'global';

    let previewInterval: NodeJS.Timeout | null = null;
    let guestHeartbeatInterval: NodeJS.Timeout | null = null;

    const startGuestTimers = (initialRemaining: number) => {
      // 1. Local countdown tick (smooth 1-second UI update)
      previewInterval = setInterval(() => {
        setPreviewSecondsLeft((prev) => {
          const nextVal = prev - 1;
          const consumed = 300 - nextVal;
          localStorage.setItem(`stream_preview_time_used_${slug}`, consumed.toString());

          if (nextVal <= 0) {
            setShowUpgradeModal(true);
            if (previewInterval) clearInterval(previewInterval);
            if (guestHeartbeatInterval) clearInterval(guestHeartbeatInterval);
            return 0;
          }
          return nextVal;
        });
      }, 1000);

      // 2. Server heartbeat tick (every 5 seconds) to track consumed time by IP on backend
      guestHeartbeatInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/watch/preview', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ slug, seconds: 5 }),
          });

          if (res.ok) {
            const data = await res.json();
            const serverRemaining = data.remaining;
            if (serverRemaining <= 0) {
              setShowUpgradeModal(true);
              if (previewInterval) clearInterval(previewInterval);
              if (guestHeartbeatInterval) clearInterval(guestHeartbeatInterval);
              setPreviewSecondsLeft(0);
            }
          }
        } catch (err) {
          console.error('Failed to sync preview heartbeat:', err);
        }
      }, 5000);
    };

    // 1. Initialize & load preview time limit (from both server IP-cache and client localStorage)
    if (isPreview) {
      const initPreviewTime = async () => {
        let serverRemaining = 300;
        try {
          const res = await fetch(`/api/watch/preview?slug=${slug}`);
          if (res.ok) {
            const data = await res.json();
            serverRemaining = typeof data.remaining === 'number' ? data.remaining : 300;
          }
        } catch (err) {
          console.error('Failed to fetch preview remaining time:', err);
        }

        const storedTimeStr = localStorage.getItem(`stream_preview_time_used_${slug}`);
        const storedTime = storedTimeStr ? parseInt(storedTimeStr, 10) : 0;
        const clientRemaining = Math.max(0, 300 - storedTime);

        // Pick the minimum to prevent bypassing (e.g. Incognito vs Normal)
        const finalRemaining = Math.min(serverRemaining, clientRemaining);
        setPreviewSecondsLeft(finalRemaining);

        if (finalRemaining <= 0) {
          setShowUpgradeModal(true);
        } else {
          startGuestTimers(finalRemaining);
        }
      };

      initPreviewTime();
    }

    // 2. Heartbeat check for session eviction (only for authenticated users)
    let heartbeatInterval: NodeJS.Timeout | null = null;
    if (!isPreview) {
      const sendHeartbeat = async () => {
        if (isOffline || isEvicted) return;

        try {
          const res = await fetch('/api/watch/heartbeat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: sessionIdRef.current,
              slug,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.evicted) {
              setIsEvicted(true);
              setEvictionMessage(data.message || 'Session Suspended. Your account is active on another device.');
            }
          }
        } catch (err) {
          console.error('Heartbeat check failed:', err);
        }
      };

      sendHeartbeat();
      heartbeatInterval = setInterval(sendHeartbeat, 5000);
    }

    // 3. Connection event handlers
    const handleOnline = () => {
      setIsOffline(false);
      setIsTimeout(false);
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      
      offlineTimerRef.current = setTimeout(() => {
        setIsTimeout(true);
      }, 30000); // 30 seconds
    };

    setIsOffline(!navigator.onLine);
    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (previewInterval) clearInterval(previewInterval);
      if (guestHeartbeatInterval) clearInterval(guestHeartbeatInterval);
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline, isEvicted, isPreview]);

  const handleReload = () => {
    window.location.reload();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // If session is evicted / suspended (only for paying/logged-in users)
  if (isEvicted) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-2 border-red-500/30 flex flex-col items-center justify-center p-6 text-center shadow-2xl shadow-black/80 animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6 text-3xl shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-bounce">
          ⚠️
        </div>
        <h3 className="text-xl font-extrabold text-white mb-2">Session Suspended</h3>
        <p className="text-white/60 text-sm max-w-md leading-relaxed mb-6">
          {evictionMessage}. Only one active stream is permitted per pass. If this was not you, please log in again or contact WhatsApp support.
        </p>
        <div className="flex gap-4">
          <Button onClick={handleReload} variant="ghost" className="text-white hover:bg-white/10 font-bold border border-white/10">
            Log In Again
          </Button>
          <a
            href="/my-access"
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(76,110,245,0.3)]"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  // If connection timed out (offline for > 30 seconds)
  if (isTimeout) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 flex flex-col items-center justify-center p-6 text-center shadow-2xl shadow-black/50 animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-6 text-3xl shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          🔌
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Connection Lost</h3>
        <p className="text-white/60 text-sm max-w-sm mb-6">
          Reconnection timed out. Please check your internet connection and try again.
        </p>
        <div className="flex gap-4">
          <Button onClick={handleReload} className="bg-brand-600 hover:bg-brand-500 font-bold">
            Reload Stream
          </Button>
          <a
            href="/my-access"
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all"
          >
            Get Help
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 16:9 Video Player Container */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
        {activeStream ? (
          <>
            {(!isPreview || !showUpgradeModal) ? (
              <iframe
                src={activeStream.embedUrl}
                className="absolute top-0 left-0 w-full h-full animate-in fade-in duration-500"
                frameBorder="0"
                allowFullScreen
                scrolling="no"
                allow="encrypted-media"
              />
            ) : (
              // When expired, show a blurred background placeholder
              <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-xl animate-in fade-in duration-500" />
            )}

            {isPreview && showUpgradeModal && (
              <div className="absolute inset-0 z-30 bg-[#0A0A0F]/70 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-500">
                {/* Decorative glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-500/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="w-16 h-16 bg-gradient-to-tr from-brand-500 to-brand-700 text-white rounded-full flex items-center justify-center mb-5 text-3xl shadow-lg shadow-brand-500/20 animate-pulse">
                  👑
                </div>
                
                <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2 tracking-tight">Free Preview Completed</h3>
                
                <p className="text-white/70 text-xs sm:text-sm max-w-md leading-relaxed mb-6">
                  You've enjoyed your 5-minute premium trial. Upgrade to a **Premium Pass** now to get unlimited zero-downtime streaming in 60 FPS HD.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm justify-center">
                  <a
                    href="/pricing"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-extrabold text-sm transition-all shadow-lg shadow-brand-600/30 hover:shadow-brand-600/50 hover:scale-105 active:scale-95 text-center flex-1"
                  >
                    Upgrade to Premium Pass
                  </a>
                </div>
              </div>
            )}

            {isOffline && !showUpgradeModal && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-20 animate-in fade-in duration-300">
                <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Connection Interrupted</h3>
                <p className="text-white/60 text-sm max-w-xs">
                  Reconnecting... checking your connection.
                </p>
              </div>
            )}

            {/* Countdown Badge overlay for free preview */}
            {isPreview && !showUpgradeModal && (
              <div className="absolute top-4 right-4 z-10 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-yellow-500/30 text-[11px] font-bold text-yellow-400 flex items-center gap-1.5 shadow-lg select-none animate-in fade-in slide-in-from-top-1 duration-300">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
                <span>FREE PREVIEW: {formatTime(previewSecondsLeft)} remaining</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-white/50">
            No stream selected
          </div>
        )}
      </div>

      {/* Stream Selector */}
      {streams.length > 1 && (
        <div className="glass rounded-xl p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">Available Streams</h3>
          <div className="flex flex-wrap gap-2">
            {streams.map((stream) => (
              <button
                key={stream.id}
                onClick={() => setActiveStream(stream)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeStream.id === stream.id
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{stream.language} {stream.streamNo ? `(${stream.streamNo})` : ''}</span>
                {stream.hd && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    activeStream.id === stream.id ? 'bg-white/20' : 'bg-brand-500/20 text-brand-400'
                  }`}>
                    HD
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
