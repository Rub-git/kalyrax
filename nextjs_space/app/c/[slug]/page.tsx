import { Metadata } from 'next';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { ChallengeShareClient } from './client';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const share = await prisma.challengeShare.findUnique({
      where: { slug },
      include: {
        challengeInstance: {
          include: {
            template: true,
            user: {
              include: { profile: true },
            },
          },
        },
      },
    });

    if (!share) {
      return {
        title: 'Challenge Not Found | NutriCoach',
        description: 'This challenge may have expired or been removed.',
      };
    }

    const { challengeInstance } = share;
    const userName = challengeInstance.user.profile?.displayName || 'A User';
    const templateName = challengeInstance.template.name;
    
    // Count completed days
    const progress = await prisma.challengeProgress.findMany({
      where: { challengeInstanceId: challengeInstance.id },
    });
    const daysCompleted = progress.filter(p => p.completed).length;

    const title = `${userName}'s ${templateName} Progress | NutriCoach`;
    const description = `${userName} has completed ${daysCompleted}/${challengeInstance.template.durationDays} days of the ${templateName}. Join the challenge and transform your nutrition!`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: 'NutriCoach',
        images: ['/og-challenge.png'],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return {
      title: 'Challenge | NutriCoach',
      description: 'Join the NutriCoach nutrition challenge and transform your health.',
    };
  }
}

export default async function PublicChallengePage({ params }: PageProps) {
  const { slug } = await params;
  
  // Verify challenge exists
  const share = await prisma.challengeShare.findUnique({
    where: { slug },
  });

  if (!share) {
    notFound();
  }

  return <ChallengeShareClient slug={slug} />;
}
