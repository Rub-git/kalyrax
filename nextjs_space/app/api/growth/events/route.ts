import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { trackGrowthEvent, GrowthEventType } from '@/lib/growth-analytics';

export const dynamic = 'force-dynamic';

// POST /api/growth/events - Track a growth event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, sessionId, sourceSlug, metadata } = body;

    // Validate event type
    const validEventTypes: GrowthEventType[] = [
      'PLAN_GENERATED',
      'CHALLENGE_STARTED',
      'DAY_COMPLETED',
      'CHALLENGE_COMPLETED',
      'SHARE_CREATED',
      'SHARE_CLICKED',
      'USER_REGISTERED',
    ];

    if (!eventType || !validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Get user ID if authenticated
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId;

    await trackGrowthEvent({
      userId,
      sessionId,
      eventType,
      sourceSlug,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking growth event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
