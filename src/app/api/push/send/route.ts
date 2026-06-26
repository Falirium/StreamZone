import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth/admin-auth';
import { logAudit } from '@/lib/audit';
import type { ApiResponse } from '@/types/api';
import webpush from 'web-push';

// Configure Web Push VAPID credentials
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@streamzone.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. Authenticate admin
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin session required' },
        { status: 401 }
      );
    }

    // Check environment configuration
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: VAPID keys are missing. Configure them in .env.' },
        { status: 500 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { title, message: pushBody, redirectUrl, targetFilter, targetValue } = body;

    if (!title || !pushBody) {
      return NextResponse.json(
        { success: false, error: 'Missing required push fields (title, message).' },
        { status: 400 }
      );
    }

    const fallbackRedirect = redirectUrl || '/';

    // 3. Query target subscriptions based on filter criteria
    let subscriptions: any[] = [];

    if (targetFilter === 'global') {
      subscriptions = await db.pushSubscription.findMany({
        include: {
          user: {
            select: { phone: true, email: true }
          }
        }
      });
    } else if (targetFilter === 'country') {
      if (!targetValue) {
        return NextResponse.json(
          { success: false, error: 'Target value (country code or ID) is required for country targeting.' },
          { status: 400 }
        );
      }
      subscriptions = await db.pushSubscription.findMany({
        where: {
          user: {
            profile: {
              OR: [
                { countryId: targetValue },
                { country: { code: targetValue } }
              ]
            }
          }
        },
        include: {
          user: {
            select: { phone: true, email: true }
          }
        }
      });
    } else if (targetFilter === 'phone') {
      if (!targetValue) {
        return NextResponse.json(
          { success: false, error: 'Target phone number is required for phone number targeting.' },
          { status: 400 }
        );
      }
      subscriptions = await db.pushSubscription.findMany({
        where: {
          user: {
            phone: targetValue
          }
        },
        include: {
          user: {
            select: { phone: true, email: true }
          }
        }
      });
    } else if (targetFilter === 'email') {
      if (!targetValue) {
        return NextResponse.json(
          { success: false, error: 'Target email address is required for email targeting.' },
          { status: 400 }
        );
      }
      subscriptions = await db.pushSubscription.findMany({
        where: {
          user: {
            email: { equals: targetValue, mode: 'insensitive' }
          }
        },
        include: {
          user: {
            select: { phone: true, email: true }
          }
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: `Invalid targeting filter: ${targetFilter}` },
        { status: 400 }
      );
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No push subscriptions matched your target filter criteria.',
        data: { sent: 0, failed: 0 }
      });
    }

    // 4. Securely transmit push notification payloads in parallel
    const payload = JSON.stringify({
      title,
      body: pushBody,
      redirectUrl: fallbackRedirect,
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
          // If the subscription is expired or uninstalled by the user, clean it from the DB
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[Push Server] Subscription expired (status ${err.statusCode}). Deleting from DB:`, sub.endpoint);
            await db.pushSubscription.delete({ where: { id: sub.id } });
          } else {
            console.error(`[Push Server] Failed to deliver push to endpoint ${sub.endpoint}:`, err);
          }
          throw err;
        }
      })
    );

    // Compute final delivery statistics
    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        sent++;
      } else {
        failed++;
      }
    });

    // 5. Log audit trail entry for this broadcast
    await logAudit({
      adminId: currentAdmin.adminId,
      action: 'push.broadcast',
      entity: 'PushSubscription',
      entityId: 'broadcast',
      details: {
        title,
        body: pushBody,
        redirectUrl: fallbackRedirect,
        targetFilter,
        targetValue,
        sentCount: sent,
        failedCount: failed,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Push broadcast completed. Successfully sent: ${sent}, Failed: ${failed}.`,
      data: { sent, failed }
    });
  } catch (error) {
    console.error('[Push Send API Error]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
