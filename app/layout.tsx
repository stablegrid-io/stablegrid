import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DM_Mono, DM_Serif_Display, Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Navigation } from '@/components/navigation/Navigation';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
});

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap'
});

const dmSerif = DM_Serif_Display({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'StableGrid | Master Data Engineering by Balancing the Grid',
  description:
    'Earn kWh deployment credits through data engineering tasks and deploy infrastructure to stabilize a renewable grid simulation.'
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${dmMono.variable} ${dmSerif.variable}`}
    >
      <body className="min-h-screen font-sans text-text-light-primary dark:text-text-dark-primary">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="stablegrid-theme"
        >
          <AuthProvider>
            <Navigation />
            <div className="pb-16 lg:pb-0">{children}</div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
