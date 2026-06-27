import { db } from '@/lib/db';
import { PushClient } from './push-client';
import { getUpcomingQueue } from './actions';

export const metadata = {
  title: 'Push Broadcast — Admin',
};

export default async function PushBroadcastPage() {
  // Fetch active countries and upcoming notifications queue
  const [countries, queueResult] = await Promise.all([
    db.country.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    getUpcomingQueue(),
  ]);

  const upcomingQueue = queueResult.success ? queueResult.data || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Push Broadcast Console</h1>
        <p className="text-white/60 text-sm mt-1">
          Compose and dispatch real-time native push notifications to registered PWA devices.
        </p>
      </div>

      <PushClient countries={countries} initialQueue={upcomingQueue} />
    </div>
  );
}
