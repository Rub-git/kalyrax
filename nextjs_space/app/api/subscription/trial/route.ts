import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { startFreeTrial } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

// POST - Start a free trial
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const billingCycle = body.billingCycle === 'yearly' ? 'yearly' : 'monthly';

    const subscription = await startFreeTrial(userId, billingCycle);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start trial';
    console.error('Error starting trial:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
