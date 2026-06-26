import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/user-auth';
import { LiveTelemetry } from '@/components/LiveTelemetry';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent shrink-0"
            >
              StreamZone
            </Link>
            <LiveTelemetry />
          </div>

          <div className="flex items-center gap-3.5 sm:gap-6 text-xs sm:text-sm">
            <Link
              href="/events"
              className="text-white/60 hover:text-white transition-colors"
            >
              Events
            </Link>
            <Link
              href="/pricing"
              className="hidden sm:inline-block text-white/60 hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/redeem"
              className="text-white/60 hover:text-white transition-colors"
            >
              <span className="hidden sm:inline">Redeem Code</span>
              <span className="inline sm:hidden">Redeem</span>
            </Link>
            {user ? (
              <Link
                href="/my-access"
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
              >
                My Access
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-white/40">
            <p>© {new Date().getFullYear()} StreamZone. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/help" className="hover:text-white/60 transition-colors">
                Help
              </Link>
              <Link href="/tv-help" className="hover:text-white/60 transition-colors">
                TV Setup
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
