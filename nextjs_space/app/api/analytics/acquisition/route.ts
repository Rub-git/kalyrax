import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get date range (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get acquisition stats by source
    const bySource = await prisma.acquisitionEvent.groupBy({
      by: ['source'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    // Get conversion stats
    const totalVisitors = await prisma.acquisitionEvent.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const conversions = await prisma.acquisitionEvent.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        converted: true,
      },
    });

    // Get calculator usage
    const calculatorUsage = await prisma.calculatorResult.groupBy({
      by: ['calculatorType'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    // Get referral stats
    const referralStats = await prisma.referral.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    const convertedReferrals = await prisma.referral.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'converted',
      },
    });

    // Get top landing pages
    const topLandingPages = await prisma.acquisitionEvent.groupBy({
      by: ['landingPage'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        landingPage: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    return NextResponse.json({
      bySource: bySource.map(s => ({
        source: s.source,
        count: s._count.id,
      })),
      totalVisitors,
      conversions,
      conversionRate: totalVisitors > 0 ? ((conversions / totalVisitors) * 100).toFixed(2) : '0',
      calculatorUsage: calculatorUsage.map(c => ({
        type: c.calculatorType,
        count: c._count.id,
      })),
      referrals: {
        total: referralStats._count.id,
        converted: convertedReferrals,
      },
      topLandingPages: topLandingPages.map(p => ({
        page: p.landingPage,
        count: p._count.id,
      })),
    });
  } catch (error) {
    console.error('Error fetching acquisition analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
