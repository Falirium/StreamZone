import Link from 'next/link';

export const metadata = { title: 'Help & FAQ — StreamZone' };

const faqItems = [
  {
    q: 'How do I purchase a pass?',
    a: 'Go to our Pricing page, select your preferred pass option (such as the Match Pass), and click "Buy Now". You will be routed to contact one of our active payment operators directly on WhatsApp. They will provide the payment instructions (e.g., CashPlus, bank transfer, Zelle) and confirm your receipt.',
  },
  {
    q: 'I made the payment. How do I get my access code?',
    a: 'Once your WhatsApp payment agent verifies your payment receipt screenshot, they will approve your order and send you a unique 8-character access pass code (e.g., ABCD-1234) on WhatsApp.',
  },
  {
    q: 'How do I redeem my access pass code?',
    a: 'You can redeem your code in two ways: either go directly to the Redeem Code page from the top navigation bar, or open any live event in the Events page and enter the code into the slide-up pass drawer to unlock playback.',
  },
  {
    q: 'Can I watch on multiple devices simultaneously?',
    a: 'Each access pass has a strict limit of concurrent screens (typically 1 screen). If you open the broadcast on another device or tab while one is active, the older session will automatically halt and show a "Session Suspended" message.',
  },
  {
    q: 'What should I do if my stream is buffering or drops offline?',
    a: 'Our video player is equipped with an adaptive bitrate (ABR) engine that automatically scales down video quality during network drops. If your connection drops completely, the player will attempt to reconnect for 30 seconds. If it fails, please check your network connection and click "Reload Stream".',
  },
  {
    q: 'Who should I contact if I experience issues?',
    a: 'Please contact the WhatsApp payment agent who issued your code. If you cannot reach them, you can log in to your dashboard at "My Access" to submit a support inquiry.',
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Help & Support FAQ</h1>
        <p className="text-white/60 text-sm sm:text-base max-w-xl mx-auto">
          Find answers to common questions about purchasing passes, redeeming codes, streaming quality, and device limits.
        </p>
      </div>

      <div className="space-y-6">
        {faqItems.map((item, index) => (
          <div key={index} className="glass border border-white/10 rounded-2xl p-6 hover:border-brand-500/30 transition-colors">
            <h3 className="text-base sm:text-lg font-bold text-white mb-2.5 flex items-start gap-3">
              <span className="text-brand-400 font-mono">Q.</span>
              {item.q}
            </h3>
            <p className="text-white/70 text-sm leading-relaxed pl-6">
              {item.a}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center p-8 bg-brand-500/5 border border-brand-500/10 rounded-3xl">
        <h3 className="text-lg font-bold mb-2">Still need help?</h3>
        <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
          If you have questions about a pending payment or access code, message your WhatsApp operator for immediate support.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/pricing"
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors"
          >
            Find a Payment Agent
          </Link>
          <Link
            href="/my-access"
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-colors"
          >
            My Access Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
