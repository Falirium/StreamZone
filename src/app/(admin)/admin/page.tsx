import { getDashboardStats } from './actions';

export const metadata = { title: 'Dashboard — Admin' };

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', accent: 'brand' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: '💳', accent: 'amber' },
    { label: 'Available Codes', value: stats.activeCodes, icon: '🔑', accent: 'emerald' },
    { label: 'Live Events', value: stats.liveEvents, icon: '📡', accent: 'red' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="p-6 rounded-xl glass">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white/60">{card.label}</p>
                <span className="text-xl">{card.icon}</span>
              </div>
              <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="rounded-xl glass p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {stats.recentAudit.length === 0 ? (
            <p className="text-white/40 text-sm">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentAudit.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-xs text-brand-400 font-medium shrink-0">
                      {log.adminName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white/80 truncate">
                        <span className="font-medium text-white">{log.adminName}</span>{' '}
                        {log.action}{' '}
                        <span className="text-white/50">{log.entity}</span>
                      </p>
                    </div>
                  </div>
                  <time className="text-xs text-white/30 shrink-0 ml-2">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </time>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent OTP Requests */}
        <div className="rounded-xl glass p-6">
          <h2 className="text-lg font-semibold mb-4">Recent OTP Requests</h2>
          {stats.recentOtps.length === 0 ? (
            <p className="text-white/40 text-sm">No OTP requests yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOtps.map((otp) => (
                <div
                  key={otp.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-white truncate select-all">{otp.email}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      Requested: {new Date(otp.createdAt).toLocaleTimeString()} |{' '}
                      {otp.verified ? (
                        <span className="text-emerald-400 font-medium">Verified</span>
                      ) : new Date(otp.expiresAt) < new Date() ? (
                        <span className="text-red-400 font-medium">Expired</span>
                      ) : (
                        <span className="text-amber-400 font-medium">Active</span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="font-mono text-sm font-bold bg-white/5 px-2.5 py-1 rounded border border-white/10 text-indigo-400 select-all">
                      {otp.code}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
