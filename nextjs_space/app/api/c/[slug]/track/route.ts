import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/c/[slug]/track - Increment view count
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const share = await prisma.challengeShare.findUnique({
      where: { slug },
    });
    
    if (!share) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }
    
    // Increment view count
    const updated = await prisma.challengeShare.update({
      where: { id: share.id },
      data: {
        viewCount: { increment: 1 },
      },
    });
    
    return NextResponse.json({ success: true, viewCount: updated.viewCount });
  } catch (error) {
    console.error('Error tracking challenge view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}
