import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/user-auth';

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-x-hidden bg-surface-900">
      
      {/* Dynamic Glowing Orb Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 z-10 w-full flex-1 flex flex-col justify-center">
        <div className="text-center md:text-left max-w-3xl">
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-wider text-white/80 uppercase">World Cup Live Now</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">Zero-Downtime Guarantee</span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            <span className="text-white">Raw Quality.</span>
            <br />
            <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent font-black">
              At a Price They Hate.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto md:mx-0 font-medium leading-relaxed">
            By the fans, for the fans. We provide the raw quality the big networks refuse to give you at a price they absolutely hate. Never miss a critical goal.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <Link
              href="/events"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(76,110,245,0.4)] hover:shadow-[0_0_30px_rgba(76,110,245,0.6)] text-center flex items-center justify-center gap-2 hover:scale-105"
            >
              Watch Live Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </Link>
            
            {user ? (
              <Link
                href="/my-access"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-600/10 hover:bg-brand-600/25 border border-brand-500/30 text-brand-400 font-bold transition-all text-center backdrop-blur-sm shadow-[0_0_15px_rgba(92,124,250,0.05)] hover:scale-105"
              >
                Go to My Access
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all text-center backdrop-blur-sm hover:scale-105"
              >
                View Pricing
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Grid Section */}
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-24 z-10 w-full">
        <div className="border-t border-white/10 pt-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-10 tracking-tight text-center md:text-left">Built Differently</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Redundancy */}
            <div className="glass p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-brand-500/30 transition-all group shadow-lg">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform w-fit">🛡️</div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                10x Server Mesh
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Mainstream platforms crash when the traffic hits—we operate a 10x server redundancy mesh. Never miss a critical goal.
              </p>
            </div>
            
            {/* Card 2: Underdog Voice */}
            <div className="glass p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-brand-500/30 transition-all group shadow-lg">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform w-fit">✊</div>
              <h3 className="text-lg font-bold text-white mb-2">By Fans, For Fans</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                We provide the raw quality the big networks refuse to give you at a price they absolutely hate. Zero corporate BS.
              </p>
            </div>
            
            {/* Card 3: 60 FPS HD */}
            <div className="glass p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-brand-500/30 transition-all group shadow-lg">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform w-fit">⚡</div>
              <h3 className="text-lg font-bold text-white mb-2">Raw HD 60 FPS</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Get the raw stream directly from broadcast centers. No heavy bitrate throttling or laggy buffers.
              </p>
            </div>
            
            {/* Card 4: Instant Code Access */}
            <div className="glass p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-brand-500/30 transition-all group shadow-lg">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform w-fit">🔑</div>
              <h3 className="text-lg font-bold text-white mb-2">Instant Unlock</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Unlock streaming instantly. Pay with local methods, redeem your custom pass code, and stream in 2 clicks.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
