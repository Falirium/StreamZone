'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  sender: 'user' | 'support';
  text: string;
}

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'support',
      text: '👋 Welcome to StreamZone Support! How can we help you today? Select a common question below or message our Telegram.',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const faqs = [
    {
      id: 'login',
      q: '🔑 How do I log in?',
      a: 'We use a passwordless OTP (One-Time Password) system. Simply enter your email address on the login page, check your inbox (and Spam folder) for the 6-digit code, and enter it to log in instantly. No password required!',
    },
    {
      id: 'lag',
      q: '⏳ Lagging or seeing pop-up ads?',
      a: 'If your stream is lagging, click the "Available Streams" buttons underneath the player to switch mirrors, or refresh the page. Since we fetch raw feeds from external mirrors, they may show ads; we highly recommend using a browser with built-in ad-blocking (like Brave) or installing an extension (like uBlock Origin) for a 100% ad-free experience.',
    },
    {
      id: 'pay',
      q: '💳 How do I complete my payment?',
      a: 'If you are in Morocco, select a plan and you will be routed directly to a WhatsApp operator to pay via CashPlus, local bank transfer, or Zelle. International users will be routed to pay instantly via our card provider, Whop.',
    },
  ];

  const handleQuestionClick = (qText: string, answerText: string) => {
    // Avoid double clicking or posting if already sent
    if (messages[messages.length - 1]?.text === qText) return;

    // Add user question message
    setMessages((prev) => [...prev, { sender: 'user', text: qText }]);

    // Add support answer message with a slight delay for simulated realism
    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: 'support', text: answerText }]);
    }, 400);
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none">
      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[450px] rounded-2xl bg-surface-800/95 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-brand-600/30 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="font-bold text-sm text-white">StreamZone 24/7 Live Support</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors text-sm font-semibold"
            >
              ✕
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                } animate-in fade-in slide-in-from-bottom-2 duration-200`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none shadow-[0_2px_8px_rgba(76,110,245,0.25)]'
                      : 'bg-white/5 border border-white/5 text-white/90 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* FAQ buttons / Actions */}
          <div className="p-3.5 border-t border-white/10 bg-white/5 space-y-2">
            <p className="text-[10px] text-white/40 font-semibold px-1 uppercase tracking-wider">
              Quick Questions
            </p>
            <div className="flex flex-col gap-1.5">
              {faqs.map((faq) => (
                <button
                  key={faq.id}
                  onClick={() => handleQuestionClick(faq.q, faq.a)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs text-white/80 hover:text-white transition-all active:scale-[0.98]"
                >
                  {faq.q}
                </button>
              ))}
            </div>
            <div className="pt-3 text-center border-t border-white/5">
              <a
                href="https://t.me/streamzone_support"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors hover:underline"
              >
                <span>💬 Talk to a Human on Telegram</span>
                <span className="text-[10px]">↗</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 hover:shadow-brand-600/50 hover:scale-105 active:scale-95 transition-all"
        aria-label="Toggle support chat"
      >
        {isOpen ? (
          <span className="text-xl">✕</span>
        ) : (
          <svg
            className="w-6 h-6 animate-in zoom-in-50 duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
