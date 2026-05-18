'use client';

import { Header } from '@/components/header';
import { useLanguage } from '@/components/providers';

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const es = language === 'es';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-2">{es ? 'Política de Privacidad' : 'Privacy Policy'}</h1>
        <p className="text-muted-foreground mb-8">{es ? 'Última actualización: Mayo 2026' : 'Last updated: May 2026'}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '1. Información que Recopilamos' : '1. Information We Collect'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Recopilamos información que nos proporcionas directamente: nombre, correo electrónico, datos de perfil nutricional (edad, peso, altura, nivel de actividad, metas de salud), registros de alimentos y preferencias dietéticas. También recopilamos datos de uso como páginas visitadas y funciones utilizadas.'
                : 'We collect information you provide directly: name, email address, nutritional profile data (age, weight, height, activity level, health goals), food tracking entries, and dietary preferences. We also collect usage data such as pages visited and features used.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '2. Cómo Usamos tu Información' : '2. How We Use Your Information'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Usamos tu información para: proporcionar recomendaciones nutricionales personalizadas con IA, generar planes de comidas, rastrear tu progreso nutricional, mejorar nuestros servicios y enviarte notificaciones importantes sobre tu cuenta.'
                : 'We use your information to: provide personalized AI nutrition recommendations, generate meal plans, track your nutritional progress, improve our services, and send you important notifications about your account.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '3. Protección de Datos' : '3. Data Protection'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Implementamos medidas de seguridad estándar de la industria para proteger tu información personal. Tus contraseñas se almacenan encriptadas y nunca compartimos tus datos de salud con terceros sin tu consentimiento explícito.'
                : 'We implement industry-standard security measures to protect your personal information. Your passwords are stored encrypted and we never share your health data with third parties without your explicit consent.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '4. Cookies y Tecnologías de Seguimiento' : '4. Cookies and Tracking Technologies'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Usamos cookies esenciales para mantener tu sesión activa y tus preferencias. No usamos cookies de publicidad de terceros.'
                : 'We use essential cookies to maintain your session and preferences. We do not use third-party advertising cookies.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '5. Tus Derechos' : '5. Your Rights'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Tienes derecho a acceder, corregir o eliminar tu información personal en cualquier momento. Puedes actualizar tu perfil desde la configuración de tu cuenta o contactarnos para solicitar la eliminación completa de tus datos.'
                : 'You have the right to access, correct, or delete your personal information at any time. You can update your profile from your account settings or contact us to request complete data deletion.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '6. Retención de Datos' : '6. Data Retention'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Conservamos tu información mientras tu cuenta esté activa. Si eliminas tu cuenta, borraremos tus datos personales dentro de los 30 días siguientes, excepto cuando la ley requiera su retención.'
                : 'We retain your information as long as your account is active. If you delete your account, we will erase your personal data within 30 days, except where retention is required by law.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{es ? '7. Contacto' : '7. Contact'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Si tienes preguntas sobre esta política de privacidad, contáctanos en nuestra página de contacto o envíanos un correo a soporte@kalyrax.com.'
                : 'If you have questions about this privacy policy, please reach out through our contact page or email us at soporte@kalyrax.com.'}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
