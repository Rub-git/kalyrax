import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  calculateNutrition,
  adjustCaloriesForGoal,
  calculateMacroGrams,
  KCAL_PER_GRAM,
  DEFAULT_MACROS,
} from '@/lib/calc-engine';
import { ProfileInput } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

// Calculate nutrition and generate meal preview
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.onboardingSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 410 }
      );
    }

    // Validate all required fields are present
    if (!session.age || !session.sex || !session.heightCm || !session.weightKg || !session.activityLevel) {
      return NextResponse.json(
        { error: 'Missing required profile data' },
        { status: 400 }
      );
    }

    // Map the goal and activity level
    const calcGoal = GOAL_MAP[session.goal] || 'maintain';
    const activityLevel = ACTIVITY_MAP[session.activityLevel] || 'moderate';

    // Create profile input for calculation
    const profileInput: ProfileInput = {
      age: session.age,
      sex: session.sex as 'male' | 'female',
      weightKg: session.weightKg,
      heightCm: session.heightCm,
      activityLevel: activityLevel,
    };

    // Calculate nutrition
    const calculation = calculateNutrition(profileInput);
    
    // Adjust calories for goal
    const adjustedTdee = adjustCaloriesForGoal(calculation.get, calcGoal);
    
    // Recalculate macros based on adjusted TDEE
    const macros = calculateMacroGrams(adjustedTdee, DEFAULT_MACROS);

    // Get 6 random food items for meal preview
    const sampleFoods = await prisma.foodItem.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
    });

    // Create a simple meal preview
    const mealPreview = {
      breakfast: {
        name: 'Healthy Breakfast',
        nameEs: 'Desayuno Saludable',
        items: sampleFoods.slice(0, 2).map(f => ({
          name: f.name,
          nameEs: f.nameEs,
          kcal: Math.round(f.kcal),
        })),
        totalKcal: Math.round(adjustedTdee * 0.25),
      },
      lunch: {
        name: 'Balanced Lunch',
        nameEs: 'Almuerzo Balanceado',
        items: sampleFoods.slice(2, 4).map(f => ({
          name: f.name,
          nameEs: f.nameEs,
          kcal: Math.round(f.kcal),
        })),
        totalKcal: Math.round(adjustedTdee * 0.35),
      },
      dinner: {
        name: 'Light Dinner',
        nameEs: 'Cena Ligera',
        items: sampleFoods.slice(4, 6).map(f => ({
          name: f.name,
          nameEs: f.nameEs,
          kcal: Math.round(f.kcal),
        })),
        totalKcal: Math.round(adjustedTdee * 0.30),
      },
      snacks: {
        name: 'Healthy Snacks',
        nameEs: 'Snacks Saludables',
        totalKcal: Math.round(adjustedTdee * 0.10),
      },
    };

    // Update session with calculated data
    const updatedSession = await prisma.onboardingSession.update({
      where: { id },
      data: {
        dailyCalories: adjustedTdee,
        carbG: macros.carbG,
        proteinG: macros.proteinG,
        fatG: macros.fatG,
        mealPreview,
        currentStep: 5, // Move to results step
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      dailyCalories: Math.round(adjustedTdee),
      macros: {
        carbG: Math.round(macros.carbG),
        proteinG: Math.round(macros.proteinG),
        fatG: Math.round(macros.fatG),
        carbPercent: DEFAULT_MACROS.carbPercent,
        proteinPercent: DEFAULT_MACROS.proteinPercent,
        fatPercent: DEFAULT_MACROS.fatPercent,
      },
      mealPreview,
      sessionId: updatedSession.id,
    });
  } catch (error) {
    console.error('Error calculating nutrition:', error);
    return NextResponse.json(
      { error: 'Failed to calculate nutrition' },
      { status: 500 }
    );
  }
}
