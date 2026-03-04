import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { addReaction, removeReaction, ReactionType } from '@/lib/social-system';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activityId, reactionType, remove } = await request.json();

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID required' }, { status: 400 });
    }

    if (remove) {
      await removeReaction(activityId, session.user.userId);
      return NextResponse.json({ success: true });
    }

    if (!reactionType || !['fire', 'muscle', 'clap'].includes(reactionType)) {
      return NextResponse.json({ error: 'Valid reaction type required' }, { status: 400 });
    }

    const reaction = await addReaction(activityId, session.user.userId, reactionType as ReactionType);
    return NextResponse.json({ reaction });
  } catch (error) {
    console.error('Error with reaction:', error);
    return NextResponse.json(
      { error: 'Failed to process reaction' },
      { status: 500 }
    );
  }
}
