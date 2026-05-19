import Stripe from 'stripe';

// Direct initialization - safe because this module is only imported
// in server-side API routes where STRIPE_SECRET_KEY is available
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    _stripe = new Stripe(key, {
      typescript: true,
    });
  }
  return _stripe;
}

// Price IDs stored in env after setup
export function getStripePrices() {
  return {
    proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    proYearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
  };
}
