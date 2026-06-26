import { NextRequest, NextResponse } from 'next/server';
import { requestOtp, verifyOtp, logoutUser } from '@/lib/auth/user-auth';
import { userOtpRequestSchema, userOtpVerifySchema } from '@/lib/validation';
import type { ApiResponse, UserSessionData } from '@/types/api';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<UserSessionData | null>>> {
  try {
    const body = await request.json();

    // Check if this is a verify request (has 'code' field)
    if ('code' in body) {
      const parsed = userOtpVerifySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' },
          { status: 400 }
        );
      }

      const result = await verifyOtp(parsed.data.email, parsed.data.code);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 401 }
        );
      }

      return NextResponse.json({ success: true, data: result.user });
    }

    // Otherwise, it's a request OTP
    const parsed = userOtpRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';

    const result = await requestOtp(parsed.data.email, ipAddress);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('[User Auth Error]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(): Promise<NextResponse<ApiResponse>> {
  try {
    await logoutUser();
    return NextResponse.json({ success: true, message: 'Logged out' });
  } catch (error) {
    console.error('[User Logout Error]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
