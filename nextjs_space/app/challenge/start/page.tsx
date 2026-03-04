'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Target, Loader2, CheckCircle2, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Track growth event
async function trackGrowthEvent(
  eventType: string,
  metadata?: Record<string, unknown>
) {
  try {
    await fetch('/api/growth/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, metadata }),
    });
  } catch {
    // Silent fail
  }
}

interface ChallengeTemplate {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  durationDays: number;
}

export default function ChallengeStartPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [template, setTemplate] = useState<ChallengeTemplate | null>(null);
  const [error, setError] = useState('');
  const [autoStarting, setAutoStarting] = useState(false);

  const fromOnboarding = searchParams.get('from') === 'onboarding';
  const t = (en: string, es: string) => (language === 'es' ? es : en);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchTemplate();
    }
  }, [status, router]);

  const fetchTemplate = async () => {
    try {
      const res = await fetch('/api/challenge/templates');
      const data = await res.json();
      if (data.templates?.length > 0) {
        setTemplate(data.templates[0]);
        
        // Auto-start if coming from onboarding
        if (fromOnboarding) {
          setAutoStarting(true);
          setTimeout(() => {
            startChallenge(data.templates[0].id);
          }, 1500);
        }
      }
    } catch (err) {
      setError(t('Failed to load challenge', 'Error al cargar el reto'));
    } finally {
      setLoading(false);
    }
  };

  const startChallenge = async (templateId: string) => {
    setStarting(true);
    setError('');
    try {
      // Check if already in a challenge
      const activeRes = await fetch('/api/challenge/active');
      const activeData = await activeRes.json();
      if (activeData.challenges?.length > 0) {
        // Already in a challenge, redirect to challenge page
        router.push('/challenge');
        return;
      }

      const res = await fetch('/api/challenge/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      if (res.ok) {
        // Track CHALLENGE_STARTED event
        trackGrowthEvent('CHALLENGE_STARTED', {
          templateId,
          fromOnboarding,
        });
        
        router.push('/challenge');
      } else {
        const data = await res.json();
        setError(data.error || t('Failed to start challenge', 'Error al iniciar el reto'));
      }
    } catch (err) {
      setError(t('Something went wrong', 'Algo salió mal'));
    } finally {
      setStarting(false);
      setAutoStarting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main className="container max-w-lg mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          {/* Header */}
          <div className="space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {fromOnboarding
                ? t('Ready to Start Your Challenge?', '¿Listo para Empezar tu Reto?')
                : t('7-Day High Protein Challenge', 'Reto de 7 Días Alto en Proteína')}
            </h1>
            {fromOnboarding && (
              <p className="text-gray-600 dark:text-gray-300">
                {t(
                  'Your nutrition plan is saved! Now take the challenge to build lasting habits.',
                  'Tu plan de nutrición está guardado. Ahora toma el reto para crear hábitos duraderos.'
                )}
              </p>
            )}
          </div>

          {/* Benefits */}
          <Card className="text-left">
            <CardContent className="py-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t('Daily Protein Goals', 'Metas Diarias de Proteína')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('Hit your target each day to build muscle and energy', 'Cumple tu meta cada día para ganar músculo y energía')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <Flame className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t('Build Streaks', 'Construye Rachas')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('Stay consistent and unlock streak bonuses', 'Mantente consistente y desbloquea bonos de racha')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t('Compete on Leaderboard', 'Compite en el Ranking')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('Earn points and climb the weekly rankings', 'Gana puntos y sube en el ranking semanal')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Zap className="h-4 w-4 text-orange-500" />
            {t('1,000+ people taking the challenge this week', 'Más de 1,000 personas en el reto esta semana')}
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* CTA */}
          {autoStarting ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  {t('Starting your challenge...', 'Iniciando tu reto...')}
                </span>
              </div>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500" />
            </div>
          ) : (
            <Button
              onClick={() => template && startChallenge(template.id)}
              disabled={starting || !template}
              size="lg"
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              {starting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Trophy className="mr-2 h-5 w-5" />
                  {t('Start 7-Day Challenge', 'Iniciar Reto de 7 Días')}
                </>
              )}
            </Button>
          )}

          {/* Skip option */}
          {!autoStarting && (
            <Link href="/dashboard" className="block text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              {t('Skip for now, go to dashboard', 'Omitir por ahora, ir al panel')}
            </Link>
          )}
        </motion.div>
      </main>
    </div>
  );
}
