'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useLanguage } from './providers';
import { Button } from './ui/button';
import { NotificationsBell } from './notifications-bell';
import {
  LayoutDashboard,
  Calendar,
  MessageCircle,
  LineChart,
  User,
  LogOut,
  Menu,
  X,
  Globe,
  Flame,
  Trophy,
  Users,
  Crown,
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export function Header() {
  const { data: session } = useSession() || {};
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/challenge', label: t('challenge'), icon: Flame },
    { href: '/meal-plan', label: t('mealPlan'), icon: Calendar },
    { href: '/tracking', label: t('tracking'), icon: LineChart },
    { href: '/chat', label: t('chat'), icon: MessageCircle },
    { href: '/social', label: t('social'), icon: Users },
    { href: '/leaderboard', label: t('leaderboard'), icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 md:h-24 items-center justify-between">
          {/* Logo */}
          <Link href={session ? '/dashboard' : '/'} className="flex items-center">
            <Image
              src="/kalyrax-logo.png"
              alt="Kalyrax"
              width={240}
              height={70}
              className="h-14 w-auto sm:h-16 md:h-20"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          {session && (
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
            >
              <Globe className="h-5 w-5" />
              <span className="sr-only">Toggle language</span>
            </Button>

            {session ? (
              <>
                <div className="hidden md:block">
                  <NotificationsBell />
                </div>
                <Link href="/profile" className="hidden md:block">
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="hidden md:flex"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/pricing">
                  <Button variant="ghost" className="hidden sm:flex items-center gap-1">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    {t('pricing')}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost">{t('login')}</Button>
                </Link>
                <Link href="/signup">
                  <Button>{t('signup')}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {session && mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t animate-fade-in">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <User className="h-4 w-4" />
                  {t('profile')}
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-destructive"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="h-4 w-4" />
                {t('logout')}
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
