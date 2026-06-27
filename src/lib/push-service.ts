import webpush from 'web-push';
import { db } from './db';

// Configure Web Push VAPID credentials
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@streamzone.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushToSubscriptions(
  title: string,
  body: string,
  redirectUrl: string,
  subscriptions: PushSubscription[]
) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    throw new Error('VAPID keys are missing from server configuration');
  }

  const payload = JSON.stringify({
    title,
    body,
    redirectUrl,
  });

  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, payload);
        return true;
      } catch (err: any) {
        // If the subscription is expired or uninstalled (410 or 404), clean it from the DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[Push Service] Clean expired subscription:`, sub.endpoint);
          await db.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          console.error(`[Push Service] Delivery failed to ${sub.endpoint}:`, err);
        }
        throw err;
      }
    })
  );

  results.forEach((res) => {
    if (res.status === 'fulfilled') {
      sent++;
    } else {
      failed++;
    }
  });

  return { sent, failed };
}

export function compilePromotionText(event: { title: string; slug: string; startsAt: Date }, origin: string) {
  const startsAtStr = event.startsAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const title = `🔥 Kickoff Alert: ${event.title} is LIVE soon!`;
  const body = `⚽ Starts at ${startsAtStr}! Bring the squad to watch—share this link with friends to enjoy 100% ad-free stream: ${origin}/watch/${event.slug} ⚡`;
  
  return { title, body };
}

