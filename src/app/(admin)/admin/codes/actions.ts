'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { adminAction } from '@/lib/actions/admin-actions';
import { codeGenerateSchema } from '@/lib/validation';
import { ACCESS_CODE_LENGTH } from '@/lib/constants';
import crypto from 'crypto';

function generateCode(): string {
  return crypto.randomBytes(ACCESS_CODE_LENGTH)
    .toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ACCESS_CODE_LENGTH);
}

export async function getCodes() {
  return adminAction(async () => {
    return db.accessCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        plan: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
        redemption: { select: { user: { select: { phone: true, email: true } } } },
      },
    });
  });
}

export async function getPlansAndEvents() {
  return adminAction(async () => {
    const [plans, events] = await Promise.all([
      db.plan.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      db.event.findMany({ where: { isActive: true }, select: { id: true, title: true }, orderBy: { startsAt: 'desc' } }),
    ]);
    return { plans, events };
  });
}

export async function generateCodes(formData: FormData) {
  const raw = {
    planId: formData.get('planId') as string,
    eventId: (formData.get('eventId') as string) || undefined,
    count: formData.get('count') as string,
    assignedTo: (formData.get('assignedTo') as string) || undefined,
  };

  const parsed = codeGenerateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  return adminAction(
    async (admin) => {
      const codes = [];
      for (let i = 0; i < parsed.data.count; i++) {
        const code = await db.accessCode.create({
          data: {
            code: generateCode(),
            planId: parsed.data.planId,
            eventId: parsed.data.eventId || null,
            status: parsed.data.assignedTo ? 'assigned' : 'available',
            assignedTo: parsed.data.assignedTo || null,
            createdBy: admin.adminId,
          },
        });
        codes.push(code);
      }
      revalidatePath('/admin/codes');
      return codes;
    },
    {
      action: 'generate_codes',
      entity: 'AccessCode',
      entityId: 'batch',
      details: { count: parsed.data.count, planId: parsed.data.planId },
    }
  );
}

export async function revokeCode(id: string) {
  return adminAction(
    async () => {
      // Update code status to revoked and fetch its redemption relation
      const code = await db.accessCode.update({
        where: { id },
        data: { status: 'revoked' },
        include: { redemption: true },
      });

      // If the code has been redeemed, deactivate the entitlement immediately
      if (code.redemption?.entitlementId) {
        await db.accessEntitlement.update({
          where: { id: code.redemption.entitlementId },
          data: { isActive: false },
        });
      }

      revalidatePath('/admin/codes');
      return code;
    },
    { action: 'revoke', entity: 'AccessCode', entityId: id }
  );
}
