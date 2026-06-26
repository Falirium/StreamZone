'use server';

import { db } from '@/lib/db';
import { ACCESS_CODE_LENGTH } from '@/lib/constants';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

function generateCode(): string {
  return crypto.randomBytes(ACCESS_CODE_LENGTH)
    .toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ACCESS_CODE_LENGTH);
}

export async function simulateWhopPayment(planId: string, userId: string, userPhone: string, amount: number, currency: string) {
  try {
    const txnRef = `WHOP-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    // Process in transaction
    const code = await db.$transaction(async (tx) => {
      // 1. Log payment
      await tx.payment.create({
        data: {
          userId,
          amount,
          currency,
          method: 'Whop (Simulated)',
          reference: txnRef,
          status: 'approved',
        },
      });

      // 2. Generate and assign code
      const accessCode = await tx.accessCode.create({
        data: {
          code: generateCode(),
          planId,
          status: 'assigned',
          assignedTo: userPhone,
          createdBy: 'System (Whop Checkout)',
        },
      });

      return accessCode;
    });

    revalidatePath('/my-access');
    return { success: true, code: code.code };
  } catch (error: any) {
    console.error('[Whop Simulation Error]', error);
    return { success: false, error: error.message || 'Failed to process simulated payment' };
  }
}

export async function createWhopCheckoutSession(planId: string, whopPlanId: string, userId: string, userPhone: string, origin: string) {
  try {
    const apiKey = process.env.WHOP_API_KEY;
    if (!apiKey) {
      throw new Error('WHOP_API_KEY is not configured');
    }

    const apiBase = process.env.WHOP_API_URL || 'https://api.whop.com/api/v1';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
    let redirectUrl = `${appUrl}/my-access`;
    if (redirectUrl.startsWith('http://')) {
      redirectUrl = redirectUrl.replace('http://', 'https://');
    }

    const response = await fetch(`${apiBase}/checkout_configurations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        plan_id: whopPlanId,
        redirect_url: redirectUrl,
        metadata: {
          planId,
          userId,
          phone: userPhone,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Whop API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    console.log('[Whop API Response Data]', JSON.stringify(data, null, 2));
    return { 
      success: true, 
      checkoutUrl: data.purchase_url || data.url || `https://whop.com/checkout?c=${data.id}` 
    };
  } catch (error: any) {
    console.error('[Create Whop Checkout Error]', error);
    return { success: false, error: error.message || 'Failed to create checkout configuration' };
  }
}
