import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { trackSubscriptionEvent } from '@/lib/subscription';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Disable body parsing - we need the raw body for signature verification
export const runtime = 'nodejs';

async function getRawBody(request: NextRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = request.body?.getReader();
  if (!reader) throw new Error('No body');
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(request);
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] No signature header');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret) {
      // Verify signature in production
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // In development without webhook secret, parse the event directly
      console.warn('[Stripe Webhook] No STRIPE_WEBHOOK_SECRET set - skipping signature verification');
      event = JSON.parse(rawBody.toString()) as Stripe.Event;
    }
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, error);
    // Return 200 to prevent Stripe from retrying
    return NextResponse.json({ received: true, error: error.message });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('[Stripe Webhook] No userId in checkout session metadata');
    return;
  }

  const billingCycle = session.metadata?.billingCycle || 'monthly';
  const stripeSubscriptionId = session.subscription as string;
  const stripeCustomerId = session.customer as string;

  console.log(`[Stripe Webhook] Checkout completed for user ${userId}, subscription: ${stripeSubscriptionId}`);

  // Get subscription details from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  const now = new Date();
  const currentPeriodEnd = new Date((stripeSubscription as any).current_period_end * 1000);
  const isTrialing = stripeSubscription.status === 'trialing';

  // Update our database
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      planType: 'pro',
      status: isTrialing ? 'trialing' : 'active',
      billingCycle,
      stripeCustomerId,
      stripeSubscriptionId,
      trialStart: isTrialing ? now : undefined,
      trialEnd: isTrialing && (stripeSubscription as any).trial_end
        ? new Date((stripeSubscription as any).trial_end * 1000)
        : undefined,
      currentPeriodStart: now,
      currentPeriodEnd,
    },
    create: {
      userId,
      planType: 'pro',
      status: isTrialing ? 'trialing' : 'active',
      billingCycle,
      stripeCustomerId,
      stripeSubscriptionId,
      trialStart: isTrialing ? now : undefined,
      trialEnd: isTrialing && (stripeSubscription as any).trial_end
        ? new Date((stripeSubscription as any).trial_end * 1000)
        : undefined,
      currentPeriodStart: now,
      currentPeriodEnd,
    },
  });

  // Track the event
  await trackSubscriptionEvent(
    userId,
    isTrialing ? 'trial_started' : 'subscription_started',
    'pro',
    billingCycle,
    'stripe_checkout'
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    // Try to find user by Stripe customer ID
    const dbSub = await prisma.subscription.findFirst({
      where: { stripeCustomerId: subscription.customer as string },
    });
    if (!dbSub) {
      console.error('[Stripe Webhook] Cannot find user for subscription update');
      return;
    }
    return handleSubscriptionUpdateForUser(dbSub.userId, subscription);
  }
  return handleSubscriptionUpdateForUser(userId, subscription);
}

async function handleSubscriptionUpdateForUser(userId: string, subscription: Stripe.Subscription) {
  const status = mapStripeStatus(subscription.status);
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
  const isTrialing = subscription.status === 'trialing';

  console.log(`[Stripe Webhook] Subscription updated for user ${userId}: status=${status}`);

  await prisma.subscription.update({
    where: { userId },
    data: {
      planType: status === 'canceled' || status === 'expired' ? 'free' : 'pro',
      status,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd,
      trialEnd: isTrialing && (subscription as any).trial_end
        ? new Date((subscription as any).trial_end * 1000)
        : undefined,
      canceledAt: subscription.cancel_at_period_end ? new Date() : null,
    },
  });

  await trackSubscriptionEvent(userId, 'subscription_updated', 'pro', undefined, 'stripe_webhook', {
    stripeStatus: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const dbSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!dbSub) {
    console.error('[Stripe Webhook] Cannot find subscription for deleted event');
    return;
  }

  console.log(`[Stripe Webhook] Subscription deleted for user ${dbSub.userId}`);

  await prisma.subscription.update({
    where: { id: dbSub.id },
    data: {
      planType: 'free',
      status: 'canceled',
      stripeSubscriptionId: null,
      canceledAt: new Date(),
    },
  });

  await trackSubscriptionEvent(dbSub.userId, 'subscription_canceled', 'pro', undefined, 'stripe_webhook');
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const dbSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!dbSub) return;

  console.log(`[Stripe Webhook] Invoice paid for user ${dbSub.userId}`);

  // Ensure subscription is active
  if (dbSub.status !== 'active' && dbSub.status !== 'trialing') {
    await prisma.subscription.update({
      where: { id: dbSub.id },
      data: {
        planType: 'pro',
        status: 'active',
      },
    });
  }

  await trackSubscriptionEvent(dbSub.userId, 'invoice_paid', 'pro', undefined, 'stripe_webhook', {
    invoiceId: invoice.id,
    amountPaid: invoice.amount_paid,
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const dbSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!dbSub) return;

  console.log(`[Stripe Webhook] Invoice payment failed for user ${dbSub.userId}`);

  await prisma.subscription.update({
    where: { id: dbSub.id },
    data: {
      status: 'past_due',
    },
  });

  await trackSubscriptionEvent(dbSub.userId, 'payment_failed', 'pro', undefined, 'stripe_webhook', {
    invoiceId: invoice.id,
  });
}

function mapStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'canceled';
    case 'incomplete':
    case 'incomplete_expired':
      return 'expired';
    default:
      return 'active';
  }
}
