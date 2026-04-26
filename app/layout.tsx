import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JetBrains_Mono, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CookieConsentManager } from '@/components/cookies/CookieConsentManager';
import { Navigation } from '@/components/navigation/Navigation';
import { OrganizationJsonLd } from '@/lib/seo/jsonLd';

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

const ROOT_DESCRIPTION =
  'Ed-tech for working data analysts and engineers. Junior to Senior tracks in PySpark, Apache Airflow, Microsoft Fabric, SQL, and Python. Free during beta.';

export const metadata: Metadata = {
  metadataBase: new URL('https://stablegrid.io'),
  title: {
    default: 'StableGrid — PySpark, Airflow & Microsoft Fabric for Data Engineers',
    template: '%s · StableGrid',
  },
  description: ROOT_DESCRIPTION,
  keywords: [
    'pyspark course',
    'apache airflow course',
    'microsoft fabric course',
    'data engineering learning',
    'sql for data engineers',
    'python for data engineers',
    'data engineer training',
  ],
  authors: [{ name: 'StableGrid' }],
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
    siteName: 'StableGrid',
    title: 'StableGrid — Deep data engineering, no certificate theatre',
    description: ROOT_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'StableGrid' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StableGrid — Data engineering, properly taught',
    description:
      'PySpark, Airflow, Microsoft Fabric, SQL, Python. Junior to Senior. Free during beta.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${jetbrainsMono.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans text-on-surface">
        <OrganizationJsonLd />
        <CookieConsentManager />
        <AuthProvider>
          <Navigation>{children}</Navigation>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
