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

function verifySignature(
  rawBody: string, 
  msgId: string,
  timestamp: string,
  signature: string, 
  secret: string
): boolean {
  try {
    // 1. Extract actual signature hash
    let signatureHash = signature;
    if (signature.includes(',')) {
      const parts = signature.split(',');
      signatureHash = parts[1] || parts[0];
    }

    // 2. Prepare keys to try
    const base64Key = secret.replace('whsec_', '');
    let decodedKeyBuffer: Buffer | null = null;
    try {
      decodedKeyBuffer = Buffer.from(base64Key, 'base64');
    } catch {
      // Not base64
    }

    const rawSecretBuffer = Buffer.from(secret, 'utf-8');
    const keys = [
      decodedKeyBuffer,
      rawSecretBuffer
    ].filter((k): k is Buffer => k !== null);

    // 3. Prepare message structures to try
    const contents = [
      `${msgId}.${timestamp}.${rawBody}`,
      rawBody
    ];

    // 4. Prepare encodings to try
    const encodings = ['base64', 'hex'] as const;

    // Try all combinations
    for (const content of contents) {
      for (const key of keys) {
        for (const encoding of encodings) {
          try {
            const hmac = crypto.createHmac('sha256', key);
            const computed = hmac.update(content).digest(encoding);

            const expectedBuffer = Buffer.from(computed, encoding);
            const signatureBuffer = Buffer.from(signatureHash, encoding);

            if (expectedBuffer.length === signatureBuffer.length && 
                crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
              console.log(`[WHOP SIGNATURE] Verified successfully using strategy: content=${content === rawBody ? 'rawBody' : 'standard'}, encoding=${encoding}`);
              return true;
            }
          } catch (e) {
            // Skip invalid key or encoding failures
          }
        }
      }
    }

    console.error('[WHOP SIGNATURE] All signature verification combinations failed.');
    return false;
  } catch (err) {
    console.error('[WHOP SIGNATURE ERROR] Cryptographic validation exception:', err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  console.log('[WHOP WEBHOOK] POST request received.');
  try {
    const signature = request.headers.get('webhook-signature') || 
                      request.headers.get('x-whop-signature') || 
                      request.headers.get('x-signature');
    const msgId = request.headers.get('webhook-id') || 
                  request.headers.get('x-whop-msg-id') || 
                  request.headers.get('msg-id');
    const timestamp = request.headers.get('webhook-timestamp') || 
                      request.headers.get('x-whop-timestamp');

    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    console.log('[WHOP WEBHOOK] Received Headers:', {
      signature: signature ? `${signature.substring(0, 15)}...` : 'undefined',
      msgId,
      timestamp,
    });
    console.log('[WHOP WEBHOOK] Received payload action/event:', body.action || body.event);

    // Verify signature if WHOP_WEBHOOK_SECRET is set
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
    if (webhookSecret) {
      console.log('[WHOP WEBHOOK] WHOP_WEBHOOK_SECRET is set. Initiating signature verification...');
      if (!signature || !msgId || !timestamp) {
        console.error('[WHOP WEBHOOK] Signature verification failed: Missing required webhook headers.', { signature, msgId, timestamp });
        return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
      }
      
      const isSignatureValid = verifySignature(rawBody, msgId, timestamp, signature, webhookSecret);
      if (!isSignatureValid) {
        console.error('[WHOP WEBHOOK] Signature verification failed: Cryptographic mismatch.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('[WHOP WEBHOOK] Signature verified successfully.');
    } else {
      console.log('[WHOP WEBHOOK] WHOP_WEBHOOK_SECRET not set. Skipping signature verification.');
    }

    // Determine event action
    const action = body.action || body.event || body.type;
    if (!action) {
      console.error('[WHOP WEBHOOK] Ignored: Missing action/event field in payload.');
      return NextResponse.json({ error: 'Missing action/event' }, { status: 400 });
    }

    // Standard Success Actions for payment or membership creation/validation
    const successEvents = [
      'payment.succeeded',
      'membership.created',
      'membership.active',
      'membership.activated',
      'membership.went_valid'
    ];
    if (!successEvents.includes(action)) {
      console.log(`[WHOP WEBHOOK] Ignored event type: ${action}`);
      return NextResponse.json({ message: 'Event ignored' });
    }

    // Extract metadata
    const data = body.data || {};
    const metadata = data.metadata || data.membership?.metadata || body.metadata || {};
    
    const planId = metadata.planId || data.plan_id;
    const userId = metadata.userId;
    let phone = metadata.phone || metadata.userPhone;

    // Prefilled email phone parsing fallback
    const email = 
      data.customer_email || 
      data.user?.email || 
      data.email || 
      data.membership?.email || 
      data.membership?.user?.email || 
      body.email || 
      '';

    if (!phone && email && (email.endsWith('@streamzone.local') || email.endsWith('@streamzone.com'))) {
      phone = decodeURIComponent(email.split('@')[0]);
      console.log(`[WHOP WEBHOOK] Extracted phone ${phone} from prefilled email: ${email}`);
    }

    const whopPlanId = data.plan_id || data.plan?.id || data.membership?.plan_id || data.membership?.plan?.id;

    if (!planId && !whopPlanId) {
      console.warn('[WHOP WEBHOOK] Ignored: Missing plan identifier in metadata or plan_id', { metadata, whopPlanId });
      return NextResponse.json({ error: 'planId or whopPlanId required' }, { status: 400 });
    }

    // 1. Locate User in Database
    let user = null;
    try {
      console.log('[WHOP WEBHOOK] Database lookup: searching for user...', { userId, email, phone });
      if (userId) {
        user = await db.user.findUnique({ where: { id: userId } });
      }
      if (!user && email) {
        user = await db.user.findUnique({ where: { email } });
      }
      if (!user && phone) {
        user = await db.user.findUnique({ where: { phone } });
      }
      console.log('[WHOP WEBHOOK] Database lookup: user result:', user ? `FOUND (ID: ${user.id})` : 'NOT FOUND');
    } catch (dbErr) {
      console.error('[WHOP WEBHOOK DB ERROR] Failed to lookup user in database:', dbErr);
      return NextResponse.json({ error: 'Internal database lookup error' }, { status: 500 });
    }

    if (!user) {
      console.warn('[WHOP WEBHOOK] Rejected: User not found for metadata/email/phone.', { userId, email, phone });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Resolve Plan and Price configuration
    let plan = null;
    let price = null;
    try {
      console.log('[WHOP WEBHOOK] Database lookup: resolving plan mappings...', { whopPlanId, planId });
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
      console.log('[WHOP WEBHOOK] Database lookup: resolve plan result:', plan ? `FOUND (Plan: ${plan.name})` : 'NOT FOUND');
    } catch (dbErr) {
      console.error('[WHOP WEBHOOK DB ERROR] Failed to resolve Plan/Price mappings:', dbErr);
      return NextResponse.json({ error: 'Internal database mapping error' }, { status: 500 });
    }

    if (!plan) {
      console.error('[WHOP WEBHOOK] Rejected: Plan or price configuration mapping not found.');
      return NextResponse.json({ error: 'Plan/Price mapping not found' }, { status: 404 });
    }

    // Unify all Whop events (payments and memberships) under the unique Membership ID to prevent double code provisioning.
    const membershipId = data.membership_id || data.membership?.id || (action.startsWith('membership') ? data.id : null);
    const txnRef = membershipId || data.id || `WHOP-WH-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    // 3. Process database transaction (Payment & Access Code generation)
    try {
      console.log('[WHOP WEBHOOK] Database transaction: Starting execution...', { txnRef });
      const result = await db.$transaction(async (tx) => {
        // Idempotency check
        const existingPayment = await tx.payment.findFirst({
          where: { reference: txnRef },
        });

        if (existingPayment) {
          console.log(`[WHOP WEBHOOK] Database transaction: Duplicate reference ${txnRef} detected. Skipping.`);
          return { alreadyProcessed: true };
        }

        // Log successful payment
        const payment = await tx.payment.create({
          data: {
            userId: user.id,
            amount: price?.amount || 0.00,
            currency: price?.currency || 'USD',
            method: 'Whop Webhook',
            reference: txnRef,
            status: 'approved',
          },
        });
        console.log(`[WHOP WEBHOOK] Database transaction: Created Payment ID: ${payment.id}`);

        // Generate assigned access code
        const codeVal = generateCode();
        const accessCode = await tx.accessCode.create({
          data: {
            code: codeVal,
            planId: plan.id,
            status: 'assigned',
            assignedTo: user.email,
            createdBy: 'System (Whop Webhook)',
          },
        });
        console.log(`[WHOP WEBHOOK] Database transaction: Generated Access Code: ${accessCode.code}`);

        return { alreadyProcessed: false, code: accessCode.code };
      });

      if (result.alreadyProcessed) {
        console.log('[WHOP WEBHOOK] Transaction complete: Already processed.');
        return NextResponse.json({ message: 'Webhook already processed' });
      }

      console.log(`[WHOP WEBHOOK] Webhook completed successfully. Provisioned code ${result.code} for user ${user.email}`);
      return NextResponse.json({ success: true, code: result.code });
    } catch (dbTxnErr) {
      console.error('[WHOP WEBHOOK DB TRANSACTION ERROR] Critical error writing payment/code to database:', dbTxnErr);
      return NextResponse.json({ error: 'Database transaction write failed' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[WHOP WEBHOOK CRITICAL ERROR] Exception inside route handler:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
