'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Paywall, usePaywall } from '@/components/paywall';
import { UpgradeBanner } from '@/components/upgrade-banner';
import {
  Calendar,
  Loader2,
  RefreshCw,
  ShoppingCart,
  ChevronRight,
  Utensils,
  Flame,
  CheckCircle2,
  Share2,
  Download,
  Copy,
  X,
  ArrowRightLeft,
  Check,
  Crown,
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

interface FoodSuggestion {
  id: string;
  name: string;
  nameEs: string;
  kcal: number;
  carbG: number;
  proteinG: number;
  fatG: number;
  ratio: number;
  adjustedServingSize: number;
  servingUnit: string;
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
  const planCardRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [mealPlan, setMealPlan] = useState<{ days: DayPlan[]; shoppingList: ShoppingItem[]; id?: string } | null>(null);
  const [targets, setTargets] = useState({ kcal: 2000, carbG: 250, proteinG: 75, fatG: 55 });
  const [selectedDay, setSelectedDay] = useState(0);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);
  
  // Share functionality
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Substitution functionality
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapItem, setSwapItem] = useState<{ dayIndex: number; mealIndex: number; itemIndex: number; foodName: string } | null>(null);
  const [swapSuggestions, setSwapSuggestions] = useState<FoodSuggestion[]>([]);
  const [loadingSwap, setLoadingSwap] = useState(false);
  
  // Subscription state
  const [mealPlanUsage, setMealPlanUsage] = useState<{ used: number; limit: number; remaining: number; allowed: boolean }>({ used: 0, limit: 2, remaining: 2, allowed: true });
  const [isPro, setIsPro] = useState(false);
  const { isOpen: paywallOpen, paywallProps, showPaywall, closePaywall } = usePaywall();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated') {
      fetchData();
      fetchSubscription();
    }
  }, [status, router]);
  
  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/subscription');
      if (res.ok) {
        const data = await res.json();
        setMealPlanUsage(data.usage?.mealPlans || { used: 0, limit: 2, remaining: 2, allowed: true });
        setIsPro(data.isPro || false);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  };

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
    // Check if user has reached their limit (non-Pro users)
    if (!isPro && !mealPlanUsage.allowed) {
      showPaywall('unlimitedMealPlanGeneration', 'meal_plan', {
        limitType: 'mealPlan',
        remaining: mealPlanUsage.remaining,
        limit: mealPlanUsage.limit,
      });
      return;
    }
    
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
          id: data.data?.id,
          days: data.data?.days ?? [],
          shoppingList: data.data?.shoppingList ?? [],
        });
        setSelectedDay(0);
        setShareUrl(''); // Reset share URL when new plan generated
        
        // Refresh subscription to update usage
        await fetchSubscription();
      }
    } catch (err) {
      console.error('Failed to generate meal plan:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Share plan functionality
  const handleShare = async () => {
    if (!mealPlan?.id) return;
    
    setSharing(true);
    try {
      const res = await fetch(`/api/share/plan/${mealPlan.id}`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.success) {
        setShareUrl(data.data.shareUrl);
        setShowShareModal(true);
      }
    } catch (err) {
      console.error('Failed to create share link:', err);
    } finally {
      setSharing(false);
    }
  };

  const copyToClipboard = (url: string, source: string) => {
    const shareLink = `${url}?utm_source=${source}`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Food swap functionality
  const handleSwapClick = async (dayIndex: number, mealIndex: number, itemIndex: number, foodName: string) => {
    setSwapItem({ dayIndex, mealIndex, itemIndex, foodName });
    setShowSwapModal(true);
    setLoadingSwap(true);
    
    try {
      // First get food ID by name
      const foodsRes = await fetch(`/api/foods?search=${encodeURIComponent(foodName)}&limit=1`);
      const foodsData = await foodsRes.json();
      
      if (foodsData.success && foodsData.data?.foods?.length > 0) {
        const foodId = foodsData.data.foods[0].id;
        
        // Get swap suggestions
        const swapRes = await fetch('/api/foods/swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foodId, preferences, limit: 6 }),
        });
        const swapData = await swapRes.json();
        
        if (swapData.success) {
          setSwapSuggestions(swapData.data.suggestions);
        }
      }
    } catch (err) {
      console.error('Failed to get swap suggestions:', err);
    } finally {
      setLoadingSwap(false);
    }
  };

  const applySwap = (suggestion: FoodSuggestion) => {
    if (!swapItem || !mealPlan) return;
    
    const newMealPlan = { ...mealPlan };
    const meal = newMealPlan.days[swapItem.dayIndex]?.meals[swapItem.mealIndex];
    
    if (meal?.items[swapItem.itemIndex]) {
      meal.items[swapItem.itemIndex] = {
        foodName: language === 'es' ? suggestion.nameEs : suggestion.name,
        quantity: suggestion.adjustedServingSize,
        unit: suggestion.servingUnit,
      };
    }
    
    setMealPlan(newMealPlan);
    setShowSwapModal(false);
    setSwapItem(null);
    setSwapSuggestions([]);
  };

  // Export as image
  const exportAsImage = async () => {
    if (!planCardRef.current) return;
    
    try {
      // Dynamic import to avoid SSR issues
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(planCardRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `nutricoach-meal-plan-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
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
              {isPro && (
                <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Pro
                </span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {language === 'es'
                ? `Meta diaria: ${targets.kcal} kcal`
                : `Daily target: ${targets.kcal} kcal`}
              {!isPro && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                  {mealPlanUsage.remaining}/{mealPlanUsage.limit} {language === 'es' ? 'restantes este mes' : 'remaining this month'}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {mealPlan && (
              <>
                <Button variant="outline" onClick={() => setShowShoppingList(true)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t('shoppingList')}
                </Button>
                <Button variant="outline" onClick={handleShare} disabled={sharing}>
                  {sharing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  {language === 'es' ? 'Compartir' : 'Share'}
                </Button>
                <Button variant="outline" onClick={exportAsImage}>
                  <Download className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Exportar' : 'Export'}
                </Button>
              </>
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

                  {currentDay?.meals?.map((meal, mealIndex) => (
                    <Card key={mealIndex} className="overflow-hidden">
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
                              className="flex items-center justify-between gap-2 text-sm group hover:bg-gray-50 rounded p-1 -m-1"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  {item.quantity} {item.unit} {item.foodName}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleSwapClick(selectedDay, mealIndex, itemIndex, item.foodName)}
                              >
                                <ArrowRightLeft className="h-3 w-3 mr-1" />
                                {language === 'es' ? 'Cambiar' : 'Swap'}
                              </Button>
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
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t('shoppingList')}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowShoppingList(false)}>
                  <X className="h-4 w-4" />
                </Button>
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

        {/* Share Modal */}
        {showShareModal && shareUrl && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">
                    {language === 'es' ? 'Compartir Plan' : 'Share Plan'}
                  </h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowShareModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  {language === 'es'
                    ? 'Comparte tu plan de comidas con amigos y familiares:'
                    : 'Share your meal plan with friends and family:'}
                </p>
                
                {/* Copy Link Section */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-50"
                  />
                  <Button onClick={() => copyToClipboard(shareUrl, 'copy')}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Share Buttons */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {language === 'es' ? 'Compartir en:' : 'Share on:'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const url = `${shareUrl}?utm_source=whatsapp`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(`${language === 'es' ? 'Mira mi plan de comidas!' : 'Check out my meal plan!'} ${url}`)}`, '_blank');
                      }}
                    >
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const url = `${shareUrl}?utm_source=twitter`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${language === 'es' ? 'Mira mi plan de comidas!' : 'Check out my meal plan!'} ${url}`)}`, '_blank');
                      }}
                    >
                      Twitter/X
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const url = `${shareUrl}?utm_source=facebook`;
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                      }}
                    >
                      Facebook
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t">
                <Button className="w-full" onClick={() => setShowShareModal(false)}>
                  {t('close')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Swap Food Modal */}
        {showSwapModal && swapItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">
                    {language === 'es' ? 'Cambiar Alimento' : 'Swap Food'}
                  </h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowSwapModal(false);
                  setSwapItem(null);
                  setSwapSuggestions([]);
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'es'
                    ? `Sustitutos para "${swapItem.foodName}":`
                    : `Substitutes for "${swapItem.foodName}":`}
                </p>
                
                {loadingSwap ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : swapSuggestions.length > 0 ? (
                  <div className="space-y-2">
                    {swapSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => applySwap(suggestion)}
                        className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {language === 'es' ? suggestion.nameEs : suggestion.name}
                          </span>
                          <span className="text-sm text-primary">
                            {suggestion.adjustedServingSize} {suggestion.servingUnit}
                          </span>
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{suggestion.kcal} kcal</span>
                          <span>C: {suggestion.carbG}g</span>
                          <span>P: {suggestion.proteinG}g</span>
                          <span>F: {suggestion.fatG}g</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {language === 'es'
                      ? 'No se encontraron sustitutos'
                      : 'No substitutes found'}
                  </p>
                )}
              </div>
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowSwapModal(false);
                    setSwapItem(null);
                    setSwapSuggestions([]);
                  }}
                >
                  {t('close')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Hidden export card for image generation */}
        <div className="fixed -left-[9999px] top-0" aria-hidden="true">
          <div ref={planCardRef} className="bg-white p-6 w-[600px]">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-800">Kalyrax</h2>
              <p className="text-gray-500">{language === 'es' ? 'Tu Plan Semanal' : 'Your Weekly Plan'}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                {language === 'es' ? 'Objetivos Diarios' : 'Daily Targets'}
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div><span className="font-bold text-orange-600">{targets.kcal}</span><br/>kcal</div>
                <div><span className="font-bold text-blue-600">{targets.carbG}g</span><br/>{language === 'es' ? 'Carbs' : 'Carbs'}</div>
                <div><span className="font-bold text-red-600">{targets.proteinG}g</span><br/>{language === 'es' ? 'Proteína' : 'Protein'}</div>
                <div><span className="font-bold text-yellow-600">{targets.fatG}g</span><br/>{language === 'es' ? 'Grasa' : 'Fat'}</div>
              </div>
            </div>
            {mealPlan?.days?.slice(0, 3).map((day, idx) => (
              <div key={idx} className="mb-3 border-b pb-2">
                <h4 className="font-semibold">{DAYS[idx]?.[language === 'es' ? 'es' : 'en']}</h4>
                <p className="text-sm text-gray-600">
                  {day.meals?.map(m => m.name).join(' • ')}
                </p>
              </div>
            ))}
            <p className="text-xs text-gray-400 text-center mt-4">
              {language === 'es' ? 'Crea tu plan en Kalyrax' : 'Create your plan at Kalyrax'}
            </p>
          </div>
        </div>
      </main>
      
      {/* Paywall Modal */}
      <Paywall
        isOpen={paywallOpen}
        onClose={closePaywall}
        feature={paywallProps.feature}
        source={paywallProps.source}
        limitType={paywallProps.limitType}
        remaining={paywallProps.remaining}
        limit={paywallProps.limit}
      />
    </div>
  );
}
