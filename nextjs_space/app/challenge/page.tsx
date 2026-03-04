'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { StreakDisplay } from '@/components/streak-display';
import { SharePromptModal } from '@/components/share-prompt-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Trophy, Target, Flame, Check, Share2, Copy, 
  ChevronRight, Zap, Calendar, Star, Users,
  MessageCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';

interface ChallengeTemplate {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  durationDays: number;
  macroRules: Record<string, unknown>;
}

interface ChallengeInstance {
  id: string;
  templateId: string;
  startDate: string;
  endDate: string;
  status: string;
  template: ChallengeTemplate;
  progress: Array<{
    id: string;
    dayNumber: number;
    completed: boolean;
    completedAt: string | null;
    proteinConsumed: number | null;
  }>;
  shares: Array<{ slug: string }>;
}

interface MyStats {
  totals: {
    totalPoints: number;
    weeklyPoints: number;
    totalDaysCompleted: number;
    challengesCompleted: number;
    bestStreak: number;
  };
  stats: Array<{
    pointsTotal: number;
    currentStreakDays: number;
    bestStreakDays: number;
    rank: number;
    totalParticipants: number;
  }>;
}

export default function ChallengePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { language, t } = useLanguage();
  const [templates, setTemplates] = useState<ChallengeTemplate[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<ChallengeInstance | null>(null);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [proteinInput, setProteinInput] = useState('');
  const [completionMessage, setCompletionMessage] = useState('');
  const shareCardRef = useRef<HTMLDivElement>(null);
  
  // Share prompt modal state
  const [sharePromptData, setSharePromptData] = useState<{
    isOpen: boolean;
    type: 'streak' | 'challenge_day' | 'challenge_complete' | 'leaderboard';
    milestone: number;
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch templates
      const templatesRes = await fetch('/api/challenge/templates');
      const templatesData = await templatesRes.json();
      setTemplates(templatesData.templates || []);

      // Fetch active challenges
      const activeRes = await fetch('/api/challenge/active');
      const activeData = await activeRes.json();
      if (activeData.challenges?.length > 0) {
        setActiveChallenge(activeData.challenges[0]);
      }

      // Fetch my stats
      const statsRes = await fetch('/api/leaderboard/my-stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setMyStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startChallenge = async (templateId: string) => {
    setStarting(true);
    try {
      const res = await fetch('/api/challenge/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveChallenge(data.challenge);
        fetchData(); // Refresh stats
      } else {
        alert(data.error || 'Failed to start challenge');
      }
    } catch (error) {
      console.error('Error starting challenge:', error);
    } finally {
      setStarting(false);
    }
  };

  const completeDay = async () => {
    if (!activeChallenge) return;
    
    const nextDay = activeChallenge.progress.find(p => !p.completed);
    if (!nextDay) return;

    setCompleting(true);
    setCompletionMessage('');
    try {
      const res = await fetch(`/api/challenge/${activeChallenge.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: nextDay.dayNumber,
          proteinConsumed: proteinInput ? parseFloat(proteinInput) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCompletionMessage(
          language === 'en'
            ? `🎉 Day ${nextDay.dayNumber} complete! +${data.pointsEarned} points!`
            : `🎉 ¡Día ${nextDay.dayNumber} completado! +${data.pointsEarned} puntos!`
        );
        setProteinInput('');
        fetchData();
        
        // Check if we should show a share prompt (viral trigger)
        if (data.sharePrompt) {
          // First create the share link
          const shareRes = await fetch(`/api/challenge/${activeChallenge.id}/share`, { method: 'POST' });
          const shareData = await shareRes.json();
          if (shareRes.ok) {
            setShareLink(`${window.location.origin}/c/${shareData.share.slug}`);
            
            // Delay showing modal to let user see completion message first
            setTimeout(() => {
              setSharePromptData({
                isOpen: true,
                type: data.sharePrompt.type as 'streak' | 'challenge_day' | 'challenge_complete',
                milestone: data.sharePrompt.milestone,
              });
            }, 1500);
          }
        }
      } else {
        alert(data.error || 'Failed to complete day');
      }
    } catch (error) {
      console.error('Error completing day:', error);
    } finally {
      setCompleting(false);
    }
  };

  const shareProgress = async () => {
    if (!activeChallenge) return;
    try {
      const res = await fetch(`/api/challenge/${activeChallenge.id}/share`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        const baseUrl = window.location.origin;
        setShareLink(`${baseUrl}/c/${data.share.slug}`);
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Error creating share:', error);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportShareCard = async () => {
    if (!shareCardRef.current) return;
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        quality: 0.95,
        width: 600,
        height: 400,
        backgroundColor: '#1f2937',
      });
      const link = document.createElement('a');
      link.download = `challenge-progress.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  const daysCompleted = activeChallenge?.progress.filter(p => p.completed).length || 0;
  const totalDays = activeChallenge?.template.durationDays || 0;
  const progressPercent = totalDays > 0 ? (daysCompleted / totalDays) * 100 : 0;
  const currentRank = myStats?.stats?.[0]?.rank;
  const nextDay = activeChallenge?.progress.find(p => !p.completed);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header with Streak */}
        <div className="flex items-start justify-between mb-8">
          <div className="text-center flex-1">
            <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-600 dark:text-emerald-400 px-4 py-2 rounded-full text-sm mb-4">
              <Flame className="h-4 w-4" />
              {t('challenge')}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {language === 'en' ? '7-Day Nutrition Challenge' : 'Reto de Nutrición de 7 Días'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'en' 
                ? 'Complete daily goals, earn points, and compete on the leaderboard!'
                : '¡Completa metas diarias, gana puntos y compite en la tabla de posiciones!'}
            </p>
          </div>
          <div className="hidden md:block">
            <StreakDisplay compact />
          </div>
        </div>

        {/* Streak Card - Mobile */}
        <div className="md:hidden mb-6">
          <StreakDisplay />
        </div>

        {/* My Stats Quick View */}
        {myStats && myStats.totals.totalPoints > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-cyan-500">{myStats.totals.totalPoints}</p>
                  <p className="text-xs text-muted-foreground">{t('totalPoints')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">{myStats.totals.bestStreak}</p>
                  <p className="text-xs text-muted-foreground">{t('bestStreak')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{myStats.totals.challengesCompleted}</p>
                  <p className="text-xs text-muted-foreground">{t('challengesCompletedCount')}</p>
                </div>
                {currentRank && (
                  <div>
                    <p className="text-2xl font-bold text-yellow-500">#{currentRank}</p>
                    <p className="text-xs text-muted-foreground">{t('yourRank')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Challenge */}
        {activeChallenge ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-cyan-500" />
                      {language === 'en' ? activeChallenge.template.name : activeChallenge.template.nameEs}
                    </CardTitle>
                    <CardDescription>
                      {activeChallenge.status === 'completed' 
                        ? (language === 'en' ? '🎉 Challenge Completed!' : '🎉 ¡Reto Completado!')
                        : (language === 'en' ? `Day ${daysCompleted + 1} of ${totalDays}` : `Día ${daysCompleted + 1} de ${totalDays}`)}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={shareProgress} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    {t('shareProgress')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      {daysCompleted} / {totalDays} {t('days')}
                    </span>
                    <span className="font-medium text-cyan-500">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Day Pills */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {activeChallenge.progress.map((day) => (
                    <div
                      key={day.dayNumber}
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-medium transition-all ${
                        day.completed
                          ? 'bg-cyan-500 text-white'
                          : day.dayNumber === nextDay?.dayNumber
                            ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-500'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {day.completed ? <Check className="h-5 w-5" /> : day.dayNumber}
                    </div>
                  ))}
                </div>

                {/* Completion Message */}
                <AnimatePresence>
                  {completionMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-center p-4 bg-cyan-500/20 rounded-lg text-cyan-600 dark:text-emerald-400 font-medium"
                    >
                      {completionMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Complete Day Form */}
                {activeChallenge.status === 'active' && nextDay && (
                  <div className="pt-4 border-t space-y-4">
                    <div className="text-center">
                      <p className="font-medium mb-2">
                        {language === 'en' ? `Complete Day ${nextDay.dayNumber}` : `Completar Día ${nextDay.dayNumber}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'en' 
                          ? 'Track your protein intake (optional)'
                          : 'Registra tu consumo de proteína (opcional)'}
                      </p>
                    </div>
                    <div className="flex gap-3 max-w-sm mx-auto">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder={language === 'en' ? 'Protein (g)' : 'Proteína (g)'}
                          value={proteinInput}
                          onChange={(e) => setProteinInput(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={completeDay} 
                        disabled={completing}
                        className="gap-2 bg-cyan-600 hover:bg-cyan-700"
                      >
                        {completing ? (
                          <span className="animate-spin">...</span>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            {t('markComplete')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Challenge Completed State */}
                {activeChallenge.status === 'completed' && (
                  <div className="text-center pt-4 border-t">
                    <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <p className="font-medium text-lg mb-4">
                      {language === 'en' 
                        ? 'Congratulations! You completed the challenge!'
                        : '¡Felicidades! ¡Completaste el reto!'}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={shareProgress} className="gap-2">
                        <Share2 className="h-4 w-4" />
                        {t('shareProgress')}
                      </Button>
                      <Link href="/leaderboard">
                        <Button className="gap-2">
                          <Trophy className="h-4 w-4" />
                          {t('viewLeaderboard')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* No Active Challenge - Show Templates */
          <div className="space-y-6">
            {templates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/3 bg-gradient-to-br from-cyan-500 to-blue-500 p-6 text-white flex flex-col justify-center">
                    <Zap className="h-12 w-12 mb-4" />
                    <h3 className="text-xl font-bold mb-2">
                      {language === 'en' ? template.name : template.nameEs}
                    </h3>
                    <p className="text-sm opacity-90">
                      {template.durationDays} {t('days')}
                    </p>
                  </div>
                  <div className="md:w-2/3 p-6">
                    <p className="text-muted-foreground mb-6">
                      {language === 'en' ? template.description : template.descriptionEs}
                    </p>
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{template.durationDays} {t('days')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span>{language === 'en' ? 'High Protein Focus' : 'Enfoque Alta Proteína'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span>+100 {t('points')} {language === 'en' ? 'bonus' : 'extra'}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => startChallenge(template.id)}
                      disabled={starting}
                      className="gap-2 bg-cyan-600 hover:bg-cyan-700"
                    >
                      {starting ? (
                        <span className="animate-spin">...</span>
                      ) : (
                        <>
                          <Flame className="h-4 w-4" />
                          {t('startChallenge')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <Link href="/leaderboard">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-medium">{t('viewLeaderboard')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'See how you rank globally' : 'Ve tu posición global'}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/chat">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium">
                    {language === 'en' ? 'Ask AI Coach' : 'Pregunta al Coach IA'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Get meal suggestions for your challenge' : 'Obtén sugerencias de comidas'}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  {t('shareChallenge')}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowShareModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>{language === 'en' ? 'Share Link' : 'Enlace para Compartir'}</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={shareLink} readOnly className="font-mono text-sm" />
                    <Button onClick={copyLink} variant="outline" className="shrink-0">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out my nutrition challenge progress! ${shareLink}`)}`, '_blank')}
                  >
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm doing the 7-Day High Protein Challenge! ${shareLink}`)}`, '_blank')}
                  >
                    Twitter
                  </Button>
                </div>

                <Button onClick={exportShareCard} variant="outline" className="w-full gap-2">
                  {t('exportImage')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Share Card for Export */}
      <div className="fixed -left-[9999px] top-0">
        <div 
          ref={shareCardRef}
          className="w-[600px] h-[400px] bg-gradient-to-br from-gray-900 to-gray-800 p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-4">
              <Flame className="h-6 w-6" />
              <span className="font-semibold">Kalyrax Challenge</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {activeChallenge ? (language === 'en' ? activeChallenge.template.name : activeChallenge.template.nameEs) : ''}
            </h2>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-white">
                <span className="text-4xl font-bold">{daysCompleted}</span>
                <span className="text-gray-400">/{totalDays} days</span>
              </div>
              {currentRank && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <Trophy className="h-6 w-6" />
                  <span className="text-2xl font-bold">#{currentRank}</span>
                </div>
              )}
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <p className="text-emerald-400 font-medium">nutricoach-app-n5uoea.abacusai.app/challenge</p>
          </div>
        </div>
      </div>

      {/* Share Prompt Modal for Viral Triggers */}
      {sharePromptData && (
        <SharePromptModal
          isOpen={sharePromptData.isOpen}
          onClose={() => setSharePromptData(null)}
          title={
            sharePromptData.type === 'streak'
              ? (language === 'en' ? `🔥 ${sharePromptData.milestone} Day Streak!` : `🔥 ¡Racha de ${sharePromptData.milestone} Días!`)
              : sharePromptData.type === 'challenge_complete'
              ? (language === 'en' ? '🏆 Challenge Complete!' : '🏆 ¡Reto Completado!')
              : (language === 'en' ? `🎯 Day ${sharePromptData.milestone} Done!` : `🎯 ¡Día ${sharePromptData.milestone} Completado!`)
          }
          message={
            sharePromptData.type === 'streak'
              ? (language === 'en' 
                  ? 'You\'re on fire! Share your streak and inspire others to join the challenge.' 
                  : '¡Estás en llamas! Comparte tu racha e inspira a otros a unirse al reto.')
              : sharePromptData.type === 'challenge_complete'
              ? (language === 'en' 
                  ? 'Incredible! You completed the challenge. Share your success!' 
                  : '¡Increíble! Completaste el reto. ¡Comparte tu éxito!')
              : (language === 'en' 
                  ? 'You\'re making great progress. Share and challenge your friends!' 
                  : '¡Estás progresando muy bien! ¡Comparte y reta a tus amigos!')
          }
          shareUrl={shareLink}
          milestoneType={sharePromptData.type}
          milestoneValue={sharePromptData.milestone}
          language={language}
          onShare={() => {
            // Tracked when share link is created
          }}
        />
      )}
    </div>
  );
}
