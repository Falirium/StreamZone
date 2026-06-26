'use server';

import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const operatorSchema = z.object({
  id: z.string().optional(),
  phoneNumber: z.string().min(5, 'Phone number too short'),
  displayName: z.string().min(2, 'Name too short'),
  isActive: z.boolean().default(true),
  defaultWeight: z.number().int().min(1, 'Weight must be at least 1'),
  templateText: z.string().nullable().optional(),
});

export async function getOperators() {
  await requireAdmin();
  try {
    const data = await db.whatsAppOperator.findMany({
      include: {
        assignments: {
          include: {
            country: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data };
  } catch (error) {
    console.error('[GetOperators]', error);
    return { success: false, error: 'Failed to fetch operators' };
  }
}

export async function createOperator(formData: FormData) {
  await requireAdmin();

  const raw = {
    phoneNumber: formData.get('phoneNumber') as string,
    displayName: formData.get('displayName') as string,
    isActive: formData.get('isActive') === 'on',
    defaultWeight: parseInt(formData.get('defaultWeight') as string || '1', 10),
    templateText: formData.get('templateText') as string || null,
  };

  const parsed = operatorSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  try {
    const operator = await db.whatsAppOperator.create({
      data: parsed.data,
    });

    // Handle country assignments if passed
    const countryIdsRaw = formData.get('countryIds') as string; // JSON string array expected
    if (countryIdsRaw) {
      const countryIds = JSON.parse(countryIdsRaw) as string[];
      await db.operatorAssignment.createMany({
        data: countryIds.map((cId) => ({
          operatorId: operator.id,
          countryId: cId,
        })),
      });
    }

    revalidatePath('/admin/operators');
    return { success: true, data: operator };
  } catch (error) {
    console.error('[CreateOperator]', error);
    return { success: false, error: 'Failed to create operator' };
  }
}

export async function updateOperator(formData: FormData) {
  await requireAdmin();

  const id = formData.get('id') as string;
  if (!id) return { success: false, error: 'Operator ID is required' };

  const raw = {
    phoneNumber: formData.get('phoneNumber') as string,
    displayName: formData.get('displayName') as string,
    isActive: formData.get('isActive') === 'on',
    defaultWeight: parseInt(formData.get('defaultWeight') as string || '1', 10),
    templateText: formData.get('templateText') as string || null,
  };

  const parsed = operatorSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  try {
    await db.whatsAppOperator.update({
      where: { id },
      data: parsed.data,
    });

    // Update country assignments
    const countryIdsRaw = formData.get('countryIds') as string;
    if (countryIdsRaw) {
      const countryIds = JSON.parse(countryIdsRaw) as string[];
      
      // Delete old assignments
      await db.operatorAssignment.deleteMany({
        where: { operatorId: id },
      });

      // Create new assignments
      if (countryIds.length > 0) {
        await db.operatorAssignment.createMany({
          data: countryIds.map((cId) => ({
            operatorId: id,
            countryId: cId,
          })),
        });
      }
    }

    revalidatePath('/admin/operators');
    return { success: true };
  } catch (error) {
    console.error('[UpdateOperator]', error);
    return { success: false, error: 'Failed to update operator' };
  }
}

export async function toggleOperatorActive(id: string, isActive: boolean) {
  await requireAdmin();
  try {
    await db.whatsAppOperator.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath('/admin/operators');
    return { success: true };
  } catch (error) {
    console.error('[ToggleOperatorActive]', error);
    return { success: false, error: 'Failed to toggle status' };
  }
}

export async function deleteOperator(id: string) {
  await requireAdmin();
  try {
    await db.whatsAppOperator.delete({
      where: { id },
    });
    revalidatePath('/admin/operators');
    return { success: true };
  } catch (error) {
    console.error('[DeleteOperator]', error);
    return { success: false, error: 'Failed to delete operator' };
  }
}

export async function getCountriesForSelection() {
  await requireAdmin();
  try {
    const data = await db.country.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data };
  } catch (error) {
    console.error('[GetCountriesForSelection]', error);
    return { success: false, error: 'Failed to fetch countries' };
  }
}
