import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CookieConsentManager } from '@/components/cookies/CookieConsentManager';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Navigation } from '@/components/navigation/Navigation';

export const metadata: Metadata = {
  title: 'StableGrid.io',
  description:
    'Earn kWh deployment credits through data engineering tasks and deploy infrastructure to stabilize a renewable grid simulation.',
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans text-text-light-primary dark:text-text-dark-primary">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
          storageKey="stablegrid-theme"
        >
          <CookieConsentManager />
          <AuthProvider>
            <Navigation />
            <div className="pb-16 lg:pb-0">{children}</div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
