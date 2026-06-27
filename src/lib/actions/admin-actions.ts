'use server';

import { requireAdmin } from '@/lib/auth/admin-auth';
import { logAudit } from '@/lib/audit';
import type { AdminSessionData } from '@/types/api';
import { Prisma } from '@prisma/client';

interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Wraps an admin server action with auth, error handling, and optional audit logging.
 */
export async function adminAction<T>(
  fn: (admin: AdminSessionData) => Promise<T>,
  audit?: {
    action: string;
    entity: string;
    entityId: string;
    details?: Record<string, unknown>;
  }
): Promise<ActionResult<T>> {
  try {
    const admin = await requireAdmin();
    const result = await fn(admin);

    if (audit) {
      await logAudit({
        adminId: admin.adminId,
        ...audit,
      });
    }

    return { success: true, data: result };
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    const rawMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    // Log the error (except expected Next.js pre-render dynamic server usage logs)
    if (!(error instanceof Error && error.message.includes('Dynamic server usage'))) {
      console.error('[AdminAction Error]:', error);
    }
    
    let clientMessage = 'An unexpected error occurred.';
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || [];
        const fieldName = target.join(', ');
        clientMessage = `A record with this ${fieldName || 'unique value'} already exists.`;
      } else if (error.code === 'P2025') {
        clientMessage = 'The requested record was not found.';
      } else {
        clientMessage = isDev ? rawMessage : 'A database error occurred.';
      }
    } else if (error instanceof Error) {
      if (rawMessage.startsWith('Unauthorized')) {
        clientMessage = rawMessage;
      } else if (isDev) {
        clientMessage = rawMessage;
      }
    }

    return { success: false, error: clientMessage };
  }
}
