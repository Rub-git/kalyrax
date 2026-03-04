export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { retrieveChunks, detectTopics, retrieveByTopics } from '@/lib/rag-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, topK = 5 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Detect topics first for better relevance
    const topics = detectTopics(query);
    let citations;

    if (topics.length > 0) {
      citations = await retrieveByTopics(topics);
    } else {
      citations = await retrieveChunks(query, topK);
    }

    return NextResponse.json({
      success: true,
      data: {
        chunks: citations,
        topics,
      },
    });
  } catch (error) {
    console.error('RAG retrieve error:', error);
    return NextResponse.json(
      { error: 'Retrieval failed' },
      { status: 500 }
    );
  }
}
