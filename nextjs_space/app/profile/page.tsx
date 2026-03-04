'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  User,
  Loader2,
  Save,
  LogOut,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function ProfilePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('maintain');
  const [medicalFlags, setMedicalFlags] = useState<string[]>([]);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.success) {
        const user = data.data?.user;
        const profile = data.data?.profile;

        setName(user?.name ?? '');
        setEmail(user?.email ?? '');

        if (profile) {
          setAge(profile.age?.toString() ?? '');
          setSex(profile.sex ?? '');
          setWeightKg(profile.weightKg?.toString() ?? '');
          setHeightCm(profile.heightCm?.toString() ?? '');
          setActivityLevel(profile.activityLevel ?? 'moderate');
          setGoal(profile.goal ?? 'maintain');
          setMedicalFlags(profile.medicalFlags ?? []);
          setDietaryPrefs(profile.dietaryPrefs ?? []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          age: Number(age),
          sex,
          weightKg: Number(weightKg),
          heightCm: Number(heightCm),
          activityLevel,
          goal,
          medicalFlags,
          dietaryPrefs,
          languagePreference: language,
        }),
      });

      if (res.ok) {
        // Recalculate
        await fetch('/api/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            age: Number(age),
            sex,
            weightKg: Number(weightKg),
            heightCm: Number(heightCm),
            activityLevel,
            goal,
            saveToProfile: true,
          }),
        });

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              {t('profile')}
            </h1>
            {saved && (
              <span className="text-sm text-green-600 font-medium animate-fade-in">
                ✓ {language === 'es' ? 'Guardado' : 'Saved'}
              </span>
            )}
          </div>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'es' ? 'Información de Cuenta' : 'Account Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('name')}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('email')}</Label>
                <Input value={email} disabled className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {language === 'es' ? 'Idioma' : 'Language'}
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={language === 'en' ? 'default' : 'outline'}
                    onClick={() => setLanguage('en')}
                    className="flex-1"
                  >
                    English
                  </Button>
                  <Button
                    type="button"
                    variant={language === 'es' ? 'default' : 'outline'}
                    onClick={() => setLanguage('es')}
                    className="flex-1"
                  >
                    Español
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Physical Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'es' ? 'Información Física' : 'Physical Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('age')}</Label>
                  <Input
                    type="number"
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
                      size="sm"
                    >
                      {t('male')}
                    </Button>
                    <Button
                      type="button"
                      variant={sex === 'female' ? 'default' : 'outline'}
                      onClick={() => setSex('female')}
                      size="sm"
                    >
                      {t('female')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('weight')} (kg)</Label>
                  <Input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    min={20}
                    max={500}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('height')} (cm)</Label>
                  <Input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    min={50}
                    max={300}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('activityLevel')}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ACTIVITY_LEVELS.map((level) => (
                    <Button
                      key={level.value}
                      type="button"
                      variant={activityLevel === level.value ? 'default' : 'outline'}
                      onClick={() => setActivityLevel(level.value)}
                      size="sm"
                      className="text-xs"
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
                      size="sm"
                      className="text-xs"
                    >
                      {language === 'es' ? g.labelEs : g.labelEn}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health & Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'es' ? 'Salud y Preferencias' : 'Health & Preferences'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('medicalConditions')}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MEDICAL_FLAGS.map((flag) => (
                    <Button
                      key={flag.value}
                      type="button"
                      variant={medicalFlags.includes(flag.value) ? 'default' : 'outline'}
                      onClick={() => toggleMedicalFlag(flag.value)}
                      size="sm"
                      className="text-xs"
                    >
                      {language === 'es' ? flag.labelEs : flag.labelEn}
                    </Button>
                  ))}
                </div>
              </div>

              {medicalFlags.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800">{t('medicalWarning')}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t('dietaryPreferences')}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DIETARY_PREFS.map((pref) => (
                    <Button
                      key={pref.value}
                      type="button"
                      variant={dietaryPrefs.includes(pref.value) ? 'default' : 'outline'}
                      onClick={() => toggleDietaryPref(pref.value)}
                      size="sm"
                      className="text-xs"
                    >
                      {language === 'es' ? pref.labelEs : pref.labelEn}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'es' ? 'Guardando...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('saveProfile')}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('logout')}
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
