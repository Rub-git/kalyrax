import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Get the host from headers or use default
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || 'nutricoach-app-n5uoea.abacusai.app';
  const baseUrl = `https://${host}`;

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
