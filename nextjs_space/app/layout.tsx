import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { getSiteUrl } from '@/lib/site-url';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  manifest: '/manifest.webmanifest',
  themeColor: '#1d4ed8',
  title: 'Kalyrax - AI-Powered Nutrition Assistant',
  description: 'Your personalized AI nutrition coach with meal planning, tracking, and smart recommendations.',
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Kalyrax',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'Kalyrax - AI-Powered Nutrition Assistant',
    description: 'Your personalized AI nutrition coach with meal planning, tracking, and smart recommendations.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
