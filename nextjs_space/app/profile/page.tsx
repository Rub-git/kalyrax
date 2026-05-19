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
  
  // Privacy settings
  const [socialEnabled, setSocialEnabled] = useState(true);
  const [showActivityToFriends, setShowActivityToFriends] = useState(true);
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);

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
          setWeightDisplay(profile.weightKg?.toString() ?? '');
          setHeightCmDisplay(profile.heightCm?.toString() ?? '');
          setActivityLevel(profile.activityLevel ?? 'moderate');
          setGoal(profile.goal ?? 'maintain');
          setMedicalFlags(profile.medicalFlags ?? []);
          setDietaryPrefs(profile.dietaryPrefs ?? []);
          
          // Privacy settings
          setSocialEnabled(profile.socialEnabled ?? true);
          setShowActivityToFriends(profile.showActivityToFriends ?? true);
          setAllowFriendRequests(profile.allowFriendRequests ?? true);
          setShowOnLeaderboard(profile.showOnLeaderboard ?? true);
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
          weightKg: getWeightKg(),
          heightCm: getHeightCm(),
          activityLevel,
          goal,
          medicalFlags,
          dietaryPrefs,
          languagePreference: language,
          socialEnabled,
          showActivityToFriends,
          allowFriendRequests,
          showOnLeaderboard,
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
            weightKg: getWeightKg(),
            heightCm: getHeightCm(),
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
              <span className="text-sm text-blue-700 font-medium animate-fade-in">
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('weight')}</Label>
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

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('privacySettings')}</CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Controla cómo interactúas con otros usuarios'
                  : 'Control how you interact with other users'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">{t('socialEnabled')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' 
                      ? 'Habilita o deshabilita todas las funciones sociales'
                      : 'Enable or disable all social features'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSocialEnabled(!socialEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    socialEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      socialEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {socialEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">{t('showActivityToFriends')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'es' 
                          ? 'Tus amigos pueden ver tu actividad'
                          : 'Your friends can see your activity'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowActivityToFriends(!showActivityToFriends)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showActivityToFriends ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showActivityToFriends ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">{t('allowFriendRequests')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'es' 
                          ? 'Otros usuarios pueden enviarte solicitudes'
                          : 'Other users can send you friend requests'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAllowFriendRequests(!allowFriendRequests)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        allowFriendRequests ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          allowFriendRequests ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">{t('showOnLeaderboard')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'es' 
                          ? 'Aparecer en las tablas de posiciones'
                          : 'Appear on public leaderboards'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOnLeaderboard(!showOnLeaderboard)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showOnLeaderboard ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showOnLeaderboard ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}
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
