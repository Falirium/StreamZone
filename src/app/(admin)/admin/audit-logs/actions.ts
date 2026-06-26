'use server';

import { db } from '@/lib/db';
import { adminAction } from '@/lib/actions/admin-actions';
import { Prisma } from '@prisma/client';

export async function getAuditLogs(page = 1, pageSize = 20, search?: string) {
  return adminAction(async () => {
    const where: Prisma.AuditLogWhereInput = search
      ? {
          OR: [
            { action: { contains: search, mode: 'insensitive' } },
            { entity: { contains: search, mode: 'insensitive' } },
            { admin: { name: { contains: search, mode: 'insensitive' } } },
            { admin: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};

    const [total, logs] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { admin: { select: { name: true, email: true } } },
      }),
    ]);

    return { total, logs, page, pageSize };
  });
}
