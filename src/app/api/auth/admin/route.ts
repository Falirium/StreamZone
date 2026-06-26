import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin, logoutAdmin } from '@/lib/auth/admin-auth';
import { adminLoginSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit';
import type { ApiResponse, AdminSessionData } from '@/types/api';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AdminSessionData>>> {
  try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const result = await loginAdmin(parsed.data.email, parsed.data.password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    // Audit log
    await logAudit({
      adminId: result.admin!.adminId,
      action: 'admin.login',
      entity: 'Admin',
      entityId: result.admin!.adminId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ success: true, data: result.admin });
  } catch (error) {
    console.error('[Admin Login Error]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(): Promise<NextResponse<ApiResponse>> {
  try {
    await logoutAdmin();
    return NextResponse.json({ success: true, message: 'Logged out' });
  } catch (error) {
    console.error('[Admin Logout Error]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
