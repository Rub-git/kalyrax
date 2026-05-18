'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLanguage } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { DisclaimerBanner } from '@/components/disclaimer-banner';
import {
  Leaf,
  Calculator,
  Calendar,
  MessageCircle,
  LineChart,
  Shield,
  Globe2,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return null;
  }

  const features = [
    {
      icon: Calculator,
      title: language === 'es' ? 'Cálculos Precisos' : 'Precise Calculations',
      description: language === 'es'
        ? 'Fórmulas Harris-Benedict validadas para tu metabolismo basal y requerimientos energéticos'
        : 'Validated Harris-Benedict formulas for your basal metabolism and energy requirements',
    },
    {
      icon: Calendar,
      title: language === 'es' ? 'Planes de Comida' : 'Meal Plans',
      description: language === 'es'
        ? 'Planes semanales personalizados con lista de compras incluida'
        : 'Personalized weekly plans with shopping list included',
    },
    {
      icon: MessageCircle,
      title: language === 'es' ? 'Asistente IA' : 'AI Assistant',
      description: language === 'es'
        ? 'Pregunta sobre nutrición y recibe respuestas basadas en evidencia científica'
        : 'Ask about nutrition and receive science-based answers',
    },
    {
      icon: LineChart,
      title: language === 'es' ? 'Seguimiento Diario' : 'Daily Tracking',
      description: language === 'es'
        ? 'Registra tus comidas y visualiza tu progreso hacia tus metas'
        : 'Log your meals and visualize your progress towards your goals',
    },
    {
      icon: Globe2,
      title: language === 'es' ? 'Bilingüe' : 'Bilingual',
      description: language === 'es'
        ? 'Interfaz completa en español e inglés, con alimentos de USA, México y Latinoamérica'
        : 'Full interface in English and Spanish, with foods from USA, Mexico, and Latin America',
    },
    {
      icon: Shield,
      title: language === 'es' ? 'Seguro y Privado' : 'Safe & Private',
      description: language === 'es'
        ? 'Tus datos están protegidos. No reemplazamos el consejo médico profesional'
        : 'Your data is protected. We don\'t replace professional medical advice',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <DisclaimerBanner />
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
                <Leaf className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              <span className="text-primary">Kalyrax</span>
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              {t('tagline')}
            </p>
            <p className="mt-6 text-lg text-gray-500 max-w-3xl mx-auto">
              {language === 'es'
                ? 'Calcula tus necesidades nutricionales con fórmulas científicamente validadas, genera planes de comidas personalizados y recibe orientación de nuestro asistente de IA.'
                : 'Calculate your nutritional needs with scientifically validated formulas, generate personalized meal plans, and receive guidance from our AI assistant.'}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-started">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
                  {language === 'es' ? 'Crear Mi Plan en 60s' : 'Create My Plan in 60s'}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  {t('login')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl">
            <div
              className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary/30 to-blue-200 opacity-30"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900">
              {language === 'es' ? 'Características' : 'Features'}
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              {language === 'es'
                ? 'Todo lo que necesitas para mejorar tu nutrición de forma inteligente'
                : 'Everything you need to improve your nutrition intelligently'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-700 to-cyan-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center text-white"
          >
            <h2 className="text-3xl font-bold mb-4">
              {language === 'es'
                ? '¿Listo para empezar?'
                : 'Ready to get started?'}
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              {language === 'es'
                ? 'Ve tu plan nutricional en 60 segundos. Sin necesidad de registro.'
                : 'See your nutrition plan in 60 seconds. No signup required.'}
            </p>
            <Link href="/get-started">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 bg-white text-blue-700 hover:bg-gray-100"
              >
                {language === 'es' ? 'Crear Mi Plan Gratis' : 'Create My Free Plan'}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Leaf className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">Kalyrax</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/help" className="hover:text-primary transition-colors">
                {language === 'es' ? 'Ayuda' : 'Help'}
              </Link>
              <Link href="/contact" className="hover:text-primary transition-colors">
                {language === 'es' ? 'Contacto' : 'Contact'}
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                {language === 'es' ? 'Privacidad' : 'Privacy'}
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                {language === 'es' ? 'Términos' : 'Terms'}
              </Link>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Kalyrax.{' '}
              {language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}