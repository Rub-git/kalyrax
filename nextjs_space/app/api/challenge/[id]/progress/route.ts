import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { awardPoints, updateChallengeStats } from '@/lib/challenge-points';
import { recordStreakActivity } from '@/lib/streak-system';

export const dynamic = 'force-dynamic';

interface ProgressEntry {
  id: string;
  dayNumber: number;
  completed: boolean;
  completedAt: Date | null;
}

// POST /api/challenge/[id]/progress - Mark day as complete
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const { dayNumber, proteinConsumed, notes } = await req.json();
    
    if (!dayNumber || dayNumber < 1) {
      return NextResponse.json(
        { error: 'Valid day number is required' },
        { status: 400 }
      );
    }
    
    // Get the challenge instance
    const challenge = await prisma.challengeInstance.findUnique({
      where: { id },
      include: {
        template: true,
        progress: {
          orderBy: { dayNumber: 'asc' },
        },
      },
    });
    
    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }
    
    if (challenge.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    if (challenge.status !== 'active') {
      return NextResponse.json(
        { error: 'Challenge is not active' },
        { status: 400 }
      );
    }
    
    // Get user profile for timezone (default to UTC if not set)
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });
    
    const userTimezone = profile?.timezone || 'UTC';
    
    // Anti-cheat: Get today's date in user's timezone
    const now = new Date();
    const userDate = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    userDate.setHours(0, 0, 0, 0);
    
    // Anti-cheat: Check day N-1 is completed before allowing day N
    if (dayNumber > 1) {
      const previousDay = challenge.progress.find((p: ProgressEntry) => p.dayNumber === dayNumber - 1);
      if (!previousDay?.completed) {
        return NextResponse.json(
          { error: `Complete day ${dayNumber - 1} first` },
          { status: 400 }
        );
      }
    }
    
    // Anti-cheat: Only allow one day completion per calendar day
    const todayCompletions = challenge.progress.filter((p: ProgressEntry) => {
      if (!p.completedAt) return false;
      const completedDate = new Date(p.completedAt.toLocaleString('en-US', { timeZone: userTimezone }));
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === userDate.getTime();
    });
    
    if (todayCompletions.length > 0) {
      return NextResponse.json(
        { error: 'You can only complete one day per calendar day' },
        { status: 400 }
      );
    }
    
    // Find the progress entry for this day
    const progressEntry = challenge.progress.find((p: ProgressEntry) => p.dayNumber === dayNumber);
    if (!progressEntry) {
      return NextResponse.json(
        { error: 'Invalid day number' },
        { status: 400 }
      );
    }
    
    if (progressEntry.completed) {
      return NextResponse.json(
        { error: 'Day already completed' },
        { status: 400 }
      );
    }
    
    // Mark day as complete
    const updatedProgress = await prisma.challengeProgress.update({
      where: { id: progressEntry.id },
      data: {
        completed: true,
        completedAt: now,
        proteinConsumed: proteinConsumed || null,
        notes: notes || null,
      },
    });
    
    // Calculate points earned
    let totalPointsEarned = 0;
    
    // Award day completion points
    const dayPoints = await awardPoints({
      userId,
      challengeInstanceId: challenge.id,
      eventType: 'DAY_COMPLETED',
      metadata: { dayNumber },
    });
    totalPointsEarned += dayPoints;
    
    // Calculate streak (consecutive days completed)
    const completedDays = challenge.progress.filter((p: ProgressEntry) => p.completed || p.dayNumber === dayNumber).length;
    const streakPoints = await awardPoints({
      userId,
      challengeInstanceId: challenge.id,
      eventType: 'STREAK_BONUS',
      metadata: { streakDays: completedDays, dayNumber },
    });
    totalPointsEarned += streakPoints;
    
    // Check if challenge is complete
    let challengeCompleted = false;
    if (dayNumber === challenge.template.durationDays) {
      challengeCompleted = true;
      
      // Award challenge completion bonus
      const completionPoints = await awardPoints({
        userId,
        challengeInstanceId: challenge.id,
        eventType: 'CHALLENGE_COMPLETED',
        metadata: { templateId: challenge.templateId },
      });
      totalPointsEarned += completionPoints;
      
      // Update challenge status
      await prisma.challengeInstance.update({
        where: { id: challenge.id },
        data: { status: 'completed' },
      });
    }
    
    // Update challenge stats
    await updateChallengeStats(userId, challenge.templateId, {
      daysCompleted: 1,
      challengeCompleted,
      currentStreak: completedDays,
      pointsEarned: totalPointsEarned,
    });
    
    // Record streak activity (global streak system)
    const streakResult = await recordStreakActivity(userId, 'DAY_COMPLETED', userTimezone);
    
    return NextResponse.json({
      success: true,
      progress: updatedProgress,
      pointsEarned: totalPointsEarned,
      challengeCompleted,
      daysCompleted: completedDays,
      totalDays: challenge.template.durationDays,
      streakInfo: streakResult,
    });
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
