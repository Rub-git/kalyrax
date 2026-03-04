export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { 
  calculateNutrition, 
  adjustCaloriesForGoal, 
  calculateMacroGrams,
  DEFAULT_MACROS,
  FORMULA_VERSION 
} from '@/lib/calc-engine';
import { ProfileInput } from '@/lib/types';

// Map onboarding goals to calc-engine goals
const GOAL_MAP: Record<string, 'maintain' | 'lose_weight' | 'gain_weight' | 'improve_health'> = {
  lose_weight: 'lose_weight',
  build_muscle: 'gain_weight',
  eat_healthier: 'improve_health',
  maintain_weight: 'maintain',
};

// Map activity levels
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
const ACTIVITY_MAP: Record<string, ActivityLevel> = {
  sedentary: 'sedentary',
  light: 'light',
  moderate: 'moderate',
  active: 'active',
  very_active: 'very_active',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, language, referralSource, referralSlug, onboardingSessionId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with referral tracking
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name ?? null,
        languagePreference: language ?? 'en',
        referralSource: referralSource ?? null,
        referralSlug: referralSlug ?? null,
      },
    });

    // If onboardingSessionId provided, convert session to profile
    if (onboardingSessionId) {
      try {
        const session = await prisma.onboardingSession.findUnique({
          where: { id: onboardingSessionId },
        });

        if (session && session.age && session.sex && session.heightCm && session.weightKg && session.activityLevel) {
          // Map goal and activity level
          const calcGoal = GOAL_MAP[session.goal] || 'maintain';
          const activityLevel = ACTIVITY_MAP[session.activityLevel] || 'moderate';

          // Create profile input
          const profileInput: ProfileInput = {
            age: session.age,
            sex: session.sex as 'male' | 'female',
            weightKg: session.weightKg,
            heightCm: session.heightCm,
            activityLevel: activityLevel,
          };

          // Calculate nutrition
          const calculation = calculateNutrition(profileInput);
          
          // Adjust for goal
          const adjustedTdee = adjustCaloriesForGoal(calculation.get, calcGoal);
          const adjustedMacros = calculateMacroGrams(adjustedTdee, DEFAULT_MACROS);

          // Create profile
          const profile = await prisma.profile.create({
            data: {
              userId: user.id,
              age: session.age,
              sex: session.sex,
              weightKg: session.weightKg,
              heightCm: session.heightCm,
              activityLevel: activityLevel,
              goal: calcGoal,
              medicalFlags: [],
              dietaryPrefs: [],
            },
          });

          // Create calculation record
          await prisma.calculation.create({
            data: {
              profileId: profile.id,
              formulaVersion: FORMULA_VERSION,
              geb: calculation.geb,
              eta: calculation.eta,
              get: calculation.get,
              bmr: calculation.bmr,
              tdee: adjustedTdee,
              carbG: adjustedMacros.carbG,
              proteinG: adjustedMacros.proteinG,
              fatG: adjustedMacros.fatG,
              fiberTargetG: calculation.fiberTargetG,
              carbPercent: DEFAULT_MACROS.carbPercent,
              proteinPercent: DEFAULT_MACROS.proteinPercent,
              fatPercent: DEFAULT_MACROS.fatPercent,
            },
          });

          // Mark session as converted
          await prisma.onboardingSession.update({
            where: { id: onboardingSessionId },
            data: {
              convertedToUserId: user.id,
            },
          });
        }
      } catch (sessionError) {
        console.error('Error converting onboarding session:', sessionError);
        // Continue - user is created, just session conversion failed
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
