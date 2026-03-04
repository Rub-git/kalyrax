'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { DisclaimerBanner } from '@/components/disclaimer-banner';
import { StreakDisplay } from '@/components/streak-display';
import { StreakShareModal } from '@/components/streak-share-modal';
import { UpgradeBanner } from '@/components/upgrade-banner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Flame,
  Apple,
  Beef,
  Droplets,
  Wheat,
  Calendar,
  MessageCircle,
  LineChart,
  Info,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Crown,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface CalculationData {
  geb: number;
  eta: number;
  get: number;
  bmr: number;
  tdee: number;
  carbG: number;
  proteinG: number;
  fatG: number;
  fiberTargetG: number;
  carbPercent: number;
  proteinPercent: number;
  fatPercent: number;
  bmi: number;
  formulaVersion: string;
}

interface ProfileData {
  age: number;
  sex: string;
  weightKg: number;
  heightCm: number;
  activityLevel: string;
  goal: string;
  medicalFlags: string[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [calculation, setCalculation] = useState<CalculationData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userName, setUserName] = useState('');
  const [showStreakShare, setShowStreakShare] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isTrialing, setIsTrialing] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const [profileRes, subscriptionRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/subscription'),
      ]);
      
      const data = await profileRes.json();

      if (data.success) {
        setUserName(data.data?.user?.name ?? '');
        setProfile(data.data?.profile);
        setCalculation(data.data?.latestCalculation);

        if (!data.data?.profile) {
          router.replace('/onboarding');
          return;
        }
      }
      
      if (subscriptionRes.ok) {
        const subData = await subscriptionRes.json();
        setIsPro(subData.isPro || false);
        setIsTrialing(subData.isTrialing || false);
        setTrialDaysRemaining(subData.trialDaysRemaining);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!profile) return;

    setRecalculating(true);
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: profile.age,
          sex: profile.sex,
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
          activityLevel: profile.activityLevel,
          goal: profile.goal,
          saveToProfile: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCalculation(data.data);
      }
    } catch (err) {
      console.error('Failed to recalculate:', err);
    } finally {
      setRecalculating(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  const macroData = calculation
    ? [
        { name: t('carbohydrates'), value: calculation.carbPercent, grams: calculation.carbG, color: '#60B5FF' },
        { name: t('protein'), value: calculation.proteinPercent, grams: calculation.proteinG, color: '#FF9149' },
        { name: t('fat'), value: calculation.fatPercent, grams: calculation.fatG, color: '#FF90BB' },
      ]
    : [];

  const hasMedicalFlags = (profile?.medicalFlags?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <DisclaimerBanner />
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('welcome')}, {userName || (language === 'es' ? 'Usuario' : 'User')}!
              </h1>
              <p className="text-gray-600 mt-1">{t('yourResults')}</p>
            </div>
            <StreakDisplay compact />
          </div>
        </motion.div>

        {/* Trial Status Banner */}
        {isTrialing && trialDaysRemaining !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="mb-6"
          >
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-emerald-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      {language === 'en' ? 'Pro Trial Active' : 'Prueba Pro Activa'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t('trialEndsIn').replace('{days}', String(trialDaysRemaining))}
                    </p>
                  </div>
                </div>
                <Link href="/pricing">
                  <Button size="sm" className="bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700">
                    {t('upgradeToPro')}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Upgrade Banner for Free Users */}
        {!isPro && !isTrialing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="mb-6"
          >
            <UpgradeBanner source="dashboard" />
          </motion.div>
        )}

        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <StreakDisplay showShare onShare={() => setShowStreakShare(true)} />
        </motion.div>

        {/* Streak Share Modal */}
        <StreakShareModal 
          isOpen={showStreakShare} 
          onClose={() => setShowStreakShare(false)} 
        />

        {/* Medical Warning */}
        {hasMedicalFlags && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800">{t('medicalWarning')}</p>
          </motion.div>
        )}

        {/* Energy Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  {t('geb')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary animate-count-up">
                  {calculation?.geb?.toLocaleString() ?? '---'}
                </p>
                <p className="text-sm text-muted-foreground">{t('kcal')} / {language === 'es' ? 'día' : 'day'}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Apple className="h-4 w-4" />
                  {t('eta')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-500 animate-count-up">
                  {calculation?.eta?.toLocaleString() ?? '---'}
                </p>
                <p className="text-sm text-muted-foreground">{t('kcal')} / {language === 'es' ? 'día' : 'day'}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full bg-primary text-primary-foreground">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-primary-foreground/80">
                  <Flame className="h-4 w-4" />
                  {t('get')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold animate-count-up">
                  {calculation?.get?.toLocaleString() ?? '---'}
                </p>
                <p className="text-sm text-primary-foreground/80">{t('kcal')} / {language === 'es' ? 'día' : 'day'}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Macros Chart & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{t('macronutrients')}</CardTitle>
                <CardDescription>
                  {language === 'es' ? 'Distribución diaria recomendada' : 'Recommended daily distribution'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value }) => `${value}%`}
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                          `${value}% (${props.payload.grams}g)`,
                          name,
                        ]}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'es' ? 'Resumen Diario' : 'Daily Summary'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wheat className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">{t('carbohydrates')}</span>
                  </div>
                  <span className="font-bold text-blue-600">{calculation?.carbG ?? 0}g</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Beef className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">{t('protein')}</span>
                  </div>
                  <span className="font-bold text-orange-600">{calculation?.proteinG ?? 0}g</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Droplets className="h-5 w-5 text-pink-500" />
                    <span className="font-medium">{t('fat')}</span>
                  </div>
                  <span className="font-bold text-pink-600">{calculation?.fatG ?? 0}g</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Apple className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">{t('fiber')}</span>
                  </div>
                  <span className="font-bold text-blue-700">{calculation?.fiberTargetG ?? 0}g</span>
                </div>

                <div className="pt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    <span>{t('formulaVersion')}: {calculation?.formulaVersion ?? 'N/A'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRecalculate}
                    disabled={recalculating}
                  >
                    {recalculating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-semibold mb-4">
            {language === 'es' ? 'Acciones Rápidas' : 'Quick Actions'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/meal-plan">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('generatePlan')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' ? 'Plan semanal personalizado' : 'Personalized weekly plan'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/chat">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('chat')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' ? 'Pregunta sobre nutrición' : 'Ask about nutrition'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/tracking">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <LineChart className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('trackMeal')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' ? 'Registra tu comida' : 'Log your food'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
