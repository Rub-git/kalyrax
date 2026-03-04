export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        calculations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        languagePreference: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user,
        profile,
        latestCalculation: profile?.calculations?.[0] ?? null,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const {
      age,
      sex,
      weightKg,
      heightCm,
      activityLevel,
      goal,
      medicalFlags,
      dietaryPrefs,
      name,
      languagePreference,
    } = body;

    // Update user if name or language changed
    if (name !== undefined || languagePreference !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(languagePreference !== undefined && { languagePreference }),
        },
      });
    }

    // Upsert profile
    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        age: age ?? 25,
        sex: sex ?? 'male',
        weightKg: weightKg ?? 70,
        heightCm: heightCm ?? 170,
        activityLevel: activityLevel ?? 'moderate',
        goal: goal ?? 'maintain',
        medicalFlags: medicalFlags ?? [],
        dietaryPrefs: dietaryPrefs ?? [],
      },
      update: {
        ...(age !== undefined && { age }),
        ...(sex !== undefined && { sex }),
        ...(weightKg !== undefined && { weightKg }),
        ...(heightCm !== undefined && { heightCm }),
        ...(activityLevel !== undefined && { activityLevel }),
        ...(goal !== undefined && { goal }),
        ...(medicalFlags !== undefined && { medicalFlags }),
        ...(dietaryPrefs !== undefined && { dietaryPrefs }),
      },
    });

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
