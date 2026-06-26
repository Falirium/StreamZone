import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { PushNotificationRegister } from '@/components/PushNotificationRegister';
import { getCurrentUser } from '@/lib/auth/user-auth';
import { SupportWidget } from '@/components/SupportWidget';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'StreamZone — Live Sports Streaming',
    template: '%s | StreamZone',
  },
  description: 'Watch live sports events. Pay, redeem your code, and stream instantly on any device.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-surface-900 text-white min-h-screen`}
      >
        {children}
        <PwaInstallPrompt />
        <PushNotificationRegister isLoggedIn={!!currentUser} />
        <SupportWidget />
      </body>
    </html>
  );
}

