import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      sessionId,
      source,
      landingPage,
      referralCode,
      utmSource,
      utmMedium,
      utmCampaign,
      metadata,
    } = body;

    if (!source) {
      return NextResponse.json(
        { error: 'Source is required' },
        { status: 400 }
      );
    }

    const event = await prisma.acquisitionEvent.create({
      data: {
        userId,
        sessionId,
        source,
        landingPage,
        referralCode,
        utmSource,
        utmMedium,
        utmCampaign,
        metadata: metadata || {},
      },
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('Error tracking acquisition:', error);
    return NextResponse.json(
      { error: 'Failed to track acquisition' },
      { status: 500 }
    );
  }
}
