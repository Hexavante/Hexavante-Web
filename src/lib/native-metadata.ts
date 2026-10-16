import type { Metadata, Viewport } from "next";
import { getAuthBaseUrl } from "@/lib/auth-env";

const APP_NAME = "Hexavante";
const APP_SHORT_NAME = "Hexavante";
const APP_DESCRIPTION = "Plataforma educacional Hexavante";
const THEME_COLOR = "#0b1220";

export const nativeViewport: Viewport = {
  themeColor: THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function buildNativeMetadata(base?: Metadata): Metadata {
  return {
    ...base,
    metadataBase: new URL(getAuthBaseUrl()),
    applicationName: APP_NAME,
    description: base?.description ?? APP_DESCRIPTION,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: APP_SHORT_NAME,
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: "/icons/icon-192.png",
      apple: "/icons/icon-192.png",
    },
  };
}
