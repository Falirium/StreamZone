import Link from 'next/link';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/events', label: 'Events', icon: '📅' },
  { href: '/admin/plans', label: 'Plans', icon: '📋' },
  { href: '/admin/prices', label: 'Prices', icon: '💰' },
  { href: '/admin/countries', label: 'Countries', icon: '🌍' },
  { href: '/admin/payments', label: 'Payments', icon: '💳' },
  { href: '/admin/codes', label: 'Codes', icon: '🔑' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/playback', label: 'Playback', icon: '▶️' },
  { href: '/admin/operators', label: 'WhatsApp', icon: '💬' },
  { href: '/admin/push', label: 'Push Broadcast', icon: '📢' },
  { href: '/admin/support', label: 'Support', icon: '🎧' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: '📜' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-800 border-r border-white/10 flex flex-col fixed h-full">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="text-lg font-bold text-white">
            StreamZone
            <span className="text-xs ml-2 px-2 py-0.5 rounded bg-brand-600/20 text-brand-400 font-medium">
              Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <form
            action={async () => {
              'use server';
              const { logoutAdmin } = await import('@/lib/auth/admin-auth');
              await logoutAdmin();
              const { redirect } = await import('next/navigation');
              redirect('/admin/login');
            }}
          >
            <button
              type="submit"
              className="w-full px-3 py-2 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors text-left"
            >
              ← Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
