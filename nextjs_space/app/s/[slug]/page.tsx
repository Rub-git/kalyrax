'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  Loader2,
  ShoppingCart,
  Utensils,
  Flame,
  ChevronRight,
  ArrowRight,
  Share2,
  Apple,
  Beef,
  Wheat,
  Droplet,
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  category?: string;
}

interface SharedPlanData {
  slug: string;
  viewCount: number;
  targets: {
    kcal: number;
    carbG: number;
    proteinG: number;
    fatG: number;
    fiberG: number;
  };
  macroDistribution: {
    carbPercent: number;
    proteinPercent: number;
    fatPercent: number;
  };
  days: DayPlan[];
  shoppingList: ShoppingItem[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  snack_am: 'Morning Snack',
  lunch: 'Lunch',
  snack_pm: 'Afternoon Snack',
  dinner: 'Dinner',
};

export default function SharedPlanPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const utmSource = searchParams?.get('utm_source');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<SharedPlanData | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  useEffect(() => {
    // Detect browser language
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('es')) {
        setLanguage('es');
      }
    }
  }, []);

  useEffect(() => {
    if (slug) {
      fetchPlan();
      trackView();
    }
  }, [slug]);

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/s/${slug}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Plan not found');
        return;
      }

      setPlanData(data.data);
    } catch (err) {
      setError('Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    try {
      await fetch(`/api/s/${slug}/track`, { method: 'POST' });
    } catch (err) {
      // Silent fail
    }
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert(language === 'es' ? '¡Link copiado!' : 'Link copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !planData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {language === 'es' ? 'Plan no encontrado' : 'Plan Not Found'}
            </h1>
            <p className="text-gray-600 mb-6">
              {language === 'es' 
                ? 'Este enlace puede haber expirado o no existe.'
                : 'This link may have expired or does not exist.'}
            </p>
            <Link href="/">
              <Button className="bg-green-600 hover:bg-green-700">
                {language === 'es' ? 'Crear mi propio plan' : 'Create Your Own Plan'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dayPlan = planData.days?.[selectedDay];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Apple className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-green-800">Kalyrax</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            >
              {language === 'en' ? 'ES' : 'EN'}
            </Button>
            <Button variant="outline" size="sm" onClick={copyShareLink}>
              <Share2 className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Compartir' : 'Share'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {language === 'es' ? 'Plan de Alimentación Personalizado' : 'Personalized Meal Plan'}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {language === 'es'
              ? '7 días de comidas saludables con lista de compras incluida'
              : '7 days of healthy meals with shopping list included'}
          </p>
        </motion.div>

        {/* Daily Targets Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                {language === 'es' ? 'Objetivos Diarios' : 'Daily Targets'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{planData.targets.kcal}</div>
                  <div className="text-sm text-gray-600">kcal</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{planData.targets.carbG}g</div>
                  <div className="text-sm text-gray-600">
                    {language === 'es' ? 'Carbohidratos' : 'Carbs'}
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{planData.targets.proteinG}g</div>
                  <div className="text-sm text-gray-600">
                    {language === 'es' ? 'Proteínas' : 'Protein'}
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{planData.targets.fatG}g</div>
                  <div className="text-sm text-gray-600">
                    {language === 'es' ? 'Grasas' : 'Fat'}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{planData.targets.fiberG}g</div>
                  <div className="text-sm text-gray-600">
                    {language === 'es' ? 'Fibra' : 'Fiber'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tab Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={showShoppingList ? 'outline' : 'default'}
            onClick={() => setShowShoppingList(false)}
            className={!showShoppingList ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Plan Semanal' : 'Weekly Plan'}
          </Button>
          <Button
            variant={showShoppingList ? 'default' : 'outline'}
            onClick={() => setShowShoppingList(true)}
            className={showShoppingList ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Lista de Compras' : 'Shopping List'}
          </Button>
        </div>

        {!showShoppingList ? (
          <>
            {/* Day Selector */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
              {DAYS.map((day, index) => (
                <Button
                  key={day}
                  variant={selectedDay === index ? 'default' : 'outline'}
                  onClick={() => setSelectedDay(index)}
                  className={`flex-shrink-0 ${
                    selectedDay === index ? 'bg-green-600 hover:bg-green-700' : ''
                  }`}
                >
                  {language === 'es' ? DAYS_ES[index] : day}
                </Button>
              ))}
            </div>

            {/* Day Meals */}
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {dayPlan?.meals?.map((meal, index) => (
                <Card key={index} className="bg-white/90 backdrop-blur">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Utensils className="h-5 w-5 text-green-600" />
                        {MEAL_TYPE_LABELS[meal.mealType] || meal.mealType}
                      </CardTitle>
                      <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        {meal.totalKcal} kcal
                      </span>
                    </div>
                    <p className="text-gray-700 font-medium">
                      {language === 'es' ? meal.nameEs : meal.name}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {meal.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0"
                        >
                          <span className="text-gray-700">{item.foodName}</span>
                          <span className="text-gray-500 text-sm">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-4 pt-4 border-t text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Wheat className="h-4 w-4 text-blue-500" />
                        {meal.totalCarbG}g
                      </span>
                      <span className="flex items-center gap-1">
                        <Beef className="h-4 w-4 text-red-500" />
                        {meal.totalProteinG}g
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplet className="h-4 w-4 text-yellow-500" />
                        {meal.totalFatG}g
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </>
        ) : (
          /* Shopping List */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  {language === 'es' ? 'Lista de Compras' : 'Shopping List'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {planData.shoppingList?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-gray-700">
                        {language === 'es' ? item.itemEs : item.item}
                      </span>
                      <span className="text-gray-500 font-medium">{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0">
            <CardContent className="py-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {language === 'es'
                  ? '¿Quieres tu propio plan personalizado?'
                  : 'Want your own personalized plan?'}
              </h2>
              <p className="text-green-100 mb-6 max-w-xl mx-auto">
                {language === 'es'
                  ? 'Calcula tus calorías exactas, obtén un plan de comidas adaptado a tus objetivos y preferencias.'
                  : 'Calculate your exact calories, get a meal plan tailored to your goals and preferences.'}
              </p>
              <Link href={`/signup?utm_source=${utmSource || 'shared_plan'}&ref=${slug}`}>
                <Button
                  size="lg"
                  className="bg-white text-green-600 hover:bg-green-50 font-bold"
                >
                  {language === 'es' ? 'Crear Mi Plan Gratis' : 'Create My Free Plan'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>
            {language === 'es'
              ? 'Este plan fue generado por Kalyrax. La información nutricional es aproximada.'
              : 'This plan was generated by Kalyrax. Nutritional information is approximate.'}
          </p>
          <p className="mt-2">
            {planData.viewCount > 0 && (
              <span>{planData.viewCount} {language === 'es' ? 'vistas' : 'views'}</span>
            )}
          </p>
        </footer>
      </main>
    </div>
  );
}
