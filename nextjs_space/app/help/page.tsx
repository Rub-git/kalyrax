'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { useLanguage } from '@/components/providers';
import { ChevronDown, HelpCircle, Calculator, Utensils, Target, Brain, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FAQItem {
  q_en: string;
  q_es: string;
  a_en: string;
  a_es: string;
  icon: React.ReactNode;
}

const faqs: FAQItem[] = [
  {
    q_en: 'How does Kalyrax calculate my nutritional needs?',
    q_es: '¿Cómo calcula Kalyrax mis necesidades nutricionales?',
    a_en: 'Kalyrax uses the Harris-Benedict equation to calculate your Basal Metabolic Rate (BMR), then factors in your activity level and goals to determine your Total Daily Energy Expenditure (TDEE). From there, we recommend optimal macronutrient distribution (protein, carbs, and fat) tailored to your specific goals.',
    a_es: 'Kalyrax usa la ecuación de Harris-Benedict para calcular tu Tasa Metabólica Basal (TMB), luego considera tu nivel de actividad y metas para determinar tu Gasto Energético Total Diario (GET). A partir de ahí, recomendamos la distribución óptima de macronutrientes (proteínas, carbohidratos y grasas) adaptada a tus metas específicas.',
    icon: <Calculator className="h-5 w-5" />,
  },
  {
    q_en: 'How do meal plans work?',
    q_es: '¿Cómo funcionan los planes de comidas?',
    a_en: 'Our AI generates personalized 7-day meal plans based on your nutritional targets, dietary preferences, and available foods. Each plan includes breakfast, lunch, dinner, and snacks with specific portions and total macros per day. You can regenerate plans anytime.',
    a_es: 'Nuestra IA genera planes de comidas personalizados de 7 días basados en tus objetivos nutricionales, preferencias dietéticas y alimentos disponibles. Cada plan incluye desayuno, almuerzo, cena y snacks con porciones específicas y macros totales por día. Puedes regenerar planes cuando quieras.',
    icon: <Utensils className="h-5 w-5" />,
  },
  {
    q_en: 'What are challenges and how do streaks work?',
    q_es: '¿Qué son los desafíos y cómo funcionan las rachas?',
    a_en: 'Challenges are structured programs (like our 7-Day High Protein Challenge) designed to help you build healthy habits. Streaks track your daily engagement — logging food, checking your meal plan, or chatting with the AI coach counts toward your streak. Longer streaks unlock motivation messages and leaderboard rankings.',
    a_es: 'Los desafíos son programas estructurados (como nuestro Desafío de Proteína de 7 Días) diseñados para ayudarte a crear hábitos saludables. Las rachas rastrean tu participación diaria — registrar alimentos, revisar tu plan de comidas o chatear con el coach de IA cuenta para tu racha. Rachas más largas desbloquean mensajes motivacionales y posiciones en el ranking.',
    icon: <Target className="h-5 w-5" />,
  },
  {
    q_en: 'How does the AI Coach work?',
    q_es: '¿Cómo funciona el Coach de IA?',
    a_en: 'The AI Coach uses advanced language models combined with a nutrition knowledge base (RAG system) to answer your diet questions, suggest food swaps, explain nutritional concepts, and provide personalized guidance. It has access to your profile and calculation data to give contextual advice.',
    a_es: 'El Coach de IA utiliza modelos de lenguaje avanzados combinados con una base de conocimientos nutricionales (sistema RAG) para responder tus preguntas sobre dieta, sugerir intercambios de alimentos, explicar conceptos nutricionales y proporcionar orientación personalizada. Tiene acceso a tu perfil y datos de cálculo para dar consejos contextualizados.',
    icon: <Brain className="h-5 w-5" />,
  },
  {
    q_en: 'Can I use Kalyrax with friends?',
    q_es: '¿Puedo usar Kalyrax con amigos?',
    a_en: 'Yes! Kalyrax has social features including friend connections, group challenges, activity feeds, and leaderboards. You can share your progress, join group challenges, and motivate each other. You can also share referral links to invite friends.',
    a_es: 'Sí! Kalyrax tiene funciones sociales incluyendo conexiones de amigos, desafíos grupales, feeds de actividad y tablas de clasificación. Puedes compartir tu progreso, unirte a desafíos grupales y motivarse mutuamente. También puedes compartir enlaces de referencia para invitar amigos.',
    icon: <Users className="h-5 w-5" />,
  },
  {
    q_en: 'Is my health data safe?',
    q_es: '¿Están seguros mis datos de salud?',
    a_en: 'Absolutely. We take data privacy seriously. Your passwords are encrypted, your health data is never shared with third parties, and you can delete your account and all associated data at any time. See our Privacy Policy for full details.',
    a_es: 'Absolutamente. Nos tomamos la privacidad de datos en serio. Tus contraseñas están encriptadas, tus datos de salud nunca se comparten con terceros y puedes eliminar tu cuenta y todos los datos asociados en cualquier momento. Consulta nuestra Política de Privacidad para más detalles.',
    icon: <Shield className="h-5 w-5" />,
  },
];

export default function HelpCenterPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { language } = useLanguage();
  const es = language === 'es';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">{es ? 'Centro de Ayuda' : 'Help Center'}</h1>
          <p className="text-muted-foreground mt-2">
            {es ? 'Encuentra respuestas a las preguntas más frecuentes' : 'Find answers to frequently asked questions'}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border rounded-lg overflow-hidden transition-shadow hover:shadow-md"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-primary">{faq.icon}</div>
                  <span className="font-medium">{es ? faq.q_es : faq.q_en}</span>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4 pt-0">
                  <div className="pl-8 text-muted-foreground leading-relaxed text-sm">
                    {es ? faq.a_es : faq.a_en}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center p-8 bg-muted/50 rounded-xl">
          <h3 className="font-semibold text-lg mb-2">
            {es ? '¿No encontraste lo que buscabas?' : 'Didn\'t find what you need?'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {es ? 'Contáctanos directamente y te ayudaremos.' : 'Contact us directly and we\'ll help you out.'}
          </p>
          <Link href="/contact">
            <Button>{es ? 'Contáctanos' : 'Contact Us'}</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
