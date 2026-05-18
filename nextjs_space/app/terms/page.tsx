'use client';

import { Header } from '@/components/header';
import { useLanguage } from '@/components/providers';

export default function TermsOfServicePage() {
  const { language } = useLanguage();
  const es = language === 'es';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-2">{es ? 'Términos de Servicio' : 'Terms of Service'}</h1>
        <p className="text-muted-foreground mb-8">{es ? 'Última actualización: Mayo 2026' : 'Last updated: May 2026'}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '1. Aceptación de Términos' : '1. Acceptance of Terms'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Al acceder y usar Kalyrax, aceptas estos términos de servicio. Si no estás de acuerdo con alguno de los términos, no debes usar nuestro servicio.'
                : 'By accessing and using Kalyrax, you agree to these terms of service. If you do not agree with any of the terms, you should not use our service.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '2. Descripción del Servicio' : '2. Service Description'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Kalyrax es un asistente nutricional impulsado por inteligencia artificial que ofrece recomendaciones personalizadas, planes de comidas, seguimiento nutricional y desafíos de salud. El servicio está diseñado con fines informativos y educativos.'
                : 'Kalyrax is an AI-powered nutrition assistant that provides personalized recommendations, meal plans, nutritional tracking, and health challenges. The service is designed for informational and educational purposes.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '3. Descargo de Responsabilidad Médica' : '3. Medical Disclaimer'}</h2>
            <p className="text-muted-foreground leading-relaxed font-medium">
              {es
                ? 'Kalyrax NO es un sustituto del consejo médico profesional. Las recomendaciones proporcionadas por nuestra IA son orientativas y no deben considerarse como diagnóstico o tratamiento médico. Siempre consulta con un profesional de la salud antes de realizar cambios significativos en tu dieta.'
                : 'Kalyrax is NOT a substitute for professional medical advice. Recommendations provided by our AI are for guidance only and should not be considered as medical diagnosis or treatment. Always consult with a healthcare professional before making significant changes to your diet.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '4. Cuentas de Usuario' : '4. User Accounts'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Debes proporcionarnos información precisa y actualizada. Nos reservamos el derecho de suspender cuentas que violen estos términos.'
                : 'You are responsible for maintaining the confidentiality of your account and password. You must provide us with accurate and up-to-date information. We reserve the right to suspend accounts that violate these terms.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '5. Uso Aceptable' : '5. Acceptable Use'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Te comprometes a usar Kalyrax solo para fines legales y personales. Está prohibido: intentar acceder a cuentas de otros usuarios, usar el servicio para actividades ilegales, o intentar interferir con el funcionamiento del servicio.'
                : 'You agree to use Kalyrax only for legal and personal purposes. You must not: attempt to access other users\' accounts, use the service for illegal activities, or attempt to interfere with the operation of the service.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '6. Propiedad Intelectual' : '6. Intellectual Property'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Todo el contenido, diseño, código y funcionalidades de Kalyrax son propiedad de Kalyrax y están protegidos por leyes de propiedad intelectual. Los planes de comida generados para ti son de tu uso personal.'
                : 'All content, design, code, and functionalities of Kalyrax are owned by Kalyrax and protected by intellectual property laws. Meal plans generated for you are for your personal use.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '7. Limitación de Responsabilidad' : '7. Limitation of Liability'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Kalyrax se proporciona "tal cual". No garantizamos que el servicio sea ininterrumpido o libre de errores. No somos responsables de daños indirectos derivados del uso de nuestras recomendaciones nutricionales.'
                : 'Kalyrax is provided "as is." We do not guarantee that the service will be uninterrupted or error-free. We are not liable for indirect damages resulting from the use of our nutritional recommendations.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '8. Cambios en los Términos' : '8. Changes to Terms'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos de cambios significativos por correo electrónico o mediante un aviso en la aplicación.'
                : 'We reserve the right to modify these terms at any time. We will notify you of significant changes via email or through a notice in the application.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '9. Contacto' : '9. Contact'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Para preguntas sobre estos términos, contáctanos a través de nuestra página de contacto.'
                : 'For questions about these terms, reach out through our contact page.'}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
