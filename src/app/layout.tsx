import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Ethiopic } from "next/font/google";

import { AppProvider } from "@/components/providers/app-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getDictionary } from "@/lib/i18n";
import { getLocale, getTheme } from "@/lib/preferences";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Ethiopic script (Amharic / Tigrinya) and Qubee glyph coverage.
const notoEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-ethiopic",
  subsets: ["ethiopic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Yope Order — Online Ordering Portal",
    template: "%s · Yope Order",
  },
  description:
    "Yope Order is an online ordering portal for businesses: publish your catalog, receive orders and keep customers coming back.",
  openGraph: {
    title: "Yope Order — Online Ordering Portal",
    description: "Online ordering portal for businesses.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  const dict = getDictionary(locale);

  return (
    <html lang={locale} data-theme={theme} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoEthiopic.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <AppProvider locale={locale} theme={theme} dict={dict}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </AppProvider>
      </body>
    </html>
  );
}