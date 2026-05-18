import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { stripe, getStripePrices } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email!;
    const body = await request.json();
    const billingCycle = body.billingCycle === 'yearly' ? 'yearly' : 'monthly';

    const prices = getStripePrices();
    const priceId = billingCycle === 'yearly' ? prices.proYearly : prices.proMonthly;

    if (!priceId) {
      console.error('Stripe price IDs not configured');
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    let stripeCustomerId = subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      // Check if customer exists in Stripe by email
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          name: session.user.name || undefined,
          metadata: {
            userId,
            app: 'kalyrax',
          },
        });
        stripeCustomerId = customer.id;
      }

      // Save Stripe customer ID
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { stripeCustomerId },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId,
            planType: 'free',
            status: 'active',
            stripeCustomerId,
          },
        });
      }
    }

    // Build dynamic URLs from request origin
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://kalyrax.com';

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        userId,
        billingCycle,
        app: 'kalyrax',
      },
      subscription_data: {
        metadata: {
          userId,
          billingCycle,
          app: 'kalyrax',
        },
      },
      allow_promotion_codes: true,
    });

    console.log(`[Stripe] Checkout session created: ${checkoutSession.id} for user ${userId}`);

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error('[Stripe] Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
