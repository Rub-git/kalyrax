export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { retrieveChunks, detectTopics, retrieveByTopics, buildRAGContext } from '@/lib/rag-system';
import { calculateNutrition, FORMULA_VERSION } from '@/lib/calc-engine';

const SAFETY_KEYWORDS = [
  'diabetes', 'insulina', 'renal', 'riñón', 'embarazo', 'pregnant', 'lactancia',
  'breastfeeding', 'eating disorder', 'anorexia', 'bulimia', 'trastorno alimenticio',
  'desmayo', 'fainting', 'chest pain', 'dolor de pecho', 'blood in', 'sangre en',
  'suicid', 'depresión severa', 'severe depression', 'medication', 'medicamento'
];

const SYSTEM_PROMPT = `Eres NutriCoach, un asistente de nutrición amigable y profesional.

REGLAS ESTRICTAS:
1. NUNCA calcules calorías o macros tu mismo. SIEMPRE usa los valores del calculation_context proporcionado.
2. Puedes explicar fórmulas y conceptos usando la información del RAG context.
3. NO des consejos médicos ni trates enfermedades.
4. Si detectas condiciones médicas (diabetes, embarazo, problemas renales, trastornos alimenticios), recomienda consultar a un profesional de salud.
5. Promueve: fibra 25-30g/día, frutas, verduras, granos enteros.
6. Estilo: claro, práctico, sin juicios, apoyador.
7. Incluye citas de página cuando expliques fórmulas.
8. PROHIBIDO: afirmar que curas enfermedades, garantizar pérdida de peso, reemplazar consejo médico.

Cuando expliques cálculos:
- GEB (Gasto Energético Basal): usa fórmulas Harris-Benedict según edad y sexo
- ETA (Efecto Térmico de Alimentos): 10% del GEB
- GET (Gasto Energético Total): GEB × Factor de Actividad
- Macros: Carbohidratos 55-65%, Proteínas 10-15%, Grasas 25-30%

Responde en el idioma del usuario (español o inglés).`;

function detectSafetyTrigger(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return SAFETY_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

const SAFETY_RESPONSE_EN = `I understand you're asking about a topic that relates to your health. While I can provide general nutrition information, I'm not qualified to give medical advice.

**I strongly recommend consulting with:**
- A registered dietitian/nutritionist
- Your primary care physician
- A specialist relevant to your condition

They can provide personalized guidance based on your specific health needs. Is there anything else about general nutrition I can help you with?`;

const SAFETY_RESPONSE_ES = `Entiendo que preguntas sobre un tema relacionado con tu salud. Aunque puedo proporcionar información general de nutrición, no estoy calificado para dar consejos médicos.

**Te recomiendo encarecidamente consultar con:**
- Un nutricionista o dietético registrado
- Tu médico de cabecera
- Un especialista relevante para tu condición

Ellos pueden proporcionar orientación personalizada basada en tus necesidades de salud específicas. ¿Hay algo más sobre nutrición general en lo que pueda ayudarte?`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { message, sessionId, language = 'en', calculationContext } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check for safety triggers
    if (detectSafetyTrigger(message)) {
      const safetyResponse = language === 'es' ? SAFETY_RESPONSE_ES : SAFETY_RESPONSE_EN;
      return NextResponse.json({
        success: true,
        data: {
          response: safetyResponse,
          citations: [],
          safetyTriggered: true,
        },
      });
    }

    // Get RAG context
    const topics = detectTopics(message);
    let citations = topics.length > 0
      ? await retrieveByTopics(topics)
      : await retrieveChunks(message, 3);

    const ragContext = buildRAGContext(citations);

    // Build messages for LLM
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add RAG context if available
    if (ragContext) {
      messages.push({
        role: 'system',
        content: `Contexto de conocimiento nutricional (usa para explicaciones, cita las páginas):\n\n${ragContext}`,
      });
    }

    // Add calculation context if provided
    if (calculationContext) {
      messages.push({
        role: 'system',
        content: `Datos del usuario (USA ESTOS VALORES, no calcules tu mismo):\n- GEB/BMR: ${calculationContext.geb} kcal\n- ETA: ${calculationContext.eta} kcal\n- GET/TDEE: ${calculationContext.get} kcal\n- Carbohidratos: ${calculationContext.carbG}g (${calculationContext.carbPercent}%)\n- Proteínas: ${calculationContext.proteinG}g (${calculationContext.proteinPercent}%)\n- Grasas: ${calculationContext.fatG}g (${calculationContext.fatPercent}%)\n- Fibra objetivo: ${calculationContext.fiberTargetG}g\n- Fórmula: ${calculationContext.formulaVersion}`,
      });
    }

    messages.push({ role: 'user', content: message });

    // Call LLM API with streaming
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages,
        stream: true,
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!reader) {
            controller.close();
            return;
          }

          let partialRead = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            partialRead += decoder.decode(value, { stream: true });
            const lines = partialRead.split('\n');
            partialRead = lines.pop() ?? '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Send final response with citations
                  const finalData = JSON.stringify({
                    status: 'completed',
                    response: fullResponse,
                    citations: citations.map(c => ({
                      chunkId: c.chunkId,
                      sectionTitle: c.sectionTitle,
                      pageNumber: c.pageNumber,
                    })),
                  });
                  controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content ?? '';
                  if (content) {
                    fullResponse += content;
                    const chunkData = JSON.stringify({
                      status: 'streaming',
                      content,
                    });
                    controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          const errorData = JSON.stringify({
            status: 'error',
            message: 'Stream error occurred',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    // Save message to database if user is logged in
    if (session?.user) {
      const userId = (session.user as any).id;
      let chatSession;

      if (sessionId) {
        chatSession = await prisma.chatSession.findUnique({
          where: { id: sessionId },
        });
      }

      if (!chatSession) {
        chatSession = await prisma.chatSession.create({
          data: { userId },
        });
      }

      // Save user message
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: 'user',
          content: message,
        },
      });
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Chat request failed' },
      { status: 500 }
    );
  }
}
