"use client";

import { getApiUrl } from "@/lib/api-url";
import { cn } from "@/lib/cn";

type Props = {
  provider: "google" | "github" | "microsoft" | "discord";
  callbackUrl: string;
  children: React.ReactNode;
  className?: string;
};

export function OAuthSignInButton({ provider, callbackUrl, children, className }: Props) {
  const API_URL = getApiUrl();
  const href = `${API_URL}/oauth/${provider}?callbackURL=${encodeURIComponent(callbackUrl)}`;

  return (
    <a
      href={href}
      className={cn(
        "hx-btn-secondary inline-flex min-h-11 w-full items-center justify-center gap-3 px-5 py-2.5 transition-all hover:shadow-md",
        className,
      )}
    >
      {children}
    </a>
  );
}
