'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Loader2, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', labelEn: 'Sedentary', labelEs: 'Sedentario' },
  { value: 'light', labelEn: 'Light', labelEs: 'Ligero' },
  { value: 'moderate', labelEn: 'Moderate', labelEs: 'Moderado' },
  { value: 'active', labelEn: 'Active', labelEs: 'Activo' },
  { value: 'very_active', labelEn: 'Very Active', labelEs: 'Muy Activo' },
];

const GOALS = [
  { value: 'maintain', labelEn: 'Maintain Weight', labelEs: 'Mantener Peso' },
  { value: 'lose_weight', labelEn: 'Lose Weight', labelEs: 'Perder Peso' },
  { value: 'gain_weight', labelEn: 'Gain Weight', labelEs: 'Ganar Peso' },
  { value: 'improve_health', labelEn: 'Improve Health', labelEs: 'Mejorar Salud' },
];

const MEDICAL_FLAGS = [
  { value: 'pregnancy', labelEn: 'Pregnancy', labelEs: 'Embarazo' },
  { value: 'lactation', labelEn: 'Lactation', labelEs: 'Lactancia' },
  { value: 'diabetes', labelEn: 'Diabetes', labelEs: 'Diabetes' },
  { value: 'renal', labelEn: 'Kidney Issues', labelEs: 'Problemas Renales' },
  { value: 'eating_disorder', labelEn: 'Eating Disorder', labelEs: 'Trastorno Alimenticio' },
  { value: 'allergies', labelEn: 'Food Allergies', labelEs: 'Alergias' },
];

const DIETARY_PREFS = [
  { value: 'vegetarian', labelEn: 'Vegetarian', labelEs: 'Vegetariano' },
  { value: 'vegan', labelEn: 'Vegan', labelEs: 'Vegano' },
  { value: 'lactose_free', labelEn: 'Lactose-Free', labelEs: 'Sin Lactosa' },
  { value: 'gluten_free', labelEn: 'Gluten-Free', labelEs: 'Sin Gluten' },
  { value: 'budget_conscious', labelEn: 'Budget-Conscious', labelEs: 'Económico' },
];

export default function OnboardingPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft_in'>('cm');
  const [weightDisplay, setWeightDisplay] = useState('');
  const [heightCmDisplay, setHeightCmDisplay] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('maintain');
  const [medicalFlags, setMedicalFlags] = useState<string[]>([]);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.replace('/login');
    return null;
  }

  const toggleMedicalFlag = (flag: string) => {
    setMedicalFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  };

  const toggleDietaryPref = (pref: string) => {
    setDietaryPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const getWeightKg = (): number => {
    if (weightUnit === 'kg') return parseFloat(weightDisplay) || 0;
    return (parseFloat(weightDisplay) || 0) / 2.20462;
  };

  const getHeightCm = (): number => {
    if (heightUnit === 'cm') return parseFloat(heightCmDisplay) || 0;
    return (parseFloat(heightFt) || 0) * 30.48 + (parseFloat(heightIn) || 0) * 2.54;
  };

  const isWeightValid = (): boolean => {
    const v = parseFloat(weightDisplay);
    if (isNaN(v)) return false;
    return weightUnit === 'kg' ? v >= 30 && v <= 300 : v >= 66 && v <= 660;
  };

  const isHeightValid = (): boolean => {
    if (heightUnit === 'cm') {
      const v = parseFloat(heightCmDisplay);
      return !isNaN(v) && v >= 100 && v <= 250;
    }
    const ft = parseFloat(heightFt);
    const inches = parseFloat(heightIn) || 0;
    return !isNaN(ft) && ft >= 3 && ft <= 8 && inches >= 0 && inches <= 11;
  };

  const handleWeightUnitChange = (newUnit: 'kg' | 'lb') => {
    if (weightDisplay) {
      const v = parseFloat(weightDisplay);
      if (!isNaN(v)) {
        if (newUnit === 'lb' && weightUnit === 'kg') {
          setWeightDisplay((v * 2.20462).toFixed(1));
        } else if (newUnit === 'kg' && weightUnit === 'lb') {
          setWeightDisplay((v / 2.20462).toFixed(1));
        }
      }
    }
    setWeightUnit(newUnit);
  };

  const handleHeightUnitChange = (newUnit: 'cm' | 'ft_in') => {
    if (newUnit === 'ft_in' && heightUnit === 'cm' && heightCmDisplay) {
      const cm = parseFloat(heightCmDisplay);
      if (!isNaN(cm)) {
        const totalInches = cm / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        setHeightFt(ft.toString());
        setHeightIn(inches.toString());
      }
    } else if (newUnit === 'cm' && heightUnit === 'ft_in') {
      const cm = (parseFloat(heightFt) || 0) * 30.48 + (parseFloat(heightIn) || 0) * 2.54;
      if (cm > 0) setHeightCmDisplay(Math.round(cm).toString());
    }
    setHeightUnit(newUnit);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // Save profile
      const profileRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: Number(age),
          sex,
          weightKg: getWeightKg(),
          heightCm: getHeightCm(),
          activityLevel,
          goal,
          medicalFlags,
          dietaryPrefs,
        }),
      });

      if (!profileRes.ok) {
        throw new Error('Failed to save profile');
      }

      // Calculate nutrition and save
      const calcRes = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: Number(age),
          sex,
          weightKg: getWeightKg(),
          heightCm: getHeightCm(),
          activityLevel,
          goal,
          saveToProfile: true,
        }),
      });

      if (!calcRes.ok) {
        throw new Error('Failed to calculate nutrition');
      }

      router.replace('/dashboard');
    } catch (err) {
      setError(language === 'es' ? 'Error al guardar perfil' : 'Failed to save profile');
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      const heightFilled = heightUnit === 'cm' ? heightCmDisplay : heightFt;
      return age && sex && weightDisplay && heightFilled && isWeightValid() && isHeightValid();
    }
    if (step === 2) return activityLevel && goal;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('completeProfile')}</CardTitle>
          <CardDescription>{t('startOnboarding')}</CardDescription>

          {/* Progress */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">{t('age')}</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min={1}
                      max={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('sex')}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={sex === 'male' ? 'default' : 'outline'}
                        onClick={() => setSex('male')}
                        className="w-full"
                      >
                        {t('male')}
                      </Button>
                      <Button
                        type="button"
                        variant={sex === 'female' ? 'default' : 'outline'}
                        onClick={() => setSex('female')}
                        className="w-full"
                      >
                        {t('female')}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="weight">{t('weight')}</Label>
                      <div className="flex rounded-md overflow-hidden border text-xs">
                        <button type="button" onClick={() => handleWeightUnitChange('kg')}
                          className={`px-2 py-1 ${weightUnit === 'kg' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                          kg
                        </button>
                        <button type="button" onClick={() => handleWeightUnitChange('lb')}
                          className={`px-2 py-1 ${weightUnit === 'lb' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                          lb
                        </button>
                      </div>
                    </div>
                    <Input
                      id="weight"
                      type="number"
                      placeholder={weightUnit === 'kg' ? '70' : '154'}
                      value={weightDisplay}
                      onChange={(e) => setWeightDisplay(e.target.value)}
                      step={0.1}
                    />
                    {weightDisplay && !isWeightValid() && (
                      <p className="text-xs text-destructive">
                        {weightUnit === 'kg'
                          ? (language === 'es' ? 'Rango válido: 30–300 kg' : 'Valid range: 30–300 kg')
                          : (language === 'es' ? 'Rango válido: 66–660 lb' : 'Valid range: 66–660 lb')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('height')}</Label>
                      <div className="flex rounded-md overflow-hidden border text-xs">
                        <button type="button" onClick={() => handleHeightUnitChange('cm')}
                          className={`px-2 py-1 ${heightUnit === 'cm' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                          cm
                        </button>
                        <button type="button" onClick={() => handleHeightUnitChange('ft_in')}
                          className={`px-2 py-1 ${heightUnit === 'ft_in' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                          ft/in
                        </button>
                      </div>
                    </div>
                    {heightUnit === 'cm' ? (
                      <Input
                        id="height"
                        type="number"
                        placeholder="170"
                        value={heightCmDisplay}
                        onChange={(e) => setHeightCmDisplay(e.target.value)}
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Input
                            type="number"
                            placeholder="5"
                            value={heightFt}
                            onChange={(e) => setHeightFt(e.target.value)}
                            min={3}
                            max={8}
                          />
                          <p className="text-xs text-muted-foreground text-center">ft</p>
                        </div>
                        <div className="space-y-1">
                          <Input
                            type="number"
                            placeholder="7"
                            value={heightIn}
                            onChange={(e) => setHeightIn(e.target.value)}
                            min={0}
                            max={11}
                          />
                          <p className="text-xs text-muted-foreground text-center">in</p>
                        </div>
                      </div>
                    )}
                    {!isHeightValid() && (heightUnit === 'cm' ? heightCmDisplay : heightFt) && (
                      <p className="text-xs text-destructive">
                        {heightUnit === 'cm'
                          ? (language === 'es' ? 'Rango válido: 100–250 cm' : 'Valid range: 100–250 cm')
                          : (language === 'es' ? 'Rango válido: 3–8 ft, 0–11 in' : 'Valid range: 3–8 ft, 0–11 in')}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>{t('activityLevel')}</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {ACTIVITY_LEVELS.map((level) => (
                      <Button
                        key={level.value}
                        type="button"
                        variant={activityLevel === level.value ? 'default' : 'outline'}
                        onClick={() => setActivityLevel(level.value)}
                        className="w-full justify-start"
                      >
                        {language === 'es' ? level.labelEs : level.labelEn}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('goal')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {GOALS.map((g) => (
                      <Button
                        key={g.value}
                        type="button"
                        variant={goal === g.value ? 'default' : 'outline'}
                        onClick={() => setGoal(g.value)}
                        className="w-full text-sm"
                      >
                        {language === 'es' ? g.labelEs : g.labelEn}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>{t('medicalConditions')}</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {language === 'es' ? 'Selecciona si aplica' : 'Select if applicable'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {MEDICAL_FLAGS.map((flag) => (
                      <Button
                        key={flag.value}
                        type="button"
                        variant={medicalFlags.includes(flag.value) ? 'default' : 'outline'}
                        onClick={() => toggleMedicalFlag(flag.value)}
                        className="w-full text-sm"
                      >
                        {language === 'es' ? flag.labelEs : flag.labelEn}
                      </Button>
                    ))}
                  </div>
                </div>

                {medicalFlags.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">{t('medicalWarning')}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{t('dietaryPreferences')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIETARY_PREFS.map((pref) => (
                      <Button
                        key={pref.value}
                        type="button"
                        variant={dietaryPrefs.includes(pref.value) ? 'default' : 'outline'}
                        onClick={() => toggleDietaryPref(pref.value)}
                        className="w-full text-sm"
                      >
                        {language === 'es' ? pref.labelEs : pref.labelEn}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-4 bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                {language === 'es' ? 'Atrás' : 'Back'}
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                {language === 'es' ? 'Siguiente' : 'Next'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'es' ? 'Guardando...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    {language === 'es' ? 'Completar' : 'Complete'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
