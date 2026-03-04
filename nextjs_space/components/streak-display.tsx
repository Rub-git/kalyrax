'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from './providers';
import { Flame, Snowflake, Trophy, Target, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  streakFreezesAvailable: number;
  completedToday: boolean;
  isAtRisk: boolean;
  streakExpired: boolean;
  nextMilestone: number | null;
  daysToNextMilestone: number | null;
  earnedMilestones: number[];
  badges: Array<{ name: string; nameEs: string; icon: string; color: string }>;
}

interface StreakDisplayProps {
  compact?: boolean;
  showShare?: boolean;
  onShare?: () => void;
}

export function StreakDisplay({ compact = false, showShare = false, onShare }: StreakDisplayProps) {
  const { data: session, status } = useSession() || {};
  const { language, t } = useLanguage();
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchStreakInfo();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, session]);

  const fetchStreakInfo = async () => {
    try {
      const res = await fetch('/api/streak');
      if (res.ok) {
        const data = await res.json();
        setStreakInfo(data);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse flex items-center gap-2">
        <div className="w-8 h-8 bg-muted rounded-full"></div>
        <div className="h-4 w-16 bg-muted rounded"></div>
      </div>
    );
  }

  if (!streakInfo || status !== 'authenticated') {
    return null;
  }

  // Compact display for headers
  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
        streakInfo.currentStreak > 0 
          ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30' 
          : 'bg-muted'
      }`}>
        <Flame className={`w-4 h-4 ${
          streakInfo.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'
        }`} />
        <span className={`font-bold text-sm ${
          streakInfo.currentStreak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
        }`}>
          {streakInfo.currentStreak}
        </span>
        {streakInfo.isAtRisk && !streakInfo.completedToday && (
          <span className="text-xs text-amber-500 font-medium">!</span>
        )}
      </div>
    );
  }

  // Full display card
  return (
    <Card className={`overflow-hidden ${
      streakInfo.currentStreak >= 7 
        ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800' 
        : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            {t('streakTitle')}
          </h3>
          {showShare && streakInfo.currentStreak > 0 && (
            <Button size="sm" variant="ghost" onClick={onShare}>
              <Share2 className="w-4 h-4 mr-1" />
              {t('shareStreak')}
            </Button>
          )}
        </div>

        {/* Main streak display */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              streakInfo.currentStreak > 0
                ? 'bg-gradient-to-br from-orange-400 to-red-500'
                : 'bg-muted'
            }`}>
              <span className="text-2xl font-bold text-white">
                {streakInfo.currentStreak}
              </span>
            </div>
            {streakInfo.currentStreak >= 7 && (
              <span className="absolute -top-1 -right-1 text-lg">🔥</span>
            )}
          </div>
          <div>
            <p className="text-2xl font-bold">
              {streakInfo.currentStreak} {streakInfo.currentStreak === 1 ? t('streakDay') : t('streakDays')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('currentStreakLabel')}
            </p>
          </div>
        </div>

        {/* Status messages */}
        {streakInfo.isAtRisk && !streakInfo.completedToday && (
          <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-3 py-2 rounded-lg mb-3 text-sm flex items-center gap-2">
            <span>⚠️</span>
            {t('streakAtRisk')}
          </div>
        )}

        {streakInfo.completedToday && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-2 rounded-lg mb-3 text-sm flex items-center gap-2">
            <span>✓</span>
            {t('dayCompleted')}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
              <Trophy className="w-4 h-4" />
            </div>
            <p className="font-bold text-lg">{streakInfo.bestStreak}</p>
            <p className="text-xs text-muted-foreground">{t('bestStreakLabel')}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
              <Snowflake className="w-4 h-4" />
            </div>
            <p className="font-bold text-lg">{streakInfo.streakFreezesAvailable}</p>
            <p className="text-xs text-muted-foreground">{t('freezesAvailable')}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
              <Target className="w-4 h-4" />
            </div>
            {streakInfo.nextMilestone ? (
              <>
                <p className="font-bold text-lg">{streakInfo.daysToNextMilestone}</p>
                <p className="text-xs text-muted-foreground">{t('daysToGo')}</p>
              </>
            ) : (
              <>
                <p className="font-bold text-lg">🏆</p>
                <p className="text-xs text-muted-foreground">Max!</p>
              </>
            )}
          </div>
        </div>

        {/* Badges */}
        {streakInfo.badges && streakInfo.badges.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">{t('badges')}</p>
            <div className="flex flex-wrap gap-2">
              {streakInfo.badges.map((badge, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs font-medium"
                >
                  {badge.icon} {language === 'es' ? badge.nameEs : badge.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Next milestone */}
        {streakInfo.nextMilestone && streakInfo.currentStreak > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('nextMilestone')}</span>
              <span className="font-medium">
                {language === 'es' 
                  ? getMilestoneNameEs(streakInfo.nextMilestone)
                  : getMilestoneName(streakInfo.nextMilestone)
                }
              </span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, (streakInfo.currentStreak / streakInfo.nextMilestone) * 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getMilestoneName(days: number): string {
  const names: Record<number, string> = {
    3: '3-Day Warrior',
    7: 'Week Champion',
    14: 'Fortnight Fighter',
    30: 'Monthly Master',
    60: 'Consistency King',
    100: 'Century Legend',
  };
  return names[days] || `${days} Days`;
}

function getMilestoneNameEs(days: number): string {
  const names: Record<number, string> = {
    3: 'Guerrero de 3 Días',
    7: 'Campeón de la Semana',
    14: 'Luchador de Quincena',
    30: 'Maestro Mensual',
    60: 'Rey de la Constancia',
    100: 'Leyenda Centenaria',
  };
  return names[days] || `${days} Días`;
}
