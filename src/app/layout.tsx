import type { Metadata } from 'next';
import Script from 'next/script';
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
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
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    siteName: 'Muhandes HUB',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@muhandeshub',
    creator: '@muhandeshub',
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
        {/* Organization + WebSite structured data for Google Knowledge Panel & Sitelinks */}
        <Script
          id="json-ld-organization"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://muhandeshub.com/#organization',
                  name: 'Muhandes HUB',
                  alternateName: 'منصة مهندس',
                  url: 'https://muhandeshub.com',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://muhandeshub.com/logo.png',
                  },
                  description:
                    'Bilingual B2B marketplace for the Saudi construction industry — connecting project owners, contractors, suppliers & buyers.',
                  address: {
                    '@type': 'PostalAddress',
                    addressCountry: 'SA',
                  },
                  sameAs: [],
                  parentOrganization: {
                    '@type': 'Organization',
                    name: 'Remal Al Mas',
                    alternateName: 'رمال الماس',
                    url: 'https://remal-almas.com',
                  },
                  contactPoint: {
                    '@type': 'ContactPoint',
                    contactType: 'customer service',
                    email: 'info@muhandeshub.com',
                    availableLanguage: ['Arabic', 'English'],
                  },
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://muhandeshub.com/#website',
                  url: 'https://muhandeshub.com',
                  name: 'Muhandes HUB',
                  alternateName: 'منصة مهندس',
                  publisher: { '@id': 'https://muhandeshub.com/#organization' },
                  inLanguage: ['ar', 'en'],
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate:
                        'https://muhandeshub.com/ar/marketplace?q={search_term_string}',
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
              ],
            }),
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BQC8J76G8Z"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BQC8J76G8Z');
          `}
        </Script>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
