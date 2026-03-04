export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Find nutritionally similar food substitutions
 * POST /api/foods/swap
 * Body: { foodId: string, preferences?: string[], limit?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { foodId, preferences = [], limit = 5 } = body;

    if (!foodId) {
      return NextResponse.json({ error: 'foodId is required' }, { status: 400 });
    }

    // Get the original food
    const originalFood = await prisma.foodItem.findUnique({
      where: { id: foodId },
    });

    if (!originalFood) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    // Find similar foods based on category and macros
    const allFoods = await prisma.foodItem.findMany({
      where: {
        id: { not: foodId },
        category: originalFood.category, // Same category
      },
    });

    // Calculate similarity scores
    const foodsWithScores = allFoods.map(food => {
      // Calculate macro similarity (lower is better)
      const kcalDiff = Math.abs(food.kcal - originalFood.kcal) / Math.max(originalFood.kcal, 1);
      const carbDiff = Math.abs(food.carbG - originalFood.carbG) / Math.max(originalFood.carbG, 1);
      const proteinDiff = Math.abs(food.proteinG - originalFood.proteinG) / Math.max(originalFood.proteinG, 1);
      const fatDiff = Math.abs(food.fatG - originalFood.fatG) / Math.max(originalFood.fatG, 1);

      // Weighted similarity score (lower is more similar)
      const similarityScore = (
        kcalDiff * 0.3 +
        proteinDiff * 0.3 +
        carbDiff * 0.2 +
        fatDiff * 0.2
      );

      // Calculate serving ratio to match original's macros
      const ratio = originalFood.kcal > 0 && food.kcal > 0 
        ? originalFood.kcal / food.kcal 
        : 1;

      return {
        ...food,
        similarityScore,
        ratio: Math.round(ratio * 100) / 100,
        matchedKcal: Math.round(food.kcal * ratio),
        matchedCarbG: Math.round(food.carbG * ratio * 10) / 10,
        matchedProteinG: Math.round(food.proteinG * ratio * 10) / 10,
        matchedFatG: Math.round(food.fatG * ratio * 10) / 10,
        adjustedServingSize: Math.round(food.servingSize * ratio),
      };
    });

    // Apply preference filters
    let filteredFoods = foodsWithScores;
    if (preferences.includes('vegetarian')) {
      // Exclude meat and fish
      const meatKeywords = ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna', 'shrimp', 'bacon', 'ham'];
      filteredFoods = filteredFoods.filter(f => 
        !meatKeywords.some(keyword => f.name.toLowerCase().includes(keyword))
      );
    }
    if (preferences.includes('vegan')) {
      // Exclude animal products
      const animalKeywords = ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna', 'shrimp', 'bacon', 'ham', 'egg', 'milk', 'cheese', 'yogurt', 'cream', 'butter'];
      filteredFoods = filteredFoods.filter(f => 
        !animalKeywords.some(keyword => f.name.toLowerCase().includes(keyword))
      );
    }
    if (preferences.includes('lactose-free')) {
      const dairyKeywords = ['milk', 'cheese', 'yogurt', 'cream', 'butter'];
      filteredFoods = filteredFoods.filter(f => 
        !dairyKeywords.some(keyword => f.name.toLowerCase().includes(keyword))
      );
    }
    if (preferences.includes('gluten-free')) {
      const glutenKeywords = ['bread', 'pasta', 'wheat', 'flour', 'tortilla'];
      filteredFoods = filteredFoods.filter(f => 
        !glutenKeywords.some(keyword => f.name.toLowerCase().includes(keyword))
      );
    }

    // Sort by similarity and take top results
    const suggestions = filteredFoods
      .sort((a, b) => a.similarityScore - b.similarityScore)
      .slice(0, limit)
      .map(({ similarityScore, ...food }) => food);

    return NextResponse.json({
      success: true,
      data: {
        original: originalFood,
        suggestions,
      },
    });
  } catch (error) {
    console.error('Food swap error:', error);
    return NextResponse.json(
      { error: 'Failed to find substitutions' },
      { status: 500 }
    );
  }
}
