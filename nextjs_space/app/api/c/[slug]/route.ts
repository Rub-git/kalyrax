import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ProgressEntry {
  dayNumber: number;
  completed: boolean;
}

// GET /api/c/[slug] - Get public challenge data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const share = await prisma.challengeShare.findUnique({
      where: { slug },
      include: {
        challengeInstance: {
          include: {
            template: true,
            progress: {
              orderBy: { dayNumber: 'asc' },
            },
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
          },
        },
      },
    });
    
    if (!share) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }
    
    const { challengeInstance } = share;
    const daysCompleted = challengeInstance.progress.filter((p: ProgressEntry) => p.completed).length;
    
    // Prepare user info (respect privacy settings)
    let userInfo = null;
    if (challengeInstance.user?.profile?.publicOptIn) {
      userInfo = {
        displayName: challengeInstance.user.profile.displayName || 'Anonymous',
        avatarSeed: challengeInstance.user.profile.avatarSeed,
        country: challengeInstance.user.profile.country,
      };
    }
    
    // Get user's rank if public
    let rank = null;
    if (userInfo) {
      const stats = await prisma.challengeStats.findUnique({
        where: {
          userId_templateId: {
            userId: challengeInstance.userId,
            templateId: challengeInstance.templateId,
          },
        },
      });
      
      if (stats) {
        const higherRanked = await prisma.challengeStats.count({
          where: {
            templateId: challengeInstance.templateId,
            pointsTotal: { gt: stats.pointsTotal },
          },
        });
        rank = higherRanked + 1;
      }
    }
    
    return NextResponse.json({
      challenge: {
        id: challengeInstance.id,
        templateName: challengeInstance.template.name,
        templateNameEs: challengeInstance.template.nameEs,
        description: challengeInstance.template.description,
        descriptionEs: challengeInstance.template.descriptionEs,
        durationDays: challengeInstance.template.durationDays,
        status: challengeInstance.status,
        daysCompleted,
        progress: challengeInstance.progress.map((p: ProgressEntry) => ({
          dayNumber: p.dayNumber,
          completed: p.completed,
        })),
        startDate: challengeInstance.startDate,
        macroRules: challengeInstance.template.macroRules,
      },
      user: userInfo,
      rank,
      viewCount: share.viewCount,
      slug,
    });
  } catch (error) {
    console.error('Error fetching public challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge' },
      { status: 500 }
    );
  }
}
