import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/challenge/start - Start a new challenge
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { templateId, planId } = await req.json();
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    // Check if template exists
    const template = await prisma.challengeTemplate.findUnique({
      where: { id: templateId },
    });
    
    if (!template || !template.isActive) {
      return NextResponse.json(
        { error: 'Challenge template not found' },
        { status: 404 }
      );
    }
    
    // Check if user already has an active challenge for this template
    const existingActive = await prisma.challengeInstance.findFirst({
      where: {
        userId,
        templateId,
        status: 'active',
      },
    });
    
    if (existingActive) {
      return NextResponse.json(
        { error: 'You already have an active challenge of this type', challengeId: existingActive.id },
        { status: 400 }
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
        planId: planId || null,
        startDate,
        endDate,
        status: 'active',
      },
      include: {
        template: true,
      },
    });
    
    // Create progress entries for each day
    const progressEntries = [];
    for (let day = 1; day <= template.durationDays; day++) {
      progressEntries.push({
        challengeInstanceId: challenge.id,
        dayNumber: day,
        completed: false,
      });
    }
    
    await prisma.challengeProgress.createMany({
      data: progressEntries,
    });
    
    return NextResponse.json({ 
      success: true, 
      challenge,
      message: 'Challenge started! Complete each day to earn points.'
    });
  } catch (error) {
    console.error('Error starting challenge:', error);
    return NextResponse.json(
      { error: 'Failed to start challenge' },
      { status: 500 }
    );
  }
}
