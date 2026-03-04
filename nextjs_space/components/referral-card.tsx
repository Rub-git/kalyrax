'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Copy, Share2, Gift, Check, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/components/providers';
import { toast } from 'sonner';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  convertedReferrals: number;
}

export function ReferralCard() {
  const { language } = useLanguage();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const res = await fetch('/api/referral');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewLink = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/referral', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const link = `${window.location.origin}${data.referralLink}`;
        await navigator.clipboard.writeText(link);
        toast.success(language === 'en' ? 'Referral link copied!' : '¡Enlace de referido copiado!');
        fetchReferralStats();
      }
    } catch (error) {
      console.error('Error generating referral:', error);
      toast.error(language === 'en' ? 'Failed to generate link' : 'Error al generar enlace');
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    if (!stats) return;
    setCopying(true);
    const link = `${window.location.origin}/get-started?ref=${stats.referralCode}`;
    await navigator.clipboard.writeText(link);
    setTimeout(() => setCopying(false), 2000);
    toast.success(language === 'en' ? 'Link copied!' : '¡Enlace copiado!');
  };

  const shareLink = async () => {
    if (!stats) return;
    const link = `${window.location.origin}/get-started?ref=${stats.referralCode}`;
    const text = language === 'en' 
      ? 'Join me on Kalyrax and get your personalized meal plan!'
      : '¡Únete a Kalyrax y obtén tu plan de comidas personalizado!';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kalyrax',
          text,
          url: link,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      copyLink();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Gift className="h-5 w-5" />
          {language === 'en' ? 'Invite Friends' : 'Invitar Amigos'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          {language === 'en'
            ? 'Share Kalyrax with friends and help them start their nutrition journey!'
            : '¡Comparte Kalyrax con amigos y ayúdalos a comenzar su viaje nutricional!'}
        </p>

        {stats && (
          <>
            {/* Referral Link */}
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/get-started?ref=${stats.referralCode}`}
                className="bg-gray-50 text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyLink}
                className="flex-shrink-0"
              >
                {copying ? <Check className="h-4 w-4 text-blue-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={shareLink}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Share Link' : 'Compartir Enlace'}
              </Button>
              <Button
                variant="outline"
                onClick={generateNewLink}
                disabled={generating}
                className="flex-shrink-0"
              >
                {generating ? '...' : (language === 'en' ? 'New Link' : 'Nuevo Enlace')}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.totalReferrals}</p>
                <p className="text-xs text-gray-500">
                  {language === 'en' ? 'Links Shared' : 'Enlaces Compartidos'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-700">{stats.convertedReferrals}</p>
                <p className="text-xs text-gray-500">
                  {language === 'en' ? 'Friends Joined' : 'Amigos Unidos'}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
