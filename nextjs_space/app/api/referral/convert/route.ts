import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Convert a referral when user signs up
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode, referredUserId } = body;

    if (!referralCode || !referredUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the referral
    const referral = await prisma.referral.findUnique({
      where: { referralCode },
    });

    if (!referral) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    if (referral.status !== 'pending') {
      return NextResponse.json(
        { error: 'Referral already used' },
        { status: 400 }
      );
    }

    // Check if expired
    if (referral.expiresAt && new Date() > referral.expiresAt) {
      await prisma.referral.update({
        where: { id: referral.id },
        data: { status: 'expired' },
      });
      return NextResponse.json(
        { error: 'Referral code expired' },
        { status: 400 }
      );
    }

    // Update the referral
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        referredUserId,
        status: 'converted',
        convertedAt: new Date(),
      },
    });

    // Update referrer's stats
    await prisma.userReferralStats.update({
      where: { userId: referral.referrerUserId },
      data: {
        convertedReferrals: { increment: 1 },
      },
    });

    // Track growth event
    await prisma.growthEvent.create({
      data: {
        userId: referredUserId,
        eventType: 'USER_REGISTERED',
        sourceSlug: referralCode,
        metadata: { referrerUserId: referral.referrerUserId },
      },
    });

    return NextResponse.json({
      success: true,
      referrerId: referral.referrerUserId,
    });
  } catch (error) {
    console.error('Error converting referral:', error);
    return NextResponse.json(
      { error: 'Failed to convert referral' },
      { status: 500 }
    );
  }
}
