import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationCount } from '@/lib/social-system';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const countOnly = searchParams.get('countOnly') === 'true';

    if (!session?.user?.userId) {
      // Return empty data for unauthenticated requests to avoid console errors
      if (countOnly) return NextResponse.json({ count: 0 });
      return NextResponse.json({ notifications: [] });
    }

    if (countOnly) {
      const count = await getUnreadNotificationCount(session.user.userId);
      return NextResponse.json({ count });
    }

    const notifications = await getNotifications(session.user.userId, unreadOnly);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, notificationId } = await request.json();

    switch (action) {
      case 'markRead': {
        if (!notificationId) {
          return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
        }
        await markNotificationRead(notificationId, session.user.userId);
        return NextResponse.json({ success: true });
      }

      case 'markAllRead': {
        await markAllNotificationsRead(session.user.userId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error with notification:', error);
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    );
  }
}
