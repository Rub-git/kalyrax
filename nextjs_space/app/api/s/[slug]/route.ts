export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Get a shared meal plan by slug (public endpoint)
 * GET /api/s/[slug]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const sharedPlan = await prisma.sharedPlan.findUnique({
      where: { slug },
      include: {
        mealPlan: {
          include: {
            calculation: true,
          },
        },
      },
    });

    if (!sharedPlan || !sharedPlan.isPublic) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check if expired
    if (sharedPlan.expiresAt && sharedPlan.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
    }

    // Return sanitized plan (no PII)
    const { mealPlan } = sharedPlan;
    const { calculation } = mealPlan;

    return NextResponse.json({
      success: true,
      data: {
        slug: sharedPlan.slug,
        viewCount: sharedPlan.viewCount,
        createdAt: sharedPlan.createdAt,
        targets: {
          kcal: Math.round(calculation.get),
          carbG: Math.round(calculation.carbG),
          proteinG: Math.round(calculation.proteinG),
          fatG: Math.round(calculation.fatG),
          fiberG: Math.round(calculation.fiberTargetG),
        },
        macroDistribution: {
          carbPercent: calculation.carbPercent,
          proteinPercent: calculation.proteinPercent,
          fatPercent: calculation.fatPercent,
        },
        days: mealPlan.days,
        shoppingList: mealPlan.shoppingList,
      },
    });
  } catch (error) {
    console.error('Get shared plan error:', error);
    return NextResponse.json(
      { error: 'Failed to get shared plan' },
      { status: 500 }
    );
  }
}
