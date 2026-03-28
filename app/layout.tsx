import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Space_Grotesk, JetBrains_Mono, Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CookieConsentManager } from '@/components/cookies/CookieConsentManager';
import { Navigation } from '@/components/navigation/Navigation';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

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
  title: 'stableGrid',
  description:
    'Premium data engineering learning platform — master PySpark, Fabric, Airflow, SQL, and more through structured theory tracks.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg'
  }
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans text-on-surface">
        <CookieConsentManager />
        <AuthProvider>
          <Navigation>{children}</Navigation>
        </AuthProvider>
      </body>
    </html>
  );
}
