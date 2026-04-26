import type { MetadataRoute } from 'next';
import { learnTopics } from '@/data/learn';
import { TOPIC_TRACK_CONFIGS } from '@/data/learn/theory/tracks';

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

  const topicLandings: MetadataRoute.Sitemap = learnTopics.map((t) => ({
    url: `${BASE}/learn/${t.id}/theory`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const trackPages: MetadataRoute.Sitemap = Object.entries(TOPIC_TRACK_CONFIGS).flatMap(
    ([topicId, configs]) =>
      configs.map((cfg) => ({
        url: `${BASE}/learn/${topicId}/theory/${cfg.slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
  );

  return [...staticRoutes, ...topicLandings, ...trackPages];
}
