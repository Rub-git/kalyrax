'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from './providers';
import { Button } from './ui/button';
import { Crown, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

interface UpgradeBannerProps {
  variant?: 'inline' | 'sticky';
  showDismiss?: boolean;
  source: string;
}

export function UpgradeBanner({
  variant = 'inline',
  showDismiss = true,
  source,
}: UpgradeBannerProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleClick = async () => {
    await fetch('/api/subscription/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'upgrade_prompt',
        source,
        clicked: true,
      }),
    }).catch(() => {});

    router.push('/pricing');
  };

  if (variant === 'sticky') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 z-40">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-medium">
              {t(language, 'tryProFree')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white text-green-600 hover:bg-gray-100"
              onClick={handleClick}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              {t(language, 'startFreeTrial')}
            </Button>
            {showDismiss && (
              <button
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {language === 'en' ? 'Unlock Pro Features' : 'Desbloquea Funciones Pro'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t(language, 'tryProFree')}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          onClick={handleClick}
        >
          <Sparkles className="w-4 h-4 mr-1" />
          {t(language, 'startFreeTrial')}
        </Button>
      </div>
    </div>
  );
}
