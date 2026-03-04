import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getStreakHistory } from '@/lib/streak-system';

export const dynamic = 'force-dynamic';

// GET /api/streak/history - Get user's streak event history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session as { user?: { id?: string } })?.user?.id || (session as { userId?: string })?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');

    const history = await getStreakHistory(userId, Math.min(limit, 100));

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching streak history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
