export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  calculateNutrition,
  validateProfileInput,
  adjustCaloriesForGoal,
  calculateMacroGrams,
  DEFAULT_MACROS,
  FORMULA_VERSION,
} from '@/lib/calc-engine';
import { ProfileInput, MacroDistribution } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const {
      age,
      sex,
      weightKg,
      heightCm,
      activityLevel,
      goal,
      macros,
      saveToProfile,
    } = body;

    // Build profile input
    const profile: ProfileInput = {
      age: Number(age),
      sex: sex as 'male' | 'female',
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      activityLevel: activityLevel ?? 'moderate',
    };

    // Validate input
    const validation = validateProfileInput(profile);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    // Use custom macros or defaults
    const macroDistribution: MacroDistribution = macros ?? DEFAULT_MACROS;

    // Calculate nutrition
    const result = calculateNutrition(profile, macroDistribution);

    // Adjust for goal if provided
    let adjustedGet = result.get;
    if (goal) {
      adjustedGet = adjustCaloriesForGoal(result.get, goal);
      // Recalculate macros for adjusted calories
      const adjustedMacros = calculateMacroGrams(adjustedGet, macroDistribution);
      result.get = adjustedGet;
      result.tdee = adjustedGet;
      result.carbG = adjustedMacros.carbG;
      result.proteinG = adjustedMacros.proteinG;
      result.fatG = adjustedMacros.fatG;
    }

    // Save calculation if user is logged in and requested
    if (session?.user && saveToProfile) {
      const userId = (session.user as any).id;

      // Get or create profile
      let userProfile = await prisma.profile.findUnique({
        where: { userId },
      });

      if (!userProfile) {
        userProfile = await prisma.profile.create({
          data: {
            userId,
            age: profile.age,
            sex: profile.sex,
            weightKg: profile.weightKg,
            heightCm: profile.heightCm,
            activityLevel: profile.activityLevel,
            goal: goal ?? 'maintain',
            medicalFlags: [],
            dietaryPrefs: [],
          },
        });
      } else {
        userProfile = await prisma.profile.update({
          where: { userId },
          data: {
            age: profile.age,
            sex: profile.sex,
            weightKg: profile.weightKg,
            heightCm: profile.heightCm,
            activityLevel: profile.activityLevel,
            goal: goal ?? userProfile.goal,
          },
        });
      }

      // Save calculation
      await prisma.calculation.create({
        data: {
          profileId: userProfile.id,
          formulaVersion: FORMULA_VERSION,
          geb: result.geb,
          eta: result.eta,
          get: result.get,
          bmr: result.bmr,
          tdee: result.tdee,
          carbG: result.carbG,
          proteinG: result.proteinG,
          fatG: result.fatG,
          fiberTargetG: result.fiberTargetG,
          carbPercent: macroDistribution.carbPercent,
          proteinPercent: macroDistribution.proteinPercent,
          fatPercent: macroDistribution.fatPercent,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json(
      { error: 'Calculation failed' },
      { status: 500 }
    );
  }
}
