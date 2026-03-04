import { Metadata } from 'next';
import { LaunchPageClient } from './client';

export const metadata: Metadata = {
  title: 'NutriCoach - AI Nutrition Planning | Product Hunt Launch',
  description: 'AI-powered nutrition planning, personalized meal plans, and a 7-day protein challenge. Transform your health with science-backed nutrition recommendations.',
  keywords: 'NutriCoach, AI nutrition, meal planning, protein challenge, diet planner, nutrition app',
  openGraph: {
    title: 'NutriCoach - AI Nutrition Planning',
    description: 'Get your personalized meal plan in 60 seconds. Join the 7-day protein challenge!',
    type: 'website',
    images: ['/og-launch.png'],
  },
};

export default function LaunchPage() {
  return <LaunchPageClient />;
}
