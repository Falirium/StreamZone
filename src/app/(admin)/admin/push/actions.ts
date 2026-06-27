'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { adminAction } from '@/lib/actions/admin-actions';
import { sendPushToSubscriptions, compilePromotionText } from '@/lib/push-service';

export interface UpcomingPushItem {
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  startsAt: string;
  sendScheduledAt: string;
  compiledTitle: string;
  compiledBody: string;
  redirectUrl: string;
}

export async function getUpcomingQueue() {
  return adminAction(async () => {
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://streamzone.com';
    const now = new Date();

    const upcomingEvents = await db.event.findMany({
      where: {
        startsAt: { gt: now },
        isActive: true,
        pushSent: false,
      },
      orderBy: { startsAt: 'asc' },
    });

    const queue: UpcomingPushItem[] = upcomingEvents.map((event) => {
      const { title, body } = compilePromotionText(event, origin);
      
      // Scheduled to auto-send 30 minutes before kickoff
      const scheduledDate = new Date(event.startsAt.getTime() - 30 * 60 * 1000);

      return {
        eventId: event.id,
        eventTitle: event.title,
        eventCategory: event.category,
        startsAt: event.startsAt.toISOString(),
        sendScheduledAt: scheduledDate.toISOString(),
        compiledTitle: title,
        compiledBody: body,
        redirectUrl: `/watch/${event.slug}`,
      };
    });

    return queue;
  });
}

export async function sendPushEarly(eventId: string) {
  return adminAction(
    async (admin) => {
      const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://streamzone.com';
      const event = await db.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.pushSent) {
        throw new Error('Push notification has already been sent for this event');
      }

      const { title, body } = compilePromotionText(event, origin);
      const redirectUrl = `/watch/${event.slug}`;

      // Fetch all registered subscriptions
      const subscriptions = await db.pushSubscription.findMany();

      if (subscriptions.length === 0) {
        // Just mark as sent and return success if no subscribers exist yet
        await db.event.update({
          where: { id: eventId },
          data: { pushSent: true },
        });
        revalidatePath('/admin/push');
        return { sentCount: 0, failedCount: 0, message: 'No registered push subscriptions found.' };
      }

      // Dispatch notifications
      const { sent, failed } = await sendPushToSubscriptions(title, body, redirectUrl, subscriptions);

      // Mark event as sent
      await db.event.update({
        where: { id: eventId },
        data: { pushSent: true },
      });

      revalidatePath('/admin/push');

      return {
        sentCount: sent,
        failedCount: failed,
        message: `Successfully dispatched early promotion. Sent: ${sent}, Failed: ${failed}.`,
      };
    },
    {
      action: 'push.broadcast.early',
      entity: 'Event',
      entityId: eventId,
    }
  );
}
