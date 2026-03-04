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
    const { calculationId, preferences = [], language = 'en' } = body;

    // Get calculation
    let calculation;
    if (calculationId) {
      calculation = await prisma.calculation.findUnique({
        where: { id: calculationId },
      });
    } else {
      // Get latest calculation for user
      const profile = await prisma.profile.findUnique({
        where: { userId },
        include: {
          calculations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
      calculation = profile?.calculations?.[0];
    }

    if (!calculation) {
      return NextResponse.json(
        { error: 'No calculation found. Please complete your profile first.' },
        { status: 400 }
      );
    }

    // Get foods from catalog
    const foods = await prisma.foodItem.findMany();

    // Build prompt for meal plan generation
    const prompt = buildMealPlanPrompt(calculation, preferences, foods, language);

    // Call LLM API
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: 'You are a nutrition expert creating personalized meal plans. Always respond with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 4000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let mealPlanData;
    try {
      mealPlanData = JSON.parse(content);
    } catch (e) {
      throw new Error('Failed to parse meal plan response');
    }

    // Save meal plan
    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        calculationId: calculation.id,
        startDate: new Date(),
        days: mealPlanData.days ?? [],
        shoppingList: mealPlanData.shoppingList ?? [],
        preferences: preferences,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: mealPlan.id,
        ...mealPlanData,
        targets: {
          kcal: calculation.get,
          carbG: calculation.carbG,
          proteinG: calculation.proteinG,
          fatG: calculation.fatG,
          fiberG: calculation.fiberTargetG,
        },
      },
    });
  } catch (error) {
    console.error('Meal plan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}

function buildMealPlanPrompt(
  calculation: any,
  preferences: string[],
  foods: any[],
  language: string
): string {
  const foodList = foods.slice(0, 100).map(f => 
    `${f.name} (${f.nameEs}): ${f.kcal}kcal, C${f.carbG}g, P${f.proteinG}g, F${f.fatG}g per ${f.servingSize}${f.servingUnit}`
  ).join('\n');

  const lang = language === 'es' ? 'Spanish' : 'English';

  return `Create a 7-day meal plan with these daily targets:
- Calories: ${Math.round(calculation.get)} kcal
- Carbohydrates: ${Math.round(calculation.carbG)}g
- Protein: ${Math.round(calculation.proteinG)}g
- Fat: ${Math.round(calculation.fatG)}g
- Fiber: ${Math.round(calculation.fiberTargetG)}g

Dietary preferences: ${preferences.length > 0 ? preferences.join(', ') : 'None'}

Available foods (use these for meal items):
${foodList}

Create meals in ${lang}. Response format:
{
  "days": [
    {
      "dayNumber": 1,
      "meals": [
        {
          "mealType": "breakfast",
          "name": "Meal name in English",
          "nameEs": "Nombre en español",
          "items": [
            { "foodName": "food name", "quantity": 100, "unit": "g" }
          ],
          "totalKcal": 400,
          "totalCarbG": 50,
          "totalProteinG": 20,
          "totalFatG": 15
        }
      ],
      "totalKcal": 2000,
      "totalCarbG": 250,
      "totalProteinG": 75,
      "totalFatG": 55
    }
  ],
  "shoppingList": [
    { "item": "Chicken Breast", "itemEs": "Pechuga de Pollo", "quantity": "500g" }
  ]
}

Include 4-5 meals per day: breakfast, snack_am (optional), lunch, snack_pm (optional), dinner.
Make sure totals are close to targets (+/- 10%).
Use realistic portions from the food list.`;
}
