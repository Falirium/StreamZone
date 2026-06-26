import { db } from '@/lib/db';
import Link from 'next/link';
import { headers } from 'next/headers';

export const metadata = { title: 'Pricing — StreamZone' };

interface Props {
  searchParams: Promise<{ country?: string; waitlist_success?: string }>;
}

export default async function PricingPage({ searchParams }: Props) {
  const { country, waitlist_success } = await searchParams;
  
  const headersList = await headers();
  // Vercel or Cloudflare geo headers
  const geoCountry = headersList.get('x-vercel-ip-country') || headersList.get('cf-ipcountry') || '';

  const [countries, plans] = await Promise.all([
    db.country.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    db.plan.findMany({
      where: { isActive: true },
      include: {
        prices: {
          include: { country: true },
        },
      },
      orderBy: { durationDays: 'asc' },
    }),
  ]);

  // Determine active country code
  let activeCountryCode = (country || geoCountry || '').toUpperCase();
  if (!activeCountryCode) {
    activeCountryCode = 'MA'; // Localhost fallback
  }

  const activeCountry = countries.find(c => c.code === activeCountryCode);

  // If the country is not supported, render the Waitlist Screen
  if (!activeCountry) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="glass rounded-3xl p-8 border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent pointer-events-none" />
          
          <div className="w-16 h-16 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            🌍
          </div>

          <h1 className="text-2xl font-bold mb-3">Country Not Supported Yet</h1>
          <p className="text-white/60 mb-6 text-sm leading-relaxed">
            We don't support streaming passes in your region ({activeCountryCode}) yet. 
            Join our waitlist to be notified as soon as we launch!
          </p>

          {waitlist_success === 'true' ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
              ✓ You have been added to the waitlist!
            </div>
          ) : (
            <form 
              action={async (fd) => {
                'use server';
                const email = fd.get('email') as string;
                console.log(`[WAITLIST] Email: ${email}, Country: ${activeCountryCode}`);
                const { redirect } = await import('next/navigation');
                redirect(`/pricing?country=${activeCountryCode}&waitlist_success=true`);
              }} 
              className="space-y-4"
            >
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="Enter your email address" 
                className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button 
                type="submit" 
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-brand-600/10"
              >
                Join Waitlist
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-xs text-white/40 mb-3">Or choose a supported region to preview:</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {countries.map(c => (
                <Link 
                  key={c.code}
                  href={`/pricing?country=${c.code}`} 
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors text-white/70"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isMorocco = activeCountryCode === 'MA';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight">Fair Pricing. No Corporate BS.</h1>
        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Choose your streaming pass. Powered by our 10x server redundancy mesh with a Zero-Downtime Guarantee. Pay securely via local options.
        </p>

        {/* Country Selector */}
        <div className="inline-flex items-center gap-4 bg-surface-900 border border-white/10 rounded-2xl p-2">
          <span className="text-sm font-medium text-white/60 pl-4">Select your region:</span>
          <div className="flex gap-1 overflow-x-auto max-w-full">
            {countries.map(c => (
              <Link
                key={c.code}
                href={`/pricing?country=${c.code}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeCountryCode === c.code
                    ? 'bg-brand-600 text-white'
                    : 'hover:bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map(plan => {
          const price = plan.prices.find(p => p.country.code === activeCountryCode);
          if (!price || !price.isActive) return null; // Only show if price exists for region

          // Moroccan routing goes to manual /pay WhatsApp redirect. International routing goes to Whop.
          const ctaUrl = isMorocco
            ? `/pay?plan=${plan.id}&country=MA`
            : `/pay/whop?plan=${plan.id}&country=${activeCountryCode}`;

          const ctaLabel = isMorocco ? 'Pay via WhatsApp' : 'Pay Now';

          return (
            <div key={plan.id} className="glass rounded-3xl p-8 border border-white/10 flex flex-col relative overflow-hidden group hover:border-brand-500/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="relative z-10 flex-1">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-white/60 text-sm mb-6 min-h-[40px]">{plan.description}</p>
                
                <div className="mb-8">
                  <span className="text-5xl font-bold tracking-tight">
                    {Number(price.amount).toFixed(2)}
                  </span>
                  <span className="text-xl text-white/50 ml-2 font-medium">{price.currency}</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <span className="text-brand-400">✓</span>
                    <span className="text-sm text-white/80">Valid for {plan.durationDays} days</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-brand-400">✓</span>
                    <span className="text-sm text-white/80">10x Server Redundancy Access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-brand-400">✓</span>
                    <span className="text-sm text-white/80">Raw HD 60 FPS Streams</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-brand-400">✓</span>
                    <span className="text-sm text-white/80 font-semibold text-emerald-400">Zero-Downtime Guarantee</span>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 mt-auto pt-8 border-t border-white/10">
                <Link
                  href={ctaUrl}
                  className="block w-full py-3 px-4 bg-white hover:bg-brand-50 text-black text-center font-semibold rounded-xl transition-colors"
                >
                  {ctaLabel}
                </Link>
                {activeCountry?.paymentNotes && (
                  <p className="text-xs text-white/40 text-center mt-4">
                    {activeCountry.paymentNotes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
