import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface StatsEntry {
  pointsWeekly: number;
  pointsTotal: number;
  totalDaysCompleted: number;
  currentStreakDays: number;
  bestStreakDays: number;
  challengeCompletedCount: number;
  user?: {
    profile?: {
      displayName?: string | null;
      avatarSeed?: string | null;
      publicOptIn?: boolean;
      country?: string | null;
    } | null;
  } | null;
  template?: {
    name: string;
    nameEs: string;
  } | null;
}

// GET /api/leaderboard - Get global leaderboard
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('template');
    const period = searchParams.get('period') || 'all_time'; // weekly, monthly, all_time
    const country = searchParams.get('country');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (templateId) {
      where.templateId = templateId;
    }
    
    // Get current week start for weekly filter
    const getWeekStart = () => {
      const now = new Date();
      const day = now.getUTCDay();
      const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
      const d = new Date(now);
      d.setUTCDate(diff);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    };
    
    // Determine which points field to use
    let orderByField = 'pointsTotal';
    if (period === 'weekly') {
      orderByField = 'pointsWeekly';
      where.weeklyResetAt = { gte: getWeekStart() };
    }
    
    // Get stats with user info
    const stats = await prisma.challengeStats.findMany({
      where,
      include: {
        user: {
          include: {
            profile: {
              select: {
                displayName: true,
                avatarSeed: true,
                publicOptIn: true,
                country: true,
              },
            },
          },
        },
        template: {
          select: {
            name: true,
            nameEs: true,
          },
        },
      },
      orderBy: [
        { [orderByField]: 'desc' },
        { totalDaysCompleted: 'desc' },
      ],
      take: limit,
      skip: offset,
    });
    
    // Filter by country if specified (after fetching because country is on profile)
    let filteredStats = stats as StatsEntry[];
    if (country) {
      filteredStats = filteredStats.filter(
        (s: StatsEntry) => s.user?.profile?.country?.toLowerCase() === country.toLowerCase()
      );
    }
    
    // Only include users who opted in to public leaderboard
    const publicStats = filteredStats.filter((s: StatsEntry) => s.user?.profile?.publicOptIn);
    
    // Format response
    const leaderboard = publicStats.map((stat: StatsEntry, index: number) => ({
      rank: offset + index + 1,
      displayName: stat.user?.profile?.displayName || 'Anonymous',
      avatarSeed: stat.user?.profile?.avatarSeed,
      country: stat.user?.profile?.country,
      points: period === 'weekly' ? stat.pointsWeekly : stat.pointsTotal,
      totalDaysCompleted: stat.totalDaysCompleted,
      currentStreak: stat.currentStreakDays,
      bestStreak: stat.bestStreakDays,
      challengesCompleted: stat.challengeCompletedCount,
      templateName: stat.template?.name,
      templateNameEs: stat.template?.nameEs,
    }));
    
    // Get total count for pagination
    const totalCount = await prisma.challengeStats.count({ where });
    
    // Get available templates
    const templates = await prisma.challengeTemplate.findMany({
      where: { isActive: true },
      select: { id: true, name: true, nameEs: true },
    });
    
    return NextResponse.json({
      leaderboard,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + leaderboard.length < totalCount,
      },
      templates,
      period,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
