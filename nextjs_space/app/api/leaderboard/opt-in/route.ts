import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateAvatarSeed } from '@/lib/challenge-points';

export const dynamic = 'force-dynamic';

// POST /api/leaderboard/opt-in - Toggle public leaderboard visibility
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { publicOptIn, displayName, country, timezone } = await req.json();
    
    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Complete onboarding first.' },
        { status: 400 }
      );
    }
    
    // Generate avatar seed if not set and opting in
    let avatarSeed = profile.avatarSeed;
    if (publicOptIn && !avatarSeed) {
      avatarSeed = generateAvatarSeed();
    }
    
    // Update profile
    const updatedProfile = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        publicOptIn: publicOptIn ?? profile.publicOptIn,
        displayName: displayName !== undefined ? displayName : profile.displayName,
        country: country !== undefined ? country : profile.country,
        timezone: timezone !== undefined ? timezone : profile.timezone,
        avatarSeed,
      },
    });
    
    return NextResponse.json({
      success: true,
      profile: {
        publicOptIn: updatedProfile.publicOptIn,
        displayName: updatedProfile.displayName,
        country: updatedProfile.country,
        timezone: updatedProfile.timezone,
        avatarSeed: updatedProfile.avatarSeed,
      },
    });
  } catch (error) {
    console.error('Error updating leaderboard opt-in:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// GET /api/leaderboard/opt-in - Get current opt-in status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        publicOptIn: true,
        displayName: true,
        country: true,
        timezone: true,
        avatarSeed: true,
      },
    });
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching opt-in status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
