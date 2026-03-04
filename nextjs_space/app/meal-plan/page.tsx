'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  Loader2,
  RefreshCw,
  ShoppingCart,
  ChevronRight,
  Utensils,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MealItem {
  foodName: string;
  quantity: number;
  unit: string;
}

interface Meal {
  mealType: string;
  name: string;
  nameEs: string;
  items: MealItem[];
  totalKcal: number;
  totalCarbG: number;
  totalProteinG: number;
  totalFatG: number;
}

interface DayPlan {
  dayNumber: number;
  meals: Meal[];
  totalKcal: number;
}

interface ShoppingItem {
  item: string;
  itemEs: string;
  quantity: string;
}

const DAYS = [
  { en: 'Monday', es: 'Lunes' },
  { en: 'Tuesday', es: 'Martes' },
  { en: 'Wednesday', es: 'Miércoles' },
  { en: 'Thursday', es: 'Jueves' },
  { en: 'Friday', es: 'Viernes' },
  { en: 'Saturday', es: 'Sábado' },
  { en: 'Sunday', es: 'Domingo' },
];

const MEAL_TYPE_LABELS: Record<string, { en: string; es: string }> = {
  breakfast: { en: 'Breakfast', es: 'Desayuno' },
  snack_am: { en: 'Morning Snack', es: 'Colación' },
  lunch: { en: 'Lunch', es: 'Comida' },
  snack_pm: { en: 'Afternoon Snack', es: 'Colación' },
  dinner: { en: 'Dinner', es: 'Cena' },
};

export default function MealPlanPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [mealPlan, setMealPlan] = useState<{ days: DayPlan[]; shoppingList: ShoppingItem[] } | null>(null);
  const [targets, setTargets] = useState({ kcal: 2000, carbG: 250, proteinG: 75, fatG: 55 });
  const [selectedDay, setSelectedDay] = useState(0);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.success && data.data?.latestCalculation) {
        const calc = data.data.latestCalculation;
        setTargets({
          kcal: Math.round(calc.get),
          carbG: Math.round(calc.carbG),
          proteinG: Math.round(calc.proteinG),
          fatG: Math.round(calc.fatG),
        });
      }
      if (data.success && data.data?.profile?.dietaryPrefs) {
        setPreferences(data.data.profile.dietaryPrefs);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMealPlan = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/meal-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences,
          language,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMealPlan({
          days: data.data?.days ?? [],
          shoppingList: data.data?.shoppingList ?? [],
        });
        setSelectedDay(0);
      }
    } catch (err) {
      console.error('Failed to generate meal plan:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  const currentDay = mealPlan?.days?.[selectedDay];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              {t('mealPlan')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {language === 'es'
                ? `Meta diaria: ${targets.kcal} kcal`
                : `Daily target: ${targets.kcal} kcal`}
            </p>
          </div>
          <div className="flex gap-2">
            {mealPlan && (
              <Button variant="outline" onClick={() => setShowShoppingList(true)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t('shoppingList')}
              </Button>
            )}
            <Button onClick={generateMealPlan} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'es' ? 'Generando...' : 'Generating...'}
                </>
              ) : mealPlan ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('regenerate')}
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('generatePlan')}
                </>
              )}
            </Button>
          </div>
        </div>

        {!mealPlan ? (
          // Empty State
          <Card className="py-16">
            <CardContent className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {language === 'es' ? 'No hay plan de comidas' : 'No Meal Plan Yet'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {language === 'es'
                  ? 'Genera un plan semanal personalizado basado en tus metas nutricionales y preferencias alimenticias.'
                  : 'Generate a personalized weekly plan based on your nutritional goals and dietary preferences.'}
              </p>
              <Button onClick={generateMealPlan} disabled={generating} size="lg">
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {language === 'es' ? 'Generando...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('generatePlan')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Meal Plan View
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Day Selector */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('weeklyPlan')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    {DAYS.map((day, index) => {
                      const dayData = mealPlan.days?.[index];
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedDay(index)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                            selectedDay === index
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="font-medium">
                            {language === 'es' ? day.es : day.en}
                          </span>
                          {dayData && (
                            <span className="text-sm opacity-80">
                              {dayData.totalKcal ?? '---'} kcal
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Day Meals */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDay}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {language === 'es' ? DAYS[selectedDay].es : DAYS[selectedDay].en}
                    </h2>
                    <div className="flex items-center gap-2 text-sm">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">
                        {currentDay?.totalKcal ?? 0} / {targets.kcal} kcal
                      </span>
                    </div>
                  </div>

                  {currentDay?.meals?.map((meal, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="pb-2 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-primary" />
                            <CardTitle className="text-base">
                              {MEAL_TYPE_LABELS[meal.mealType]?.[language === 'es' ? 'es' : 'en'] ?? meal.mealType}
                            </CardTitle>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {meal.totalKcal} kcal
                          </span>
                        </div>
                        <p className="text-sm font-medium text-primary">
                          {language === 'es' ? meal.nameEs : meal.name}
                        </p>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          {meal.items?.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="flex items-center gap-2 text-sm"
                            >
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span>
                                {item.quantity} {item.unit} {item.foodName}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t flex gap-4 text-xs text-muted-foreground">
                          <span>C: {meal.totalCarbG}g</span>
                          <span>P: {meal.totalProteinG}g</span>
                          <span>F: {meal.totalFatG}g</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Shopping List Modal */}
        {showShoppingList && mealPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{t('shoppingList')}</h3>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <div className="space-y-2">
                  {mealPlan.shoppingList?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
                    >
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">
                        {language === 'es' ? item.itemEs : item.item}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t">
                <Button className="w-full" onClick={() => setShowShoppingList(false)}>
                  {t('close')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
