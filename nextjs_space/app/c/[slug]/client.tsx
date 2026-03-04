'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Users, Share2, Check, Flame, Globe, ChevronRight } from 'lucide-react';
import { toPng } from 'html-to-image';

interface ChallengeData {
  challenge: {
    id: string;
    templateName: string;
    templateNameEs: string;
    description: string;
    descriptionEs: string;
    durationDays: number;
    status: string;
    daysCompleted: number;
    progress: { dayNumber: number; completed: boolean }[];
    startDate: string;
    macroRules: { focusMacro?: string; proteinMinPercent?: number };
  };
  user: {
    displayName: string;
    avatarSeed: string;
    country?: string;
  } | null;
  rank: number | null;
  viewCount: number;
  slug: string;
}

interface Props {
  slug: string;
}

export function ChallengeShareClient({ slug }: Props) {
  const [data, setData] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [copying, setCopying] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slug) {
      fetchChallenge();
      trackView();
    }
  }, [slug]);

  const fetchChallenge = async () => {
    try {
      const res = await fetch(`/api/c/${slug}`);
      if (!res.ok) throw new Error('Challenge not found');
      const challengeData = await res.json();
      setData(challengeData);
    } catch {
      setError('Challenge not found');
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    try {
      await fetch(`/api/c/${slug}/track`, { method: 'POST' });
    } catch {
      // Silently fail
    }
  };

  const copyLink = async () => {
    setCopying(true);
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setTimeout(() => setCopying(false), 2000);
  };

  const exportImage = async () => {
    if (!shareCardRef.current) return;
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        quality: 0.95,
        width: 600,
        height: 400,
        backgroundColor: '#1f2937',
      });
      const link = document.createElement('a');
      link.download = `challenge-${slug}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
    }
  };

  // Generate deterministic avatar from seed
  const getAvatarColor = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 mx-auto text-gray-500 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {lang === 'en' ? 'Challenge Not Found' : 'Reto No Encontrado'}
            </h2>
            <p className="text-gray-400 mb-6">
              {lang === 'en' 
                ? 'This challenge may have expired or been removed.'
                : 'Este reto puede haber expirado o sido eliminado.'}
            </p>
            <Link href="/signup?ref=challenge">
              <Button className="bg-cyan-600 hover:bg-cyan-700">
                {lang === 'en' ? 'Start Your Own Challenge' : 'Comienza Tu Propio Reto'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { challenge, user, rank, viewCount } = data;
  const progressPercent = (challenge.daysCompleted / challenge.durationDays) * 100;
  const challengeName = lang === 'en' ? challenge.templateName : challenge.templateNameEs;
  const description = lang === 'en' ? challenge.description : challenge.descriptionEs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
          className="bg-gray-800/50 border-gray-600 hover:bg-gray-700"
        >
          <Globe className="h-4 w-4 mr-2" />
          {lang === 'en' ? 'ES' : 'EN'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm mb-4">
            <Flame className="h-4 w-4" />
            {lang === 'en' ? 'Nutrition Challenge' : 'Reto de Nutrición'}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {challengeName}
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            {description}
          </p>
        </div>

        {/* User Info (if public) */}
        {user && (
          <div className="flex items-center justify-center gap-4 mb-8">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: getAvatarColor(user.avatarSeed || 'default') }}
            >
              {user.displayName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="text-left">
              <p className="text-white font-medium">{user.displayName}</p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {user.country && <span>{user.country}</span>}
                {rank && (
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    #{rank}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Card */}
        <Card className="bg-gray-800/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-500" />
              {lang === 'en' ? 'Challenge Progress' : 'Progreso del Reto'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">
                  {challenge.daysCompleted} / {challenge.durationDays} {lang === 'en' ? 'days' : 'días'}
                </span>
                <span className="text-emerald-400 font-medium">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Day Pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {challenge.progress.map((day) => (
                <div
                  key={day.dayNumber}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                    day.completed
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {day.completed ? <Check className="h-5 w-5" /> : day.dayNumber}
                </div>
              ))}
            </div>

            {/* Status Badge */}
            {challenge.status === 'completed' && (
              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full">
                  <Trophy className="h-4 w-4" />
                  {lang === 'en' ? 'Challenge Completed!' : '¡Reto Completado!'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{viewCount}</p>
              <p className="text-sm text-gray-400">{lang === 'en' ? 'Views' : 'Vistas'}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{challenge.daysCompleted}</p>
              <p className="text-sm text-gray-400">{lang === 'en' ? 'Day Streak' : 'Racha de Días'}</p>
            </CardContent>
          </Card>
        </div>

        {/* CTAs */}
        <div className="space-y-4">
          <Link href={`/get-started?ref=${slug}&utm_source=challenge_share`} className="block">
            <Button className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
              <Trophy className="h-5 w-5 mr-2" />
              {lang === 'en' ? 'Start Your 7-Day Challenge' : 'Inicia Tu Reto de 7 Días'}
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          
          <p className="text-center text-sm text-gray-400">
            {lang === 'en' 
              ? 'Get your personalized nutrition plan in 60 seconds'
              : 'Obtén tu plan de nutrición personalizado en 60 segundos'}
          </p>

          <div className="flex gap-4">
            <Link href="/leaderboard" className="flex-1">
              <Button variant="outline" className="w-full border-gray-600 hover:bg-gray-700">
                <Trophy className="h-4 w-4 mr-2" />
                {lang === 'en' ? 'Leaderboard' : 'Tabla de Posiciones'}
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="flex-1 border-gray-600 hover:bg-gray-700"
              onClick={copyLink}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {copying 
                ? (lang === 'en' ? 'Copied!' : '¡Copiado!') 
                : (lang === 'en' ? 'Share' : 'Compartir')}
            </Button>
          </div>
        </div>

        {/* Export Card Button */}
        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={exportImage}
            className="text-gray-400 hover:text-white"
          >
            {lang === 'en' ? 'Download Share Card' : 'Descargar Tarjeta'}
          </Button>
        </div>
      </div>

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
            <h2 className="text-3xl font-bold text-white mb-2">{challengeName}</h2>
            {user && (
              <p className="text-gray-400">by {user.displayName}</p>
            )}
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-white">
                <span className="text-4xl font-bold">{challenge.daysCompleted}</span>
                <span className="text-gray-400">/{challenge.durationDays} days</span>
              </div>
              {rank && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <Trophy className="h-6 w-6" />
                  <span className="text-2xl font-bold">#{rank}</span>
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
            <p className="text-emerald-400 font-medium">nutricoach-app-n5uoea.abacusai.app/c/{slug}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
