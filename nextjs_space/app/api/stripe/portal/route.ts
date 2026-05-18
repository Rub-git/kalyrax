import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Create a customer portal session for managing subscriptions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get the user's subscription with Stripe customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active Stripe subscription found' },
        { status: 400 }
      );
    }

    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://kalyrax.com';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${origin}/dashboard`,
    });

    console.log(`[Stripe] Portal session created for user ${userId}`);

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('[Stripe] Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
