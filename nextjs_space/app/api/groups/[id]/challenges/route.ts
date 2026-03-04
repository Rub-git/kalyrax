import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createGroupChallenge, joinGroupChallenge, getGroupChallengeLeaderboard } from '@/lib/social-system';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    if (challengeId) {
      // Get leaderboard for a specific challenge
      const leaderboard = await getGroupChallengeLeaderboard(challengeId);
      return NextResponse.json({ leaderboard });
    }

    // Get all challenges for the group
    const challenges = await prisma.groupChallenge.findMany({
      where: { groupId: id },
      include: {
        template: true,
        creator: {
          select: {
            id: true,
            name: true,
            profile: { select: { displayName: true } },
          },
        },
        participants: {
          where: { userId: session.user.userId },
        },
        _count: { select: { participants: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({
      challenges: challenges.map(c => ({
        ...c,
        isParticipating: c.participants.length > 0,
        participantCount: c._count.participants,
      })),
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action, templateId, startDate, challengeId } = await request.json();

    switch (action) {
      case 'create': {
        if (!templateId || !startDate) {
          return NextResponse.json({ error: 'Template ID and start date required' }, { status: 400 });
        }
        const challenge = await createGroupChallenge(
          id,
          session.user.userId,
          templateId,
          new Date(startDate)
        );
        return NextResponse.json({ challenge });
      }

      case 'join': {
        if (!challengeId) {
          return NextResponse.json({ error: 'Challenge ID required' }, { status: 400 });
        }
        await joinGroupChallenge(challengeId, session.user.userId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error with group challenge:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}
