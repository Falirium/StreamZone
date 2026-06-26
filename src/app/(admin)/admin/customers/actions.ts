'use server';

import { db } from '@/lib/db';
import { adminAction } from '@/lib/actions/admin-actions';

export async function getCustomers(search?: string) {
  return adminAction(async () => {
    return db.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: { include: { country: true } },
        _count: { select: { entitlements: { where: { isActive: true } }, payments: true } },
      },
      take: 100, // Limit to recent/top 100 for now to keep it simple, or use pagination
    });
  });
}
