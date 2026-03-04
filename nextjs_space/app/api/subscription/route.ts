import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getUserSubscription,
  getUserPlan,
  getRemainingTrialDays,
  checkUsageLimit,
  PRICING,
  FEATURES,
  FREE_LIMITS,
} from '@/lib/subscription';

export const dynamic = 'force-dynamic';

// GET - Fetch user's subscription status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const subscription = await getUserSubscription(userId);
    const plan = await getUserPlan(userId);
    const trialDaysRemaining = await getRemainingTrialDays(userId);

    // Get usage limits for free users
    const [mealPlanUsage, aiChatUsage, challengeUsage] = await Promise.all([
      checkUsageLimit(userId, 'mealPlans'),
      checkUsageLimit(userId, 'aiChats'),
      checkUsageLimit(userId, 'challenges'),
    ]);

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
        canceledAt: subscription.canceledAt,
      },
      plan,
      trialDaysRemaining,
      isPro: plan === 'pro',
      isTrialing: subscription.status === 'trialing',
      hasUsedTrial: !!subscription.trialStart,
      usage: {
        mealPlans: mealPlanUsage,
        aiChats: aiChatUsage,
        challenges: challengeUsage,
      },
      limits: FREE_LIMITS,
      features: FEATURES,
      pricing: PRICING,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
