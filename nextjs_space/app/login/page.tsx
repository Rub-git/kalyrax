'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Loader2, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t, language } = useLanguage();

  const invalidCredentialsText =
    language === 'es'
      ? 'Correo o contraseña incorrectos. Si esta cuenta no existe, primero regístrate.'
      : 'Incorrect email or password. If this account does not exist yet, sign up first.';

  const authTemporarilyUnavailableText =
    language === 'es'
      ? 'Inicio de sesión temporalmente no disponible. Intenta de nuevo en unos minutos.'
      : 'Sign-in is temporarily unavailable. Please try again in a few minutes.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const result = await signIn('credentials', {
        email: normalizedEmail,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('AuthServiceUnavailable')) {
          setError(authTemporarilyUnavailableText);
        } else if (result.error === 'CredentialsSignin' || result.status === 401) {
          setError(invalidCredentialsText);
        } else {
          setError(language === 'es' ? 'Error al iniciar sesión' : 'Login failed');
        }
      } else {
        router.replace('/dashboard');
      }
    } catch (err) {
      setError(language === 'es' ? 'Error al iniciar sesión' : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
          </Link>
          <CardTitle className="text-2xl">{t('login')}</CardTitle>
          <CardDescription>
            {language === 'es'
              ? 'Ingresa tus credenciales para continuar'
              : 'Enter your credentials to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'es' ? 'Ingresando...' : 'Signing in...'}
                </>
              ) : (
                t('login')
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary">
              {language === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
            </Link>
          </div>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">{t('dontHaveAccount')}</span>{' '}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              {t('signup')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
