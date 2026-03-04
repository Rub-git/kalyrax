import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// Create a new onboarding session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goal } = body;

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal is required' },
        { status: 400 }
      );
    }

    // Session expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const session = await prisma.onboardingSession.create({
      data: {
        goal,
        currentStep: 2, // Move to step 2 after goal selection
        expiresAt,
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      currentStep: session.currentStep,
    });
  } catch (error) {
    console.error('Error creating onboarding session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
