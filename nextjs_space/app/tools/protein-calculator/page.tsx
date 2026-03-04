import { Metadata } from 'next';
import { ProteinCalculatorClient } from './client';

export const metadata: Metadata = {
  title: 'Free Protein Calculator | Daily Protein Needs - NutriCoach',
  description: 'Calculate your daily protein requirements based on your weight, activity level, and fitness goals. Perfect for muscle building, weight loss, or athletic performance.',
  keywords: 'protein calculator, daily protein intake, protein needs, muscle building protein, protein for weight loss, protein requirements',
  openGraph: {
    title: 'Free Protein Calculator | NutriCoach',
    description: 'Calculate how much protein you need daily based on your goals and activity level.',
    type: 'website',
    images: ['/og-protein-calculator.png'],
  },
  alternates: {
    languages: {
      'en': '/tools/protein-calculator',
      'es': '/tools/protein-calculator?lang=es',
    },
  },
};

export default function ProteinCalculatorPage() {
  return <ProteinCalculatorClient />;
}
