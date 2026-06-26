import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/user-auth';
import type { ApiResponse } from '@/types/api';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. Authenticate user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: User session required' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { endpoint, p256dh, auth } = body;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { success: false, error: 'Missing required push subscription fields (endpoint, p256dh, auth).' },
        { status: 400 }
      );
    }

    // 3. Upsert push subscription in database linked to the user profile
    await db.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: currentUser.userId,
      },
      create: {
        userId: currentUser.userId,
        endpoint,
        p256dh,
        auth,
      },
    });

    return NextResponse.json({ success: true, message: 'Subscription saved successfully.' });
  } catch (error) {
    console.error('[Push Subscribe API Error]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
