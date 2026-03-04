/**
 * Acquisition Tracking System
 * Tracks user acquisition sources and referrals
 */

import prisma from './db';

// Acquisition sources
export type AcquisitionSource = 'seo' | 'social' | 'referral' | 'direct' | 'product_hunt';

// Calculator types for SEO pages
export type CalculatorType = 'macro' | 'calorie' | 'protein' | 'meal_plan';

/**
 * Generate a unique referral code
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate session ID for anonymous tracking
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Detect acquisition source from URL parameters and referrer
 */
export function detectAcquisitionSource(
  searchParams: Record<string, string | undefined>,
  referrer?: string
): AcquisitionSource {
  // Check for referral code
  if (searchParams.ref || searchParams.referral) {
    return 'referral';
  }

  // Check for Product Hunt
  if (searchParams.utm_source === 'product_hunt' || referrer?.includes('producthunt.com')) {
    return 'product_hunt';
  }

  // Check for social media
  const socialDomains = ['twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'tiktok.com'];
  if (socialDomains.some(domain => referrer?.includes(domain))) {
    return 'social';
  }

  // Check for search engines (SEO)
  const searchEngines = ['google.', 'bing.', 'yahoo.', 'duckduckgo.', 'baidu.'];
  if (searchEngines.some(engine => referrer?.includes(engine))) {
    return 'seo';
  }

  // Default to direct
  return 'direct';
}

/**
 * Track acquisition event
 */
export async function trackAcquisitionEvent(params: {
  userId?: string;
  sessionId?: string;
  source: AcquisitionSource;
  landingPage?: string;
  referralCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.acquisitionEvent.create({
      data: {
        userId: params.userId,
        sessionId: params.sessionId,
        source: params.source,
        landingPage: params.landingPage,
        referralCode: params.referralCode,
        utmSource: params.utmSource,
        utmMedium: params.utmMedium,
        utmCampaign: params.utmCampaign,
        metadata: params.metadata as object,
      },
    });
  } catch (error) {
    console.error('Error tracking acquisition event:', error);
  }
}

/**
 * Save calculator result for anonymous or logged-in users
 */
export async function saveCalculatorResult(params: {
  sessionId?: string;
  userId?: string;
  calculatorType: CalculatorType;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
}) {
  try {
    const result = await prisma.calculatorResult.create({
      data: {
        sessionId: params.sessionId,
        userId: params.userId,
        calculatorType: params.calculatorType,
        inputs: params.inputs as object,
        results: params.results as object,
      },
    });
    return result;
  } catch (error) {
    console.error('Error saving calculator result:', error);
    return null;
  }
}

/**
 * Mark calculator result as converted to signup
 */
export async function markCalculatorConverted(sessionId: string, userId: string) {
  try {
    await prisma.calculatorResult.updateMany({
      where: { sessionId },
      data: { userId, convertedToSignup: true },
    });
  } catch (error) {
    console.error('Error marking calculator converted:', error);
  }
}

/**
 * Get or create user's referral stats
 */
export async function getUserReferralStats(userId: string) {
  let stats = await prisma.userReferralStats.findUnique({
    where: { userId },
  });

  if (!stats) {
    stats = await prisma.userReferralStats.create({
      data: {
        userId,
        referralCode: generateReferralCode(),
      },
    });
  }

  return stats;
}

/**
 * Create a referral for a user
 */
export async function createReferral(referrerUserId: string, referralCode: string) {
  const referral = await prisma.referral.create({
    data: {
      referralCode,
      referrerUserId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });
  return referral;
}

/**
 * Convert a referral when a new user signs up
 */
export async function convertReferral(referralCode: string, referredUserId: string) {
  try {
    // Find the referral
    const referral = await prisma.referral.findUnique({
      where: { referralCode },
    });

    if (!referral || referral.status !== 'pending') {
      return null;
    }

    // Update the referral
    const updated = await prisma.referral.update({
      where: { id: referral.id },
      data: {
        referredUserId,
        status: 'converted',
        convertedAt: new Date(),
      },
    });

    // Update referrer's stats
    await prisma.userReferralStats.update({
      where: { userId: referral.referrerUserId },
      data: {
        totalReferrals: { increment: 1 },
        convertedReferrals: { increment: 1 },
      },
    });

    return updated;
  } catch (error) {
    console.error('Error converting referral:', error);
    return null;
  }
}

/**
 * Get acquisition analytics summary
 */
export async function getAcquisitionAnalytics(startDate?: Date, endDate?: Date) {
  const where: Record<string, unknown> = {};
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [bySource, totalEvents, conversions] = await Promise.all([
    prisma.acquisitionEvent.groupBy({
      by: ['source'],
      where: where as object,
      _count: { id: true },
    }),
    prisma.acquisitionEvent.count({ where: where as object }),
    prisma.acquisitionEvent.count({
      where: { ...where, converted: true } as object,
    }),
  ]);

  return {
    bySource: bySource.map(s => ({
      source: s.source,
      count: s._count.id,
    })),
    totalEvents,
    conversions,
    conversionRate: totalEvents > 0 ? (conversions / totalEvents * 100).toFixed(2) : '0',
  };
}
