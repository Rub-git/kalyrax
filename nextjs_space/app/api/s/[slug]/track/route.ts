export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Track view for a shared plan
 * POST /api/s/[slug]/track
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const sharedPlan = await prisma.sharedPlan.findUnique({
      where: { slug },
    });

    if (!sharedPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Increment view count
    await prisma.sharedPlan.update({
      where: { slug },
      data: {
        viewCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      viewCount: sharedPlan.viewCount + 1,
    });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}
