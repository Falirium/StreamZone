'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { adminAction } from '@/lib/actions/admin-actions';
import { playbackSourceCreateSchema, playbackSourceUpdateSchema } from '@/lib/validation';

export async function getPlaybackSources() {
  return adminAction(async () => {
    return db.playbackSource.findMany({
      orderBy: [{ event: { startsAt: 'desc' } }, { priority: 'asc' }],
      include: { event: { select: { id: true, title: true, slug: true } } },
    });
  });
}

export async function getActiveEvents() {
  return adminAction(async () => {
    return db.event.findMany({
      where: { isActive: true },
      select: { id: true, title: true },
      orderBy: { startsAt: 'desc' },
    });
  });
}

export async function createPlaybackSource(formData: FormData) {
  const raw = {
    eventId: formData.get('eventId') as string,
    matchId: formData.get('matchId') as string,
    sourceProvider: formData.get('sourceProvider') as string,
    sourceMatchId: formData.get('sourceMatchId') as string,
    priority: formData.get('priority') as string,
    isActive: formData.get('isActive') === 'on',
  };

  const parsed = playbackSourceCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  return adminAction(
    async () => {
      const source = await db.playbackSource.create({ data: parsed.data });
      revalidatePath('/admin/playback');
      return source;
    },
    {
      action: 'create',
      entity: 'PlaybackSource',
      entityId: 'new',
      details: { eventId: parsed.data.eventId, matchId: parsed.data.matchId },
    }
  );
}

export async function deletePlaybackSource(id: string) {
  return adminAction(
    async () => {
      await db.playbackSource.delete({ where: { id } });
      revalidatePath('/admin/playback');
    },
    { action: 'delete', entity: 'PlaybackSource', entityId: id }
  );
}
