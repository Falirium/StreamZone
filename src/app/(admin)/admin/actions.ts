'use server';

import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin-auth';

export async function getDashboardStats() {
  await requireAdmin();

  const [
    totalUsers,
    pendingPayments,
    activeCodes,
    liveEvents,
    recentAudit,
    recentOtps,
  ] = await Promise.all([
    db.user.count(),
    db.payment.count({ where: { status: 'pending' } }),
    db.accessCode.count({ where: { status: 'available' } }),
    db.event.count({
      where: {
        isActive: true,
        startsAt: { lte: new Date() },
        OR: [
          { endsAt: null },
          { endsAt: { gte: new Date() } },
        ],
      },
    }),
    db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { name: true, email: true } } },
    }),
    db.userOtp.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    totalUsers,
    pendingPayments,
    activeCodes,
    liveEvents,
    recentAudit: recentAudit.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      adminName: log.admin?.name ?? 'System',
      createdAt: log.createdAt.toISOString(),
    })),
    recentOtps: recentOtps.map((otp) => ({
      id: otp.id,
      email: otp.email,
      code: otp.code,
      verified: otp.verified,
      expiresAt: otp.expiresAt.toISOString(),
      createdAt: otp.createdAt.toISOString(),
    })),
  };
}
