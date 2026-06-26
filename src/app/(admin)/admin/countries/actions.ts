'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { adminAction } from '@/lib/actions/admin-actions';
import { countryCreateSchema, countryUpdateSchema } from '@/lib/validation';

export async function getCountries() {
  return adminAction(async () => {
    return db.country.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { profiles: true, prices: true } } },
    });
  });
}

export async function createCountry(formData: FormData) {
  const raw = {
    name: formData.get('name') as string,
    code: formData.get('code') as string,
    currency: formData.get('currency') as string,
    paymentNotes: (formData.get('paymentNotes') as string) || undefined,
    isActive: formData.get('isActive') === 'on',
  };

  const parsed = countryCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  return adminAction(
    async () => {
      const country = await db.country.create({ data: parsed.data });
      revalidatePath('/admin/countries');
      return country;
    },
    {
      action: 'create',
      entity: 'Country',
      entityId: 'new',
      details: { name: parsed.data.name, code: parsed.data.code },
    }
  );
}

export async function updateCountry(formData: FormData) {
  const raw = {
    id: formData.get('id') as string,
    name: (formData.get('name') as string) || undefined,
    code: (formData.get('code') as string) || undefined,
    currency: (formData.get('currency') as string) || undefined,
    paymentNotes: formData.get('paymentNotes') as string | null,
    isActive: formData.has('isActive') ? formData.get('isActive') === 'on' : undefined,
  };

  const parsed = countryUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const { id, ...data } = parsed.data;

  return adminAction(
    async () => {
      const country = await db.country.update({ where: { id }, data });
      revalidatePath('/admin/countries');
      return country;
    },
    {
      action: 'update',
      entity: 'Country',
      entityId: id!,
      details: data as Record<string, unknown>,
    }
  );
}

export async function toggleCountryActive(id: string, isActive: boolean) {
  return adminAction(
    async () => {
      const country = await db.country.update({
        where: { id },
        data: { isActive },
      });
      revalidatePath('/admin/countries');
      return country;
    },
    {
      action: isActive ? 'activate' : 'deactivate',
      entity: 'Country',
      entityId: id,
    }
  );
}
