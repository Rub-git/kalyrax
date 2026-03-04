export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { date, mealType, foodId, quantity, unit } = body;

    if (!date || !mealType || !foodId || !quantity || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const entry = await prisma.trackingEntry.create({
      data: {
        userId,
        date: new Date(date),
        mealType,
        foodId,
        quantity: Number(quantity),
        unit,
      },
      include: {
        food: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('Tracking create error:', error);
    return NextResponse.json(
      { error: 'Failed to create tracking entry' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    const entries = await prisma.trackingEntry.findMany({
      where: {
        userId,
        date: new Date(date),
      },
      include: {
        food: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate totals
    const totals = entries.reduce(
      (acc, entry) => {
        const food = entry.food;
        const multiplier = entry.quantity / (food?.servingSize ?? 1);
        return {
          kcal: acc.kcal + ((food?.kcal ?? 0) * multiplier),
          carbG: acc.carbG + ((food?.carbG ?? 0) * multiplier),
          proteinG: acc.proteinG + ((food?.proteinG ?? 0) * multiplier),
          fatG: acc.fatG + ((food?.fatG ?? 0) * multiplier),
          fiberG: acc.fiberG + ((food?.fiberG ?? 0) * multiplier),
        };
      },
      { kcal: 0, carbG: 0, proteinG: 0, fatG: 0, fiberG: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        entries,
        totals: {
          kcal: Math.round(totals.kcal),
          carbG: Math.round(totals.carbG),
          proteinG: Math.round(totals.proteinG),
          fatG: Math.round(totals.fatG),
          fiberG: Math.round(totals.fiberG),
        },
      },
    });
  } catch (error) {
    console.error('Tracking fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking entries' },
      { status: 500 }
    );
  }
}
