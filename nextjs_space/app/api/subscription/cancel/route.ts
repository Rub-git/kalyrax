import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { cancelSubscription } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

// POST - Cancel subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const subscription = await cancelSubscription(userId);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        canceledAt: subscription.canceledAt,
      },
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
