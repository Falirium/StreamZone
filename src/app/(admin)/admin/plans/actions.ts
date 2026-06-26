'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { adminAction } from '@/lib/actions/admin-actions';
import { planCreateSchema, planUpdateSchema } from '@/lib/validation';

export async function getPlans() {
  return adminAction(async () => {
    return db.plan.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { prices: true, accessCodes: true, entitlements: true } },
      },
    });
  });
}

export async function createPlan(formData: FormData) {
  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    durationDays: formData.get('durationDays') as string,
    maxDevices: formData.get('maxDevices') as string,
    isActive: formData.get('isActive') === 'on',
  };

  const parsed = planCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  return adminAction(
    async () => {
      const plan = await db.plan.create({ data: parsed.data });
      revalidatePath('/admin/plans');
      return plan;
    },
    {
      action: 'create',
      entity: 'Plan',
      entityId: 'new',
      details: { name: parsed.data.name },
    }
  );
}

export async function updatePlan(formData: FormData) {
  const raw = {
    id: formData.get('id') as string,
    name: (formData.get('name') as string) || undefined,
    description: formData.get('description') as string | null,
    durationDays: (formData.get('durationDays') as string) || undefined,
    maxDevices: (formData.get('maxDevices') as string) || undefined,
    isActive: formData.has('isActive') ? formData.get('isActive') === 'on' : undefined,
  };

  const parsed = planUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const { id, ...data } = parsed.data;

  return adminAction(
    async () => {
      const plan = await db.plan.update({ where: { id }, data });
      revalidatePath('/admin/plans');
      return plan;
    },
    {
      action: 'update',
      entity: 'Plan',
      entityId: id!,
      details: data as Record<string, unknown>,
    }
  );
}

export async function togglePlanActive(id: string, isActive: boolean) {
  return adminAction(
    async () => {
      const plan = await db.plan.update({
        where: { id },
        data: { isActive },
      });
      revalidatePath('/admin/plans');
      return plan;
    },
    {
      action: isActive ? 'activate' : 'deactivate',
      entity: 'Plan',
      entityId: id,
    }
  );
}
