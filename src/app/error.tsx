'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error securely to the console/server context
    console.error('[Unhandled Render Error]:', error);
  }, [error]);

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 text-white p-6 relative overflow-hidden">
      
      {/* Decorative Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 p-8 sm:p-10 bg-surface-800/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          ⚠
        </div>
        
        <h1 className="text-2xl font-extrabold mb-3 text-white">Something Went Wrong</h1>
        
        <p className="text-white/60 mb-8 text-sm leading-relaxed">
          An unexpected error occurred during rendering. Please try reloading the page, or contact our support agent on WhatsApp if the issue persists.
        </p>

        {isDev && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left overflow-x-auto max-h-48 text-xs font-mono text-red-400">
            <p className="font-bold mb-1">{error.name}: {error.message}</p>
            {error.stack && <pre className="opacity-80 whitespace-pre-wrap">{error.stack}</pre>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 font-bold px-6 py-3 rounded-xl text-sm">
            Try Again
          </Button>
          <a
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-all backdrop-blur-sm"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
