import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import QueryProvider from '@/components/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'https://memoralk.com'),
  title: {
    default: 'Memoralk — Order Management & Growth Analytics',
    template: '%s | Memoralk',
  },
  description:
    'Executive order management platform with cost vs selling price tracking, automated client invoice PDF generation, status workflow audits, and interactive monthly growth analytics.',
  applicationName: 'Memoralk',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Memoralk — Order Management & Growth Analytics',
    description:
      'Executive order management platform with cost vs selling price tracking, automated client invoice PDF generation, status workflow audits, and interactive monthly growth analytics.',
    type: 'website',
    url: 'https://memoralk.com',
    siteName: 'Memoralk',
    images: [
      {
        url: '/cover.jpg',
        width: 1200,
        height: 630,
        alt: 'Memoralk Orders Management & Analytics Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Memoralk — Order Management & Growth Analytics',
    description:
      'Executive order management platform with cost vs selling price tracking, automated client invoice PDF generation, status workflow audits, and interactive monthly growth analytics.',
    images: ['/cover.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className="bg-slate-50 text-slate-900 antialiased min-h-screen selection:bg-indigo-500 selection:text-white"
          suppressHydrationWarning
        >
          <QueryProvider>
            {children}
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
