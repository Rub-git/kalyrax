import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia' as any,
  typescript: true,
});

// Price IDs will be stored in env after setup
export function getStripePrices() {
  return {
    proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    proYearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
  };
}
