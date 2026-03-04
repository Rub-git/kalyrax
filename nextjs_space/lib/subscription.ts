// Subscription service with feature gating
import { prisma } from './db';

// Plan types
export type PlanType = 'free' | 'pro';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';

// Pricing configuration
export const PRICING = {
  pro: {
    monthly: 9.99,
    yearly: 79.00,
    yearlySavings: 40.88, // 12 * 9.99 - 79
  },
  trialDays: 7,
} as const;

// Feature definitions
export const FEATURES = {
  // Free features
  nutritionCalculator: { free: true, pro: true },
  weeklyMealPlan: { free: true, pro: true },
  shoppingList: { free: true, pro: true },
  challengeParticipation: { free: true, pro: true },
  streakSystem: { free: true, pro: true },
  basicAICoach: { free: true, pro: true },
  
  // Pro features
  adaptiveCalorieAdjustments: { free: false, pro: true },
  unlimitedMealPlanGeneration: { free: false, pro: true },
  advancedAICoach: { free: false, pro: true },
  personalizedRecipes: { free: false, pro: true },
  premiumChallenges: { free: false, pro: true },
  detailedProgressAnalytics: { free: false, pro: true },
  prioritySupport: { free: false, pro: true },
} as const;

export type FeatureKey = keyof typeof FEATURES;

// Free tier limits
export const FREE_LIMITS = {
  mealPlansPerMonth: 2,
  aiChatsPerDay: 5,
  challengesPerMonth: 2,
} as const;

// Get user subscription status
export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    // Create a free subscription for new users
    return await prisma.subscription.create({
      data: {
        userId,
        planType: 'free',
        status: 'active',
      },
    });
  }

  // Check if trial has expired
  if (subscription.status === 'trialing' && subscription.trialEnd) {
    if (new Date() > subscription.trialEnd) {
      // Trial expired - downgrade to free
      return await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planType: 'free',
          status: 'active',
          trialEnd: null,
        },
      });
    }
  }

  // Check if subscription has expired
  if (subscription.currentPeriodEnd && subscription.status === 'active') {
    if (new Date() > subscription.currentPeriodEnd) {
      return await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'expired',
          planType: 'free',
        },
      });
    }
  }

  return subscription;
}

// Check if user has access to a feature
export async function hasFeatureAccess(userId: string, feature: FeatureKey): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  const plan = getEffectivePlan(subscription);
  return FEATURES[feature][plan];
}

// Get effective plan (considering trial status)
function getEffectivePlan(subscription: { planType: string; status: string }): 'free' | 'pro' {
  if (subscription.status === 'trialing') {
    return 'pro';
  }
  if (subscription.planType === 'pro' && subscription.status === 'active') {
    return 'pro';
  }
  return 'free';
}

// Check feature access synchronously from subscription object
export function checkFeatureAccess(
  subscription: { planType: string; status: string } | null,
  feature: FeatureKey
): boolean {
  if (!subscription) return FEATURES[feature].free;
  const plan = getEffectivePlan(subscription);
  return FEATURES[feature][plan];
}

// Get user's effective plan
export async function getUserPlan(userId: string): Promise<'free' | 'pro'> {
  const subscription = await getUserSubscription(userId);
  return getEffectivePlan(subscription);
}

// Check if user is on trial
export async function isOnTrial(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription.status === 'trialing';
}

// Get remaining trial days
export async function getRemainingTrialDays(userId: string): Promise<number | null> {
  const subscription = await getUserSubscription(userId);
  if (subscription.status !== 'trialing' || !subscription.trialEnd) {
    return null;
  }
  const remaining = Math.ceil(
    (subscription.trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, remaining);
}

// Start a free trial
export async function startFreeTrial(userId: string, billingCycle: BillingCycle = 'monthly') {
  const subscription = await getUserSubscription(userId);
  
  // Check if user has already used a trial
  if (subscription.trialStart) {
    throw new Error('Free trial has already been used');
  }

  const now = new Date();
  const trialEnd = new Date(now.getTime() + PRICING.trialDays * 24 * 60 * 60 * 1000);

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      planType: 'pro',
      status: 'trialing',
      billingCycle,
      trialStart: now,
      trialEnd,
    },
  });

  // Track analytics
  await trackSubscriptionEvent(userId, 'trial_started', 'pro', billingCycle);

  return updated;
}

// Upgrade to pro (after trial or directly)
export async function upgradeToP(userId: string, billingCycle: BillingCycle) {
  const subscription = await getUserSubscription(userId);
  const now = new Date();
  
  let periodEnd: Date;
  if (billingCycle === 'yearly') {
    periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  } else {
    periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const wasTrialing = subscription.status === 'trialing';

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      planType: 'pro',
      status: 'active',
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  // Track analytics
  if (wasTrialing) {
    await trackSubscriptionEvent(userId, 'trial_converted', 'pro', billingCycle);
  } else {
    await trackSubscriptionEvent(userId, 'subscription_started', 'pro', billingCycle);
  }

  return updated;
}

// Cancel subscription
export async function cancelSubscription(userId: string) {
  const subscription = await getUserSubscription(userId);
  
  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  await trackSubscriptionEvent(userId, 'subscription_canceled', subscription.planType, subscription.billingCycle || undefined);

  return updated;
}

// Track subscription analytics event
export async function trackSubscriptionEvent(
  userId: string | null,
  eventType: string,
  planType?: string,
  billingCycle?: string,
  source?: string,
  metadata?: object
) {
  return prisma.subscriptionEvent.create({
    data: {
      userId,
      eventType,
      planType,
      billingCycle,
      source,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });
}

// Track upgrade prompt shown
export async function trackUpgradePrompt(
  userId: string,
  source: string,
  clicked: boolean = false
) {
  return trackSubscriptionEvent(
    userId,
    clicked ? 'upgrade_prompt_clicked' : 'upgrade_prompt_shown',
    undefined,
    undefined,
    source
  );
}

// Check usage limits for free tier
export async function checkUsageLimit(
  userId: string,
  limitType: 'mealPlans' | 'aiChats' | 'challenges'
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
  const subscription = await getUserSubscription(userId);
  const plan = getEffectivePlan(subscription);

  // Pro users have unlimited access
  if (plan === 'pro') {
    return { allowed: true, used: 0, limit: Infinity, remaining: Infinity };
  }

  const now = new Date();
  
  switch (limitType) {
    case 'mealPlans': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const count = await prisma.mealPlan.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      });
      return {
        allowed: count < FREE_LIMITS.mealPlansPerMonth,
        used: count,
        limit: FREE_LIMITS.mealPlansPerMonth,
        remaining: Math.max(0, FREE_LIMITS.mealPlansPerMonth - count),
      };
    }
    case 'aiChats': {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const count = await prisma.chatMessage.count({
        where: {
          session: { userId },
          role: 'user',
          createdAt: { gte: startOfDay },
        },
      });
      return {
        allowed: count < FREE_LIMITS.aiChatsPerDay,
        used: count,
        limit: FREE_LIMITS.aiChatsPerDay,
        remaining: Math.max(0, FREE_LIMITS.aiChatsPerDay - count),
      };
    }
    case 'challenges': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const count = await prisma.challengeInstance.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      });
      return {
        allowed: count < FREE_LIMITS.challengesPerMonth,
        used: count,
        limit: FREE_LIMITS.challengesPerMonth,
        remaining: Math.max(0, FREE_LIMITS.challengesPerMonth - count),
      };
    }
    default:
      return { allowed: true, used: 0, limit: Infinity, remaining: Infinity };
  }
}

// Get subscription analytics for user
export async function getSubscriptionAnalytics(userId?: string) {
  const whereClause = userId ? { userId } : {};

  const [totalTrials, trialConversions, activeSubscriptions, canceledSubscriptions] = await Promise.all([
    prisma.subscriptionEvent.count({ where: { ...whereClause, eventType: 'trial_started' } }),
    prisma.subscriptionEvent.count({ where: { ...whereClause, eventType: 'trial_converted' } }),
    prisma.subscription.count({ where: { ...whereClause, planType: 'pro', status: 'active' } }),
    prisma.subscriptionEvent.count({ where: { ...whereClause, eventType: 'subscription_canceled' } }),
  ]);

  return {
    totalTrials,
    trialConversions,
    conversionRate: totalTrials > 0 ? (trialConversions / totalTrials) * 100 : 0,
    activeSubscriptions,
    canceledSubscriptions,
  };
}
