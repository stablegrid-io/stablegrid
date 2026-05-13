import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { LandingPage } from '@/components/home/LandingPage';
import { LandingPageMobile } from '@/components/home/LandingPageMobile';
import { FaqJsonLd } from '@/lib/seo/jsonLd';
import { LANDING_FAQS } from '@/lib/landing/faqs';

// Page-level title overrides the root layout's default template so the
// home page reads as a standalone canonical title in search results
// instead of inheriting "<default> · stablegrid.io".
const HOME_TITLE =
  'stablegrid.io — PySpark, written for engineers who already ship';
const HOME_DESCRIPTION =
  'A working PySpark journal for analysts and data engineers. Three tiers, thirty modules, every chapter paired with server-graded practice. Free during beta.';

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://stablegrid.io',
    siteName: 'stablegrid.io',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'stablegrid.io' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ['/og-image.png'],
  },
};

// Phone vs desktop variant chosen server-side from the User-Agent so we
// don't ship both component trees to every visitor. The regex targets
// phone form factors only — tablets (iPad, Android tablets without
// "Mobile" in UA) keep the rich desktop landing because they have the
// width for parallax chapters and the comparison table.
const PHONE_UA_RE = /Android.*Mobile|iPhone|iPod|Mobi|webOS|IEMobile|Opera Mini|BlackBerry/i;

const isPhoneRequest = (): boolean => {
  try {
    const ua = headers().get('user-agent') ?? '';
    if (!ua) return false;
    // `Sec-CH-UA-Mobile: ?1` is sent by recent Chromium-based browsers as a
    // hint independent of the UA string — trust it when present.
    const chMobile = headers().get('sec-ch-ua-mobile');
    if (chMobile === '?1') return true;
    if (chMobile === '?0') return false;
    return PHONE_UA_RE.test(ua);
  } catch {
    return false;
  }
};

export default function RootPage() {
  const phone = isPhoneRequest();
  return (
    <>
      <FaqJsonLd items={LANDING_FAQS} />
      {phone ? <LandingPageMobile /> : <LandingPage />}
    </>
  );
}
