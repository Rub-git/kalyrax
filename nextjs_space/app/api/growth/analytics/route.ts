import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getGrowthMetrics, getDailyEventCounts, getViralFunnel, GrowthEventType } from '@/lib/growth-analytics';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Check if user is admin (simple check - in production you'd have proper roles)
async function isAdmin(userId: string): Promise<boolean> {
  // For MVP, consider the first user or users with specific email as admin
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.email?.endsWith('@nutricoach.com') || 
         user?.email === 'admin@nutricoach.com' ||
         user?.email === 'test@nutricoach.com';
}

// GET /api/growth/analytics - Get growth analytics data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId;

    // For now, allow access to authenticated users for demo
    // In production, restrict to admin users
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const type = searchParams.get('type') || 'all';

    if (type === 'metrics') {
      const metrics = await getGrowthMetrics(days);
      return NextResponse.json(metrics);
    }

    if (type === 'funnel') {
      const funnel = await getViralFunnel(days);
      return NextResponse.json(funnel);
    }

    if (type === 'daily') {
      const eventTypes: GrowthEventType[] = [
        'PLAN_GENERATED',
        'CHALLENGE_STARTED',
        'SHARE_CREATED',
        'USER_REGISTERED',
      ];
      const dailyCounts = await getDailyEventCounts(eventTypes, days);
      return NextResponse.json(dailyCounts);
    }

    // Return all data
    const [metrics, funnel, dailyCounts] = await Promise.all([
      getGrowthMetrics(days),
      getViralFunnel(days),
      getDailyEventCounts(
        ['PLAN_GENERATED', 'CHALLENGE_STARTED', 'SHARE_CREATED', 'USER_REGISTERED'],
        days
      ),
    ]);

    return NextResponse.json({
      metrics,
      funnel,
      dailyCounts,
      period: { days, startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    });
  } catch (error) {
    console.error('Error fetching growth analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
