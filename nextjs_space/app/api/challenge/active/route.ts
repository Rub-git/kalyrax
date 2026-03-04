import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/challenge/active - Get user's active challenges
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const challenges = await prisma.challengeInstance.findMany({
      where: {
        userId,
        status: 'active',
      },
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
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Error fetching active challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active challenges' },
      { status: 500 }
    );
  }
}
