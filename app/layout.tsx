import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JetBrains_Mono, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CookieConsentManager } from '@/components/cookies/CookieConsentManager';
import { Navigation } from '@/components/navigation/Navigation';

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

export const metadata: Metadata = {
  title: 'StableGrid',
  description:
    'Ed-tech for analysts and engineers who’d rather understand a query plan than collect another certificate.',
  metadataBase: new URL('https://stablegrid.io'),
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
    title: 'StableGrid',
    description:
      'Ed-tech for analysts and engineers who’d rather understand a query plan than collect another certificate.',
    url: 'https://stablegrid.io',
    siteName: 'StableGrid',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'StableGrid' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StableGrid',
    description:
      'Ed-tech for analysts and engineers who’d rather understand a query plan than collect another certificate.',
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
        <CookieConsentManager />
        <AuthProvider>
          <Navigation>{children}</Navigation>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
