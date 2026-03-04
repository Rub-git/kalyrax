'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from './providers';

export function DisclaimerBanner() {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('nutricoach-disclaimer-dismissed');
    if (!wasDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('nutricoach-disclaimer-dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>{t('disclaimer')}:</strong> {t('disclaimerText')}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-amber-600 hover:text-amber-800 flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
