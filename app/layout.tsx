import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JetBrains_Mono, Inter, Inter_Tight, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CookieConsentManager } from '@/components/cookies/CookieConsentManager';
import { VercelAnalyticsGate } from '@/components/cookies/VercelAnalyticsGate';
import { Navigation } from '@/components/navigation/Navigation';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/lib/seo/jsonLd';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif-editorial',
  weight: ['400', '600', '700'],
  display: 'swap',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-sans-editorial',
  weight: ['500', '600', '700'],
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono-editorial',
  weight: ['400', '500'],
  display: 'swap',
});

const ROOT_DESCRIPTION =
  'A PySpark journal for working engineers and analysts. Junior to Senior modules paired with server-graded practice. Free during beta.';

export const metadata: Metadata = {
  metadataBase: new URL('https://stablegrid.io'),
  title: {
    default: 'stablegrid.io — PySpark for engineers who already ship',
    template: '%s · stablegrid.io',
  },
  description: ROOT_DESCRIPTION,
  keywords: [
    'pyspark course',
    'pyspark tutorial',
    'pyspark for engineers',
    'pyspark for analysts',
    'spark dataframe',
    'pyspark practice',
    'spark sql',
    'data engineering training',
    'pyspark execution plan',
    'pyspark partitioning',
    'delta lake',
    'structured streaming',
  ],
  authors: [{ name: 'stablegrid.io' }],
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32-dark.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-180-dark.png', sizes: '180x180', type: 'image/png' },
      { url: '/favicon-512-dark.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://stablegrid.io',
    siteName: 'stablegrid.io',
    title: 'stablegrid.io — PySpark, written for engineers who already ship',
    description: ROOT_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'stablegrid.io' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'stablegrid.io — PySpark, written for engineers who already ship',
    description: ROOT_DESCRIPTION,
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${inter.variable} ${sourceSerif.variable} ${interTight.variable} ${plexMono.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-screen bg-surface font-body text-on-surface antialiased">
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <CookieConsentManager />
        <AuthProvider>
          <Navigation>{children}</Navigation>
        </AuthProvider>
        <VercelAnalyticsGate />
      </body>
    </html>
  );
}
