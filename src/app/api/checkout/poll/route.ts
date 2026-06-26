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

    let isSuccessful = !!(payment || recentCode || recentEntitlement);
    let explicitError: string | null = null;
    let whopEmailAddress: string | null = null;

    if (!isSuccessful) {
      console.log('[CHECKOUT POLL] Webhook has not processed yet. Checking Whop API directly for fallback/self-healing...');
      const whopApiKey = process.env.WHOP_API_KEY;
      if (whopApiKey) {
        const whopApiBase = process.env.WHOP_API_URL || 'https://api.whop.com/api/v1';
        try {
          const whopRes = await fetch(`${whopApiBase}/memberships/${paymentId}`, {
            headers: {
              'Authorization': `Bearer ${whopApiKey}`,
            },
          });

          if (whopRes.ok) {
            const whopData = await whopRes.json();
            console.log('[CHECKOUT POLL] Fetched Whop membership directly:', JSON.stringify(whopData, null, 2));
            
            const whopEmail = whopData.email || whopData.user?.email || '';
            const sessionEmail = session.email;

            // Normalize emails for comparison
            if (whopEmail && whopEmail.toLowerCase() !== sessionEmail.toLowerCase()) {
              console.warn('[CHECKOUT POLL] Mismatch detected: Whop email is', whopEmail, 'but logged in user email is', sessionEmail);
              explicitError = 'EMAIL_MISMATCH';
              whopEmailAddress = whopEmail;
            } else {
              // Self-healing: if the emails match and the membership is valid/active, let's provision the payment & code now!
              const membershipStatus = whopData.status || '';
              const validStatuses = ['active', 'valid', 'completed', 'went_valid', 'trialing'];
              if (validStatuses.includes(membershipStatus.toLowerCase()) || whopData.active === true) {
                console.log('[CHECKOUT POLL] Whop membership is active and email matches. Triggering self-healing database write...');
                
                // Let's resolve the plan mapping
                const whopPlanId = whopData.plan_id || whopData.plan?.id;
                let price = null;
                let plan = null;
                if (whopPlanId) {
                  price = await db.price.findFirst({
                    where: { whopPlanId },
                    include: { plan: true },
                  });
                  if (price) plan = price.plan;
                }

                if (!plan) {
                  // Fallback: use first active plan
                  plan = await db.plan.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
                }

                if (plan) {
                  // Log the payment and assign/redeem the code in a single transaction
                  try {
                    const result = await db.$transaction(async (tx) => {
                      // Double check if payment already logged (idempotency)
                      const existingPayment = await tx.payment.findFirst({
                        where: { reference: paymentId },
                      });
                      if (existingPayment) {
                        return { alreadyProcessed: true };
                      }

                      await tx.payment.create({
                        data: {
                          userId: session.userId,
                          amount: price?.amount || 0.00,
                          currency: price?.currency || 'USD',
                          method: 'Whop API (Self-Healed)',
                          reference: paymentId,
                          status: 'approved',
                        },
                      });

                      // Create and redeem code
                      const accessCode = await tx.accessCode.create({
                        data: {
                          code: `WHOP-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
                          planId: plan.id,
                          status: 'redeemed',
                          assignedTo: session.email,
                          createdBy: 'System (Self-Healing Poll)',
                        },
                      });

                      const startsAt = new Date();
                      const expiresAt = new Date(startsAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

                      const entitlement = await tx.accessEntitlement.create({
                        data: {
                          userId: session.userId,
                          planId: plan.id,
                          startsAt,
                          expiresAt,
                          isActive: true,
                        },
                      });

                      await tx.redemption.create({
                        data: {
                          userId: session.userId,
                          codeId: accessCode.id,
                          entitlementId: entitlement.id,
                        },
                      });

                      return { alreadyProcessed: false, code: accessCode.code };
                    });

                    if (result && 'code' in result && result.code) {
                      return NextResponse.json({ status: 'success', redeemed: true, code: result.code });
                    }
                  } catch (txnErr) {
                    console.error('[CHECKOUT POLL] Self-healing transaction failed:', txnErr);
                  }
                } else {
                  console.error('[CHECKOUT POLL] No valid plan could be mapped for self-healing.');
                  explicitError = 'PLAN_CONFIGURATION_ERROR';
                }
              }
            }
          } else {
            console.warn('[CHECKOUT POLL] Whop API membership lookup returned status:', whopRes.status);
          }
        } catch (whopApiErr) {
          console.error('[CHECKOUT POLL] Failed to poll Whop API directly:', whopApiErr);
        }
      }
    }

    if (explicitError) {
      return NextResponse.json({ 
        status: 'failed', 
        error: explicitError, 
        whopEmail: whopEmailAddress, 
        loggedInEmail: session.email 
      });
    }

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
