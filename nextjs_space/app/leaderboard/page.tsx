'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Trophy, Medal, Flame, Users, Crown, Star, Target,
  ChevronRight, Settings, Globe, Check
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  avatarSeed?: string;
  country?: string;
  points: number;
  totalDaysCompleted: number;
  currentStreak: number;
  bestStreak: number;
  challengesCompleted: number;
}

interface Template {
  id: string;
  name: string;
  nameEs: string;
}

interface MyStats {
  stats: Array<{
    templateId: string;
    pointsTotal: number;
    pointsWeekly: number;
    totalDaysCompleted: number;
    currentStreakDays: number;
    bestStreakDays: number;
    challengeCompletedCount: number;
    rank: number;
    totalParticipants: number;
    template: { name: string; nameEs: string };
  }>;
  totals: {
    totalPoints: number;
    weeklyPoints: number;
    totalDaysCompleted: number;
    challengesCompleted: number;
    bestStreak: number;
  };
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession() || {};
  const { language, t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'weekly' | 'all_time'>('weekly');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [optInStatus, setOptInStatus] = useState({
    publicOptIn: false,
    displayName: '',
    country: '',
    timezone: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [period, selectedTemplate]);

  // Early check for authenticated user - only true when session is resolved and user is logged in
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const isSessionResolved = status === 'authenticated' || status === 'unauthenticated';

  useEffect(() => {
    // Only fetch authenticated data when user is definitely authenticated
    // Do NOT run this effect when session is loading or unauthenticated
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    const loadAuthData = async () => {
      // Fetch my stats
      try {
        const statsRes = await fetch('/api/leaderboard/my-stats');
        if (statsRes.ok) {
          const data = await statsRes.json();
          setMyStats(data);
        }
      } catch { /* ignore */ }
      
      // Fetch opt-in status
      try {
        const optInRes = await fetch('/api/leaderboard/opt-in');
        if (optInRes.ok) {
          const data = await optInRes.json();
          setOptInStatus({
            publicOptIn: data.profile?.publicOptIn || false,
            displayName: data.profile?.displayName || '',
            country: data.profile?.country || '',
            timezone: data.profile?.timezone || '',
          });
        }
      } catch { /* ignore */ }
    };

    loadAuthData();
  }, [status, session]);

  const fetchLeaderboard = async () => {
    try {
      const params = new URLSearchParams({ period });
      if (selectedTemplate) params.set('template', selectedTemplate);
      
      const res = await fetch(`/api/leaderboard?${params}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const reloadAuthenticatedData = async () => {
    if (status !== 'authenticated' || !session?.user) return;
    
    try {
      const statsRes = await fetch('/api/leaderboard/my-stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setMyStats(data);
      }
    } catch { /* ignore */ }
  };

  const saveSettings = async () => {
    if (!isAuthenticated) return;
    setSaving(true);
    try {
      const res = await fetch('/api/leaderboard/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optInStatus),
      });
      if (res.ok) {
        setShowSettings(false);
        fetchLeaderboard();
        reloadAuthenticatedData();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const getAvatarColor = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash % 360)}, 70%, 50%)`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-300" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-gray-400">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              {t('globalLeaderboard')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'en' 
                ? 'Compete with others in nutrition challenges'
                : 'Compite con otros en retos de nutrición'}
            </p>
          </div>
          
          {session?.user && (
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(!showSettings)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              {t('privacySettings')}
            </Button>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('privacySettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="publicOptIn" className="flex-1">
                  {t('appearOnLeaderboard')}
                  <p className="text-sm text-muted-foreground font-normal">
                    {language === 'en' 
                      ? 'Show your progress publicly on the leaderboard'
                      : 'Muestra tu progreso públicamente en la tabla'}
                  </p>
                </Label>
                <button
                  id="publicOptIn"
                  onClick={() => setOptInStatus(s => ({ ...s, publicOptIn: !s.publicOptIn }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    optInStatus.publicOptIn ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                    optInStatus.publicOptIn ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              
              {optInStatus.publicOptIn && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="displayName">{t('displayName')}</Label>
                    <Input
                      id="displayName"
                      value={optInStatus.displayName}
                      onChange={(e) => setOptInStatus(s => ({ ...s, displayName: e.target.value }))}
                      placeholder={language === 'en' ? 'Enter display name' : 'Nombre para mostrar'}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">{t('country')}</Label>
                    <Input
                      id="country"
                      value={optInStatus.country}
                      onChange={(e) => setOptInStatus(s => ({ ...s, country: e.target.value }))}
                      placeholder={language === 'en' ? 'e.g., USA, Mexico' : 'ej., México, USA'}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? t('loading') : t('save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Stats */}
        {session?.user && myStats && myStats.totals.totalPoints > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  {language === 'en' ? 'Your Stats' : 'Tus Estadísticas'}
                </h3>
                {!optInStatus.publicOptIn && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {language === 'en' ? 'Private' : 'Privado'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-500">{myStats.totals.totalPoints}</p>
                  <p className="text-xs text-muted-foreground">{t('totalPoints')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{myStats.totals.weeklyPoints}</p>
                  <p className="text-xs text-muted-foreground">{t('weeklyPoints')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{myStats.totals.totalDaysCompleted}</p>
                  <p className="text-xs text-muted-foreground">{t('daysCompleted')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{myStats.totals.bestStreak}</p>
                  <p className="text-xs text-muted-foreground">{t('bestStreak')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">{myStats.totals.challengesCompleted}</p>
                  <p className="text-xs text-muted-foreground">{t('challengesCompletedCount')}</p>
                </div>
              </div>
              {myStats.stats.length > 0 && myStats.stats[0].rank && (
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                  <span className="text-sm text-muted-foreground">{t('yourRank')}: </span>
                  <span className="font-bold text-yellow-500">#{myStats.stats[0].rank}</span>
                  <span className="text-sm text-muted-foreground"> / {myStats.stats[0].totalParticipants}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex rounded-lg overflow-hidden border">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                period === 'weekly' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-muted'
              }`}
            >
              {t('weekly')}
            </button>
            <button
              onClick={() => setPeriod('all_time')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                period === 'all_time' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-muted'
              }`}
            >
              {t('allTime')}
            </button>
          </div>
          
          {templates.length > 0 && (
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="px-4 py-2 rounded-lg border bg-background text-sm"
            >
              <option value="">
                {language === 'en' ? 'All Challenges' : 'Todos los Retos'}
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {language === 'en' ? t.name : t.nameEs}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Leaderboard */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'en' 
                    ? 'No participants yet. Be the first!'
                    : '¡Aún no hay participantes. Sé el primero!'}
                </p>
                <Link href="/challenge" className="inline-block mt-4">
                  <Button className="gap-2">
                    <Target className="h-4 w-4" />
                    {t('startChallenge')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                      entry.rank <= 3 ? 'bg-yellow-500/5' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-12 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                        style={{ backgroundColor: getAvatarColor(entry.avatarSeed || entry.displayName) }}
                      >
                        {entry.displayName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{entry.displayName || t('anonymous')}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {entry.country && <span>{entry.country}</span>}
                          {entry.currentStreak > 0 && (
                            <span className="flex items-center gap-1">
                              <Flame className="h-3 w-3 text-orange-500" />
                              {entry.currentStreak}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Points */}
                    <div className="text-right">
                      <p className="font-bold text-lg">{entry.points}</p>
                      <p className="text-xs text-muted-foreground">{t('points')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA for non-authenticated users */}
        {!session?.user && (
          <Card className="mt-8 bg-gradient-to-r from-emerald-500 to-blue-500">
            <CardContent className="p-6 text-center text-white">
              <Trophy className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">
                {language === 'en' ? 'Ready to compete?' : '¿Listo para competir?'}
              </h3>
              <p className="mb-4 opacity-90">
                {language === 'en' 
                  ? 'Join the 7-Day High Protein Challenge and climb the leaderboard!'
                  : '¡Únete al Reto de 7 Días Alta Proteína y sube en la tabla!'}
              </p>
              <Link href="/signup?ref=leaderboard">
                <Button variant="secondary" className="gap-2">
                  {t('joinNow')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Documentation */}
        <div className="mt-8 text-sm text-muted-foreground">
          <h4 className="font-semibold mb-2">
            {language === 'en' ? 'How Points Work' : 'Cómo Funcionan los Puntos'}
          </h4>
          <ul className="space-y-1 list-disc list-inside">
            <li>{language === 'en' ? 'Complete a day: +10 points' : 'Completar un día: +10 puntos'}</li>
            <li>{language === 'en' ? 'Streak bonus: +5 per consecutive day (max +25)' : 'Bonus racha: +5 por día consecutivo (máx +25)'}</li>
            <li>{language === 'en' ? 'Complete challenge: +100 bonus points' : 'Completar reto: +100 puntos bonus'}</li>
            <li>{language === 'en' ? 'Share progress: +3 points (1x per day)' : 'Compartir progreso: +3 puntos (1x por día)'}</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
