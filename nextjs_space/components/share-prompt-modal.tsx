'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, X, Trophy, Flame, Target, Copy, Check, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SharePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  shareUrl: string;
  milestoneType: 'streak' | 'challenge_day' | 'challenge_complete' | 'leaderboard';
  milestoneValue?: number;
  language?: 'en' | 'es';
  onShare?: () => void;
}

export function SharePromptModal({
  isOpen,
  onClose,
  title,
  message,
  shareUrl,
  milestoneType,
  milestoneValue,
  language = 'en',
  onShare,
}: SharePromptModalProps) {
  const [copied, setCopied] = useState(false);

  const t = (en: string, es: string) => (language === 'es' ? es : en);

  const getMilestoneIcon = () => {
    switch (milestoneType) {
      case 'streak':
        return <Flame className="h-12 w-12 text-orange-500" />;
      case 'challenge_day':
        return <Target className="h-12 w-12 text-blue-500" />;
      case 'challenge_complete':
        return <Trophy className="h-12 w-12 text-yellow-500" />;
      case 'leaderboard':
        return <Trophy className="h-12 w-12 text-purple-500" />;
      default:
        return <Share2 className="h-12 w-12 text-green-500" />;
    }
  };

  const getMilestoneColor = () => {
    switch (milestoneType) {
      case 'streak':
        return 'from-orange-500 to-red-500';
      case 'challenge_day':
        return 'from-blue-500 to-cyan-500';
      case 'challenge_complete':
        return 'from-yellow-400 to-orange-500';
      case 'leaderboard':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-green-500 to-emerald-500';
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    onShare?.();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: message,
          url: shareUrl,
        });
        onShare?.();
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <Card className="overflow-hidden border-0 shadow-2xl">
            {/* Gradient header */}
            <div className={`bg-gradient-to-r ${getMilestoneColor()} p-6 text-white relative`}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-white/20 rounded-full">
                  {getMilestoneIcon()}
                </div>
                {milestoneValue !== undefined && (
                  <div className="text-4xl font-bold">{milestoneValue}</div>
                )}
                <h2 className="text-xl font-bold text-center">{title}</h2>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              <p className="text-center text-gray-600 dark:text-gray-300">
                {message}
              </p>

              <div className="space-y-3">
                {/* Share button */}
                <Button
                  onClick={handleShare}
                  className={`w-full bg-gradient-to-r ${getMilestoneColor()} hover:opacity-90`}
                  size="lg"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  {t('Share Your Achievement', 'Comparte Tu Logro')}
                </Button>

                {/* Copy link */}
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      {t('Copied!', '¡Copiado!')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      {t('Copy Link', 'Copiar Enlace')}
                    </>
                  )}
                </Button>

                {/* Skip button */}
                <button
                  onClick={onClose}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {t('Maybe Later', 'Quizás Después')}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
