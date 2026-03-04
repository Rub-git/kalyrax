import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackGrowthEvent } from '@/lib/growth-analytics';

export const dynamic = 'force-dynamic';

// POST /api/challenge/start - Start a new challenge
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId } = await req.json();

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Check if user already has an active challenge for this template
    const existingChallenge = await prisma.challengeInstance.findFirst({
      where: {
        userId,
        templateId,
        status: 'active',
      },
    });

    if (existingChallenge) {
      return NextResponse.json(
        { error: 'You already have an active challenge for this template' },
        { status: 400 }
      );
    }

    // Get the template
    const template = await prisma.challengeTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Challenge template not found' },
        { status: 404 }
      );
    }

    // Create the challenge instance
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + template.durationDays);

    const challenge = await prisma.challengeInstance.create({
      data: {
        userId,
        templateId,
        startDate,
        endDate,
        status: 'active',
        progress: {
          create: Array.from({ length: template.durationDays }, (_, i) => ({
            dayNumber: i + 1,
            completed: false,
          })),
        },
      },
      include: {
        template: true,
        progress: {
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    // Initialize or update stats
    await prisma.challengeStats.upsert({
      where: {
        userId_templateId: { userId, templateId },
      },
      create: {
        userId,
        templateId,
        totalDaysCompleted: 0,
        currentStreakDays: 0,
        bestStreakDays: 0,
        challengeCompletedCount: 0,
        pointsTotal: 0,
        pointsWeekly: 0,
      },
      update: {
        currentStreakDays: 0,
      },
    });

    // Track CHALLENGE_STARTED growth event
    await trackGrowthEvent({
      userId,
      eventType: 'CHALLENGE_STARTED',
      metadata: {
        templateId,
        templateName: template.name,
        challengeInstanceId: challenge.id,
      },
    });

    return NextResponse.json({
      success: true,
      challenge,
    });
  } catch (error) {
    console.error('Error starting challenge:', error);
    return NextResponse.json(
      { error: 'Failed to start challenge' },
      { status: 500 }
    );
  }
}
