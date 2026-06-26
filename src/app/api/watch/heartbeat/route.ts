import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/user-auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, slug } = body;

    if (!sessionId || !slug) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() - 15 * 1000); // 15 seconds expiration window

    // 1. Clean up stale/inactive playback sessions
    await db.playbackSession.deleteMany({
      where: {
        lastActive: { lt: cutoff }
      }
    });

    // 2. Upsert the current session to mark it active
    await db.playbackSession.upsert({
      where: {
        userId_sessionId: {
          userId: user.userId,
          sessionId: sessionId
        }
      },
      update: {
        lastActive: now
      },
      create: {
        userId: user.userId,
        sessionId: sessionId,
        lastActive: now
      }
    });

    // 3. Find user's active entitlement to get the plan and its maxDevices limit
    const entitlement = await db.accessEntitlement.findFirst({
      where: {
        userId: user.userId,
        isActive: true,
        expiresAt: { gt: now }
      },
      include: {
        plan: true
      }
    });

    // Default to 1 if no plan/entitlement found
    const maxDevices = entitlement?.plan?.maxDevices ?? 1;

    // 4. Fetch all active sessions for this user, ordered by lastActive desc
    const activeSessions = await db.playbackSession.findMany({
      where: {
        userId: user.userId
      },
      orderBy: {
        lastActive: 'desc'
      }
    });

    // 5. Determine if current session is in the allowed active pool
    // (most recent maxDevices sessions)
    const currentSessionIndex = activeSessions.findIndex(s => s.sessionId === sessionId);
    
    if (currentSessionIndex === -1 || currentSessionIndex >= maxDevices) {
      // Evict from DB
      await db.playbackSession.delete({
        where: {
          userId_sessionId: {
            userId: user.userId,
            sessionId: sessionId
          }
        }
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        evicted: true,
        message: `Device limit reached. This pass is active on other screens.`
      });
    }

    return NextResponse.json({
      success: true,
      evicted: false
    });

  } catch (error) {
    console.error('[Heartbeat Error]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
