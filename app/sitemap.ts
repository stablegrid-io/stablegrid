import type { MetadataRoute } from 'next';
import { LANDING_TOPICS } from '@/lib/landing/topics';

const BASE = 'https://stablegrid.io';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/topics`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/theory`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/cheat-sheets`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/support`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const topicRoutes: MetadataRoute.Sitemap = LANDING_TOPICS.map((topic) => ({
    url: `${BASE}/topics/${topic.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [...staticRoutes, ...topicRoutes];
}
