import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/challenge/[id] - Get challenge instance details
export async function GET(
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
    
    const challenge = await prisma.challengeInstance.findUnique({
      where: { id },
      include: {
        template: true,
        progress: {
          orderBy: { dayNumber: 'asc' },
        },
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
    
    // Verify ownership
    if (challenge.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get user's stats for this template
    const stats = await prisma.challengeStats.findUnique({
      where: {
        userId_templateId: {
          userId,
          templateId: challenge.templateId,
        },
      },
    });
    
    return NextResponse.json({ challenge, stats });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge' },
      { status: 500 }
    );
  }
}
