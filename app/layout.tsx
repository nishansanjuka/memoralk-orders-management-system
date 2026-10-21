import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vanguard Orders - Order Management & Growth Analytics',
  description:
    'Executive order management platform with cost vs selling price tracking, automated client invoice PDF generation, status workflow audits, and interactive monthly growth analytics.',
  openGraph: {
    title: 'Vanguard Orders - Order Management & Growth Analytics',
    description:
      'Executive order management platform with cost vs selling price tracking, automated client invoice PDF generation, status workflow audits, and interactive monthly growth analytics.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vanguard Orders - Order Management & Growth Analytics',
    description:
      'Executive order management platform with cost vs selling price tracking, automated client invoice PDF generation, status workflow audits, and interactive monthly growth analytics.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen selection:bg-indigo-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
