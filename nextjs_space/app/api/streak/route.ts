import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserStreakInfo, getEarnedMilestones, getMilestoneBadge } from '@/lib/streak-system';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/streak - Get user's streak info
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session as { user?: { id?: string } })?.user?.id || (session as { userId?: string })?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Get user's timezone from profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { timezone: true },
    });

    const streakInfo = await getUserStreakInfo(userId, profile?.timezone || undefined);
    const earnedMilestones = getEarnedMilestones(streakInfo.currentStreak, streakInfo.bestStreak);
    const badges = earnedMilestones.map(m => getMilestoneBadge(m)).filter(Boolean);

    return NextResponse.json({
      ...streakInfo,
      earnedMilestones,
      badges,
    });
  } catch (error) {
    console.error('Error fetching streak:', error);
    return NextResponse.json({ error: 'Failed to fetch streak' }, { status: 500 });
  }
}
