/**
 * RAG (Retrieval Augmented Generation) System for Nutrition Knowledge
 * Retrieves relevant chunks from the PDF knowledge base
 */

import { prisma } from './db';
import { Citation } from './types';

/**
 * Simple text similarity using keyword matching and TF-IDF-like scoring
 * In production, this would use vector embeddings
 */
function calculateRelevance(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const textLower = text.toLowerCase();
  
  let score = 0;
  for (const word of queryWords) {
    if (textLower.includes(word)) {
      score += 1;
      // Bonus for exact word match
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        score += matches.length * 0.5;
      }
    }
  }
  
  // Normalize by query length
  return score / Math.max(queryWords.length, 1);
}

/**
 * Retrieve relevant PDF chunks for a given query
 * @param query - The search query
 * @param topK - Number of results to return (default 5)
 * @returns Array of citations with relevance scores
 */
export async function retrieveChunks(
  query: string,
  topK: number = 5
): Promise<Citation[]> {
  try {
    // Fetch all chunks from database
    const chunks = await prisma.pdfChunk.findMany({
      select: {
        chunkId: true,
        sectionTitle: true,
        pageNumber: true,
        text: true,
      },
    });

    if (!chunks || chunks.length === 0) {
      return [];
    }

    // Calculate relevance scores
    const scored = chunks.map(chunk => ({
      chunkId: chunk.chunkId,
      sectionTitle: chunk.sectionTitle,
      pageNumber: chunk.pageNumber,
      text: chunk.text,
      relevanceScore: calculateRelevance(query, `${chunk.sectionTitle} ${chunk.text}`),
    }));

    // Sort by relevance and take top K
    const topChunks = scored
      .filter(c => c.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, topK);

    return topChunks;
  } catch (error) {
    console.error('Error retrieving chunks:', error);
    return [];
  }
}

/**
 * Format citations for display
 * @param citations - Array of citations
 * @returns Formatted citation string
 */
export function formatCitations(citations: Citation[]): string {
  if (!citations || citations.length === 0) return '';
  
  return citations
    .map((c, i) => `[${i + 1}] ${c.sectionTitle} (pág. ${c.pageNumber})`)
    .join('\n');
}

/**
 * Build context from retrieved chunks for LLM
 * @param citations - Array of citations
 * @returns Context string for LLM
 */
export function buildRAGContext(citations: Citation[]): string {
  if (!citations || citations.length === 0) return '';
  
  return citations
    .map((c, i) => `[Fuente ${i + 1}, pág. ${c.pageNumber}] ${c.sectionTitle}:\n${c.text}`)
    .join('\n\n');
}

/**
 * Keywords for specific nutrition topics
 */
export const TOPIC_KEYWORDS: Record<string, string[]> = {
  geb: ['geb', 'gasto energético basal', 'basal', 'harris-benedict', 'bmr', 'metabolismo basal'],
  eta: ['eta', 'efecto térmico', 'termogénesis', 'digestión'],
  get: ['get', 'gasto energético total', 'tdee', 'calorías totales', 'requerimiento energético'],
  macros: ['macronutrimentos', 'carbohidratos', 'proteínas', 'lípidos', 'grasas', 'distribución'],
  fiber: ['fibra', 'dietética', 'soluble', 'insoluble'],
  vitamins: ['vitaminas', 'liposolubles', 'hidrosolubles'],
  minerals: ['minerales', 'calcio', 'hierro', 'zinc'],
  activity: ['actividad física', 'factor de actividad', 'sedentario', 'ejercicio'],
};

/**
 * Detect topics in a query
 * @param query - User query
 * @returns Array of detected topic keys
 */
export function detectTopics(query: string): string[] {
  const queryLower = query.toLowerCase();
  const detected: string[] = [];
  
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (queryLower.includes(keyword)) {
        detected.push(topic);
        break;
      }
    }
  }
  
  return detected;
}

/**
 * Get specific chunks by topic
 * @param topic - Topic key
 * @returns Relevant chunk IDs
 */
export const TOPIC_CHUNK_MAP: Record<string, string[]> = {
  geb: ['chunk_028', 'chunk_029', 'chunk_030'],
  eta: ['chunk_031'],
  get: ['chunk_032', 'chunk_033'],
  macros: ['chunk_005', 'chunk_012', 'chunk_017', 'chunk_033', 'chunk_034'],
  fiber: ['chunk_009', 'chunk_010', 'chunk_011', 'chunk_037'],
  vitamins: ['chunk_021', 'chunk_022', 'chunk_023', 'chunk_024'],
  minerals: ['chunk_025', 'chunk_026', 'chunk_027'],
  activity: ['chunk_032'],
};

/**
 * Retrieve chunks by specific topic
 * @param topics - Array of topic keys
 * @returns Array of citations
 */
export async function retrieveByTopics(topics: string[]): Promise<Citation[]> {
  const chunkIds: string[] = [];
  
  for (const topic of topics) {
    const ids = TOPIC_CHUNK_MAP[topic] ?? [];
    chunkIds.push(...ids);
  }
  
  if (chunkIds.length === 0) return [];
  
  const uniqueIds = [...new Set(chunkIds)];
  
  try {
    const chunks = await prisma.pdfChunk.findMany({
      where: {
        chunkId: { in: uniqueIds },
      },
      select: {
        chunkId: true,
        sectionTitle: true,
        pageNumber: true,
        text: true,
      },
    });
    
    return chunks.map(c => ({
      chunkId: c.chunkId,
      sectionTitle: c.sectionTitle,
      pageNumber: c.pageNumber,
      text: c.text,
      relevanceScore: 1.0,
    }));
  } catch (error) {
    console.error('Error retrieving by topics:', error);
    return [];
  }
}
