import { Metadata } from 'next';
import { LaunchPageClient } from './client';

export const metadata: Metadata = {
  title: 'Kalyrax - AI Nutrition Planning | Product Hunt Launch',
  description: 'AI-powered nutrition planning, personalized meal plans, and a 7-day protein challenge. Transform your health with science-backed nutrition recommendations.',
  keywords: 'Kalyrax, AI nutrition, meal planning, protein challenge, diet planner, nutrition app',
  openGraph: {
    title: 'Kalyrax - AI Nutrition Planning',
    description: 'Get your personalized meal plan in 60 seconds. Join the 7-day protein challenge!',
    type: 'website',
    images: ['/og-launch.png'],
  },
};

export default function LaunchPage() {
  return <LaunchPageClient />;
}
