import { prisma } from './db';

export type GrowthEventType =
  | 'PLAN_GENERATED'
  | 'CHALLENGE_STARTED'
  | 'DAY_COMPLETED'
  | 'CHALLENGE_COMPLETED'
  | 'SHARE_CREATED'
  | 'SHARE_CLICKED'
  | 'USER_REGISTERED';

export interface GrowthEventData {
  userId?: string;
  sessionId?: string;
  eventType: GrowthEventType;
  sourceSlug?: string;
  metadata?: Record<string, unknown>;
}

// Track a growth event
export async function trackGrowthEvent(data: GrowthEventData): Promise<void> {
  try {
    await prisma.growthEvent.create({
      data: {
        userId: data.userId || null,
        sessionId: data.sessionId || null,
        eventType: data.eventType,
        sourceSlug: data.sourceSlug || null,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
    });
  } catch (error) {
    console.error('Error tracking growth event:', error);
  }
}

// Get analytics metrics for a time period
export interface GrowthMetrics {
  totalPlansGenerated: number;
  totalChallengesStarted: number;
  totalChallengesCompleted: number;
  totalSharesCreated: number;
  totalShareClicks: number;
  totalUsersRegistered: number;
  activationRate: number; // % of plan generations that start a challenge
  challengeCompletionRate: number; // % of started challenges that complete
  shareRate: number; // % of challenge starts that create a share
  viralCoefficient: number; // New users per share
}

export async function getGrowthMetrics(days: number = 30): Promise<GrowthMetrics> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const events = await prisma.growthEvent.groupBy({
    by: ['eventType'],
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    _count: {
      eventType: true,
    },
  });

  const eventCounts: Record<string, number> = {};
  events.forEach((e) => {
    eventCounts[e.eventType] = e._count.eventType;
  });

  const totalPlansGenerated = eventCounts['PLAN_GENERATED'] || 0;
  const totalChallengesStarted = eventCounts['CHALLENGE_STARTED'] || 0;
  const totalChallengesCompleted = eventCounts['CHALLENGE_COMPLETED'] || 0;
  const totalSharesCreated = eventCounts['SHARE_CREATED'] || 0;
  const totalShareClicks = eventCounts['SHARE_CLICKED'] || 0;
  const totalUsersRegistered = eventCounts['USER_REGISTERED'] || 0;

  // Calculate rates
  const activationRate = totalPlansGenerated > 0
    ? (totalChallengesStarted / totalPlansGenerated) * 100
    : 0;
  const challengeCompletionRate = totalChallengesStarted > 0
    ? (totalChallengesCompleted / totalChallengesStarted) * 100
    : 0;
  const shareRate = totalChallengesStarted > 0
    ? (totalSharesCreated / totalChallengesStarted) * 100
    : 0;

  // Calculate viral coefficient: new users from shares / total shares
  const usersFromShares = await prisma.growthEvent.count({
    where: {
      eventType: 'USER_REGISTERED',
      sourceSlug: { not: null },
      createdAt: { gte: startDate },
    },
  });
  const viralCoefficient = totalSharesCreated > 0
    ? usersFromShares / totalSharesCreated
    : 0;

  return {
    totalPlansGenerated,
    totalChallengesStarted,
    totalChallengesCompleted,
    totalSharesCreated,
    totalShareClicks,
    totalUsersRegistered,
    activationRate,
    challengeCompletionRate,
    shareRate,
    viralCoefficient,
  };
}

// Get daily event counts for charts
export async function getDailyEventCounts(
  eventTypes: GrowthEventType[],
  days: number = 30
): Promise<Record<string, { date: string; count: number }[]>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const events = await prisma.growthEvent.findMany({
    where: {
      eventType: { in: eventTypes },
      createdAt: { gte: startDate },
    },
    select: {
      eventType: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Group by event type and date
  const grouped: Record<string, Record<string, number>> = {};
  eventTypes.forEach((type) => {
    grouped[type] = {};
  });

  events.forEach((event) => {
    const date = event.createdAt.toISOString().split('T')[0];
    if (!grouped[event.eventType][date]) {
      grouped[event.eventType][date] = 0;
    }
    grouped[event.eventType][date]++;
  });

  // Convert to array format
  const result: Record<string, { date: string; count: number }[]> = {};
  Object.keys(grouped).forEach((type) => {
    result[type] = Object.keys(grouped[type]).map((date) => ({
      date,
      count: grouped[type][date],
    }));
  });

  return result;
}

// Get viral funnel data
export async function getViralFunnel(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [plansGenerated, challengesStarted, sharesCreated, shareClicks, conversions] =
    await Promise.all([
      prisma.growthEvent.count({
        where: { eventType: 'PLAN_GENERATED', createdAt: { gte: startDate } },
      }),
      prisma.growthEvent.count({
        where: { eventType: 'CHALLENGE_STARTED', createdAt: { gte: startDate } },
      }),
      prisma.growthEvent.count({
        where: { eventType: 'SHARE_CREATED', createdAt: { gte: startDate } },
      }),
      prisma.growthEvent.count({
        where: { eventType: 'SHARE_CLICKED', createdAt: { gte: startDate } },
      }),
      prisma.growthEvent.count({
        where: {
          eventType: 'USER_REGISTERED',
          sourceSlug: { not: null },
          createdAt: { gte: startDate },
        },
      }),
    ]);

  return [
    { stage: 'Plan Generated', count: plansGenerated },
    { stage: 'Challenge Started', count: challengesStarted },
    { stage: 'Share Created', count: sharesCreated },
    { stage: 'Share Clicked', count: shareClicks },
    { stage: 'New User (from share)', count: conversions },
  ];
}
