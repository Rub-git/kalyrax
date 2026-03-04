import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateReferralCode } from '@/lib/acquisition';

export const dynamic = 'force-dynamic';

// GET - Get user's referral info
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create referral stats
    let stats = await prisma.userReferralStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      stats = await prisma.userReferralStats.create({
        data: {
          userId,
          referralCode: generateReferralCode(),
        },
      });
    }

    // Get list of referrals
    const referrals = await prisma.referral.findMany({
      where: { referrerUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      referralCode: stats.referralCode,
      totalReferrals: stats.totalReferrals,
      convertedReferrals: stats.convertedReferrals,
      recentReferrals: referrals,
    });
  } catch (error) {
    console.error('Error fetching referral info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral info' },
      { status: 500 }
    );
  }
}

// POST - Create a new referral link/invite
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's referral code
    let stats = await prisma.userReferralStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      stats = await prisma.userReferralStats.create({
        data: {
          userId,
          referralCode: generateReferralCode(),
        },
      });
    }

    // Create a new referral entry
    const newReferralCode = generateReferralCode();
    await prisma.referral.create({
      data: {
        referralCode: newReferralCode,
        referrerUserId: userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Increment total referrals sent
    await prisma.userReferralStats.update({
      where: { userId },
      data: { totalReferrals: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      referralCode: newReferralCode,
      referralLink: `/get-started?ref=${newReferralCode}`,
    });
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json(
      { error: 'Failed to create referral' },
      { status: 500 }
    );
  }
}
