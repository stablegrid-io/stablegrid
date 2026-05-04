import type { MetadataRoute } from 'next';
import { LANDING_TOPICS } from '@/lib/landing/topics';

const BASE = 'https://stablegrid.io';

/**
 * Public marketing surfaces only. Auth-gated routes (/home, /practice/coding,
 * /grid, /stats, the practice/learn detail pages) are intentionally
 * excluded — they redirect to /login for unauthenticated bots and would
 * pollute the index with low-content soft-404s.
 *
 * The per-topic theory pages and the four per-category practice landings
 * (/practice/{coding|computer-science|logic|math-statistics}/landing) are
 * the marketing surface that ranks for long-tail queries; keep them in
 * sync here when new topics or categories ship.
 */
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

  // Per-category practice landings — public marketing pages that mirror
  // /topics/[slug] for the practice surface. Coding is live; the other
  // three are coming-soon vision pages, but they all carry indexable
  // content and rank for queries like "data engineering practice".
  const PRACTICE_CATEGORY_LANDINGS = [
    'coding',
    'computer-science',
    'logic',
    'math-statistics',
  ];
  const practiceLandingRoutes: MetadataRoute.Sitemap =
    PRACTICE_CATEGORY_LANDINGS.map((slug) => ({
      url: `${BASE}/practice/${slug}/landing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: slug === 'coding' ? 0.85 : 0.5,
    }));

  return [...staticRoutes, ...topicRoutes, ...practiceLandingRoutes];
}
