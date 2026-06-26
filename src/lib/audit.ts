import { db } from '@/lib/db';

interface AuditLogInput {
  adminId?: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        adminId: input.adminId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        details: input.details ? (input.details as any) : undefined,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (error) {
    // Audit logging should never crash the main operation
    console.error('[AUDIT] Failed to write audit log:', error);
  }
}
