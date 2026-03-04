'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Trash2,
  Search,
  Loader2,
  Flame,
  Wheat,
  Beef,
  Droplets,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addDays, subDays } from 'date-fns';

interface TrackingEntry {
  id: string;
  mealType: string;
  quantity: number;
  unit: string;
  food: {
    id: string;
    name: string;
    nameEs: string;
    kcal: number;
    carbG: number;
    proteinG: number;
    fatG: number;
    servingSize: number;
    servingUnit: string;
  };
}

interface FoodItem {
  id: string;
  name: string;
  nameEs: string;
  category: string;
  kcal: number;
  carbG: number;
  proteinG: number;
  fatG: number;
  servingSize: number;
  servingUnit: string;
}

interface Targets {
  kcal: number;
  carbG: number;
  proteinG: number;
  fatG: number;
}

export default function TrackingPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<TrackingEntry[]>([]);
  const [totals, setTotals] = useState({ kcal: 0, carbG: 0, proteinG: 0, fatG: 0, fiberG: 0 });
  const [targets, setTargets] = useState<Targets>({ kcal: 2000, carbG: 250, proteinG: 75, fatG: 55 });
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated') {
      fetchTargets();
      fetchEntries();
    }
  }, [status, router, selectedDate]);

  const fetchTargets = async () => {
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
    } catch (err) {
      console.error('Failed to fetch targets:', err);
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`/api/tracking?date=${dateStr}`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.data?.entries ?? []);
        setTotals(data.data?.totals ?? { kcal: 0, carbG: 0, proteinG: 0, fatG: 0, fiberG: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchFoods = async (query: string) => {
    if (!query.trim()) {
      setFoods([]);
      return;
    }
    try {
      const res = await fetch(`/api/foods?search=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setFoods(data.data ?? []);
      }
    } catch (err) {
      console.error('Failed to search foods:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchFoods(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddEntry = async () => {
    if (!selectedFood || !quantity) return;

    setAddLoading(true);
    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          mealType,
          foodId: selectedFood.id,
          quantity: Number(quantity),
          unit: selectedFood.servingUnit,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setSelectedFood(null);
        setQuantity('');
        setSearchQuery('');
        fetchEntries();
      }
    } catch (err) {
      console.error('Failed to add entry:', err);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await fetch(`/api/tracking/${id}`, { method: 'DELETE' });
      fetchEntries();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const getProgress = (consumed: number, target: number) => {
    return Math.min((consumed / target) * 100, 100);
  };

  const mealTypes = [
    { value: 'breakfast', label: t('breakfast') },
    { value: 'snack_am', label: t('snack_am') },
    { value: 'lunch', label: t('lunch') },
    { value: 'snack_pm', label: t('snack_pm') },
    { value: 'dinner', label: t('dinner') },
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('tracking')}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-4 py-2 bg-white rounded-lg border font-medium">
              {format(selectedDate, 'MMM d, yyyy')}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              disabled={format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">{t('kcal')}</span>
                </div>
                <p className="text-2xl font-bold">{totals.kcal}</p>
                <p className="text-xs text-muted-foreground">{t('of')} {targets.kcal}</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 progress-bar"
                    style={{ width: `${getProgress(totals.kcal, targets.kcal)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wheat className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{t('carbohydrates')}</span>
                </div>
                <p className="text-2xl font-bold">{totals.carbG}g</p>
                <p className="text-xs text-muted-foreground">{t('of')} {targets.carbG}g</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 progress-bar"
                    style={{ width: `${getProgress(totals.carbG, targets.carbG)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Beef className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">{t('protein')}</span>
                </div>
                <p className="text-2xl font-bold">{totals.proteinG}g</p>
                <p className="text-xs text-muted-foreground">{t('of')} {targets.proteinG}g</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 progress-bar"
                    style={{ width: `${getProgress(totals.proteinG, targets.proteinG)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="h-4 w-4 text-pink-500" />
                  <span className="text-sm font-medium">{t('fat')}</span>
                </div>
                <p className="text-2xl font-bold">{totals.fatG}g</p>
                <p className="text-xs text-muted-foreground">{t('of')} {targets.fatG}g</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 progress-bar"
                    style={{ width: `${getProgress(totals.fatG, targets.fatG)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Entries List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('dailyProgress')}</CardTitle>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addFood')}
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'es' ? 'No hay alimentos registrados' : 'No foods logged yet'}
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => {
                  const multiplier = entry.quantity / (entry.food?.servingSize ?? 1);
                  const kcal = Math.round((entry.food?.kcal ?? 0) * multiplier);
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {language === 'es' ? entry.food?.nameEs : entry.food?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.quantity} {entry.unit} • {mealTypes.find(m => m.value === entry.mealType)?.label}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-orange-600">{kcal} kcal</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Food Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">{t('addFood')}</h3>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('searchFoods')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Search Results */}
                {foods.length > 0 && !selectedFood && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {foods.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => {
                          setSelectedFood(food);
                          setQuantity(food.servingSize.toString());
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <p className="font-medium">
                          {language === 'es' ? food.nameEs : food.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {food.kcal} kcal / {food.servingSize}{food.servingUnit}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Food */}
                {selectedFood && (
                  <div className="space-y-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="font-medium text-primary">
                        {language === 'es' ? selectedFood.nameEs : selectedFood.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFood.kcal} kcal / {selectedFood.servingSize}{selectedFood.servingUnit}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-auto p-0 text-xs"
                        onClick={() => setSelectedFood(null)}
                      >
                        {language === 'es' ? 'Cambiar' : 'Change'}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('quantity')} ({selectedFood.servingUnit})</Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'es' ? 'Tipo de Comida' : 'Meal Type'}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {mealTypes.map((meal) => (
                          <Button
                            key={meal.value}
                            type="button"
                            variant={mealType === meal.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMealType(meal.value)}
                          >
                            {meal.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  {t('cancel')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddEntry}
                  disabled={!selectedFood || !quantity || addLoading}
                >
                  {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
