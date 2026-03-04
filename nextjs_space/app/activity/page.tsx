'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Trophy, Users, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  userId: string;
  eventType: string;
  referenceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    profile: {
      displayName: string | null;
      avatarSeed: string | null;
    } | null;
  };
  userReaction: string | null;
  reactionCounts: {
    fire: number;
    muscle: number;
    clap: number;
  };
}

function getAvatarUrl(seed: string | null, name: string | null): string {
  const s = seed || name || 'default';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s)}`;
}

const REACTIONS = [
  { type: 'fire', emoji: '🔥' },
  { type: 'muscle', emoji: '💪' },
  { type: 'clap', emoji: '👏' },
];

export default function ActivityPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reacting, setReacting] = useState<string | null>(null);

  const userId = (session?.user as { userId?: string })?.userId;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchActivities();
    }
  }, [status]);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activity');
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (activityId: string, reactionType: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    setReacting(activityId);
    try {
      const isRemoving = activity.userReaction === reactionType;
      await fetch('/api/activity/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          reactionType,
          remove: isRemoving,
        }),
      });

      // Update local state
      setActivities(prev => prev.map(a => {
        if (a.id !== activityId) return a;
        const newCounts = { ...a.reactionCounts };
        if (isRemoving) {
          newCounts[reactionType as keyof typeof newCounts]--;
        } else {
          if (a.userReaction) {
            newCounts[a.userReaction as keyof typeof newCounts]--;
          }
          newCounts[reactionType as keyof typeof newCounts]++;
        }
        return {
          ...a,
          userReaction: isRemoving ? null : reactionType,
          reactionCounts: newCounts,
        };
      }));
    } catch (error) {
      console.error('Error reacting:', error);
    } finally {
      setReacting(null);
    }
  };

  const getEventDescription = (activity: ActivityItem): string => {
    const meta = activity.metadata as Record<string, unknown> | null;
    switch (activity.eventType) {
      case 'CHALLENGE_STARTED':
        return t('activityChallengeStarted');
      case 'DAY_COMPLETED':
        return `${t('dayCompleted')} ${meta?.dayNumber || ''}/${meta?.totalDays || ''}`;
      case 'CHALLENGE_COMPLETED':
        return t('activityChallengeCompleted');
      case 'STREAK_MILESTONE':
        return `${t('activityStreakMilestoneReached')} ${meta?.milestone || ''} ${t('activityDayStreak')}`;
      default:
        return activity.eventType;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'CHALLENGE_STARTED':
        return <Trophy className="h-5 w-5 text-blue-500" />;
      case 'DAY_COMPLETED':
        return <Activity className="h-5 w-5 text-green-500" />;
      case 'CHALLENGE_COMPLETED':
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case 'STREAK_MILESTONE':
        return <Flame className="h-5 w-5 text-orange-500" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-6">
          <Link
            href="/social"
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('friends')}</span>
          </Link>
          <Link
            href="/groups"
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">{t('groups')}</span>
          </Link>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors bg-background shadow text-primary"
          >
            <Flame className="h-4 w-4" />
            <span className="hidden sm:inline">{t('activity')}</span>
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Activity className="h-6 w-6" />
          {t('activityFeed')}
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : activities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('noActivity')}</p>
              <Link href="/social">
                <Button className="mt-4">Find Friends</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={activity.userId === userId ? 'border-primary/30' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={getAvatarUrl(
                            activity.user.profile?.avatarSeed || null,
                            activity.user.name
                          )}
                          alt="Avatar"
                          className="h-10 w-10 rounded-full bg-muted"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {activity.user.profile?.displayName || activity.user.name || 'User'}
                            </span>
                            {getEventIcon(activity.eventType)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {getEventDescription(activity)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                              locale: language === 'es' ? es : enUS,
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Reactions */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                        {REACTIONS.map(({ type, emoji }) => {
                          const count = activity.reactionCounts[type as keyof typeof activity.reactionCounts];
                          const isSelected = activity.userReaction === type;
                          return (
                            <button
                              key={type}
                              onClick={() => handleReaction(activity.id, type)}
                              disabled={reacting === activity.id}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                                isSelected
                                  ? 'bg-primary/10 text-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <span>{emoji}</span>
                              {count > 0 && <span>{count}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
