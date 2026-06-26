'use server';

import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/user-auth';
import { accessCodeSchema } from '@/lib/validation';

export async function redeemCode(formData: FormData) {
  try {
    const session = await requireUser();
    const rawCode = formData.get('code') as string;

    const parsed = accessCodeSchema.safeParse(rawCode);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid code format' };
    }

    // Remove dashes before looking up in the database (since DB stores uppercase alphanumeric e.g. ABCD1234)
    const codeString = parsed.data.replace(/-/g, '');

    const code = await db.accessCode.findUnique({
      where: { code: codeString },
      include: { plan: true },
    });

    if (!code) {
      return { success: false, error: 'Invalid access code' };
    }

    if (code.status === 'redeemed') {
      return { success: false, error: 'This code has already been redeemed' };
    }

    if (code.status === 'revoked') {
      return { success: false, error: 'This code has been revoked' };
    }

    if (code.assignedTo && code.assignedTo !== session.email && code.assignedTo !== session.phone) {
      return { success: false, error: 'This code is assigned to a different account' };
    }

    // Process redemption in a transaction
    await db.$transaction(async (tx) => {
      // 1. Create Entitlement
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

      // 2. Create Redemption record
      await tx.redemption.create({
        data: {
          userId: session.userId,
          codeId: code.id,
          entitlementId: entitlement.id,
        },
      });

      // 3. Mark code as redeemed
      await tx.accessCode.update({
        where: { id: code.id },
        data: { status: 'redeemed' },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error('[Redeem]', error);
    const msg = error?.message || 'An unexpected error occurred';
    if (msg.includes('session') || msg.includes('Unauthorized')) {
      return { success: false, error: 'Your session has expired. Please log in again.' };
    }
    return { success: false, error: 'An unexpected error occurred while redeeming the code' };
  }
}
