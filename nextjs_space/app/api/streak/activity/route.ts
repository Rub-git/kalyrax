import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { recordStreakActivity, StreakEventType } from '@/lib/streak-system';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/streak/activity - Record a qualifying activity
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session as { user?: { id?: string } })?.user?.id || (session as { userId?: string })?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { eventType } = await request.json();

    // Validate event type
    const validTypes: StreakEventType[] = ['DAY_COMPLETED', 'AI_INTERACTION', 'PLAN_VIEW'];
    if (!validTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Get user's timezone from profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { timezone: true },
    });

    const result = await recordStreakActivity(userId, eventType, profile?.timezone || undefined);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error recording streak activity:', error);
    return NextResponse.json({ error: 'Failed to record activity' }, { status: 500 });
  }
}
