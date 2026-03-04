import { Metadata } from 'next';
import { CalorieCalculatorClient } from './client';

export const metadata: Metadata = {
  title: 'Free Calorie Calculator | TDEE & BMR Calculator - Kalyrax',
  description: 'Calculate your daily calorie needs with our free TDEE and BMR calculator. Get personalized nutrition recommendations based on Harris-Benedict formula. Start your 7-day protein challenge today!',
  keywords: 'calorie calculator, TDEE calculator, BMR calculator, daily calorie needs, weight loss calculator, nutrition calculator',
  openGraph: {
    title: 'Free Calorie Calculator | Kalyrax',
    description: 'Calculate your daily calorie needs and get a personalized meal plan in 60 seconds.',
    type: 'website',
    images: ['/og-calorie-calculator.png'],
  },
  alternates: {
    languages: {
      'en': '/tools/calorie-calculator',
      'es': '/tools/calorie-calculator?lang=es',
    },
  },
};

export default function CalorieCalculatorPage() {
  return <CalorieCalculatorClient />;
}
