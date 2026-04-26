import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/login',
          '/signup',
          '/onboarding',
          '/settings/',
          '/profile',
          '/home',
          '/workspace/',
          '/grid',
          '/stats',
          '/operations/practice/',
          '/practice/',
          '/learn/',
        ],
      },
    ],
    sitemap: 'https://stablegrid.io/sitemap.xml',
    host: 'https://stablegrid.io',
  };
}
