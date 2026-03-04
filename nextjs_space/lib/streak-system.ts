import prisma from './db';
import { Prisma } from '@prisma/client';

// Streak event types
export type StreakEventType = 
  | 'DAY_COMPLETED' 
  | 'AI_INTERACTION' 
  | 'PLAN_VIEW' 
  | 'STREAK_FREEZE_USED' 
  | 'STREAK_BROKEN';

// Streak milestones
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

// Get user's timezone-aware date
export function getUserDate(timezone?: string): Date {
  const now = new Date();
  if (timezone) {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
      const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(now);
      const year = parseInt(parts.find(p => p.type === 'year')?.value || '2024');
      const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1;
      const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
      return new Date(Date.UTC(year, month, day));
    } catch {
      // Fallback to UTC if timezone is invalid
    }
  }
  // Default to UTC date
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Get date string for comparison (YYYY-MM-DD)
export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Calculate days between two dates
export function daysBetween(date1: Date, date2: Date): number {
  const d1 = new Date(Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate()));
  const d2 = new Date(Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate()));
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Get or create user streak record
export async function getOrCreateUserStreak(userId: string) {
  let streak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!streak) {
    streak = await prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 0,
        bestStreak: 0,
        streakFreezesAvailable: 2,
        freezesResetAt: getNextMonthReset(),
      },
    });
  }

  // Check if freezes need to be reset (monthly)
  if (streak.freezesResetAt && new Date() >= streak.freezesResetAt) {
    streak = await prisma.userStreak.update({
      where: { userId },
      data: {
        streakFreezesAvailable: 2,
        freezesResetAt: getNextMonthReset(),
      },
    });
  }

  return streak;
}

// Get the start of next month for freeze reset
function getNextMonthReset(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

// Record a qualifying action and update streak
export async function recordStreakActivity(
  userId: string,
  eventType: StreakEventType,
  timezone?: string
): Promise<{
  streak: { currentStreak: number; bestStreak: number };
  isNewDay: boolean;
  milestoneReached: number | null;
  freezeUsed: boolean;
}> {
  const userStreak = await getOrCreateUserStreak(userId);
  const today = getUserDate(timezone);
  const todayStr = getDateString(today);
  const lastActivityStr = userStreak.lastActivityDate ? getDateString(userStreak.lastActivityDate) : null;

  // Check if already recorded today
  if (lastActivityStr === todayStr) {
    return {
      streak: { currentStreak: userStreak.currentStreak, bestStreak: userStreak.bestStreak },
      isNewDay: false,
      milestoneReached: null,
      freezeUsed: false,
    };
  }

  let newCurrentStreak = userStreak.currentStreak;
  let freezeUsed = false;
  let streakBroken = false;

  // Check for missed days
  if (userStreak.lastActivityDate) {
    const daysSinceLastActivity = daysBetween(userStreak.lastActivityDate, today);

    if (daysSinceLastActivity > 1) {
      const missedDays = daysSinceLastActivity - 1;
      
      // Can we use freezes?
      if (missedDays <= userStreak.streakFreezesAvailable) {
        // Use freezes for missed days
        await prisma.userStreak.update({
          where: { userId },
          data: {
            streakFreezesAvailable: userStreak.streakFreezesAvailable - missedDays,
          },
        });
        
        // Log freeze usage
        for (let i = 0; i < missedDays; i++) {
          await prisma.streakEvent.create({
            data: {
              userId,
              eventType: 'STREAK_FREEZE_USED',
              streakBefore: newCurrentStreak,
              streakAfter: newCurrentStreak,
              metadata: { missedDay: i + 1 } as Prisma.InputJsonValue,
            },
          });
        }
        freezeUsed = true;
      } else {
        // Streak broken
        await prisma.streakEvent.create({
          data: {
            userId,
            eventType: 'STREAK_BROKEN',
            streakBefore: newCurrentStreak,
            streakAfter: 0,
            metadata: { missedDays } as Prisma.InputJsonValue,
          },
        });
        newCurrentStreak = 0;
        streakBroken = true;
      }
    }
  }

  // Increment streak for today
  newCurrentStreak += 1;
  const newBestStreak = Math.max(newCurrentStreak, userStreak.bestStreak);

  // Check for milestone
  const milestoneReached = STREAK_MILESTONES.includes(newCurrentStreak) ? newCurrentStreak : null;

  // Update streak record
  await prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newCurrentStreak,
      bestStreak: newBestStreak,
      lastActivityDate: today,
    },
  });

  // Log the activity event
  await prisma.streakEvent.create({
    data: {
      userId,
      eventType,
      streakBefore: streakBroken ? 0 : newCurrentStreak - 1,
      streakAfter: newCurrentStreak,
      metadata: milestoneReached ? { milestone: milestoneReached } as Prisma.InputJsonValue : undefined,
    },
  });

  return {
    streak: { currentStreak: newCurrentStreak, bestStreak: newBestStreak },
    isNewDay: true,
    milestoneReached,
    freezeUsed,
  };
}

// Get user's streak info
export async function getUserStreakInfo(userId: string, timezone?: string) {
  const userStreak = await getOrCreateUserStreak(userId);
  const today = getUserDate(timezone);
  const todayStr = getDateString(today);
  const lastActivityStr = userStreak.lastActivityDate ? getDateString(userStreak.lastActivityDate) : null;

  // Check if streak is at risk (missed yesterday)
  let isAtRisk = false;
  let streakExpired = false;
  
  if (userStreak.lastActivityDate) {
    const daysSinceLastActivity = daysBetween(userStreak.lastActivityDate, today);
    
    if (daysSinceLastActivity === 1) {
      // Yesterday was the last activity, streak is at risk today
      isAtRisk = userStreak.currentStreak > 0;
    } else if (daysSinceLastActivity > 1 && userStreak.currentStreak > 0) {
      // More than 1 day missed - check if freezes can save it
      const missedDays = daysSinceLastActivity - 1;
      if (missedDays > userStreak.streakFreezesAvailable) {
        streakExpired = true;
      }
    }
  }

  const completedToday = lastActivityStr === todayStr;

  // Get next milestone
  const nextMilestone = STREAK_MILESTONES.find(m => m > userStreak.currentStreak) || null;
  const daysToNextMilestone = nextMilestone ? nextMilestone - userStreak.currentStreak : null;

  return {
    currentStreak: streakExpired ? 0 : userStreak.currentStreak,
    bestStreak: userStreak.bestStreak,
    streakFreezesAvailable: userStreak.streakFreezesAvailable,
    lastActivityDate: userStreak.lastActivityDate,
    completedToday,
    isAtRisk,
    streakExpired,
    nextMilestone,
    daysToNextMilestone,
  };
}

// Get streak history/events for a user
export async function getStreakHistory(userId: string, limit = 30) {
  const events = await prisma.streakEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return events;
}

// Get milestone badge info
export function getMilestoneBadge(days: number): { name: string; nameEs: string; icon: string; color: string } | null {
  const badges: Record<number, { name: string; nameEs: string; icon: string; color: string }> = {
    3: { name: '3-Day Warrior', nameEs: 'Guerrero de 3 Días', icon: '🔥', color: 'orange' },
    7: { name: 'Week Champion', nameEs: 'Campeón de la Semana', icon: '🏆', color: 'yellow' },
    14: { name: 'Fortnight Fighter', nameEs: 'Luchador de Quincena', icon: '⚡', color: 'purple' },
    30: { name: 'Monthly Master', nameEs: 'Maestro Mensual', icon: '🌟', color: 'gold' },
    60: { name: 'Consistency King', nameEs: 'Rey de la Constancia', icon: '👑', color: 'platinum' },
    100: { name: 'Century Legend', nameEs: 'Leyenda Centenaria', icon: '💎', color: 'diamond' },
  };

  return badges[days] || null;
}

// Get all earned milestones for a user
export function getEarnedMilestones(currentStreak: number, bestStreak: number): number[] {
  return STREAK_MILESTONES.filter(m => bestStreak >= m);
}
