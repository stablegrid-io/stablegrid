import {
  clearProductAnalyticsData,
  primeProductAnalyticsSession
} from '@/lib/analytics/productAnalytics';
import type { CookieCategory } from '@/lib/cookies/cookie-types';

type CookiePartyType = 'first-party' | 'third-party';
type CookieLegalBasis = 'necessary' | 'consent';

export interface CookieServiceConfig {
  id: string;
  name: string;
  provider: string;
  category: CookieCategory;
  purpose: string;
  expiry: string;
  type: CookiePartyType;
  legalBasis: CookieLegalBasis;
  requiresConsent: boolean;
  loader: () => void | Promise<void>;
  cleanup?: () => void | Promise<void>;
}

export const COOKIE_CATEGORY_COPY: Record<CookieCategory, { label: string; description: string }> = {
  necessary: {
    label: 'Necessary',
    description: 'Required for security, session continuity, load balancing, and consent memory.'
  },
  analytics: {
    label: 'Analytics',
    description: 'Traffic measurement and usage statistics.'
  },
  marketing: {
    label: 'Marketing',
    description: 'Ad measurement, retargeting, and cross-site tracking.'
  },
  preferences: {
    label: 'Preferences',
    description: 'Remembered UI settings, language, and non-essential personalization.'
  }
};

const noop = () => {};

export const COOKIE_SERVICE_REGISTRY: CookieServiceConfig[] = [
  {
    id: 'stablegrid-consent-memory',
    name: 'Consent memory',
    provider: 'stableGrid',
    category: 'necessary',
    purpose: 'Stores cookie choices and timestamp so the site can honor your decision.',
    expiry: '180 days',
    type: 'first-party',
    legalBasis: 'necessary',
    requiresConsent: false,
    loader: noop
  },
  {
    id: 'stablegrid-product-analytics',
    name: 'Product analytics',
    provider: 'stableGrid',
    category: 'analytics',
    purpose: 'Measures feature usage and page flow to improve product reliability.',
    expiry: '365 days',
    type: 'first-party',
    legalBasis: 'consent',
    requiresConsent: true,
    // Optional analytics must be loaded only after explicit opt-in.
    loader: () => {
      primeProductAnalyticsSession();
    },
    cleanup: () => {
      clearProductAnalyticsData();
    }
  },
  {
    id: 'vercel-analytics',
    name: 'Vercel Analytics',
    provider: 'Vercel',
    category: 'analytics',
    purpose: 'Anonymized traffic and Web Vitals measurement provided by our hosting platform.',
    expiry: 'Session',
    type: 'third-party',
    legalBasis: 'consent',
    requiresConsent: true,
    // The <VercelAnalyticsGate /> component mounts/unmounts the script in
    // response to consent changes, so this entry is for disclosure only.
    loader: noop
  },
];
