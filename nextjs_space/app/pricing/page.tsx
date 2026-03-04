'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, X, Crown, Sparkles, Zap, Target, ChefHat, BarChart3, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PRICING, FEATURES, FREE_LIMITS } from '@/lib/subscription';

type BillingCycle = 'monthly' | 'yearly';

interface SubscriptionData {
  subscription: {
    planType: string;
    status: string;
    billingCycle: string | null;
    trialEnd: string | null;
    currentPeriodEnd: string | null;
  };
  plan: 'free' | 'pro';
  isPro: boolean;
  isTrialing: boolean;
  hasUsedTrial: boolean;
  trialDaysRemaining: number | null;
}

export default function PricingPage() {
  const { t, language } = useLanguage();
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [status]);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    if (!session) {
      router.push('/signup?redirect=/pricing');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/subscription/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle }),
      });

      if (res.ok) {
        await fetchSubscription();
        router.push('/dashboard');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to start trial');
      }
    } catch (error) {
      console.error('Error starting trial:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!session) {
      router.push('/signup?redirect=/pricing');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle }),
      });

      if (res.ok) {
        await fetchSubscription();
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error upgrading:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const yearlySavings = Math.round((1 - PRICING.pro.yearly / (PRICING.pro.monthly * 12)) * 100);

  const freeFeatures = [
    { key: 'nutritionCalculator', icon: Target },
    { key: 'weeklyMealPlan', icon: ChefHat },
    { key: 'shoppingList', icon: Check },
    { key: 'challengeParticipation', icon: Zap },
    { key: 'streakSystem', icon: Target },
    { key: 'basicAICoach', icon: Sparkles },
  ];

  const proFeatures = [
    { key: 'adaptiveCalorieAdjustments', icon: BarChart3 },
    { key: 'unlimitedMealPlanGeneration', icon: ChefHat },
    { key: 'advancedAICoach', icon: Sparkles },
    { key: 'personalizedRecipes', icon: ChefHat },
    { key: 'premiumChallenges', icon: Crown },
    { key: 'detailedProgressAnalytics', icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
              {t('pricing')}
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {language === 'en'
              ? 'Unlock your full nutrition potential with Kalyrax Pro'
              : 'Desbloquea tu potencial nutricional completo con Kalyrax Pro'}
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1 flex gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-700'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {t('monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-700'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {t('yearly')}
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                -{yearlySavings}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full border-2 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-2">
                  {t('freePlan')}
                  {subscription?.plan === 'free' && !subscription.isTrialing && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                      {t('currentPlan')}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {language === 'en'
                    ? 'Get started with essential nutrition tools'
                    : 'Comienza con herramientas esenciales de nutrición'}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-500">{t('perMonth')}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {freeFeatures.map((feature) => (
                    <div key={feature.key} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                        <Check className="w-3 h-3 text-blue-700" />
                      </div>
                      <span className="text-sm">{t(`feature_${feature.key}`)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mb-4 space-y-1">
                  <p>• {FREE_LIMITS.mealPlansPerMonth} {language === 'en' ? 'meal plans/month' : 'planes/mes'}</p>
                  <p>• {FREE_LIMITS.aiChatsPerDay} {language === 'en' ? 'AI chats/day' : 'chats IA/día'}</p>
                  <p>• {FREE_LIMITS.challengesPerMonth} {language === 'en' ? 'challenges/month' : 'retos/mes'}</p>
                </div>
                {!session && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/signup')}
                  >
                    {t('getStartedFree')}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full border-2 border-blue-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                {t('mostPopular')}
              </div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  {t('proPlan')}
                  {subscription?.isPro && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-950/30 text-blue-800 px-2 py-1 rounded-full">
                      {subscription.isTrialing ? t('trialActive') : t('proActive')}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {language === 'en'
                    ? 'Unlock all premium features'
                    : 'Desbloquea todas las funciones premium'}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${billingCycle === 'yearly'
                      ? (PRICING.pro.yearly / 12).toFixed(2)
                      : PRICING.pro.monthly}
                  </span>
                  <span className="text-gray-500">{t('perMonth')}</span>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-gray-500 mt-1">
                      {t('billedYearly')} (${PRICING.pro.yearly})
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {t('everythingInFree')}
                </p>
                <div className="space-y-3 mb-6">
                  {proFeatures.map((feature) => (
                    <div key={feature.key} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium">{t(`feature_${feature.key}`)}</span>
                    </div>
                  ))}
                </div>
                
                {!subscription?.isPro && !subscription?.hasUsedTrial && (
                  <Button
                    className="w-full bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700"
                    onClick={handleStartTrial}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {t('startFreeTrial')}
                  </Button>
                )}

                {!subscription?.isPro && subscription?.hasUsedTrial && (
                  <Button
                    className="w-full bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700"
                    onClick={handleUpgrade}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    {t('upgradeToPro')}
                  </Button>
                )}

                {subscription?.isTrialing && subscription.trialDaysRemaining !== null && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {t('trialEndsIn').replace('{days}', String(subscription.trialDaysRemaining))}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2 text-amber-700 border-amber-300"
                      onClick={handleUpgrade}
                      disabled={actionLoading}
                    >
                      {language === 'en' ? 'Upgrade Now' : 'Actualizar Ahora'}
                    </Button>
                  </div>
                )}

                {subscription?.isPro && !subscription.isTrialing && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/profile')}
                  >
                    {t('manageSubscription')}
                  </Button>
                )}

                <p className="text-xs text-center text-gray-500 mt-4">
                  {t('cancelAnytime')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* FAQ / Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold mb-6">
            {language === 'en' ? 'Frequently Asked Questions' : 'Preguntas Frecuentes'}
          </h2>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h3 className="font-medium mb-2">
                {language === 'en' ? 'What happens after the trial?' : '¿Qué pasa después de la prueba?'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'en'
                  ? 'After your 7-day trial, you can choose to subscribe or continue with the free plan. No automatic charges.'
                  : 'Después de tu prueba de 7 días, puedes elegir suscribirte o continuar con el plan gratis. Sin cargos automáticos.'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h3 className="font-medium mb-2">
                {language === 'en' ? 'Can I cancel anytime?' : '¿Puedo cancelar en cualquier momento?'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'en'
                  ? 'Yes! You can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.'
                  : '¡Sí! Puedes cancelar tu suscripción en cualquier momento. Continuarás teniendo acceso hasta el final de tu período de facturación.'}
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
