'use client';

import { useEffect, useState } from 'react';
import { Apple, ArrowRight, Clock, Sparkles, Users, Check, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEOCalculator } from '@/components/seo-calculator';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function MealPlanGeneratorClient() {
  const { language } = useLanguage();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let sid = sessionStorage.getItem('calc_session_id');
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('calc_session_id', sid);
    }
    setSessionId(sid);

    fetch('/api/acquisition/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid,
        source: 'seo',
        landingPage: '/tools/meal-plan-generator',
      }),
    }).catch(() => {});
  }, []);

  const handleCalculate = async (inputs: Record<string, unknown>, results: Record<string, unknown>) => {
    await fetch('/api/calculator/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        calculatorType: 'meal_plan',
        inputs,
        results,
      }),
    }).catch(() => {});
  };

  const features = [
    {
      icon: CalendarDays,
      title: { en: '7-Day Meal Plans', es: 'Planes de 7 Días' },
      desc: { en: 'Get a full week of balanced, nutritious meals', es: 'Obtén una semana completa de comidas balanceadas y nutritivas' },
    },
    {
      icon: Sparkles,
      title: { en: 'AI-Powered', es: 'Impulsado por IA' },
      desc: { en: 'Smart meal suggestions based on your preferences', es: 'Sugerencias inteligentes basadas en tus preferencias' },
    },
    {
      icon: Clock,
      title: { en: 'Save Time', es: 'Ahorra Tiempo' },
      desc: { en: 'No more wondering what to eat each day', es: 'No más preguntándote qué comer cada día' },
    },
    {
      icon: Users,
      title: { en: 'Shopping List', es: 'Lista de Compras' },
      desc: { en: 'Auto-generated shopping list from your meal plan', es: 'Lista de compras autogenerada de tu plan' },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-cyan-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 rounded-full text-cyan-700 text-sm font-medium mb-4">
            <Apple className="h-4 w-4" />
            {language === 'en' ? 'AI-Powered' : 'Impulsado por IA'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {language === 'en' ? 'Meal Plan Generator' : 'Generador de Plan de Comidas'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {language === 'en'
              ? 'Calculate your calories first, then get a personalized 7-day meal plan tailored to your nutrition goals.'
              : 'Calcula tus calorías primero, luego obtén un plan de comidas de 7 días personalizado a tus metas nutricionales.'}
          </p>
        </motion.div>

        {/* Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SEOCalculator type="meal_plan" onCalculate={handleCalculate} />
        </motion.div>

        {/* Features Grid */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {language === 'en' ? 'What You Get' : 'Lo Que Obtienes'}
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {feature.title[language as 'en' | 'es']}
                </h3>
                <p className="text-gray-600">
                  {feature.desc[language as 'en' | 'es']}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Sample Meal Plan Preview */}
          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 p-8 rounded-2xl text-white mb-12">
            <h3 className="text-2xl font-bold mb-6 text-center">
              {language === 'en' ? 'Sample Day in Your Meal Plan' : 'Día de Ejemplo en tu Plan'}
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-emerald-200 text-sm mb-1">{language === 'en' ? 'Breakfast' : 'Desayuno'}</p>
                <p className="font-semibold">{language === 'en' ? 'Greek Yogurt Bowl' : 'Bowl de Yogur Griego'}</p>
                <p className="text-sm text-emerald-200 mt-1">~400 kcal</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-emerald-200 text-sm mb-1">{language === 'en' ? 'Lunch' : 'Almuerzo'}</p>
                <p className="font-semibold">{language === 'en' ? 'Grilled Chicken Salad' : 'Ensalada de Pollo a la Parrilla'}</p>
                <p className="text-sm text-emerald-200 mt-1">~550 kcal</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-emerald-200 text-sm mb-1">{language === 'en' ? 'Dinner' : 'Cena'}</p>
                <p className="font-semibold">{language === 'en' ? 'Salmon with Veggies' : 'Salmón con Vegetales'}</p>
                <p className="text-sm text-emerald-200 mt-1">~600 kcal</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-emerald-200 text-sm mb-1">{language === 'en' ? 'Snacks' : 'Snacks'}</p>
                <p className="font-semibold">{language === 'en' ? 'Nuts & Fruit' : 'Nueces y Fruta'}</p>
                <p className="text-sm text-emerald-200 mt-1">~350 kcal</p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold mb-6">
              {language === 'en' ? 'How It Works' : 'Cómo Funciona'}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-cyan-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold">{language === 'en' ? 'Calculate Your Needs' : 'Calcula tus Necesidades'}</p>
                  <p className="text-gray-600 text-sm">
                    {language === 'en' 
                      ? 'Enter your details to get your daily calorie and macro targets'
                      : 'Ingresa tus datos para obtener tus metas diarias de calorías y macros'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-cyan-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold">{language === 'en' ? 'Create Your Account' : 'Crea tu Cuenta'}</p>
                  <p className="text-gray-600 text-sm">
                    {language === 'en'
                      ? 'Sign up in 60 seconds to save your plan'
                      : 'Regístrate en 60 segundos para guardar tu plan'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-cyan-600 font-bold">3</span>
                </div>
                <div>
                  <p className="font-semibold">{language === 'en' ? 'Get Your Meal Plan' : 'Obtén tu Plan de Comidas'}</p>
                  <p className="text-gray-600 text-sm">
                    {language === 'en'
                      ? 'AI generates a personalized 7-day plan with shopping list'
                      : 'La IA genera un plan personalizado de 7 días con lista de compras'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-cyan-600 to-teal-600 p-8 rounded-3xl text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {language === 'en' ? 'Ready to Get Your Meal Plan?' : '¿Listo para Obtener tu Plan de Comidas?'}
            </h2>
            <p className="text-cyan-100 mb-6">
              {language === 'en'
                ? 'Create your free account and join our 7-day challenge with personalized nutrition.'
                : 'Crea tu cuenta gratuita y únete a nuestro reto de 7 días con nutrición personalizada.'}
            </p>
            <Link href="/get-started">
              <Button size="lg" className="bg-white text-cyan-600 hover:bg-cyan-50">
                {language === 'en' ? 'Generate My Meal Plan' : 'Generar Mi Plan de Comidas'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © 2026 Kalyrax. {language === 'en' ? 'All rights reserved.' : 'Todos los derechos reservados.'}
            </p>
            <div className="flex gap-6">
              <Link href="/tools/calorie-calculator" className="text-sm hover:text-white transition-colors">
                {language === 'en' ? 'Calorie Calculator' : 'Calculadora de Calorías'}
              </Link>
              <Link href="/tools/macro-calculator" className="text-sm hover:text-white transition-colors">
                {language === 'en' ? 'Macro Calculator' : 'Calculadora de Macros'}
              </Link>
              <Link href="/tools/protein-calculator" className="text-sm hover:text-white transition-colors">
                {language === 'en' ? 'Protein Calculator' : 'Calculadora de Proteínas'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
