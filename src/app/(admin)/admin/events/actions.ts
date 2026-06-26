'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { adminAction } from '@/lib/actions/admin-actions';
import { eventCreateSchema, eventUpdateSchema } from '@/lib/validation';

export async function getEvents() {
  return adminAction(async () => {
    return db.event.findMany({
      orderBy: { startsAt: 'desc' },
      include: {
        _count: { select: { playbackSources: true, accessCodes: true, entitlements: true } },
      },
    });
  });
}

export async function createEvent(formData: FormData) {
  const raw = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || undefined,
    slug: formData.get('slug') as string,
    category: formData.get('category') as string,
    startsAt: formData.get('startsAt') as string,
    endsAt: (formData.get('endsAt') as string) || undefined,
    posterUrl: (formData.get('posterUrl') as string) || undefined,
    isActive: formData.get('isActive') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
  };

  const parsed = eventCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  return adminAction(
    async () => {
      const event = await db.event.create({ data: parsed.data });
      revalidatePath('/admin/events');
      return event;
    },
    {
      action: 'create',
      entity: 'Event',
      entityId: 'new',
      details: { title: parsed.data.title, slug: parsed.data.slug },
    }
  );
}

export async function updateEvent(formData: FormData) {
  const raw = {
    id: formData.get('id') as string,
    title: (formData.get('title') as string) || undefined,
    description: formData.get('description') as string | null,
    slug: (formData.get('slug') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    startsAt: (formData.get('startsAt') as string) || undefined,
    endsAt: (formData.get('endsAt') as string) || undefined,
    posterUrl: (formData.get('posterUrl') as string) || undefined,
    isActive: formData.has('isActive') ? formData.get('isActive') === 'on' : undefined,
    isFeatured: formData.has('isFeatured') ? formData.get('isFeatured') === 'on' : undefined,
  };

  const parsed = eventUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const { id, ...data } = parsed.data;

  return adminAction(
    async () => {
      const event = await db.event.update({ where: { id }, data });
      revalidatePath('/admin/events');
      return event;
    },
    {
      action: 'update',
      entity: 'Event',
      entityId: id!,
      details: data as Record<string, unknown>,
    }
  );
}

export async function toggleEventActive(id: string, isActive: boolean) {
  return adminAction(
    async () => {
      const event = await db.event.update({ where: { id }, data: { isActive } });
      revalidatePath('/admin/events');
      return event;
    },
    { action: isActive ? 'activate' : 'deactivate', entity: 'Event', entityId: id }
  );
}

export async function toggleEventFeatured(id: string, isFeatured: boolean) {
  return adminAction(
    async () => {
      const event = await db.event.update({ where: { id }, data: { isFeatured } });
      revalidatePath('/admin/events');
      return event;
    },
    { action: isFeatured ? 'feature' : 'unfeature', entity: 'Event', entityId: id }
  );
}
