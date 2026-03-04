import { Metadata } from 'next';
import { MacroCalculatorClient } from './client';

export const metadata: Metadata = {
  title: 'Free Macro Calculator | Calculate Your Macros - NutriCoach',
  description: 'Calculate your ideal macronutrient breakdown with our free macro calculator. Get personalized protein, carbs, and fat targets for your fitness goals.',
  keywords: 'macro calculator, macronutrient calculator, protein calculator, carbs calculator, fat calculator, IIFYM calculator, flexible dieting',
  openGraph: {
    title: 'Free Macro Calculator | NutriCoach',
    description: 'Calculate your daily macros (protein, carbs, fat) and get a personalized meal plan.',
    type: 'website',
    images: ['/og-macro-calculator.png'],
  },
  alternates: {
    languages: {
      'en': '/tools/macro-calculator',
      'es': '/tools/macro-calculator?lang=es',
    },
  },
};

export default function MacroCalculatorPage() {
  return <MacroCalculatorClient />;
}
