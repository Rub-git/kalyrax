import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, calculatorType, inputs, results } = body;

    if (!calculatorType || !inputs || !results) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is logged in
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id || null;

    const calculatorResult = await prisma.calculatorResult.create({
      data: {
        sessionId: sessionId || null,
        userId,
        calculatorType,
        inputs,
        results,
      },
    });

    return NextResponse.json({ success: true, resultId: calculatorResult.id });
  } catch (error) {
    console.error('Error saving calculator result:', error);
    return NextResponse.json(
      { error: 'Failed to save calculator result' },
      { status: 500 }
    );
  }
}
