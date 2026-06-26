import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/user-auth';
import { db } from '@/lib/db';

// Force dynamic execution to bypass Next.js and CDN caching
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      console.warn('[CHECKOUT POLL] Unauthorized: No active user session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const paymentId = searchParams.get('payment_id');

    if (!paymentId) {
      console.warn('[CHECKOUT POLL] Missing payment_id parameter');
      return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 });
    }

    console.log(`[CHECKOUT POLL] Checking status for paymentId: ${paymentId}, userId: ${session.userId}, email: ${session.email}`);

    // 1. Check if the payment with the Whop reference exists
    let payment = null;
    try {
      payment = await db.payment.findFirst({
        where: {
          userId: session.userId,
          reference: paymentId,
        },
      });
      if (payment) {
        console.log(`[CHECKOUT POLL] Payment record found in database (ID: ${payment.id}, Status: ${payment.status})`);
      } else {
        console.log(`[CHECKOUT POLL] No payment record found with reference: ${paymentId}`);
      }
    } catch (dbErr) {
      console.error('[CHECKOUT POLL DB ERROR] Failed to query payment record:', dbErr);
    }

    // 2. Check for any recently assigned access code (created in the last 3 minutes)
    let recentCode = null;
    try {
      recentCode = await db.accessCode.findFirst({
        where: {
          assignedTo: session.email,
          status: 'assigned',
          createdAt: {
            gte: new Date(Date.now() - 3 * 60 * 1000), // last 3 minutes
          },
        },
        include: {
          plan: true,
        },
      });
      if (recentCode) {
        console.log(`[CHECKOUT POLL] Recently assigned access code found: ${recentCode.code} (Plan: ${recentCode.plan.name})`);
      }
    } catch (dbErr) {
      console.error('[CHECKOUT POLL DB ERROR] Failed to query recently assigned codes:', dbErr);
    }

    // 3. Check for any recently created active entitlement (created in the last 3 minutes)
    let recentEntitlement = null;
    try {
      recentEntitlement = await db.accessEntitlement.findFirst({
        where: {
          userId: session.userId,
          createdAt: {
            gte: new Date(Date.now() - 3 * 60 * 1000), // last 3 minutes
          },
        },
      });
      if (recentEntitlement) {
        console.log(`[CHECKOUT POLL] Recently active entitlement found: ${recentEntitlement.id}`);
      }
    } catch (dbErr) {
      console.error('[CHECKOUT POLL DB ERROR] Failed to query recently active entitlements:', dbErr);
    }

    const isSuccessful = !!(payment || recentCode || recentEntitlement);

    if (!isSuccessful) {
      console.log('[CHECKOUT POLL] Webhook has not processed yet. Returning pending.');
      return NextResponse.json({ status: 'pending' });
    }

    // 4. Look for any assigned code for this user/email to auto-redeem
    const code = recentCode || await db.accessCode.findFirst({
      where: {
        assignedTo: session.email,
        status: 'assigned',
      },
      include: {
        plan: true,
      },
    });

    if (code) {
      console.log(`[CHECKOUT POLL] Code ${code.code} is assigned. Attempting auto-redemption...`);
      // Auto-redeem the code
      try {
        await db.$transaction(async (tx) => {
          const startsAt = new Date();
          const expiresAt = new Date(startsAt.getTime() + code.plan.durationDays * 24 * 60 * 60 * 1000);

          const entitlement = await tx.accessEntitlement.create({
            data: {
              userId: session.userId,
              planId: code.planId,
              eventId: code.eventId,
              startsAt,
              expiresAt,
              isActive: true,
            },
          });

          await tx.redemption.create({
            data: {
              userId: session.userId,
              codeId: code.id,
              entitlementId: entitlement.id,
            },
          });

          await tx.accessCode.update({
            where: { id: code.id },
            data: { status: 'redeemed' },
          });
        });
        console.log(`[CHECKOUT POLL] Code ${code.code} successfully auto-redeemed. Entitlement granted.`);
        return NextResponse.json({ status: 'success', redeemed: true, code: code.code });
      } catch (err) {
        console.error('[CHECKOUT POLL AUTO-REDEEM ERROR] Transaction failed:', err);
      }
    }

    console.log('[CHECKOUT POLL] Payment confirmed, no pending code to redeem (already redeemed). Returning success.');
    return NextResponse.json({ status: 'success', redeemed: false });
  } catch (error: any) {
    console.error('[CHECKOUT POLL CRITICAL ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
