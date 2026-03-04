import { prisma } from './db';
import { Prisma } from '@prisma/client';

// Points configuration
export const POINTS = {
  DAY_COMPLETED: 10,
  CHALLENGE_COMPLETED: 100,
  STREAK_BONUS_PER_DAY: 5,
  STREAK_BONUS_CAP: 25,
  SHARE_CREATED: 3,
  SHARE_CAP_PER_DAY: 1,
};

export type EventType = 'DAY_COMPLETED' | 'CHALLENGE_COMPLETED' | 'SHARE_CREATED' | 'STREAK_BONUS';

interface AwardPointsParams {
  userId: string;
  challengeInstanceId?: string;
  eventType: EventType;
  metadata?: Record<string, unknown>;
}

export async function awardPoints(params: AwardPointsParams): Promise<number> {
  const { userId, challengeInstanceId, eventType, metadata } = params;
  
  let pointsToAward = 0;
  
  switch (eventType) {
    case 'DAY_COMPLETED':
      pointsToAward = POINTS.DAY_COMPLETED;
      break;
    case 'CHALLENGE_COMPLETED':
      pointsToAward = POINTS.CHALLENGE_COMPLETED;
      break;
    case 'STREAK_BONUS':
      const streakDays = (metadata?.streakDays as number) || 1;
      pointsToAward = Math.min(streakDays * POINTS.STREAK_BONUS_PER_DAY, POINTS.STREAK_BONUS_CAP);
      break;
    case 'SHARE_CREATED':
      // Check if user already got share points today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const shareEventsToday = await prisma.leaderboardEvent.count({
        where: {
          userId,
          eventType: 'SHARE_CREATED',
          createdAt: { gte: today },
        },
      });
      if (shareEventsToday >= POINTS.SHARE_CAP_PER_DAY) {
        return 0; // Already reached daily cap
      }
      pointsToAward = POINTS.SHARE_CREATED;
      break;
  }
  
  if (pointsToAward > 0) {
    // Create leaderboard event
    await prisma.leaderboardEvent.create({
      data: {
        userId,
        challengeInstanceId,
        eventType,
        pointsAwarded: pointsToAward,
        metadata: (metadata || {}) as Prisma.InputJsonValue,
      },
    });
  }
  
  return pointsToAward;
}

export async function updateChallengeStats(
  userId: string,
  templateId: string,
  params: {
    daysCompleted?: number;
    challengeCompleted?: boolean;
    currentStreak?: number;
    pointsEarned?: number;
  }
): Promise<void> {
  const { daysCompleted, challengeCompleted, currentStreak, pointsEarned } = params;
  
  // Get or create stats record
  let stats = await prisma.challengeStats.findUnique({
    where: {
      userId_templateId: { userId, templateId },
    },
  });
  
  const now = new Date();
  
  // Check if weekly reset is needed (Monday 00:00 UTC)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    d.setUTCDate(diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  };
  
  const currentWeekStart = getWeekStart(now);
  
  if (!stats) {
    stats = await prisma.challengeStats.create({
      data: {
        userId,
        templateId,
        totalDaysCompleted: 0,
        currentStreakDays: 0,
        bestStreakDays: 0,
        challengeCompletedCount: 0,
        pointsTotal: 0,
        pointsWeekly: 0,
        weeklyResetAt: currentWeekStart,
      },
    });
  }
  
  // Reset weekly points if needed
  let weeklyPoints = stats.pointsWeekly;
  if (!stats.weeklyResetAt || stats.weeklyResetAt < currentWeekStart) {
    weeklyPoints = 0;
  }
  
  // Calculate updates
  const updates: Record<string, unknown> = {
    weeklyResetAt: currentWeekStart,
  };
  
  if (daysCompleted) {
    updates.totalDaysCompleted = stats.totalDaysCompleted + daysCompleted;
    updates.lastCompletedAt = now;
  }
  
  if (challengeCompleted) {
    updates.challengeCompletedCount = stats.challengeCompletedCount + 1;
  }
  
  if (currentStreak !== undefined) {
    updates.currentStreakDays = currentStreak;
    if (currentStreak > stats.bestStreakDays) {
      updates.bestStreakDays = currentStreak;
    }
  }
  
  if (pointsEarned) {
    updates.pointsTotal = stats.pointsTotal + pointsEarned;
    updates.pointsWeekly = weeklyPoints + pointsEarned;
  }
  
  await prisma.challengeStats.update({
    where: { id: stats.id },
    data: updates,
  });
}

export function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

export function generateAvatarSeed(): string {
  return Math.random().toString(36).substring(2, 10);
}
