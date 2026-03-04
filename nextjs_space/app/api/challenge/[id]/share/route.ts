import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { awardPoints, generateSlug } from '@/lib/challenge-points';
import { trackGrowthEvent } from '@/lib/growth-analytics';

export const dynamic = 'force-dynamic';

// POST /api/challenge/[id]/share - Create shareable link for challenge
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    // Get the challenge instance
    const challenge = await prisma.challengeInstance.findUnique({
      where: { id },
      include: {
        shares: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    
    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }
    
    if (challenge.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Return existing share if available
    if (challenge.shares.length > 0) {
      return NextResponse.json({
        success: true,
        share: challenge.shares[0],
        isNew: false,
      });
    }
    
    // Generate unique slug
    let slug = generateSlug();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.challengeShare.findUnique({
        where: { slug },
      });
      if (!existing) break;
      slug = generateSlug();
      attempts++;
    }
    
    // Create share link
    const share = await prisma.challengeShare.create({
      data: {
        challengeInstanceId: challenge.id,
        slug,
      },
    });
    
    // Award share points
    await awardPoints({
      userId,
      challengeInstanceId: challenge.id,
      eventType: 'SHARE_CREATED',
      metadata: { slug },
    });
    
    // Track SHARE_CREATED growth event
    await trackGrowthEvent({
      userId,
      eventType: 'SHARE_CREATED',
      metadata: {
        slug,
        challengeInstanceId: challenge.id,
      },
    });
    
    return NextResponse.json({
      success: true,
      share,
      isNew: true,
    });
  } catch (error) {
    console.error('Error creating challenge share:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
