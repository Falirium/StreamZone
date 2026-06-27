import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPushToSubscriptions, compilePromotionText } from '@/lib/push-service';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  console.log('[PUSH CRON] Starting automated check...');
  
  // 1. Authenticate Request using secret token if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('Authorization');
    const urlSecret = request.nextUrl.searchParams.get('secret');
    
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : urlSecret;
    
    if (token !== cronSecret) {
      console.warn('[PUSH CRON] Unauthorized request attempted.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    // Scan window: starts in the next 30 minutes, or started up to 10 minutes ago (in case of scheduler lag)
    const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const eventsToPromote = await db.event.findMany({
      where: {
        startsAt: {
          gte: tenMinsAgo,
          lte: thirtyMinsFromNow,
        },
        isActive: true,
        pushSent: false,
      },
    });

    if (eventsToPromote.length === 0) {
      console.log('[PUSH CRON] No upcoming matches found in the 30-minute window.');
      return NextResponse.json({ success: true, message: 'No events to promote at this time.' });
    }

    console.log(`[PUSH CRON] Found ${eventsToPromote.length} event(s) to promote.`);
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://streamzone.com';
    const subscriptions = await db.pushSubscription.findMany();

    if (subscriptions.length === 0) {
      // Mark events as sent even if no subscribers, so we don't scan them again
      for (const event of eventsToPromote) {
        await db.event.update({
          where: { id: event.id },
          data: { pushSent: true },
        });
      }
      return NextResponse.json({ success: true, message: 'No push subscribers. Events marked as sent.' });
    }

    let totalSent = 0;
    let totalFailed = 0;

    for (const event of eventsToPromote) {
      const { title, body } = compilePromotionText(event, origin);
      const redirectUrl = `/watch/${event.slug}`;

      const { sent, failed } = await sendPushToSubscriptions(title, body, redirectUrl, subscriptions);
      totalSent += sent;
      totalFailed += failed;

      // Update sent flag
      await db.event.update({
        where: { id: event.id },
        data: { pushSent: true },
      });

      // Log system audit log
      await logAudit({
        action: 'push.broadcast.cron',
        entity: 'Event',
        entityId: event.id,
        details: {
          title,
          body,
          sentCount: sent,
          failedCount: failed,
        },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      });
    }

    console.log(`[PUSH CRON] Promotion check completed. Sent: ${totalSent}, Failed: ${totalFailed}`);
    return NextResponse.json({
      success: true,
      message: `Automated dispatch completed. Sent: ${totalSent}, Failed: ${totalFailed}`,
    });
  } catch (error: any) {
    console.error('[PUSH CRON ERROR]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
