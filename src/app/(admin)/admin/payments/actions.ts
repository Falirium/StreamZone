'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { adminAction } from '@/lib/actions/admin-actions';
import { paymentReviewSchema } from '@/lib/validation';
import { ACCESS_CODE_LENGTH } from '@/lib/constants';
import crypto from 'crypto';

function generateCode(): string {
  return crypto.randomBytes(ACCESS_CODE_LENGTH)
    .toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ACCESS_CODE_LENGTH);
}

export async function getPayments(status?: string) {
  return adminAction(async () => {
    return db.payment.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, phone: true } } },
    });
  });
}

export async function reviewPayment(formData: FormData) {
  const raw = {
    id: formData.get('id') as string,
    status: formData.get('status') as string,
    reviewNote: (formData.get('reviewNote') as string) || undefined,
  };

  const parsed = paymentReviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  return adminAction(
    async (admin) => {
      const payment = await db.payment.update({
        where: { id: parsed.data.id },
        data: {
          status: parsed.data.status,
          reviewNote: parsed.data.reviewNote ?? null,
          reviewedBy: admin.adminId,
          reviewedAt: new Date(),
        },
        include: { user: true },
      });

      let generatedCodeString: string | null = null;

      // On approval, generate an access code
      if (parsed.data.status === 'approved') {
        // Find or use default plan
        const plan = await db.plan.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
        if (!plan) {
          throw new Error('No active plan found to assign access code.');
        }

        const codeVal = generateCode();
        generatedCodeString = codeVal;
        
        await db.accessCode.create({
          data: {
            code: codeVal,
            planId: plan.id,
            status: 'assigned',
            assignedTo: payment.user.email,
            createdBy: admin.adminId,
          },
        });
      }

      revalidatePath('/admin/payments');
      return {
        id: payment.id,
        status: payment.status,
        code: generatedCodeString,
      };
    },
    {
      action: `review_${parsed.data.status}`,
      entity: 'Payment',
      entityId: parsed.data.id,
      details: { status: parsed.data.status, reviewNote: parsed.data.reviewNote },
    }
  );
}
