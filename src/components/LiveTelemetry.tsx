'use client';

import { useEffect, useState } from 'react';

export function LiveTelemetry() {
  const [mounted, setMounted] = useState(false);
  const [bitrate, setBitrate] = useState(7820);
  const [latency, setLatency] = useState(14);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    setMounted(true);

    const interval = setInterval(() => {
      // Fluctuate Bitrate by 1-2% (~7800 Kbps base)
      setBitrate((prev) => {
        const delta = Math.floor((Math.random() - 0.5) * 120); // fluctuate +/- 60 Kbps
        const next = prev + delta;
        return Math.min(8000, Math.max(7600, next));
      });

      // Fluctuate Latency by 1-2 ms (~14ms base)
      setLatency((prev) => {
        const delta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const next = prev + delta;
        return Math.min(18, Math.max(12, next));
      });

      // Fluctuate FPS occasionally between 59 and 60
      setFps(() => {
        return Math.random() > 0.9 ? 59 : 60;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    // Render placeholder with same layout structure but static values to avoid layout shift
    return (
      <div className="hidden lg:flex items-center gap-4 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white/70 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-white/40 uppercase tracking-wider text-[9px]">LIVE TELEMETRY</span>
        </div>
        <div className="h-3 w-px bg-white/10" />
        <div>BITRATE: <span className="text-white font-mono">7,800 Kbps</span></div>
        <div className="h-3 w-px bg-white/10" />
        <div>PING: <span className="text-white font-mono">14ms</span></div>
        <div className="h-3 w-px bg-white/10" />
        <div>FPS: <span className="text-white font-mono">60 FPS</span></div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center gap-4 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white/70 backdrop-blur-md select-none shadow-[0_0_15px_rgba(16,185,129,0.02)]">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        <span className="text-white/40 uppercase tracking-wider text-[9px]">LIVE TELEMETRY</span>
      </div>
      
      <div className="h-3 w-px bg-white/10" />
      
      <div className="transition-all duration-300">
        BITRATE: <span className="text-emerald-400 font-mono font-bold">{bitrate.toLocaleString()} Kbps</span>
      </div>
      
      <div className="h-3 w-px bg-white/10" />
      
      <div className="transition-all duration-300">
        PING: <span className="text-emerald-400 font-mono font-bold">{latency}ms</span>
      </div>
      
      <div className="h-3 w-px bg-white/10" />
      
      <div className="transition-all duration-300">
        FPS: <span className="text-emerald-400 font-mono font-bold">{fps} FPS</span>
      </div>
    </div>
  );
}
