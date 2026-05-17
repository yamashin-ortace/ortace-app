import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNav } from "@/components/bottom-nav";
import { NavigationPendingIndicator } from "@/components/navigation-pending-indicator";
import { AppHeader } from "@/components/app-header";
import { MarketingHeader } from "@/components/marketing-header";
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

export const metadata: Metadata = {
  title: "ORT ACE — 視能訓練士国家試験対策",
  description:
    "視能訓練士国家試験対策Webアプリ。過去問1,500問とAIコーチで毎日コツコツ合格へ。",
  manifest: "/manifest.webmanifest",
  applicationName: "ORT ACE",
  appleWebApp: {
    capable: true,
    title: "ORT ACE",
    statusBarStyle: "default",
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSessionContext();
  const showAppChrome = Boolean(session);

  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSansJp.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: COLOR_THEME_SCRIPT }} />
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
            {showAppChrome ? <BottomNav /> : null}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
