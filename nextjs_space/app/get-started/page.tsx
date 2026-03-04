'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { useLanguage } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Leaf, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Target,
  Dumbbell,
  Apple,
  Scale,
  Flame,
  Utensils,
  Check,
  Sparkles,
  Trophy,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Track growth event
async function trackGrowthEvent(
  eventType: string,
  sessionId?: string,
  sourceSlug?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await fetch('/api/growth/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, sessionId, sourceSlug, metadata }),
    });
  } catch {
    // Silent fail
  }
}

const GOALS = [
  { 
    value: 'lose_weight', 
    labelEn: 'Lose Weight', 
    labelEs: 'Perder Peso',
    icon: Target,
    color: 'bg-orange-500'
  },
  { 
    value: 'build_muscle', 
    labelEn: 'Build Muscle', 
    labelEs: 'Ganar Músculo',
    icon: Dumbbell,
    color: 'bg-blue-500'
  },
  { 
    value: 'eat_healthier', 
    labelEn: 'Eat Healthier', 
    labelEs: 'Comer Más Sano',
    icon: Apple,
    color: 'bg-green-500'
  },
  { 
    value: 'maintain_weight', 
    labelEn: 'Maintain Weight', 
    labelEs: 'Mantener Peso',
    icon: Scale,
    color: 'bg-purple-500'
  },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', labelEn: 'Sedentary', labelEs: 'Sedentario', desc: 'Little or no exercise' },
  { value: 'light', labelEn: 'Light', labelEs: 'Ligero', desc: '1-3 days/week' },
  { value: 'moderate', labelEn: 'Moderate', labelEs: 'Moderado', desc: '3-5 days/week' },
  { value: 'active', labelEn: 'Active', labelEs: 'Activo', desc: '6-7 days/week' },
  { value: 'very_active', labelEn: 'Very Active', labelEs: 'Muy Activo', desc: 'Athlete level' },
];

interface NutritionResult {
  dailyCalories: number;
  macros: {
    carbG: number;
    proteinG: number;
    fatG: number;
    carbPercent: number;
    proteinPercent: number;
    fatPercent: number;
  };
  mealPreview: {
    breakfast: { name: string; nameEs: string; totalKcal: number; items: { name: string; nameEs: string; kcal: number }[] };
    lunch: { name: string; nameEs: string; totalKcal: number; items: { name: string; nameEs: string; kcal: number }[] };
    dinner: { name: string; nameEs: string; totalKcal: number; items: { name: string; nameEs: string; kcal: number }[] };
    snacks: { name: string; nameEs: string; totalKcal: number };
  };
}

export default function GetStartedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession() || {};
  const { language } = useLanguage();
  
  // Capture referral source from URL (e.g., from shared challenge)
  const refSlug = searchParams.get('ref') || '';
  const utmSource = searchParams.get('utm_source') || '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Form state
  const [goal, setGoal] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');

  // Results
  const [results, setResults] = useState<NutritionResult | null>(null);

  // Registration form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [registering, setRegistering] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (session?.user) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  const totalSteps = 6;
  const progressPercent = (step / totalSteps) * 100;

  const t = (en: string, es: string) => language === 'es' ? es : en;

  // Step 1: Start
  const handleStart = () => {
    setStep(2);
  };

  // Step 2: Select goal and create session
  const handleGoalSelect = async (selectedGoal: string) => {
    setGoal(selectedGoal);
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: selectedGoal }),
      });

      if (!res.ok) throw new Error('Failed to create session');

      const data = await res.json();
      setSessionId(data.sessionId);
      setStep(3);
    } catch (err) {
      setError(t('Something went wrong. Please try again.', 'Algo salió mal. Por favor intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Submit basic data
  const handleBasicDataSubmit = async () => {
    if (!age || !sex || !heightCm || !weightKg) {
      setError(t('Please fill in all fields', 'Por favor completa todos los campos'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update session with basic data
      const updateRes = await fetch(`/api/onboarding-session/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: parseInt(age),
          sex,
          heightCm: parseFloat(heightCm),
          weightKg: parseFloat(weightKg),
          activityLevel,
          currentStep: 4,
        }),
      });

      if (!updateRes.ok) throw new Error('Failed to update session');

      // Move to loading step
      setStep(4);

      // Simulate loading for UX (2-3 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Calculate nutrition
      const calcRes = await fetch(`/api/onboarding-session/${sessionId}/calculate`, {
        method: 'POST',
      });

      if (!calcRes.ok) throw new Error('Failed to calculate nutrition');

      const calcData = await calcRes.json();
      setResults(calcData);
      
      // Track PLAN_GENERATED event
      trackGrowthEvent('PLAN_GENERATED', sessionId || undefined, refSlug || undefined, {
        goal,
        dailyCalories: calcData.dailyCalories,
        utmSource,
      });
      
      setStep(5);
    } catch (err) {
      setError(t('Something went wrong. Please try again.', 'Algo salió mal. Por favor intenta de nuevo.'));
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setError('');

    try {
      // Create account
      const signupRes = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          onboardingSessionId: sessionId,
        }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        throw new Error(signupData.error || 'Signup failed');
      }

      // Sign in
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        // Track USER_REGISTERED event
        trackGrowthEvent('USER_REGISTERED', sessionId || undefined, refSlug || undefined, {
          goal,
          fromOnboarding: true,
          utmSource,
          referredFromChallenge: !!refSlug,
        });
        
        // Redirect to challenge start page (growth loop activation)
        router.push('/challenge/start?from=onboarding');
      } else {
        throw new Error('Login failed');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setRegistering(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Store sessionId in localStorage for conversion after Google login
    if (sessionId) {
      localStorage.setItem('onboardingSessionId', sessionId);
    }
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Progress bar - visible on steps 2-6 */}
      {step > 1 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="h-2 bg-gray-200 dark:bg-gray-700">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Landing */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg text-center space-y-8"
            >
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
                  <Leaf className="h-16 w-16 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                  {t(
                    'Build your personalized nutrition plan in 60 seconds',
                    'Crea tu plan de nutrición personalizado en 60 segundos'
                  )}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  {t(
                    'No signup required to see your results',
                    'Sin necesidad de registro para ver tus resultados'
                  )}
                </p>
              </div>

              <Button
                onClick={handleStart}
                size="lg"
                className="w-full max-w-xs h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
              >
                {t('Start', 'Comenzar')}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-sm text-gray-500">
                {t('Already have an account?', '¿Ya tienes cuenta?')}{' '}
                <Link href="/login" className="text-green-600 hover:underline font-medium">
                  {t('Sign in', 'Inicia sesión')}
                </Link>
              </p>
            </motion.div>
          )}

          {/* Step 2: Goal Selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="w-full max-w-lg space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {t("What's your goal?", '¿Cuál es tu objetivo?')}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {GOALS.map((g) => {
                  const Icon = g.icon;
                  return (
                    <button
                      key={g.value}
                      onClick={() => handleGoalSelect(g.value)}
                      disabled={loading}
                      className="flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-500 hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <div className={`p-3 rounded-xl ${g.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {language === 'es' ? g.labelEs : g.labelEn}
                      </span>
                      {loading && goal === g.value && (
                        <Loader2 className="ml-auto h-5 w-5 animate-spin text-green-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mx-auto"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('Back', 'Atrás')}
              </button>

              {error && (
                <p className="text-center text-red-500 text-sm">{error}</p>
              )}
            </motion.div>
          )}

          {/* Step 3: Basic Data */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="w-full max-w-lg space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {t('Tell us about you', 'Cuéntanos sobre ti')}
                </h2>
              </div>

              <div className="space-y-5">
                {/* Sex */}
                <div className="space-y-2">
                  <Label className="text-base">{t('Sex', 'Sexo')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['male', 'female'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSex(s)}
                        className={`p-4 rounded-xl border-2 font-medium transition-all ${
                          sex === s
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {s === 'male' ? t('Male', 'Hombre') : t('Female', 'Mujer')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-base">{t('Age', 'Edad')}</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>

                {/* Height & Weight in a row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-base">{t('Height (cm)', 'Altura (cm)')}</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="170"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-base">{t('Weight (kg)', 'Peso (kg)')}</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="70"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="h-12 text-lg"
                    />
                  </div>
                </div>

                {/* Activity Level */}
                <div className="space-y-2">
                  <Label className="text-base">{t('Activity Level', 'Nivel de Actividad')}</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {ACTIVITY_LEVELS.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setActivityLevel(level.value)}
                        className={`flex justify-between items-center p-3 rounded-xl border-2 transition-all ${
                          activityLevel === level.value
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="font-medium">
                          {language === 'es' ? level.labelEs : level.labelEn}
                        </span>
                        {activityLevel === level.value && (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleBasicDataSubmit}
                disabled={loading}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {t('Create My Plan', 'Crear Mi Plan')}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mx-auto"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('Back', 'Atrás')}
              </button>

              {error && (
                <p className="text-center text-red-500 text-sm">{error}</p>
              )}
            </motion.div>
          )}

          {/* Step 4: Loading */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full max-w-lg text-center space-y-8"
            >
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-pulse">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('Creating your nutrition plan...', 'Creando tu plan de nutrición...')}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {t(
                    'Analyzing your data and calculating your ideal macros',
                    'Analizando tus datos y calculando tus macros ideales'
                  )}
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 5: Results Preview */}
          {step === 5 && results && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium text-sm mb-2">
                  <Check className="h-4 w-4" />
                  {t('Plan Ready!', '¡Plan Listo!')}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {t('Your Nutrition Plan', 'Tu Plan de Nutrición')}
                </h2>
              </div>

              {/* Daily Calories */}
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white">
                <CardContent className="py-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Flame className="h-6 w-6" />
                    <span className="text-sm uppercase tracking-wide opacity-90">
                      {t('Daily Calories', 'Calorías Diarias')}
                    </span>
                  </div>
                  <div className="text-5xl font-bold">
                    {results.dailyCalories.toLocaleString()}
                  </div>
                  <div className="text-sm opacity-90">kcal</div>
                </CardContent>
              </Card>

              {/* Macros */}
              <Card>
                <CardContent className="py-6">
                  <h3 className="font-semibold text-center mb-4">
                    {t('Daily Macros', 'Macros Diarios')}
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {results.macros.carbG}g
                      </div>
                      <div className="text-sm text-gray-500">
                        {t('Carbs', 'Carbos')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {results.macros.carbPercent}%
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {results.macros.proteinG}g
                      </div>
                      <div className="text-sm text-gray-500">
                        {t('Protein', 'Proteína')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {results.macros.proteinPercent}%
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {results.macros.fatG}g
                      </div>
                      <div className="text-sm text-gray-500">
                        {t('Fat', 'Grasa')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {results.macros.fatPercent}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meal Preview */}
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Utensils className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">
                      {t('Sample Meal Plan', 'Plan de Comidas de Ejemplo')}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {['breakfast', 'lunch', 'dinner'].map((meal) => {
                      const mealData = results.mealPreview[meal as keyof typeof results.mealPreview];
                      if (!('items' in mealData)) return null;
                      return (
                        <div key={meal} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <div className="font-medium capitalize">
                              {meal === 'breakfast' && t('Breakfast', 'Desayuno')}
                              {meal === 'lunch' && t('Lunch', 'Almuerzo')}
                              {meal === 'dinner' && t('Dinner', 'Cena')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {language === 'es' ? mealData.nameEs : mealData.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600">
                              {mealData.totalKcal} kcal
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Challenge CTA - Primary Activation */}
              <Card className="border-2 border-orange-300 dark:border-orange-600 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                <CardContent className="py-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-full bg-orange-500">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {t('7-Day High Protein Challenge', 'Reto de 7 Días Alto en Proteína')}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('Start building better habits today', 'Comienza a construir mejores hábitos hoy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400">
                    <Zap className="h-4 w-4" />
                    {t('Join 1,000+ people taking the challenge', 'Únete a más de 1,000 personas en el reto')}
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={() => setStep(6)}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                <Trophy className="mr-2 h-5 w-5" />
                {t('Start Challenge & Save Plan', 'Iniciar Reto y Guardar Plan')}
              </Button>

              <p className="text-center text-sm text-gray-500">
                {t(
                  'Create a free account to track your progress and join the leaderboard',
                  'Crea una cuenta gratuita para seguir tu progreso y unirte al ranking'
                )}
              </p>
            </motion.div>
          )}

          {/* Step 6: Registration */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="w-full max-w-lg space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {t('Save Your Plan', 'Guarda Tu Plan')}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {t(
                    'Create your account to start your personalized nutrition journey',
                    'Crea tu cuenta para comenzar tu viaje de nutrición personalizado'
                  )}
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">{t('Name', 'Nombre')}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('Your name', 'Tu nombre')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">{t('Email', 'Correo electrónico')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base">{t('Password', 'Contraseña')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-lg"
                    minLength={8}
                    required
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={registering}
                  size="lg"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {registering ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    t('Create Account', 'Crear Cuenta')
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 text-gray-500">
                    {t('or', 'o')}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleGoogleSignIn}
                className="w-full h-14 text-lg"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('Continue with Google', 'Continuar con Google')}
              </Button>

              <button
                onClick={() => setStep(5)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mx-auto"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('Back to results', 'Volver a resultados')}
              </button>

              <p className="text-center text-sm text-gray-500">
                {t('Already have an account?', '¿Ya tienes cuenta?')}{' '}
                <Link href="/login" className="text-green-600 hover:underline font-medium">
                  {t('Sign in', 'Inicia sesión')}
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
