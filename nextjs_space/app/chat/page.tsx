'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { chunkId: string; sectionTitle: string; pageNumber: number }[];
  isStreaming?: boolean;
}

export default function ChatPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [calculation, setCalculation] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated') {
      fetchCalculation();
    }
  }, [status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCalculation = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.success && data.data?.latestCalculation) {
        setCalculation(data.data.latestCalculation);
      }
    } catch (err) {
      console.error('Failed to fetch calculation:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add streaming assistant message
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', isStreaming: true },
    ]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          language,
          calculationContext: calculation,
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = '';
      let fullContent = '';
      let citations: any[] = [];

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.status === 'streaming' && parsed.content) {
                fullContent += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: fullContent }
                      : m
                  )
                );
              } else if (parsed.status === 'completed') {
                fullContent = parsed.response ?? fullContent;
                citations = parsed.citations ?? [];
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Final update with citations
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: fullContent, citations, isStreaming: false }
            : m
        )
      );
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  language === 'es'
                    ? 'Lo siento, hubo un error. Por favor intenta de nuevo.'
                    : 'Sorry, there was an error. Please try again.',
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    inputRef.current?.focus();
  };

  const quickActions = [
    {
      label: t('explainCalculations'),
      query: language === 'es' ? 'Explícame cómo se calcularon mis calorías y macros' : 'Explain how my calories and macros were calculated',
    },
    {
      label: t('suggestSnacks'),
      query: language === 'es' ? 'Sugiere snacks saludables para mi meta calórica' : 'Suggest healthy snacks for my calorie goal',
    },
    {
      label: t('swapIngredient'),
      query: language === 'es' ? 'Necesito alternativas vegetarianas a la proteína' : 'I need vegetarian alternatives to protein',
    },
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col mx-auto w-full max-w-4xl px-4 py-6">
        {/* Chat Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            {t('chat')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'es'
              ? 'Pregunta sobre nutrición, tus cálculos, o pide sugerencias de comidas'
              : 'Ask about nutrition, your calculations, or get meal suggestions'}
          </p>
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'es' ? '¡Hola! Soy Kalyrax' : 'Hi! I\'m Kalyrax'}
                </h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  {language === 'es'
                    ? 'Puedo explicarte tus cálculos nutricionales, sugerir comidas y responder preguntas sobre nutrición basadas en evidencia científica.'
                    : 'I can explain your nutritional calculations, suggest meals, and answer nutrition questions based on scientific evidence.'}
                </p>

                {/* Quick Actions */}
                <div className="space-y-2 w-full max-w-sm">
                  <p className="text-sm font-medium text-muted-foreground">{t('suggestedQuestions')}</p>
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => handleQuickAction(action.query)}
                    >
                      <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white border shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm chat-message">
                      {message.content}
                      {message.isStreaming && (
                        <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                      )}
                    </div>

                    {/* Citations */}
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                          <BookOpen className="h-3 w-3" />
                          {t('citations')}
                        </p>
                        <div className="space-y-1">
                          {message.citations.map((cite, i) => (
                            <p key={cite.chunkId} className="text-xs text-muted-foreground">
                              [{i + 1}] {cite.sectionTitle} ({t('page')} {cite.pageNumber})
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 flex-shrink-0">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('typeMessage')}
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              {language === 'es'
                ? 'Kalyrax no reemplaza el consejo médico profesional.'
                : 'Kalyrax does not replace professional medical advice.'}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
