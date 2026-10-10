"use client";

import { cn } from "@/lib/cn";

type Props = {
  themeId: string | null;
  themeClassName: string;
  themeVars: Record<string, string> | null;
};

export function ThemeStyle({ themeId, themeClassName, themeVars }: Props) {
  if (!themeId || themeId === "default" || !themeVars) {
    return null;
  }

  const cssVars = Object.entries(themeVars)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n");

  const css = `html.${themeClassName}, .${themeClassName} { ${cssVars} }`;

  return (
    <style
      dangerouslySetInnerHTML={{ __html: css }}
      data-theme-style={themeClassName}
    />
  );
}