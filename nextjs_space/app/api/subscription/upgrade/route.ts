import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { upgradeToP, getUserSubscription, trackSubscriptionEvent } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

// POST - Upgrade to Pro (after payment)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const billingCycle = body.billingCycle === 'yearly' ? 'yearly' : 'monthly';
    
    // In a real implementation, this would verify payment with Stripe
    // For now, we simulate a successful payment
    const subscription = await upgradeToP(userId, billingCycle);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
