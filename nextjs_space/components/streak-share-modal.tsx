'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from './providers';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X, Download, Copy, Twitter, Facebook, Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';

interface StreakShareData {
  displayName: string;
  currentStreak: number;
  bestStreak: number;
  latestBadge: { name: string; nameEs: string; icon: string; color: string } | null;
  earnedMilestones: number[];
}

interface StreakShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: StreakShareData | null;
}

export function StreakShareModal({ isOpen, onClose, data }: StreakShareModalProps) {
  const { language, t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [shareData, setShareData] = useState<StreakShareData | null>(data || null);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (isOpen && !data) {
      fetchShareData();
    } else if (data) {
      setShareData(data);
      setLoading(false);
    }
  }, [isOpen, data]);

  const fetchShareData = async () => {
    try {
      const res = await fetch('/api/streak/share');
      if (res.ok) {
        const fetchedData = await res.json();
        setShareData(fetchedData);
      }
    } catch (error) {
      console.error('Error fetching share data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 600,
        height: 400,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      });
      const link = document.createElement('a');
      link.download = `nutricoach-streak-${shareData?.currentStreak || 0}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareText = language === 'es'
    ? `🔥 Llevo ${shareData?.currentStreak || 0} días de racha en Kalyrax! Únete a mi reto de nutrición.`
    : `🔥 I'm on a ${shareData?.currentStreak || 0}-day streak on Kalyrax! Join my nutrition challenge.`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareUrl}/challenge?utm_source=streak_share`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl + '/challenge')}`;
    window.open(url, '_blank', 'width=550,height=450');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl + '/challenge')}`;
    window.open(url, '_blank', 'width=550,height=450');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            {t('shareStreak')}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : shareData ? (
            <>
              {/* Share Card Preview */}
              <div className="flex justify-center">
                <div
                  ref={cardRef}
                  className="w-[300px] h-[200px] bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-xl p-6 text-white relative overflow-hidden"
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">
                        {shareData.displayName}
                      </p>
                      <p className="text-xs opacity-75">{t('streakCardTitle')}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-5xl">🔥</span>
                      <div>
                        <p className="text-4xl font-bold">{shareData.currentStreak}</p>
                        <p className="text-sm opacity-90">
                          {shareData.currentStreak === 1 ? t('streakDay') : t('streakDays')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        {shareData.latestBadge && (
                          <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-xs">
                            {shareData.latestBadge.icon}
                            {language === 'es' ? shareData.latestBadge.nameEs : shareData.latestBadge.name}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold opacity-90">Kalyrax</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  {t('downloadCard')}
                </Button>
                <Button onClick={handleCopyLink} variant="outline" className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  {copied ? t('linkCopied') : t('copyLink')}
                </Button>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleTwitterShare}
                  className="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button 
                  onClick={handleFacebookShare}
                  className="flex-1 bg-[#4267B2] hover:bg-[#365899] text-white"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Unable to load streak data.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
