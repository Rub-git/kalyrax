/**
 * Stripe Product/Price Setup Script
 * Run: cd nextjs_space && npx tsx --require dotenv/config scripts/stripe-setup.ts
 * 
 * Creates:
 * - Kalyrax Pro product
 * - Monthly price: $9.99/month
 * - Yearly price: $79.00/year
 */
import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
});

async function setup() {
  console.log('🔧 Setting up Stripe products and prices...\n');

  // Check if products already exist by searching
  const existingProducts = await stripe.products.list({ limit: 100 });
  let proProduct = existingProducts.data.find(p => p.metadata?.app === 'kalyrax' && p.metadata?.plan === 'pro');

  if (!proProduct) {
    // Create the Pro product
    proProduct = await stripe.products.create({
      name: 'Kalyrax Pro',
      description: 'Unlock all premium nutrition features including unlimited meal plans, advanced AI coaching, personalized recipes, and detailed analytics.',
      metadata: {
        app: 'kalyrax',
        plan: 'pro',
      },
    });
    console.log(`✅ Created product: ${proProduct.name} (${proProduct.id})`);
  } else {
    console.log(`ℹ️  Product already exists: ${proProduct.name} (${proProduct.id})`);
  }

  // Check existing prices
  const existingPrices = await stripe.prices.list({
    product: proProduct.id,
    active: true,
    limit: 100,
  });

  let monthlyPrice = existingPrices.data.find(
    p => p.recurring?.interval === 'month' && p.unit_amount === 999
  );
  let yearlyPrice = existingPrices.data.find(
    p => p.recurring?.interval === 'year' && p.unit_amount === 7900
  );

  if (!monthlyPrice) {
    monthlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 999, // $9.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 7,
      },
      metadata: {
        app: 'kalyrax',
        plan: 'pro',
        cycle: 'monthly',
      },
    });
    console.log(`✅ Created monthly price: $9.99/month (${monthlyPrice.id})`);
  } else {
    console.log(`ℹ️  Monthly price already exists: (${monthlyPrice.id})`);
  }

  if (!yearlyPrice) {
    yearlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 7900, // $79.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'year',
        trial_period_days: 7,
      },
      metadata: {
        app: 'kalyrax',
        plan: 'pro',
        cycle: 'yearly',
      },
    });
    console.log(`✅ Created yearly price: $79.00/year (${yearlyPrice.id})`);
  } else {
    console.log(`ℹ️  Yearly price already exists: (${yearlyPrice.id})`);
  }

  // Update .env file
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  const updateEnv = (key: string, value: string) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  };

  updateEnv('STRIPE_PRICE_PRO_MONTHLY', monthlyPrice.id);
  updateEnv('STRIPE_PRICE_PRO_YEARLY', yearlyPrice.id);
  updateEnv('STRIPE_PRODUCT_PRO', proProduct.id);

  fs.writeFileSync(envPath, envContent);

  console.log('\n📋 Environment variables updated:');
  console.log(`  STRIPE_PRODUCT_PRO=${proProduct.id}`);
  console.log(`  STRIPE_PRICE_PRO_MONTHLY=${monthlyPrice.id}`);
  console.log(`  STRIPE_PRICE_PRO_YEARLY=${yearlyPrice.id}`);
  console.log('\n✅ Stripe setup complete!');
  console.log('\n⚠️  Next steps:');
  console.log('  1. Set up the webhook in Stripe Dashboard:');
  console.log('     URL: https://kalyrax.com/api/stripe/webhook');
  console.log('     Events: checkout.session.completed, customer.subscription.updated,');
  console.log('             customer.subscription.deleted, invoice.paid, invoice.payment_failed');
  console.log('  2. Add STRIPE_WEBHOOK_SECRET to .env');
  console.log('  3. Configure Customer Portal in Stripe Dashboard:');
  console.log('     https://dashboard.stripe.com/settings/billing/portal');
}

setup().catch(console.error);
