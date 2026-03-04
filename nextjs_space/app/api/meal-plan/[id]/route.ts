export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { recordStreakActivity } from '@/lib/streak-system';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;

    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        calculation: true,
      },
    });

    if (!mealPlan || mealPlan.userId !== userId) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Record streak activity for viewing plan
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    await recordStreakActivity(userId, 'PLAN_VIEW', profile?.timezone || undefined);

    return NextResponse.json({
      success: true,
      data: mealPlan,
    });
  } catch (error) {
    console.error('Meal plan fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plan' },
      { status: 500 }
    );
  }
}
