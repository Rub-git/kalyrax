import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserStreakInfo, getMilestoneBadge, getEarnedMilestones } from '@/lib/streak-system';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// Generate a random slug for sharing
function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET /api/streak/share - Get shareable streak data for card generation
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

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          select: { displayName: true, timezone: true },
        },
      },
    });

    const streakInfo = await getUserStreakInfo(userId, user?.profile?.timezone || undefined);
    const earnedMilestones = getEarnedMilestones(streakInfo.currentStreak, streakInfo.bestStreak);
    const latestBadge = earnedMilestones.length > 0 
      ? getMilestoneBadge(earnedMilestones[earnedMilestones.length - 1]) 
      : null;

    // Generate a share slug
    const shareSlug = generateSlug();

    return NextResponse.json({
      displayName: user?.profile?.displayName || user?.name || 'Anonymous',
      currentStreak: streakInfo.currentStreak,
      bestStreak: streakInfo.bestStreak,
      latestBadge,
      earnedMilestones,
      shareSlug,
    });
  } catch (error) {
    console.error('Error generating share data:', error);
    return NextResponse.json({ error: 'Failed to generate share data' }, { status: 500 });
  }
}
