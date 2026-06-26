'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { adminAction } from '@/lib/actions/admin-actions';
import { priceCreateSchema, priceUpdateSchema } from '@/lib/validation';

export async function getPrices() {
  return adminAction(async () => {
    return db.price.findMany({
      orderBy: [{ plan: { name: 'asc' } }, { country: { name: 'asc' } }],
      include: {
        plan: { select: { id: true, name: true } },
        country: { select: { id: true, name: true, code: true } },
      },
    });
  });
}

export async function getPlansAndCountries() {
  return adminAction(async () => {
    const [plans, countries] = await Promise.all([
      db.plan.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      db.country.findMany({ where: { isActive: true }, select: { id: true, name: true, code: true, currency: true }, orderBy: { name: 'asc' } }),
    ]);
    return { plans, countries };
  });
}

export async function createPrice(formData: FormData) {
  const raw = {
    planId: formData.get('planId') as string,
    countryId: formData.get('countryId') as string,
    amount: formData.get('amount') as string,
    currency: formData.get('currency') as string,
    whopPlanId: formData.get('whopPlanId') as string || undefined,
    isActive: formData.get('isActive') === 'on',
  };

  const parsed = priceCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  return adminAction(
    async () => {
      const price = await db.price.create({ data: parsed.data });
      revalidatePath('/admin/prices');
      return price;
    },
    {
      action: 'create',
      entity: 'Price',
      entityId: 'new',
      details: parsed.data as unknown as Record<string, unknown>,
    }
  );
}

export async function updatePrice(formData: FormData) {
  const raw = {
    id: formData.get('id') as string,
    amount: (formData.get('amount') as string) || undefined,
    currency: (formData.get('currency') as string) || undefined,
    whopPlanId: formData.has('whopPlanId') ? (formData.get('whopPlanId') as string || null) : undefined,
    isActive: formData.has('isActive') ? formData.get('isActive') === 'on' : undefined,
  };

  const parsed = priceUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const { id, ...data } = parsed.data;

  return adminAction(
    async () => {
      const price = await db.price.update({ where: { id }, data });
      revalidatePath('/admin/prices');
      return price;
    },
    {
      action: 'update',
      entity: 'Price',
      entityId: id!,
      details: data as Record<string, unknown>,
    }
  );
}

export async function togglePriceActive(id: string, isActive: boolean) {
  return adminAction(
    async () => {
      const price = await db.price.update({
        where: { id },
        data: { isActive },
      });
      revalidatePath('/admin/prices');
      return price;
    },
    {
      action: isActive ? 'activate' : 'deactivate',
      entity: 'Price',
      entityId: id,
    }
  );
}
