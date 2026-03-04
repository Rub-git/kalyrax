import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { trackUpgradePrompt } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

// POST - Track analytics events
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, source, clicked } = body;

    if (eventType === 'upgrade_prompt') {
      await trackUpgradePrompt(userId, source || 'unknown', clicked || false);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking analytics:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
