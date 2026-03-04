'use client';

import { useEffect, useState } from 'react';
import { Flame, ArrowRight, Check, BookOpen, Calculator, TrendingDown, TrendingUp, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEOCalculator } from '@/components/seo-calculator';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CalorieCalculatorClient() {
  const { language } = useLanguage();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Generate session ID for tracking
    let sid = sessionStorage.getItem('calc_session_id');
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('calc_session_id', sid);
    }
    setSessionId(sid);

    // Track page visit
    fetch('/api/acquisition/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid,
        source: 'seo',
        landingPage: '/tools/calorie-calculator',
      }),
    }).catch(() => {});
  }, []);

  const handleCalculate = async (inputs: Record<string, unknown>, results: Record<string, unknown>) => {
    // Save calculator result
    await fetch('/api/calculator/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        calculatorType: 'calorie',
        inputs,
        results,
      }),
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full text-orange-700 text-sm font-medium mb-4">
            <Flame className="h-4 w-4" />
            {language === 'en' ? 'Free Tool' : 'Herramienta Gratuita'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {language === 'en' ? 'Calorie Calculator' : 'Calculadora de Calorías'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {language === 'en'
              ? 'Calculate your daily calorie needs based on your age, sex, weight, height, and activity level using the Harris-Benedict equation.'
              : 'Calcula tus necesidades calóricas diarias basado en tu edad, sexo, peso, altura y nivel de actividad usando la ecuación de Harris-Benedict.'}
          </p>
        </motion.div>

        {/* Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SEOCalculator type="calorie" onCalculate={handleCalculate} />
        </motion.div>

        {/* Educational Content */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {language === 'en' ? 'Understanding Your Calorie Needs' : 'Entendiendo tus Necesidades Calóricas'}
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {language === 'en' ? 'What is TDEE?' : '¿Qué es el TDEE?'}
              </h3>
              <p className="text-gray-600">
                {language === 'en'
                  ? 'Total Daily Energy Expenditure (TDEE) is the total number of calories you burn each day. It includes your Basal Metabolic Rate (BMR) plus calories burned through physical activity and digestion.'
                  : 'El Gasto Energético Total Diario (TDEE) es el número total de calorías que quemas cada día. Incluye tu Tasa Metabólica Basal (TMB) más las calorías quemadas por actividad física y digestión.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Scale className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {language === 'en' ? 'What is BMR?' : '¿Qué es el TMB?'}
              </h3>
              <p className="text-gray-600">
                {language === 'en'
                  ? 'Basal Metabolic Rate (BMR) is the number of calories your body needs to maintain basic functions while at rest, such as breathing, circulation, and cell production.'
                  : 'La Tasa Metabólica Basal (TMB) es el número de calorías que tu cuerpo necesita para mantener funciones básicas en reposo, como respirar, circulación y producción celular.'}
              </p>
            </div>
          </div>

          {/* Calorie Goals Section */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-2xl text-white mb-12">
            <h3 className="text-2xl font-bold mb-6">
              {language === 'en' ? 'Calorie Goals by Objective' : 'Metas Calóricas por Objetivo'}
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <TrendingDown className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold mb-1">
                    {language === 'en' ? 'Weight Loss' : 'Pérdida de Peso'}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {language === 'en'
                      ? 'TDEE - 500 kcal/day for ~0.5kg (1lb) loss per week'
                      : 'TDEE - 500 kcal/día para ~0.5kg de pérdida por semana'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Scale className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold mb-1">
                    {language === 'en' ? 'Maintenance' : 'Mantenimiento'}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {language === 'en'
                      ? 'Eat at your TDEE to maintain current weight'
                      : 'Come a tu TDEE para mantener tu peso actual'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-6 w-6 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold mb-1">
                    {language === 'en' ? 'Muscle Gain' : 'Ganancia Muscular'}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {language === 'en'
                      ? 'TDEE + 300 kcal/day for lean muscle building'
                      : 'TDEE + 300 kcal/día para construir músculo magro'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="h-6 w-6 text-emerald-600" />
              <h3 className="text-2xl font-bold">
                {language === 'en' ? 'How We Calculate Your Calories' : 'Cómo Calculamos tus Calorías'}
              </h3>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                {language === 'en'
                  ? 'Our calculator uses the Harris-Benedict equation, a scientifically validated formula that has been used for over a century to estimate caloric needs:'
                  : 'Nuestra calculadora usa la ecuación de Harris-Benedict, una fórmula científicamente validada que se ha usado por más de un siglo para estimar necesidades calóricas:'}
              </p>
              <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm mb-4">
                <p className="mb-2"><strong>{language === 'en' ? 'For Men:' : 'Para Hombres:'}</strong></p>
                <p className="text-gray-700 mb-4">BMR = 88.362 + (13.397 × weight_kg) + (4.799 × height_cm) - (5.677 × age)</p>
                <p className="mb-2"><strong>{language === 'en' ? 'For Women:' : 'Para Mujeres:'}</strong></p>
                <p className="text-gray-700">BMR = 447.593 + (9.247 × weight_kg) + (3.098 × height_cm) - (4.330 × age)</p>
              </div>
              <p className="text-gray-600">
                {language === 'en'
                  ? 'Your BMR is then multiplied by an activity factor (1.2 - 1.9) to get your TDEE.'
                  : 'Tu TMB se multiplica por un factor de actividad (1.2 - 1.9) para obtener tu TDEE.'}
              </p>
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
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-emerald-600 to-teal-600 p-8 rounded-3xl text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {language === 'en' ? 'Ready to Transform Your Nutrition?' : '¿Listo para Transformar tu Nutrición?'}
            </h2>
            <p className="text-emerald-100 mb-6">
              {language === 'en'
                ? 'Get a personalized meal plan and join our 7-day high protein challenge. Free to start!'
                : 'Obtén un plan de comidas personalizado y únete a nuestro reto de 7 días de alta proteína. ¡Gratis para empezar!'}
            </p>
            <Link href="/get-started">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">
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
              <Link href="/tools/macro-calculator" className="text-sm hover:text-white transition-colors">
                {language === 'en' ? 'Macro Calculator' : 'Calculadora de Macros'}
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
