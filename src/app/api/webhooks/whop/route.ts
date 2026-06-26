import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ACCESS_CODE_LENGTH } from '@/lib/constants';
import crypto from 'crypto';

function generateCode(): string {
  return crypto.randomBytes(ACCESS_CODE_LENGTH)
    .toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ACCESS_CODE_LENGTH);
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-whop-signature') || 
                      request.headers.get('webhook-signature') || 
                      request.headers.get('x-signature');
    const body = await request.json();

    console.log('[WHOP WEBHOOK] Received payload:', JSON.stringify(body, null, 2));

    // For production security, verify signature if WHOP_WEBHOOK_SECRET is set
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
    if (webhookSecret && !signature) {
      console.warn('[WHOP WEBHOOK] Rejected: WHOP_WEBHOOK_SECRET is set but no signature header was found.');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Determine event action
    const action = body.action || body.event;
    if (!action) {
      return NextResponse.json({ error: 'Missing action/event' }, { status: 400 });
    }

    // We specifically care about payment.succeeded or membership.created
    if (action !== 'payment.succeeded' && action !== 'membership.created' && action !== 'membership.active') {
      return NextResponse.json({ message: 'Event ignored' });
    }

    // Extract metadata
    // Whop webhook payloads can nest metadata in body.data, body.data.membership, or body
    const data = body.data || {};
    const metadata = data.metadata || data.membership?.metadata || body.metadata || {};
    
    const planId = metadata.planId || data.plan_id;
    const userId = metadata.userId;
    let phone = metadata.phone || metadata.userPhone;

    // Check for email-prefilled phone fallback (e.g. +1234567890@streamzone.local)
    const email = data.email || data.membership?.email || data.membership?.user?.email || body.email || '';
    if (!phone && email && (email.endsWith('@streamzone.local') || email.endsWith('@streamzone.com'))) {
      phone = decodeURIComponent(email.split('@')[0]);
      console.log(`[WHOP WEBHOOK] Extracted phone ${phone} from prefilled email: ${email}`);
    }

    const whopPlanId = data.plan_id || data.plan?.id || data.membership?.plan_id || data.membership?.plan?.id;

    if (!planId && !whopPlanId) {
      console.warn('[WHOP WEBHOOK] Ignored: Missing plan identifier', metadata);
      return NextResponse.json({ error: 'planId or whopPlanId required' }, { status: 400 });
    }

    // Find the associated user
    let user = null;
    if (userId) {
      user = await db.user.findUnique({ where: { id: userId } });
    }
    
    if (!user && email) {
      user = await db.user.findUnique({ where: { email } });
    }

    if (!user && phone) {
      user = await db.user.findUnique({ where: { phone } });
    }

    if (!user) {
      console.warn('[WHOP WEBHOOK] User not found for metadata/email:', { metadata, email });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify plan and price exist (Option B: look up Price configuration by whopPlanId)
    let plan = null;
    let price = null;

    if (whopPlanId) {
      price = await db.price.findFirst({
        where: { whopPlanId },
        include: { plan: true },
      });
      if (price) {
        plan = price.plan;
      }
    }

    if (!plan && planId) {
      plan = await db.plan.findUnique({
        where: { id: planId },
      });
      if (plan) {
        price = await db.price.findFirst({
          where: { planId: plan.id, isActive: true },
        });
      }
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plan/Price mapping not found' }, { status: 404 });
    }

    const txnRef = data.id || `WHOP-WH-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    // Create payment record and generate code in database transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Check if this transaction reference was already processed (idempotency)
      const existingPayment = await tx.payment.findFirst({
        where: { reference: txnRef },
      });

      if (existingPayment) {
        return { alreadyProcessed: true };
      }

      // 2. Log successful payment
      await tx.payment.create({
        data: {
          userId: user.id,
          amount: price?.amount || 0.00,
          currency: price?.currency || 'USD',
          method: 'Whop Webhook',
          reference: txnRef,
          status: 'approved',
        },
      });

      // 3. Generate assigned access code
      const accessCode = await tx.accessCode.create({
        data: {
          code: generateCode(),
          planId: plan.id,
          status: 'assigned',
          assignedTo: user.email,
          createdBy: 'System (Whop Webhook)',
        },
      });

      return { alreadyProcessed: false, code: accessCode.code };
    });

    if (result.alreadyProcessed) {
      return NextResponse.json({ message: 'Webhook already processed' });
    }

    console.log(`[WHOP WEBHOOK] Code ${result.code} successfully provisioned for user ${user.phone}`);

    return NextResponse.json({ success: true, code: result.code });
  } catch (error: any) {
    console.error('[WHOP WEBHOOK ERROR]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
