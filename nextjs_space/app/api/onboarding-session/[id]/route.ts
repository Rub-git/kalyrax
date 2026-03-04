import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get onboarding session
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.onboardingSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 410 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching onboarding session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// Update onboarding session
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const session = await prisma.onboardingSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 410 }
      );
    }

    const { age, sex, heightCm, weightKg, activityLevel, currentStep } = body;

    const updatedSession = await prisma.onboardingSession.update({
      where: { id },
      data: {
        ...(age !== undefined && { age }),
        ...(sex !== undefined && { sex }),
        ...(heightCm !== undefined && { heightCm }),
        ...(weightKg !== undefined && { weightKg }),
        ...(activityLevel !== undefined && { activityLevel }),
        ...(currentStep !== undefined && { currentStep }),
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating onboarding session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
