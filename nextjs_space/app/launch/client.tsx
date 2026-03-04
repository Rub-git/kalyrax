'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket, Sparkles, ArrowRight, Check, Users, Trophy,
  CalendarDays, Apple, Brain, Heart, Zap, Star, ChefHat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import Link from 'next/link';
import Image from 'next/image';

export function LaunchPageClient() {
  const { language } = useLanguage();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let sid = sessionStorage.getItem('calc_session_id');
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('calc_session_id', sid);
    }
    setSessionId(sid);

    // Track Product Hunt visit
    fetch('/api/acquisition/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid,
        source: 'product_hunt',
        landingPage: '/launch',
        utmSource: 'product_hunt',
      }),
    }).catch(() => {});
  }, []);

  const features = [
    {
      icon: Brain,
      title: { en: 'AI Nutrition Coach', es: 'Coach de Nutrición IA' },
      desc: { en: 'Get personalized advice from our AI trained on nutrition science', es: 'Obtén consejos personalizados de nuestra IA entrenada en ciencia nutricional' },
    },
    {
      icon: CalendarDays,
      title: { en: '7-Day Meal Plans', es: 'Planes de Comidas de 7 Días' },
      desc: { en: 'Automatically generated meal plans tailored to your goals', es: 'Planes de comidas generados automáticamente adaptados a tus metas' },
    },
    {
      icon: Trophy,
      title: { en: 'Protein Challenge', es: 'Reto de Proteína' },
      desc: { en: 'Join our 7-day challenge with daily targets and leaderboards', es: 'Únete a nuestro reto de 7 días con metas diarias y tablas de posiciones' },
    },
    {
      icon: ChefHat,
      title: { en: 'Shopping Lists', es: 'Listas de Compras' },
      desc: { en: 'Auto-generated shopping lists from your meal plans', es: 'Listas de compras autogeneradas de tus planes de comidas' },
    },
  ];

  const stats = [
    { value: '60s', label: { en: 'To get your plan', es: 'Para obtener tu plan' } },
    { value: '150+', label: { en: 'Foods in catalog', es: 'Alimentos en catálogo' } },
    { value: '7', label: { en: 'Day challenge', es: 'Días de reto' } },
    { value: '2', label: { en: 'Languages', es: 'Idiomas' } },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-emerald-900 to-gray-900">
      <Header />
      
      <main className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-1/3 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        {/* Hero Section */}
        <section className="relative container mx-auto px-4 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Product Hunt Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 mb-8"
            >
              <Rocket className="h-5 w-5" />
              <span className="font-semibold">
                {language === 'en' ? 'Just Launched on Product Hunt!' : '¡Recién Lanzado en Product Hunt!'}
              </span>
              <Star className="h-4 w-4 fill-current" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Kalyrax
              </span>
              <br />
              {language === 'en' ? 'AI Nutrition Planning' : 'Planificación Nutricional IA'}
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10">
              {language === 'en'
                ? 'Get your personalized meal plan in 60 seconds. Science-backed nutrition recommendations with AI-powered coaching.'
                : 'Obtén tu plan de comidas personalizado en 60 segundos. Recomendaciones nutricionales respaldadas por ciencia con coaching impulsado por IA.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/get-started">
                <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-6 text-lg">
                  <Sparkles className="h-5 w-5 mr-2" />
                  {language === 'en' ? 'Get Your Free Plan' : 'Obtén tu Plan Gratis'}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/tools/calorie-calculator">
                <Button size="lg" variant="outline" className="border-gray-500 text-gray-200 hover:bg-gray-800 px-8 py-6 text-lg">
                  {language === 'en' ? 'Try Free Calculator' : 'Probar Calculadora Gratis'}
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="text-center"
                >
                  <p className="text-4xl font-bold text-emerald-400">{stat.value}</p>
                  <p className="text-gray-400 text-sm">{stat.label[language as 'en' | 'es']}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="relative container mx-auto px-4 py-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white text-center mb-16"
          >
            {language === 'en' ? 'Everything You Need for Better Nutrition' : 'Todo lo que Necesitas para una Mejor Nutrición'}
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title[language as 'en' | 'es']}
                </h3>
                <p className="text-gray-400">
                  {feature.desc[language as 'en' | 'es']}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Challenge Section */}
        <section className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-3xl p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium mb-4">
                  <Zap className="h-4 w-4" />
                  {language === 'en' ? 'Featured Challenge' : 'Reto Destacado'}
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {language === 'en' ? '7-Day High Protein Challenge' : 'Reto de Alta Proteína de 7 Días'}
                </h3>
                <p className="text-cyan-100 text-lg mb-6">
                  {language === 'en'
                    ? 'Hit your daily protein targets, track your progress, and compete on the leaderboard. Perfect for beginners and fitness enthusiasts alike.'
                    : 'Alcanza tus metas diarias de proteína, sigue tu progreso y compite en la tabla de posiciones. Perfecto para principiantes y entusiastas del fitness.'}
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    { en: 'Personalized daily protein targets', es: 'Metas diarias de proteína personalizadas' },
                    { en: 'Daily progress tracking', es: 'Seguimiento de progreso diario' },
                    { en: 'Leaderboard with points system', es: 'Tabla de posiciones con sistema de puntos' },
                    { en: 'Share your progress with friends', es: 'Comparte tu progreso con amigos' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white">
                      <Check className="h-5 w-5 text-emerald-200" />
                      {item[language as 'en' | 'es']}
                    </li>
                  ))}
                </ul>
                <Link href="/get-started">
                  <Button size="lg" className="bg-white text-cyan-600 hover:bg-cyan-50">
                    {language === 'en' ? 'Join Free Challenge' : 'Únete al Reto Gratis'}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="relative w-64 h-64">
                  <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
                  <div className="absolute inset-4 bg-white/20 rounded-full flex items-center justify-center">
                    <Trophy className="h-24 w-24 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Bilingual Section */}
        <section className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {language === 'en' ? 'Available in English & Español' : 'Disponible en Inglés y Español'}
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              {language === 'en'
                ? 'Full bilingual support with 150+ foods from USA, Mexico, and Latin America.'
                : 'Soporte bilingüe completo con más de 150 alimentos de USA, México y Latinoamérica.'}
            </p>
            <div className="flex justify-center gap-8">
              <div className="flex items-center gap-3 px-6 py-3 bg-white/10 rounded-xl">
                <span className="text-3xl">🇺🇸</span>
                <span className="text-white font-medium">English</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-white/10 rounded-xl">
                <span className="text-3xl">🇲🇽</span>
                <span className="text-white font-medium">Español</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Final CTA */}
        <section className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {language === 'en' ? 'Start Your Nutrition Journey Today' : 'Comienza tu Viaje Nutricional Hoy'}
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              {language === 'en' ? 'Free to start. No credit card required.' : 'Gratis para empezar. No se requiere tarjeta de crédito.'}
            </p>
            <Link href="/get-started">
              <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white px-12 py-6 text-xl">
                <Sparkles className="h-6 w-6 mr-2" />
                {language === 'en' ? 'Create My Free Plan' : 'Crear Mi Plan Gratis'}
                <ArrowRight className="h-6 w-6 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2026 Kalyrax. {language === 'en' ? 'All rights reserved.' : 'Todos los derechos reservados.'}
            </p>
            <div className="flex gap-6">
              <Link href="/tools/calorie-calculator" className="text-gray-400 text-sm hover:text-white transition-colors">
                {language === 'en' ? 'Calorie Calculator' : 'Calculadora de Calorías'}
              </Link>
              <Link href="/tools/macro-calculator" className="text-gray-400 text-sm hover:text-white transition-colors">
                {language === 'en' ? 'Macro Calculator' : 'Calculadora de Macros'}
              </Link>
              <Link href="/tools/protein-calculator" className="text-gray-400 text-sm hover:text-white transition-colors">
                {language === 'en' ? 'Protein Calculator' : 'Calculadora de Proteínas'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
