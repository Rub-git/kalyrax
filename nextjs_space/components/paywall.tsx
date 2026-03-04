'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from './providers';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Crown, Sparkles, X, Lock, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRICING } from '@/lib/subscription';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  source: string;
  limitType?: 'mealPlan' | 'aiChat' | 'challenge';
  remaining?: number;
  limit?: number;
}

export function Paywall({
  isOpen,
  onClose,
  feature,
  source,
  limitType,
  remaining,
  limit,
}: PaywallProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Track that upgrade prompt was shown
      fetch('/api/subscription/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'upgrade_prompt',
          source,
          clicked: false,
        }),
      }).catch(() => {});

      // Check if user has used trial
      fetch('/api/subscription')
        .then((res) => res.json())
        .then((data) => {
          setHasUsedTrial(data.hasUsedTrial || false);
        })
        .catch(() => {});
    }
  }, [isOpen, source]);

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      // Track click
      await fetch('/api/subscription/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'upgrade_prompt',
          source,
          clicked: true,
        }),
      });

      const res = await fetch('/api/subscription/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle: 'monthly' }),
      });

      if (res.ok) {
        onClose();
        window.location.reload();
      } else {
        const data = await res.json();
        if (data.error === 'Free trial has already been used') {
          router.push('/pricing');
        }
      }
    } catch (error) {
      console.error('Error starting trial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPricing = async () => {
    await fetch('/api/subscription/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'upgrade_prompt',
        source,
        clicked: true,
      }),
    }).catch(() => {});

    onClose();
    router.push('/pricing');
  };

  const getLimitMessage = () => {
    if (!limitType) return null;

    switch (limitType) {
      case 'mealPlan':
        return t('mealPlanLimitReached');
      case 'aiChat':
        return t('aiChatLimitReached');
      case 'challenge':
        return t('challengeLimitReached');
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <Card className="border-2 border-blue-500 relative overflow-hidden">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />

            <CardHeader className="text-center pt-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                {limitType ? (
                  <Lock className="w-8 h-8 text-blue-700" />
                ) : (
                  <Crown className="w-8 h-8 text-yellow-500" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {limitType ? t('limitReached') : t('upgradeRequired')}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {limitType ? getLimitMessage() : t('upgradeToUnlock')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Feature highlight */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                  <span className="font-medium text-blue-700">{t(`feature_${feature}`)}</span>
                  {' '}
                  {t('includedInPro').toLowerCase()}
                </p>
              </div>

              {/* Usage info if limit type */}
              {limitType && remaining !== undefined && limit !== undefined && (
                <div className="flex justify-center">
                  <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full">
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      {remaining}/{limit} {limitType === 'aiChat'
                        ? t('remainingToday').replace('{count}', String(remaining))
                        : t('remainingThisMonth').replace('{count}', String(remaining))}
                    </span>
                  </div>
                </div>
              )}

              {/* Pro benefits */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('unlockUnlimited')}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-blue-500" />
                    <span>{t('feature_unlimitedMealPlanGeneration')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    <span>{t('feature_advancedAICoach')}</span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                {!hasUsedTrial ? (
                  <Button
                    className="w-full bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700"
                    onClick={handleStartTrial}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {t('startFreeTrial')}
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700"
                    onClick={handleViewPricing}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {t('upgradeToPro')}
                  </Button>
                )}

                <Button variant="ghost" className="w-full" onClick={onClose}>
                  {language === 'en' ? 'Maybe later' : 'Quizás después'}
                </Button>
              </div>

              {/* Trial info */}
              {!hasUsedTrial && (
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-500">
                    {t('noCommitment')} • {t('cancelAnytime')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {language === 'en'
                      ? `Then $${PRICING.pro.monthly}/month`
                      : `Luego $${PRICING.pro.monthly}/mes`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to manage paywall state
export function usePaywall() {
  const [isOpen, setIsOpen] = useState(false);
  const [paywallProps, setPaywallProps] = useState<{
    feature: string;
    source: string;
    limitType?: 'mealPlan' | 'aiChat' | 'challenge';
    remaining?: number;
    limit?: number;
  }>({ feature: '', source: '' });

  const showPaywall = (
    feature: string,
    source: string,
    options?: {
      limitType?: 'mealPlan' | 'aiChat' | 'challenge';
      remaining?: number;
      limit?: number;
    }
  ) => {
    setPaywallProps({
      feature,
      source,
      ...options,
    });
    setIsOpen(true);
  };

  const closePaywall = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    paywallProps,
    showPaywall,
    closePaywall,
  };
}
