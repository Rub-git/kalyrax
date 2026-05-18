'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/providers';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
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
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
    } catch {
      setError(es ? 'Error al enviar el correo. Intenta de nuevo.' : 'Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {es ? 'Restablecer contraseña' : 'Reset Password'}
          </CardTitle>
          <CardDescription>
            {es
              ? 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña'
              : 'Enter your email and we\'ll send you a link to reset your password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                {es
                  ? 'Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.'
                  : 'If an account exists with that email, you\'ll receive a password reset link.'}
              </p>
              <Link href="/login">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {es ? 'Volver al login' : 'Back to login'}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{es ? 'Enviando...' : 'Sending...'}</>
                ) : (
                  es ? 'Enviar enlace' : 'Send reset link'
                )}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                  <ArrowLeft className="h-3 w-3 inline mr-1" />
                  {es ? 'Volver al login' : 'Back to login'}
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
