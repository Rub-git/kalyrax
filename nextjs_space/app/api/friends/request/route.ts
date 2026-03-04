import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, blockUser } from '@/lib/social-system';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, friendId, friendshipId } = await request.json();

    switch (action) {
      case 'send': {
        if (!friendId) {
          return NextResponse.json({ error: 'Friend ID required' }, { status: 400 });
        }
        const friendship = await sendFriendRequest(session.user.userId, friendId);
        return NextResponse.json({ friendship });
      }

      case 'accept': {
        if (!friendshipId) {
          return NextResponse.json({ error: 'Friendship ID required' }, { status: 400 });
        }
        const friendship = await acceptFriendRequest(friendshipId, session.user.userId);
        return NextResponse.json({ friendship });
      }

      case 'reject': {
        if (!friendshipId) {
          return NextResponse.json({ error: 'Friendship ID required' }, { status: 400 });
        }
        await rejectFriendRequest(friendshipId, session.user.userId);
        return NextResponse.json({ success: true });
      }

      case 'remove': {
        if (!friendshipId) {
          return NextResponse.json({ error: 'Friendship ID required' }, { status: 400 });
        }
        await removeFriend(friendshipId, session.user.userId);
        return NextResponse.json({ success: true });
      }

      case 'block': {
        if (!friendId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        await blockUser(session.user.userId, friendId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error with friend request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}
