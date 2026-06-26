import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/user-auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const paymentId = searchParams.get('payment_id');

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 });
    }

    // 1. Check if the payment with the Whop reference exists
    const payment = await db.payment.findFirst({
      where: {
        userId: session.userId,
        reference: paymentId,
      },
    });

    if (!payment) {
      // Webhook hasn't processed yet
      return NextResponse.json({ status: 'pending' });
    }

    // 2. Look for any assigned code for this user/email
    const code = await db.accessCode.findFirst({
      where: {
        assignedTo: session.email,
        status: 'assigned',
      },
      include: {
        plan: true,
      },
    });

    if (code) {
      // 3. Auto-redeem the code
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
        return NextResponse.json({ status: 'success', redeemed: true, code: code.code });
      } catch (err) {
        console.error('[POLL AUTO-REDEEM ERROR]', err);
        // If it failed (maybe parallel request or already redeemed), it's fine, we can still report success
      }
    }

    return NextResponse.json({ status: 'success', redeemed: false });
  } catch (error: any) {
    console.error('[POLL ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
