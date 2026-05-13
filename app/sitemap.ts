import type { MetadataRoute } from 'next';

const BASE = 'https://stablegrid.io';

/**
 * Public indexable surfaces. Auth-gated routes (/home, /practice/modules,
 * /grid, /stats, etc.) are excluded because they redirect to /login for
 * unauthenticated bots and would pollute the index with soft-404s.
 *
 * The theory tree is the long-tail SEO asset: 3 tracks × 10 chapters,
 * with `?chapter=…&lesson=…-lesson-01` previews publicly readable via
 * the middleware lesson-01 carve-out.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },

    // /theory is the only bare track route that doesn't redirect; the
    // /theory/{junior|mid|senior} surfaces all bounce back to /theory when
    // no chapter param is present, so we don't list them as canonical.
    // Track-level visibility comes via the lesson-01 preview URLs below.
    { url: `${BASE}/theory`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },

    { url: `${BASE}/practice`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/practice/coding/landing`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/practice/common-mistakes`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/practice/function-atlas`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/practice/spark-ui-speed-reading`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },

    { url: `${BASE}/support`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // First-lesson chapter previews — middleware lets these through unauth so
  // Googlebot can crawl real PySpark prose. 30 URLs (3 tracks × 10 chapters).
  const TRACK_MODULES: Array<{ track: 'junior' | 'mid' | 'senior'; prefix: string }> = [
    { track: 'junior', prefix: 'PS' },
    { track: 'mid', prefix: 'PSI' },
    { track: 'senior', prefix: 'PSS' },
  ];
  const chapterPreviewRoutes: MetadataRoute.Sitemap = TRACK_MODULES.flatMap(({ track, prefix }) =>
    Array.from({ length: 10 }, (_, i) => {
      const moduleId = `module-${prefix}${i + 1}`;
      const params = new URLSearchParams({
        chapter: moduleId,
        lesson: `${moduleId}-lesson-01`,
      });
      return {
        url: `${BASE}/theory/${track}?${params.toString()}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      };
    })
  );

  return [...staticRoutes, ...chapterPreviewRoutes];
}
