'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, ArrowRight, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Suspense } from 'react';

function SuccessContent() {
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give Stripe webhook a moment to process
    const timer = setTimeout(() => {
      setVerified(true);
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="container mx-auto px-4 py-20 max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="text-center">
            <CardContent className="pt-10 pb-8 space-y-6">
              {loading ? (
                <>
                  <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto" />
                  <h2 className="text-2xl font-bold">
                    {language === 'en' ? 'Processing your payment...' : 'Procesando tu pago...'}
                  </h2>
                  <p className="text-gray-500">
                    {language === 'en' ? 'Please wait a moment' : 'Por favor espera un momento'}
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                  </motion.div>

                  <div>
                    <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                      <Crown className="w-6 h-6 text-yellow-500" />
                      {language === 'en' ? 'Welcome to Kalyrax Pro!' : '¡Bienvenido a Kalyrax Pro!'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-3">
                      {language === 'en'
                        ? 'Your subscription has been activated successfully. Enjoy unlimited access to all premium features!'
                        : 'Tu suscripción se ha activado correctamente. ¡Disfruta acceso ilimitado a todas las funciones premium!'}
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-left space-y-2">
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                      {language === 'en' ? 'You now have access to:' : 'Ahora tienes acceso a:'}
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                      <li>✓ {language === 'en' ? 'Unlimited meal plans' : 'Planes de comida ilimitados'}</li>
                      <li>✓ {language === 'en' ? 'Advanced AI coaching' : 'Coaching IA avanzado'}</li>
                      <li>✓ {language === 'en' ? 'Personalized recipes' : 'Recetas personalizadas'}</li>
                      <li>✓ {language === 'en' ? 'Detailed analytics' : 'Analíticas detalladas'}</li>
                      <li>✓ {language === 'en' ? 'Premium challenges' : 'Retos premium'}</li>
                    </ul>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700"
                    onClick={() => router.push('/dashboard')}
                  >
                    {language === 'en' ? 'Go to Dashboard' : 'Ir al Dashboard'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

export default function PricingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
