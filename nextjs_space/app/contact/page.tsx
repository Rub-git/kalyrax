'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send, CheckCircle, Loader2, Mail, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/components/providers';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { language } = useLanguage();
  const es = language === 'es';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      setSent(true);
    } catch {
      setError(es ? 'Error al enviar. Intenta de nuevo.' : 'Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">{es ? 'Contáctanos' : 'Contact Us'}</h1>
          <p className="text-muted-foreground mt-2">
            {es ? '¿Tienes preguntas? Nos encantaría escucharte.' : 'Have questions? We\'d love to hear from you.'}
          </p>
        </div>

        {sent ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {es ? '¡Mensaje enviado!' : 'Message Sent!'}
              </h2>
              <p className="text-muted-foreground">
                {es ? 'Te responderemos lo antes posible.' : 'We\'ll get back to you as soon as possible.'}
              </p>
              <Button className="mt-6" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                {es ? 'Enviar otro mensaje' : 'Send another message'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {es ? 'Envíanos un mensaje' : 'Send us a message'}
              </CardTitle>
              <CardDescription>
                {es ? 'Responderemos dentro de 24-48 horas.' : 'We\'ll respond within 24-48 hours.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{es ? 'Nombre' : 'Name'} *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">{es ? 'Asunto' : 'Subject'}</Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{es ? 'Mensaje' : 'Message'} *</Label>
                  <textarea
                    id="message"
                    rows={5}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{es ? 'Enviando...' : 'Sending...'}</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" />{es ? 'Enviar mensaje' : 'Send message'}</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
