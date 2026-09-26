import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./native-shell.css";
import { AppShell } from "@/components/app-shell";
import { HeaderBar } from "@/components/layout/header-bar";
import { NativeAppBootstrap } from "@/components/native/native-app-bootstrap";
import { GlobalThemeLayer } from "@/components/shop/global-theme-layer";
import { ThemeEquipOverlay } from "@/components/shop/theme-equip-overlay";
import { PresenceHeartbeat } from "@/components/presence/presence-heartbeat";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { ErrorBoundary } from "@/components/error-boundary";
import { ToastProvider } from "@/components/ui/toast";
import { Providers } from "@/providers/query-provider";
import { cn } from "@/lib/cn";
import { getLayoutSessionAndCosmetics } from "@/lib/layout-cosmetics";
import { getNavAvatarUrl } from "@/lib/nav-avatar";
import { toNavSession } from "@/lib/nav-session";
import { getThemeMode, themeFxClasses } from "@/lib/cosmetics";
import { buildNativeMetadata, nativeViewport } from "@/lib/native-metadata";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const viewport = nativeViewport;

export const metadata: Metadata = buildNativeMetadata({
  title: {
    default: "Hexavante",
    template: "%s | Hexavante",
  },
  description: "Plataforma educacional para estudantes e instituições",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { session, cosmetics } = await getLayoutSessionAndCosmetics();
  const avatarUrl = session?.user?.id ? await getNavAvatarUrl(session.user.id) : null;
  const navSession = toNavSession(session, avatarUrl, {
    avatarBorderClassName: cosmetics.avatarBorderClassName,
    badgeLabel: cosmetics.badgeLabel,
  });
  const themeClass = cosmetics.themeClassName || "theme-default";
  const themeMode = getThemeMode(cosmetics.themeId);
  const themeFx = themeFxClasses(cosmetics.themeId);

  return (
    <html
      lang="pt-BR"
      className={`${themeClass} ${themeFx}`.trim()}
      data-shop-theme={cosmetics.themeId ?? undefined}
      data-theme-mode={themeMode}
      suppressHydrationWarning
    >
      <body
        className={cn(grotesk.variable, "app-shell hx-native-safe-area antialiased font-sans", themeClass, themeFx)}
        data-theme-mode={themeMode}
      >
        <ErrorBoundary>
          <Providers>
            <NativeAppBootstrap />
            <ToastProvider>
              <GlobalThemeLayer
                themeId={cosmetics.themeId}
                themeClassName={cosmetics.themeClassName}
              />
              <ThemeEquipOverlay />
              {navSession && <PresenceHeartbeat />}
              <AppShell session={navSession} header={<HeaderBar session={navSession} />}>
                {children}
              </AppShell>
            </ToastProvider>
            <CookieBanner />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
