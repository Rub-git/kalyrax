'use client';

import { useEffect, useState } from 'react';
import { Dumbbell, ArrowRight, Check, Beef, Fish, Egg, Milk } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEOCalculator } from '@/components/seo-calculator';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const proteinSources = [
  { name: { en: 'Chicken Breast', es: 'Pechuga de Pollo' }, protein: 31, serving: '100g', icon: Beef },
  { name: { en: 'Salmon', es: 'Salmón' }, protein: 25, serving: '100g', icon: Fish },
  { name: { en: 'Eggs', es: 'Huevos' }, protein: 13, serving: '2 large', icon: Egg },
  { name: { en: 'Greek Yogurt', es: 'Yogur Griego' }, protein: 17, serving: '170g', icon: Milk },
  { name: { en: 'Lean Beef', es: 'Carne Magra' }, protein: 26, serving: '100g', icon: Beef },
  { name: { en: 'Tofu', es: 'Tofu' }, protein: 8, serving: '100g', icon: Beef },
];

export function ProteinCalculatorClient() {
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
        landingPage: '/tools/protein-calculator',
      }),
    }).catch(() => {});
  }, []);

  const handleCalculate = async (inputs: Record<string, unknown>, results: Record<string, unknown>) => {
    await fetch('/api/calculator/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        calculatorType: 'protein',
        inputs,
        results,
      }),
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-red-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-full text-red-700 text-sm font-medium mb-4">
            <Dumbbell className="h-4 w-4" />
            {language === 'en' ? 'Free Tool' : 'Herramienta Gratuita'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {language === 'en' ? 'Protein Calculator' : 'Calculadora de Proteínas'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {language === 'en'
              ? 'Calculate your optimal daily protein intake for muscle building, weight loss, or maintenance.'
              : 'Calcula tu ingesta óptima diaria de proteínas para construir músculo, perder peso o mantenimiento.'}
          </p>
        </motion.div>

        {/* Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SEOCalculator type="protein" onCalculate={handleCalculate} />
        </motion.div>

        {/* Educational Content */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {language === 'en' ? 'Why Protein Matters' : 'Por Qué Importa la Proteína'}
          </h2>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600">✔</span>
                {language === 'en' ? 'Muscle Building' : 'Construcción Muscular'}
              </h3>
              <p className="text-gray-600">
                {language === 'en'
                  ? 'Protein provides amino acids essential for muscle protein synthesis and recovery after workouts.'
                  : 'La proteína proporciona aminoácidos esenciales para la síntesis de proteínas musculares y recuperación después del ejercicio.'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600">✔</span>
                {language === 'en' ? 'Weight Loss' : 'Pérdida de Peso'}
              </h3>
              <p className="text-gray-600">
                {language === 'en'
                  ? 'High protein intake increases satiety and helps preserve lean muscle mass during calorie restriction.'
                  : 'Una alta ingesta de proteínas aumenta la saciedad y ayuda a preservar la masa muscular durante la restricción calórica.'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600">✔</span>
                {language === 'en' ? 'Metabolism Boost' : 'Impulso Metabólico'}
              </h3>
              <p className="text-gray-600">
                {language === 'en'
                  ? 'Protein has a higher thermic effect, meaning you burn more calories digesting it.'
                  : 'La proteína tiene un mayor efecto térmico, lo que significa que quemas más calorías digiriéndola.'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600">✔</span>
                {language === 'en' ? 'Recovery' : 'Recuperación'}
              </h3>
              <p className="text-gray-600">
                {language === 'en'
                  ? 'Adequate protein speeds up recovery between workouts and reduces muscle soreness.'
                  : 'La proteína adecuada acelera la recuperación entre entrenamientos y reduce el dolor muscular.'}
              </p>
            </div>
          </div>

          {/* Protein Sources */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 rounded-2xl text-white mb-12">
            <h3 className="text-2xl font-bold mb-6">
              {language === 'en' ? 'Top Protein Sources' : 'Principales Fuentes de Proteína'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {proteinSources.map((source, i) => (
                <div key={i} className="bg-white/10 p-4 rounded-xl">
                  <p className="font-semibold">{source.name[language as 'en' | 'es']}</p>
                  <p className="text-red-200 text-sm">{source.serving}</p>
                  <p className="text-xl font-bold mt-1">{source.protein}g</p>
                </div>
              ))}
            </div>
          </div>

          {/* Protein Guidelines */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold mb-6">
              {language === 'en' ? 'Protein Intake Guidelines' : 'Guías de Ingesta de Proteína'}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold">{language === 'en' ? 'General Health' : 'Salud General'}</p>
                  <p className="text-gray-600 text-sm">
                    {language === 'en' ? '0.8g per kg body weight (RDA minimum)' : '0.8g por kg de peso corporal (mínimo RDA)'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold">{language === 'en' ? 'Active Lifestyle' : 'Estilo de Vida Activo'}</p>
                  <p className="text-gray-600 text-sm">
                    {language === 'en' ? '1.2-1.6g per kg body weight' : '1.2-1.6g por kg de peso corporal'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold">3</span>
                </div>
                <div>
                  <p className="font-semibold">{language === 'en' ? 'Muscle Building' : 'Construcción Muscular'}</p>
                  <p className="text-gray-600 text-sm">
                    {language === 'en' ? '1.6-2.2g per kg body weight' : '1.6-2.2g por kg de peso corporal'}
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
              {language === 'en' ? 'Join the 7-Day High Protein Challenge' : 'Únete al Reto de 7 Días de Alta Proteína'}
            </h2>
            <p className="text-cyan-100 mb-6">
              {language === 'en'
                ? 'Get daily protein targets, meal ideas, and track your progress with our free challenge.'
                : 'Obtén metas diarias de proteína, ideas de comidas y sigue tu progreso con nuestro reto gratuito.'}
            </p>
            <Link href="/get-started">
              <Button size="lg" className="bg-white text-cyan-600 hover:bg-cyan-50">
                {language === 'en' ? 'Start Free Challenge' : 'Iniciar Reto Gratis'}
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
