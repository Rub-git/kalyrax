import { Metadata } from 'next';
import { MealPlanGeneratorClient } from './client';

export const metadata: Metadata = {
  title: 'Free AI Meal Plan Generator | Personalized Nutrition - NutriCoach',
  description: 'Generate a personalized 7-day meal plan based on your calorie needs and dietary preferences. AI-powered nutrition planning made simple.',
  keywords: 'meal plan generator, weekly meal plan, personalized meal plan, diet plan generator, nutrition plan, healthy meal planning',
  openGraph: {
    title: 'Free AI Meal Plan Generator | NutriCoach',
    description: 'Get a personalized 7-day meal plan based on your calorie needs and preferences.',
    type: 'website',
    images: ['/og-meal-plan-generator.png'],
  },
  alternates: {
    languages: {
      'en': '/tools/meal-plan-generator',
      'es': '/tools/meal-plan-generator?lang=es',
    },
  },
};

export default function MealPlanGeneratorPage() {
  return <MealPlanGeneratorClient />;
}
