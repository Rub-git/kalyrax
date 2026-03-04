import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/challenge/templates - List available challenge templates
export async function GET() {
  try {
    const templates = await prisma.challengeTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching challenge templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge templates' },
      { status: 500 }
    );
  }
}
