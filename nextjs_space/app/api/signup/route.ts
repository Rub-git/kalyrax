export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getLocalizedError(language: string | undefined, key: string): string {
  const isEs = language === 'es';

  const messages: Record<string, { es: string; en: string }> = {
    MISSING_FIELDS: {
      es: 'Email y contraseña son obligatorios',
      en: 'Email and password are required',
    },
    INVALID_EMAIL: {
      es: 'El correo no es valido',
      en: 'Invalid email format',
    },
    WEAK_PASSWORD: {
      es: 'La contraseña debe tener al menos 6 caracteres',
      en: 'Password must be at least 6 characters',
    },
    USER_EXISTS: {
      es: 'Ya existe una cuenta con este correo. Inicia sesion.',
      en: 'An account with this email already exists. Please sign in.',
    },
    DB_UNAVAILABLE: {
      es: 'Servicio temporalmente no disponible. Intenta de nuevo en unos minutos.',
      en: 'Service temporarily unavailable. Please try again in a few minutes.',
    },
    CREATE_FAILED: {
      es: 'Error al crear cuenta',
      en: 'Failed to create account',
    },
  };

  const fallback = messages.CREATE_FAILED;
  const selected = messages[key] ?? fallback;
  return isEs ? selected.es : selected.en;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      name, 
      language, 
      referralSource, 
      referralSlug, 
      referralCode,
      onboardingSessionId,
      sessionId, // For acquisition tracking
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: getLocalizedError(language, 'MISSING_FIELDS'), code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: getLocalizedError(language, 'INVALID_EMAIL'), code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: getLocalizedError(language, 'WEAK_PASSWORD'), code: 'WEAK_PASSWORD' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: getLocalizedError(language, 'USER_EXISTS'), code: 'USER_EXISTS' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Determine acquisition source
    let acquisitionSource = 'direct';
    if (referralCode) {
      acquisitionSource = 'referral';
    } else if (utmSource === 'product_hunt') {
      acquisitionSource = 'product_hunt';
    } else if (referralSource) {
      acquisitionSource = referralSource;
    }

    // Create user with referral tracking
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name ?? null,
        languagePreference: language ?? 'en',
        referralSource: acquisitionSource,
        referralSlug: referralSlug ?? referralCode ?? null,
      },
    });

    // Handle referral code conversion
    if (referralCode) {
      try {
        const referral = await prisma.referral.findUnique({
          where: { referralCode },
        });

        if (referral && referral.status === 'pending') {
          await prisma.referral.update({
            where: { id: referral.id },
            data: {
              referredUserId: user.id,
              status: 'converted',
              convertedAt: new Date(),
            },
          });

          // Update referrer's stats
          await prisma.userReferralStats.update({
            where: { userId: referral.referrerUserId },
            data: {
              convertedReferrals: { increment: 1 },
            },
          });
        }
      } catch (refError) {
        console.error('Error converting referral:', refError);
      }
    }

    // Track acquisition event
    try {
      await prisma.acquisitionEvent.updateMany({
        where: { sessionId: sessionId || undefined },
        data: {
          userId: user.id,
          converted: true,
          convertedAt: new Date(),
        },
      });

      // Also create a growth event
      await prisma.growthEvent.create({
        data: {
          userId: user.id,
          sessionId: sessionId || null,
          eventType: 'USER_REGISTERED',
          sourceSlug: referralCode || referralSlug || null,
          metadata: {
            acquisitionSource,
            utmSource,
            utmMedium,
            utmCampaign,
          },
        },
      });
    } catch (trackError) {
      console.error('Error tracking acquisition:', trackError);
    }

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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: getLocalizedError(undefined, 'USER_EXISTS'), code: 'USER_EXISTS' },
          { status: 409 }
        );
      }
    }

    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      return NextResponse.json(
        { error: getLocalizedError(undefined, 'DB_UNAVAILABLE'), code: 'DB_UNAVAILABLE' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: getLocalizedError(undefined, 'CREATE_FAILED'), code: 'CREATE_FAILED' },
      { status: 500 }
    );
  }
}
