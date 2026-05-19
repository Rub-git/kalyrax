import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const forwardedHost = headersList.get('x-forwarded-host') || headersList.get('host');
  const baseUrl = forwardedHost ? `https://${forwardedHost}` : getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/onboarding/',
          '/profile/',
          '/meal-plan/',
          '/tracking/',
          '/chat/',
          '/challenge/',
          '/groups/',
          '/friends/',
          '/admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
