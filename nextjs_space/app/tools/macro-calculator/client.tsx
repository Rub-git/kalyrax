'use client';

import { useEffect, useState } from 'react';
import { Calculator, ArrowRight, Wheat, Drumstick, Droplets, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEOCalculator } from '@/components/seo-calculator';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function MacroCalculatorClient() {
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
        landingPage: '/tools/macro-calculator',
      }),
    }).catch(() => {});
  }, []);

  const handleCalculate = async (inputs: Record<string, unknown>, results: Record<string, unknown>) => {
    await fetch('/api/calculator/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        calculatorType: 'macro',
        inputs,
        results,
      }),
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-violet-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 rounded-full text-violet-700 text-sm font-medium mb-4">
            <Calculator className="h-4 w-4" />
            {language === 'en' ? 'Free Tool' : 'Herramienta Gratuita'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {language === 'en' ? 'Macro Calculator' : 'Calculadora de Macros'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {language === 'en'
              ? 'Calculate your optimal protein, carbohydrate, and fat intake based on your body composition and goals.'
              : 'Calcula tu ingesta óptima de proteínas, carbohidratos y grasas basado en tu composición corporal y objetivos.'}
          </p>
        </motion.div>

        {/* Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SEOCalculator type="macro" onCalculate={handleCalculate} />
        </motion.div>

        {/* Educational Content */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {language === 'en' ? 'Understanding Macronutrients' : 'Entendiendo los Macronutrientes'}
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <Wheat className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-amber-700">
                {language === 'en' ? 'Carbohydrates' : 'Carbohidratos'}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {language === 'en'
                  ? 'Primary energy source for your body and brain. Essential for high-intensity exercise.'
                  : 'Fuente principal de energía para tu cuerpo y cerebro. Esencial para ejercicio de alta intensidad.'}
              </p>
              <p className="text-amber-600 font-medium">4 kcal/g</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <Drumstick className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-red-700">
                {language === 'en' ? 'Protein' : 'Proteína'}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {language === 'en'
                  ? 'Building blocks for muscle, enzymes, and hormones. Critical for recovery and muscle growth.'
                  : 'Bloques de construcción para músculos, enzimas y hormonas. Crítico para recuperación y crecimiento muscular.'}
              </p>
              <p className="text-red-600 font-medium">4 kcal/g</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Droplets className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-blue-700">
                {language === 'en' ? 'Fats' : 'Grasas'}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {language === 'en'
                  ? 'Essential for hormone production, vitamin absorption, and brain function.'
                  : 'Esenciales para producción de hormonas, absorción de vitaminas y función cerebral.'}
              </p>
              <p className="text-blue-600 font-medium">9 kcal/g</p>
            </div>
          </div>

          {/* Macro Distribution Guide */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-8 rounded-2xl text-white mb-12">
            <div className="flex items-center gap-3 mb-6">
              <PieChart className="h-7 w-7" />
              <h3 className="text-2xl font-bold">
                {language === 'en' ? 'Recommended Macro Ratios by Goal' : 'Proporciones de Macros Recomendadas por Objetivo'}
              </h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="font-semibold mb-2">{language === 'en' ? 'Weight Loss' : 'Pérdida de Peso'}</p>
                <div className="space-y-1 text-sm">
                  <p>{language === 'en' ? 'Carbs: 40%' : 'Carbos: 40%'}</p>
                  <p>{language === 'en' ? 'Protein: 30%' : 'Proteína: 30%'}</p>
                  <p>{language === 'en' ? 'Fat: 30%' : 'Grasa: 30%'}</p>
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="font-semibold mb-2">{language === 'en' ? 'Maintenance' : 'Mantenimiento'}</p>
                <div className="space-y-1 text-sm">
                  <p>{language === 'en' ? 'Carbs: 50%' : 'Carbos: 50%'}</p>
                  <p>{language === 'en' ? 'Protein: 25%' : 'Proteína: 25%'}</p>
                  <p>{language === 'en' ? 'Fat: 25%' : 'Grasa: 25%'}</p>
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="font-semibold mb-2">{language === 'en' ? 'Muscle Gain' : 'Ganancia Muscular'}</p>
                <div className="space-y-1 text-sm">
                  <p>{language === 'en' ? 'Carbs: 45%' : 'Carbos: 45%'}</p>
                  <p>{language === 'en' ? 'Protein: 30%' : 'Proteína: 30%'}</p>
                  <p>{language === 'en' ? 'Fat: 25%' : 'Grasa: 25%'}</p>
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
              {language === 'en' ? 'Get Your Personalized Meal Plan' : 'Obtén tu Plan de Comidas Personalizado'}
            </h2>
            <p className="text-cyan-100 mb-6">
              {language === 'en'
                ? 'Take the next step with a 7-day meal plan tailored to your macro targets.'
                : 'Da el siguiente paso con un plan de comidas de 7 días adaptado a tus metas de macros.'}
            </p>
            <Link href="/get-started">
              <Button size="lg" className="bg-white text-cyan-600 hover:bg-cyan-50">
                {language === 'en' ? 'Start 7-Day Challenge' : 'Iniciar Reto de 7 Días'}
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
              <Link href="/tools/protein-calculator" className="text-sm hover:text-white transition-colors">
                {language === 'en' ? 'Protein Calculator' : 'Calculadora de Proteínas'}
              </Link>
              <Link href="/tools/meal-plan-generator" className="text-sm hover:text-white transition-colors">
                {language === 'en' ? 'Meal Plan Generator' : 'Generador de Plan de Comidas'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
