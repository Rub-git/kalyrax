export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getSiteUrl } from '@/lib/site-url';

// Generate a short unique slug
function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

/**
 * Create a shareable link for a meal plan
 * POST /api/share/plan/[planId]
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { planId } = params;

    // Verify meal plan belongs to user
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: planId,
        userId,
      },
      include: {
        calculation: true,
      },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    // Check if already shared
    const existingShare = await prisma.sharedPlan.findFirst({
      where: { planId },
    });

    if (existingShare) {
      // Return existing share link
      const baseUrl = getSiteUrl();
      return NextResponse.json({
        success: true,
        data: {
          slug: existingShare.slug,
          shareUrl: `${baseUrl}/s/${existingShare.slug}`,
          viewCount: existingShare.viewCount,
          createdAt: existingShare.createdAt,
        },
      });
    }

    // Generate unique slug
    let slug = generateSlug();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.sharedPlan.findUnique({ where: { slug } });
      if (!exists) break;
      slug = generateSlug();
      attempts++;
    }

    // Create shared plan
    const sharedPlan = await prisma.sharedPlan.create({
      data: {
        planId,
        slug,
        isPublic: true,
      },
    });

    const baseUrl = getSiteUrl();

    return NextResponse.json({
      success: true,
      data: {
        slug: sharedPlan.slug,
        shareUrl: `${baseUrl}/s/${sharedPlan.slug}`,
        viewCount: 0,
        createdAt: sharedPlan.createdAt,
      },
    });
  } catch (error) {
    console.error('Share plan error:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
