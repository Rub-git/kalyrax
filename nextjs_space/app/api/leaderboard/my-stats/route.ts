import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface StatsEntry {
  id: string;
  templateId: string;
  pointsTotal: number;
  pointsWeekly: number;
  totalDaysCompleted: number;
  currentStreakDays: number;
  bestStreakDays: number;
  challengeCompletedCount: number;
  template?: {
    name: string;
    nameEs: string;
  } | null;
}

// GET /api/leaderboard/my-stats - Get current user's challenge stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's stats for all templates
    const stats = await prisma.challengeStats.findMany({
      where: { userId },
      include: {
        template: {
          select: {
            name: true,
            nameEs: true,
          },
        },
      },
    });
    
    // Get user's rank for each template
    const statsWithRank = await Promise.all(
      stats.map(async (stat: StatsEntry) => {
        const higherRanked = await prisma.challengeStats.count({
          where: {
            templateId: stat.templateId,
            pointsTotal: { gt: stat.pointsTotal },
          },
        });
        
        const totalParticipants = await prisma.challengeStats.count({
          where: { templateId: stat.templateId },
        });
        
        return {
          ...stat,
          rank: higherRanked + 1,
          totalParticipants,
        };
      })
    );
    
    // Get recent events
    const recentEvents = await prisma.leaderboardEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    // Calculate totals
    const totals = {
      totalPoints: stats.reduce((sum: number, s: StatsEntry) => sum + s.pointsTotal, 0),
      weeklyPoints: stats.reduce((sum: number, s: StatsEntry) => sum + s.pointsWeekly, 0),
      totalDaysCompleted: stats.reduce((sum: number, s: StatsEntry) => sum + s.totalDaysCompleted, 0),
      challengesCompleted: stats.reduce((sum: number, s: StatsEntry) => sum + s.challengeCompletedCount, 0),
      bestStreak: Math.max(...stats.map((s: StatsEntry) => s.bestStreakDays), 0),
    };
    
    return NextResponse.json({
      stats: statsWithRank,
      recentEvents,
      totals,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
