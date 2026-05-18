'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/components/providers';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { language } = useLanguage();
  const es = language === 'es';

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <p className="text-muted-foreground">
          {es ? 'Enlace inválido. Solicita uno nuevo.' : 'Invalid link. Please request a new one.'}
        </p>
        <Link href="/forgot-password">
          <Button>{es ? 'Solicitar nuevo enlace' : 'Request new link'}</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(es ? 'La contraseña debe tener al menos 6 caracteres' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError(es ? 'Las contraseñas no coinciden' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      setError(message === 'Invalid or expired reset link'
        ? (es ? 'Enlace inválido o expirado' : message)
        : (es ? 'Error al restablecer. Intenta de nuevo.' : 'Failed to reset password. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="h-12 w-12 text-primary mx-auto" />
        <h3 className="font-semibold text-lg">
          {es ? '¡Contraseña restablecida!' : 'Password Reset!'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {es ? 'Ya puedes iniciar sesión con tu nueva contraseña.' : 'You can now log in with your new password.'}
        </p>
        <Link href="/login">
          <Button className="mt-2">{es ? 'Ir al login' : 'Go to login'}</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">{es ? 'Nueva contraseña' : 'New password'}</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">{es ? 'Confirmar contraseña' : 'Confirm password'}</Label>
        <Input
          id="confirm"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{es ? 'Restableciendo...' : 'Resetting...'}</>
        ) : (
          es ? 'Restablecer contraseña' : 'Reset password'
        )}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const es = language === 'es';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {es ? 'Nueva contraseña' : 'New Password'}
          </CardTitle>
          <CardDescription>
            {es ? 'Ingresa tu nueva contraseña' : 'Enter your new password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
