import type { Metadata } from 'next';
import { Inter, IBM_Plex_Sans_Arabic, Geist } from 'next/font/google';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { getLocale } from 'next-intl/server';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans',display:'swap'});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: '--font-ibm-plex-sans-arabic',
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Muhandes HUB | منصة مهندس',
    template: '%s | Muhandes HUB',
  },
  description:
    'Bilingual B2B marketplace for the Saudi construction industry — connecting project owners, contractors, suppliers & buyers. | منصة رقمية متكاملة لقطاع الإنشاءات في المملكة العربية السعودية',
  keywords: [
    'construction',
    'Saudi Arabia',
    'B2B marketplace',
    'contractors',
    'suppliers',
    'مقاولات',
    'المملكة العربية السعودية',
    'منصة مهندس',
  ],
  authors: [{ name: 'Muhandes HUB' }],
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    siteName: 'Muhandes HUB',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body
        className={`${inter.variable} ${ibmPlexSansArabic.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
