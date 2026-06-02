import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNav } from "@/components/bottom-nav";
import { NavigationPendingIndicator } from "@/components/navigation-pending-indicator";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { DeviceSessionGuard } from "@/components/auth/device-session-guard";
import { AppHeader } from "@/components/app-header";
import { MarketingHeader } from "@/components/marketing-header";
import { ACCOUNT_STORAGE_USER_ID_KEY } from "@/lib/auth/account-storage";
import { getSessionContext } from "@/lib/auth/profile";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://ortace.jp";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ORT ACE — 視能訓練士国家試験対策アプリ",
    template: "%s｜ORT ACE",
  },
  description:
    "視能訓練士国家試験対策アプリ。第47〜56回・10年分・1,500問の過去問と、AIコーチMiLu先生があなたの学習履歴から次の一歩を提案。",
  keywords: [
    "視能訓練士",
    "国家試験",
    "ORT",
    "過去問",
    "AIコーチ",
    "国試対策",
    "視能訓練士国試",
    "ORT ACE",
  ],
  manifest: "/manifest.webmanifest",
  applicationName: "ORT ACE",
  appleWebApp: {
    capable: true,
    title: "ORT ACE",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: "ORT ACE",
    title: "ORT ACE — 視能訓練士国家試験対策アプリ",
    description:
      "視能訓練士国家試験対策アプリ。第47〜56回・10年分・1,500問の過去問と、AIコーチMiLu先生があなたの学習履歴から次の一歩を提案。",
    // OG画像は opengraph-image.tsx で動的生成（/opengraph-image）
  },
  twitter: {
    card: "summary_large_image",
    title: "ORT ACE — 視能訓練士国家試験対策アプリ",
    description:
      "視能訓練士国家試験対策アプリ。第47〜56回・10年分・1,500問とAIコーチMiLu先生で合格まで伴走。",
    images: [`${SITE_URL}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f10" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const COLOR_THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('ortace.colorTheme');var valid=['pink','lavender','mint','peach','sky'];document.documentElement.setAttribute('data-theme',valid.indexOf(t)>=0?t:'pink');}catch(e){document.documentElement.setAttribute('data-theme','pink');}})();`;

function createAccountStorageScript(userId: string | null): string {
  return `(function(){var u=${JSON.stringify(userId)};window.__ORTACE_ACCOUNT_USER_ID__=u;try{var k=${JSON.stringify(ACCOUNT_STORAGE_USER_ID_KEY)};if(u){localStorage.setItem(k,u);}else{localStorage.removeItem(k);}}catch(e){}})();`;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSessionContext();
  const showAppChrome = Boolean(session);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSansJp.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: COLOR_THEME_SCRIPT }} />
        <script
          dangerouslySetInnerHTML={{
            __html: createAccountStorageScript(session?.userId ?? null),
          }}
        />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col md:max-w-[960px]">
            {showAppChrome ? <AppHeader /> : <MarketingHeader />}
            <main
              className={cn(
                "flex-1 px-5 pt-4",
                showAppChrome
                  ? "pb-[calc(3.5rem+1.5rem+env(safe-area-inset-bottom,0px))]"
                  : "pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]",
              )}
            >
              {children}
            </main>
            <NavigationPendingIndicator />
            {session ? <DeviceSessionGuard userId={session.userId} /> : null}
            {showAppChrome ? <BottomNav /> : null}
          </div>
          <ServiceWorkerRegister />
        </ThemeProvider>
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `}</Script>
          </>
        ) : null}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
