'use client';

import { useState, useTransition } from 'react';
import type { Country } from '@prisma/client';
import { sendPushEarly, UpcomingPushItem } from './actions';

interface Props {
  countries: Country[];
  initialQueue?: UpcomingPushItem[];
}

export function PushClient({ countries, initialQueue = [] }: Props) {
  // Form state
  const [title, setTitle] = useState('New Event Starting Now! 🚨');
  const [message, setMessage] = useState('Tune in live to watch the match of the day. Stream now in HD!');
  const [redirectUrl, setRedirectUrl] = useState('/events');
  const [targetFilter, setTargetFilter] = useState<'global' | 'country' | 'phone' | 'email'>('global');
  const [targetValue, setTargetValue] = useState('');

  // Queue state
  const [queue, setQueue] = useState<UpcomingPushItem[]>(initialQueue);
  const [isPending, startTransition] = useTransition();
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  // Status state
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    sent?: number;
    failed?: number;
    error?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          message,
          redirectUrl,
          targetFilter,
          targetValue: targetFilter === 'global' ? undefined : targetValue,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          sent: data.data?.sent ?? 0,
          failed: data.data?.failed ?? 0,
        });
      } else {
        setResult({
          success: false,
          error: data.error || 'Failed to dispatch push notification.',
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'An unexpected network error occurred.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendEarly = (eventId: string) => {
    setActionResult(null);
    startTransition(async () => {
      try {
        const res = await sendPushEarly(eventId);
        if (res.success) {
          setQueue((prev) => prev.filter((item) => item.eventId !== eventId));
          setActionResult({
            success: true,
            message: res.data?.message || 'Notification dispatched successfully!',
          });
        } else {
          setActionResult({
            success: false,
            message: res.error || 'Failed to dispatch notification.',
          });
        }
      } catch (err: any) {
        setActionResult({
          success: false,
          message: err.message || 'An unexpected error occurred.',
        });
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Compose Form: Left 7 Columns */}
      <div className="lg:col-span-7 bg-surface-800 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <h2 className="text-lg font-bold text-white mb-6">Compose Notification</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
              Target Audience
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTargetFilter('global');
                  setTargetValue('');
                }}
                className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                  targetFilter === 'global'
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-600/5'
                    : 'bg-white/5 border-white/5 hover:border-white/10 text-white/70'
                }`}
              >
                <span className="text-lg">🌍</span>
                <span>Global</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetFilter('country');
                  setTargetValue(countries[0]?.code || '');
                }}
                className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                  targetFilter === 'country'
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-600/5'
                    : 'bg-white/5 border-white/5 hover:border-white/10 text-white/70'
                }`}
              >
                <span className="text-lg">🏳️</span>
                <span>By Country</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetFilter('phone');
                  setTargetValue('');
                }}
                className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                  targetFilter === 'phone'
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-600/5'
                    : 'bg-white/5 border-white/5 hover:border-white/10 text-white/70'
                }`}
              >
                <span className="text-lg">📱</span>
                <span>By Phone</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetFilter('email');
                  setTargetValue('');
                }}
                className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                  targetFilter === 'email'
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-600/5'
                    : 'bg-white/5 border-white/5 hover:border-white/10 text-white/70'
                }`}
              >
                <span className="text-lg">📧</span>
                <span>By Email</span>
              </button>
            </div>
          </div>

          {/* Conditional Target Inputs */}
          {targetFilter === 'country' && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <label htmlFor="countrySelect" className="block text-xs font-semibold text-white/60 mb-2">
                Select Target Country
              </label>
              <select
                id="countrySelect"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full bg-[#12141C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                required
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetFilter === 'phone' && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <label htmlFor="phoneInput" className="block text-xs font-semibold text-white/60 mb-2">
                Target User Phone Number (with Country Code)
              </label>
              <input
                id="phoneInput"
                type="text"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="+1234567890"
                className="w-full bg-[#12141C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          )}

          {targetFilter === 'email' && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <label htmlFor="emailInput" className="block text-xs font-semibold text-white/60 mb-2">
                Target User Email Address
              </label>
              <input
                id="emailInput"
                type="email"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="user@domain.com"
                className="w-full bg-[#12141C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          )}

          <hr className="border-white/5" />

          {/* Title */}
          <div>
            <label htmlFor="titleInput" className="block text-xs font-semibold text-white/60 mb-2">
              Notification Title
            </label>
            <input
              id="titleInput"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title of push banner"
              maxLength={60}
              className="w-full bg-[#12141C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          {/* Message Body */}
          <div>
            <label htmlFor="bodyTextarea" className="block text-xs font-semibold text-white/60 mb-2">
              Notification Body Message
            </label>
            <textarea
              id="bodyTextarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Short descriptive broadcast copy..."
              maxLength={150}
              rows={3}
              className="w-full bg-[#12141C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              required
            />
          </div>

          {/* Redirect link */}
          <div>
            <label htmlFor="redirectLinkInput" className="block text-xs font-semibold text-white/60 mb-2">
              Redirect Link (URL Tapped Action)
            </label>
            <input
              id="redirectLinkInput"
              type="text"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="/watch/slug-of-event"
              className="w-full bg-[#12141C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
            <p className="text-[10px] text-white/40 mt-1.5">
              Enter relative paths (e.g. <code className="text-white/60">/events</code> or <code className="text-white/60">/pricing</code>) or complete external URLs.
            </p>
          </div>

          {/* Submit Trigger */}
          <button
            type="submit"
            disabled={isSending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Dispatched Broadcast...
              </>
            ) : (
              '⚡ Send Broadcast Notification'
            )}
          </button>
        </form>

        {/* Results Banner */}
        {result && (
          <div className="mt-6 animate-in fade-in duration-200">
            {result.success ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl p-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span>✅</span>
                  <span>Broadcast Dispatched Successfully!</span>
                </div>
                <p className="text-xs text-white/70 mt-1 leading-relaxed">
                  {result.message}
                </p>
                <div className="flex gap-4 text-xs font-bold text-emerald-400 mt-2 border-t border-emerald-500/10 pt-2 select-none">
                  <div>Sent: {result.sent}</div>
                  <div>Failed: {result.failed}</div>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4 flex items-start gap-2.5">
                <span className="text-base leading-none">❌</span>
                <div>
                  <h4 className="font-bold text-sm leading-snug">Broadcast Failed</h4>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    {result.error}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Live Notification Preview: Right 5 Columns */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-surface-800 border border-white/10 rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-6">Real-Time Phone Preview</h2>
          
          <div className="flex-1 flex items-center justify-center p-4">
            {/* Phone Body Mock */}
            <div className="w-64 h-[420px] bg-black rounded-[36px] border-[6px] border-surface-700 shadow-2xl relative overflow-hidden flex flex-col select-none">
              {/* Dynamic status bar */}
              <div className="h-6 w-full bg-black flex justify-between items-center px-6 text-[10px] text-white/80 shrink-0 font-medium">
                <span>9:41</span>
                {/* Camera notch */}
                <div className="w-16 h-3.5 bg-black rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2" />
                <div className="flex items-center gap-1">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>

              {/* Wallpaper background */}
              <div 
                className="flex-1 w-full bg-cover bg-center p-4 flex flex-col justify-start relative"
                style={{ 
                  backgroundImage: 'radial-gradient(circle at center, #2e1065 0%, #03001e 80%, #12001e 100%)' 
                }}
              >
                {/* Simulated lock screen clock */}
                <div className="flex flex-col items-center mt-6 text-white shrink-0">
                  <span className="text-3xl font-extralight tracking-tight">09:41</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/60 mt-0.5">Wednesday, June 24</span>
                </div>

                {/* Interactive Lock Screen Notification Banner */}
                <div className="mt-8 bg-surface-900/90 border border-white/10 rounded-2xl p-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 w-full">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 bg-indigo-600 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                        SZ
                      </div>
                      <span className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider">StreamZone</span>
                    </div>
                    <span className="text-[9px] text-white/40">now</span>
                  </div>

                  <h4 className="font-extrabold text-white text-xs leading-snug break-words">
                    {title || 'New Live Event!'}
                  </h4>
                  <p className="text-white/70 text-[10px] mt-0.5 leading-relaxed break-words line-clamp-3">
                    {message || 'Watch today\'s game on StreamZone.'}
                  </p>
                </div>
              </div>

              {/* Home indicator bar */}
              <div className="h-4 w-full bg-black flex items-center justify-center shrink-0">
                <div className="w-24 h-1 bg-white/40 rounded-full" />
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-white/5 rounded-xl p-3 border border-white/5 text-[10px] text-white/50 leading-relaxed">
            💡 <strong>Tip:</strong> Users must grant Notification Permissions when requested. To test the delivery, log in to the client-side app, enable notifications, and target your phone number here.
          </div>
        </div>
      </div>
    </div>

      {/* Upcoming Automated Promotions Queue */}
      <div className="bg-surface-800 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden mt-8">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📋</span> Scheduled Automated Promotions
            </h2>
            <p className="text-white/60 text-xs mt-1">
              Automated notifications scheduled for upcoming matches. They send automatically 30 minutes prior to kickoff.
            </p>
          </div>
        </div>

        {actionResult && (
          <div className={`mb-6 p-4 rounded-xl border text-sm ${actionResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
            {actionResult.message}
          </div>
        )}

        {queue.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-[#12141C]/50">
            <span className="text-3xl">📭</span>
            <p className="text-white/40 text-sm mt-3 font-medium">No upcoming scheduled promotions. Events are either complete or sent.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((item) => (
              <div 
                key={item.eventId} 
                className="glass rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex-1 space-y-3 min-w-0 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                      {item.eventCategory}
                    </span>
                    <h3 className="text-sm font-extrabold text-white truncate">{item.eventTitle}</h3>
                    <span className="text-[10px] text-white/40 font-mono">
                      Kickoff: {new Date(item.startsAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-black/20 border border-white/5 rounded-xl p-3 space-y-1.5">
                    <div className="text-xs font-bold text-white/70">
                      Preview: <span className="text-brand-300 font-extrabold">{item.compiledTitle}</span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed font-sans select-all">{item.compiledBody}</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold">
                    <span>⏰ Auto-Dispatch scheduled at:</span>
                    <span className="font-mono bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      {new Date(item.sendScheduledAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleSendEarly(item.eventId)}
                    disabled={isPending}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 rounded-lg transition-all shadow-md shadow-indigo-600/15 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isPending ? (
                      <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      '⚡ Send Now'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
