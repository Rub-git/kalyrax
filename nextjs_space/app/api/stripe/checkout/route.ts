import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getStripe, getStripePrices } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[Stripe Checkout] POST called');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('[Stripe Checkout] Session:', session?.user?.email || 'none');
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email!;
    
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      console.error('[Stripe Checkout] Failed to parse body:', e);
      body = {};
    }
    
    const billingCycle = body.billingCycle === 'yearly' ? 'yearly' : 'monthly';
    console.log('[Stripe Checkout] billingCycle:', billingCycle, 'userId:', userId);

    const prices = getStripePrices();
    const priceId = billingCycle === 'yearly' ? prices.proYearly : prices.proMonthly;
    console.log('[Stripe Checkout] priceId:', priceId);

    if (!priceId) {
      console.error('[Stripe Checkout] Price IDs not configured. MONTHLY:', process.env.STRIPE_PRICE_PRO_MONTHLY, 'YEARLY:', process.env.STRIPE_PRICE_PRO_YEARLY);
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    console.log('[Stripe Checkout] Existing subscription:', subscription?.id, 'stripeCustomerId:', subscription?.stripeCustomerId);

    let stripeCustomerId = subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      console.log('[Stripe Checkout] Creating/finding Stripe customer for', userEmail);
      const existingCustomers = await getStripe().customers.list({
        email: userEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
        console.log('[Stripe Checkout] Found existing customer:', stripeCustomerId);
      } else {
        const customer = await getStripe().customers.create({
          email: userEmail,
          name: session.user.name || undefined,
          metadata: { userId, app: 'kalyrax' },
        });
        stripeCustomerId = customer.id;
        console.log('[Stripe Checkout] Created new customer:', stripeCustomerId);
      }

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { stripeCustomerId },
        });
      } else {
        await prisma.subscription.create({
          data: { userId, planType: 'free', status: 'active', stripeCustomerId },
        });
      }
    }

    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://kalyrax.com';
    console.log('[Stripe Checkout] Origin:', origin);

    // Check if customer already has an active subscription in Stripe
    const existingSubs = await getStripe().subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });
    
    if (existingSubs.data.length > 0) {
      console.log('[Stripe Checkout] Customer already has active subscription, opening portal instead');
      const portalSession = await getStripe().billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${origin}/dashboard`,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    // Also check for trialing subscriptions
    const trialingSubs = await getStripe().subscriptions.list({
      customer: stripeCustomerId,
      status: 'trialing',
      limit: 1,
    });
    
    if (trialingSubs.data.length > 0) {
      console.log('[Stripe Checkout] Customer already has trialing subscription, opening portal instead');
      const portalSession = await getStripe().billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${origin}/dashboard`,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    console.log('[Stripe Checkout] Creating checkout session...');
    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: { userId, billingCycle, app: 'kalyrax' },
      subscription_data: {
        metadata: { userId, billingCycle, app: 'kalyrax' },
      },
      allow_promotion_codes: true,
    });

    console.log(`[Stripe Checkout] Session created: ${checkoutSession.id}, url: ${checkoutSession.url?.substring(0, 50)}...`);

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error('[Stripe Checkout] ERROR:', error?.message || error);
    console.error('[Stripe Checkout] Type:', error?.type, 'Code:', error?.code);
    console.error('[Stripe Checkout] Stack:', error?.stack?.substring(0, 500));
    console.error('[Stripe Checkout] Env check - SK:', !!process.env.STRIPE_SECRET_KEY, 'MONTHLY:', !!process.env.STRIPE_PRICE_PRO_MONTHLY, 'YEARLY:', !!process.env.STRIPE_PRICE_PRO_YEARLY);
    
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
