import { db } from '@/lib/db';
import { PushClient } from './push-client';

export const metadata = {
  title: 'Push Broadcast — Admin',
};

export default async function PushBroadcastPage() {
  // Fetch active countries for target filtering
  const countries = await db.country.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Push Broadcast Console</h1>
        <p className="text-white/60 text-sm mt-1">
          Compose and dispatch real-time native push notifications to registered PWA devices.
        </p>
      </div>

      <PushClient countries={countries} />
    </div>
  );
}
