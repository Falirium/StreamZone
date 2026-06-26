'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { adminAction } from '@/lib/actions/admin-actions';
import { supportCaseUpdateSchema } from '@/lib/validation';

export async function getSupportCases(status?: string) {
  return adminAction(async () => {
    return db.supportCase.findMany({
      where: status && status !== 'all' ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { phone: true, email: true } } },
    });
  });
}

export async function updateSupportCase(formData: FormData) {
  const raw = {
    id: formData.get('id') as string,
    status: formData.get('status') as string,
    adminNote: formData.get('adminNote') as string | null,
  };

  const parsed = supportCaseUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const { id, ...data } = parsed.data;

  return adminAction(
    async (admin) => {
      const isResolvedOrClosed = data.status === 'resolved' || data.status === 'closed';
      
      const supportCase = await db.supportCase.update({
        where: { id },
        data: {
          ...data,
          ...(isResolvedOrClosed ? { resolvedBy: admin.adminId } : {}),
        },
      });
      revalidatePath('/admin/support');
      return supportCase;
    },
    {
      action: `update_case_${data.status}`,
      entity: 'SupportCase',
      entityId: id!,
      details: data as Record<string, unknown>,
    }
  );
}
