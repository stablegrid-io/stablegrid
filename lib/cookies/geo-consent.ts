// Geo-aware consent defaults.
//
// Visitors from the EU/EEA (plus the UK and Switzerland, which apply
// equivalent GDPR-style frameworks) are governed by ePrivacy + GDPR, which
// require explicit opt-in for non-essential cookies — Analytics defaults to
// `false` for them.
//
// Visitors from the rest of the world get a pre-checked Analytics default
// (the banner still appears for transparency and 1-click opt-out, but the
// state is `true` until they choose otherwise). This is legally permissible
// outside the EU/EEA and lifts Vercel Analytics coverage from ~30% (consent-
// only) to ~85-95% of traffic for a US/UK-heavy audience.

export const GEO_REGION_COOKIE_NAME = 'sg_geo_region';
export const GEO_REGION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type GeoRegion = 'eu' | 'row';

// 27 EU member states + EEA (Norway, Iceland, Liechtenstein) + UK + Switzerland.
// ISO 3166-1 alpha-2 codes (what Vercel returns via `x-vercel-ip-country`).
export const EU_LIKE_COUNTRY_CODES: ReadonlySet<string> = new Set([
  // EU 27
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EEA (not in EU)
  'NO', 'IS', 'LI',
  // GDPR-equivalent frameworks
  'GB', 'CH'
]);

/**
 * Map an ISO 3166-1 alpha-2 country code to a region bucket.
 * `null`/unknown defaults to `eu` — the conservative GDPR-compliant choice.
 */
export const getGeoRegionFromCountry = (
  country: string | null | undefined
): GeoRegion => {
  if (!country) return 'eu';
  const normalized = country.trim().toUpperCase();
  if (!normalized) return 'eu';
  return EU_LIKE_COUNTRY_CODES.has(normalized) ? 'eu' : 'row';
};

const canUseDom = () =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Read the geo region cookie set by middleware on the very first request.
 * Returns `null` when the cookie isn't set yet (rare race: first paint before
 * the middleware response writes the cookie) or when called server-side.
 */
export const readGeoRegion = (): GeoRegion | null => {
  if (!canUseDom()) return null;
  const prefix = `${GEO_REGION_COOKIE_NAME}=`;
  const entry = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!entry) return null;
  const raw = entry.slice(prefix.length);
  return raw === 'eu' || raw === 'row' ? raw : null;
};
