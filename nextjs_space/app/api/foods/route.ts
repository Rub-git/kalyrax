export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const region = searchParams.get('region');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') ?? '100');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEs: { contains: search, mode: 'insensitive' } },
      ];
    }

    const foods = await prisma.foodItem.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' },
    });

    // Filter by region if specified (JSONB array)
    let filteredFoods = foods;
    if (region) {
      filteredFoods = foods.filter((food) => {
        const tags = food.regionTags as string[];
        return tags?.includes(region);
      });
    }

    const total = await prisma.foodItem.count({ where });

    return NextResponse.json({
      success: true,
      data: filteredFoods,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Foods fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch foods' },
      { status: 500 }
    );
  }
}
