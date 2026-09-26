export type AvatarBorderRarity = "common" | "rare" | "legendary" | "premium";

export type AvatarBorderDef = {
  id: string;
  label: string;
  rarity: AvatarBorderRarity;
  description: string;
};

export type AppThemeDef = {
  id: string;
  label: string;
  description: string;
  className: string;
  preview: [string, string, string];
  /** dark (default) ou light — controla legibilidade global via data-theme-mode */
  mode?: "dark" | "light";
  vars: Record<string, string>;
};

/** Sidebar palette (HSL components, same format as globals.css :root). */
const DEFAULT_SIDEBAR = {
  "--sidebar-background": "240 6% 7%",
  "--sidebar-foreground": "210 20% 96%",
  "--sidebar-accent": "217 25% 14%",
  "--sidebar-accent-foreground": "210 20% 98%",
  "--sidebar-border": "217 20% 16%",
  "--sidebar-ring": "217 91% 60%",
  "--sidebar-highlight": "187 85% 53%",
};

const DEFAULT_SURFACE = {
  "--theme-glow-1": "rgba(37, 99, 235, 0.2)",
  "--theme-glow-2": "rgba(34, 211, 238, 0.12)",
  "--theme-gradient-from": "#0f172a",
  "--theme-gradient-mid": "#06080f",
  "--theme-gradient-to": "#030712",
};

export const AVATAR_BORDERS: Record<string, AvatarBorderDef> = {
  "border-cyan": {
    id: "border-cyan",
    label: "Borda Ciano",
    rarity: "common",
    description: "Linha sólida ciano — entrada na coleção.",
  },
  "border-aurora": {
    id: "border-aurora",
    label: "Borda Aurora",
    rarity: "rare",
    description: "Gradiente estático roxo e rosa.",
  },
  "border-gold": {
    id: "border-gold",
    label: "Borda Dourada",
    rarity: "rare",
    description: "Gradiente dourado para perfis de elite.",
  },
  "border-premium-neon": {
    id: "border-premium-neon",
    label: "Borda Neon Premium",
    rarity: "legendary",
    description: "Chroma animado exclusivo para assinantes.",
  },
  "border-crystal": {
    id: "border-crystal",
    label: "Moldura Cristal",
    rarity: "legendary",
    description: "Brilho gelo com reflexos prateados.",
  },
};

export const APP_THEMES: Record<string, AppThemeDef> = {
  default: {
    id: "default",
    label: "Padrão Hexavante",
    description: "Azul e teal — o visual original.",
    className: "theme-default",
    preview: ["#2563eb", "#22d3ee", "#06080f"],
    vars: {},
  },
  cyberpunk: {
    id: "cyberpunk",
    label: "Cyber Neon",
    description: "Fuchsia e ciano neon — vibrante.",
    className: "theme-cyberpunk",
    preview: ["#d946ef", "#22d3ee", "#0c0614"],
    vars: {
      "--color-primary": "#d946ef",
      "--color-primary-hover": "#c026d3",
      "--background": "#0c0614",
      "--foreground": "#faf5ff",
      "--primary": "#d946ef",
      "--primary-hover": "#c026d3",
      "--accent": "#22d3ee",
      "--secondary": "#1a0f2e",
      "--border": "rgba(217, 70, 239, 0.18)",
      "--surface": "rgba(26, 15, 46, 0.88)",
      "--surface-strong": "rgba(12, 6, 20, 0.97)",
      "--cyan": "#22d3ee",
      "--cyan-glow": "rgba(34, 211, 238, 0.25)",
      "--theme-glow-1": "rgba(217, 70, 239, 0.2)",
      "--theme-glow-2": "rgba(34, 211, 238, 0.12)",
      "--theme-gradient-from": "#1a0f2e",
      "--theme-gradient-mid": "#0c0614",
      "--theme-gradient-to": "#06030a",
      "--sidebar-background": "280 40% 7%",
      "--sidebar-foreground": "280 15% 94%",
      "--sidebar-accent": "285 35% 14%",
      "--sidebar-accent-foreground": "280 10% 97%",
      "--sidebar-border": "280 30% 16%",
      "--sidebar-ring": "292 84% 61%",
      "--sidebar-highlight": "292 84% 61%",
    },
  },
  hacker: {
    id: "hacker",
    label: "Matrix Verde",
    description: "Terminal verde escuro — vibe hacker.",
    className: "theme-hacker",
    preview: ["#22c55e", "#4ade80", "#030a05"],
    vars: {
      "--color-primary": "#22c55e",
      "--color-primary-hover": "#16a34a",
      "--background": "#030a05",
      "--foreground": "#ecfdf5",
      "--primary": "#22c55e",
      "--primary-hover": "#16a34a",
      "--accent": "#4ade80",
      "--secondary": "#0a1f12",
      "--border": "rgba(34, 197, 94, 0.18)",
      "--surface": "rgba(10, 31, 18, 0.9)",
      "--surface-strong": "rgba(3, 10, 5, 0.98)",
      "--cyan": "#4ade80",
      "--cyan-glow": "rgba(74, 222, 128, 0.22)",
      "--theme-glow-1": "rgba(34, 197, 94, 0.18)",
      "--theme-glow-2": "rgba(74, 222, 128, 0.1)",
      "--theme-gradient-from": "#0a1f12",
      "--theme-gradient-mid": "#030a05",
      "--theme-gradient-to": "#010502",
      "--sidebar-background": "145 45% 5%",
      "--sidebar-foreground": "140 20% 92%",
      "--sidebar-accent": "145 38% 11%",
      "--sidebar-accent-foreground": "140 15% 96%",
      "--sidebar-border": "145 32% 13%",
      "--sidebar-ring": "142 76% 45%",
      "--sidebar-highlight": "142 76% 45%",
    },
  },
  obsidian: {
    id: "obsidian",
    label: "Obsidian",
    description: "Preto absoluto com índigo sutil.",
    className: "theme-obsidian",
    preview: ["#6366f1", "#94a3b8", "#020203"],
    vars: {
      "--color-primary": "#6366f1",
      "--color-primary-hover": "#4f46e5",
      "--background": "#020203",
      "--foreground": "#e2e8f0",
      "--primary": "#6366f1",
      "--primary-hover": "#4f46e5",
      "--accent": "#94a3b8",
      "--secondary": "#0c0c10",
      "--border": "rgba(148, 163, 184, 0.12)",
      "--surface": "rgba(12, 12, 16, 0.92)",
      "--surface-strong": "rgba(2, 2, 3, 0.98)",
      "--cyan": "#a5b4fc",
      "--cyan-glow": "rgba(99, 102, 241, 0.18)",
      "--theme-glow-1": "rgba(99, 102, 241, 0.1)",
      "--theme-glow-2": "rgba(148, 163, 184, 0.06)",
      "--theme-gradient-from": "#0c0c10",
      "--theme-gradient-mid": "#020203",
      "--theme-gradient-to": "#010102",
      "--sidebar-background": "240 10% 4%",
      "--sidebar-foreground": "220 12% 90%",
      "--sidebar-accent": "240 12% 10%",
      "--sidebar-accent-foreground": "220 10% 96%",
      "--sidebar-border": "240 8% 12%",
      "--sidebar-ring": "239 84% 67%",
      "--sidebar-highlight": "239 84% 67%",
    },
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    description: "Laranja quente e rosa — crepúsculo.",
    className: "theme-sunset",
    preview: ["#f97316", "#fb7185", "#1a0a08"],
    vars: {
      "--color-primary": "#f97316",
      "--color-primary-hover": "#ea580c",
      "--background": "#1a0a08",
      "--foreground": "#fff7ed",
      "--primary": "#f97316",
      "--primary-hover": "#ea580c",
      "--accent": "#fb7185",
      "--secondary": "#2a1210",
      "--border": "rgba(249, 115, 22, 0.18)",
      "--surface": "rgba(42, 18, 16, 0.9)",
      "--surface-strong": "rgba(26, 10, 8, 0.97)",
      "--cyan": "#fdba74",
      "--cyan-glow": "rgba(251, 113, 133, 0.22)",
      "--theme-glow-1": "rgba(249, 115, 22, 0.18)",
      "--theme-glow-2": "rgba(251, 113, 133, 0.1)",
      "--theme-gradient-from": "#2a1210",
      "--theme-gradient-mid": "#1a0a08",
      "--theme-gradient-to": "#0f0504",
      "--sidebar-background": "15 50% 7%",
      "--sidebar-foreground": "30 25% 94%",
      "--sidebar-accent": "18 42% 13%",
      "--sidebar-accent-foreground": "30 20% 97%",
      "--sidebar-border": "18 38% 15%",
      "--sidebar-ring": "25 95% 53%",
      "--sidebar-highlight": "25 95% 53%",
    },
  },
  ocean: {
    id: "ocean",
    label: "Deep Ocean",
    description: "Azul profundo com ciano aquático.",
    className: "theme-ocean",
    preview: ["#0ea5e9", "#06b6d4", "#041018"],
    vars: {
      "--color-primary": "#0ea5e9",
      "--color-primary-hover": "#0284c7",
      "--background": "#041018",
      "--foreground": "#ecfeff",
      "--primary": "#0ea5e9",
      "--primary-hover": "#0284c7",
      "--accent": "#06b6d4",
      "--secondary": "#0c2433",
      "--border": "rgba(14, 165, 233, 0.18)",
      "--surface": "rgba(12, 36, 51, 0.9)",
      "--surface-strong": "rgba(4, 16, 24, 0.97)",
      "--cyan": "#22d3ee",
      "--cyan-glow": "rgba(6, 182, 212, 0.25)",
      "--theme-glow-1": "rgba(14, 165, 233, 0.16)",
      "--theme-glow-2": "rgba(6, 182, 212, 0.1)",
      "--theme-gradient-from": "#0c2433",
      "--theme-gradient-mid": "#041018",
      "--theme-gradient-to": "#020a10",
      "--sidebar-background": "205 55% 7%",
      "--sidebar-foreground": "195 25% 94%",
      "--sidebar-accent": "205 48% 12%",
      "--sidebar-accent-foreground": "195 20% 97%",
      "--sidebar-border": "205 42% 14%",
      "--sidebar-ring": "199 89% 48%",
      "--sidebar-highlight": "199 89% 48%",
    },
  },
  sakura: {
    id: "sakura",
    label: "Sakura",
    description: "Rosa suave — cerejeiras em flor.",
    className: "theme-sakura",
    preview: ["#ec4899", "#f9a8d4", "#1a0a14"],
    vars: {
      "--color-primary": "#ec4899",
      "--color-primary-hover": "#db2777",
      "--background": "#1a0a14",
      "--foreground": "#fdf2f8",
      "--primary": "#ec4899",
      "--primary-hover": "#db2777",
      "--accent": "#f9a8d4",
      "--secondary": "#2a1020",
      "--border": "rgba(236, 72, 153, 0.18)",
      "--surface": "rgba(42, 16, 32, 0.9)",
      "--surface-strong": "rgba(26, 10, 20, 0.97)",
      "--cyan": "#f9a8d4",
      "--cyan-glow": "rgba(236, 72, 153, 0.22)",
      "--theme-glow-1": "rgba(236, 72, 153, 0.16)",
      "--theme-glow-2": "rgba(249, 168, 212, 0.1)",
      "--theme-gradient-from": "#2a1020",
      "--theme-gradient-mid": "#1a0a14",
      "--theme-gradient-to": "#100610",
      "--sidebar-background": "330 38% 8%",
      "--sidebar-foreground": "330 20% 94%",
      "--sidebar-accent": "330 32% 14%",
      "--sidebar-accent-foreground": "330 15% 97%",
      "--sidebar-border": "330 28% 16%",
      "--sidebar-ring": "330 81% 60%",
      "--sidebar-highlight": "330 81% 60%",
    },
  },
  midnight: {
    id: "midnight",
    label: "Midnight Violet",
    description: "Roxo profundo — madrugada.",
    className: "theme-midnight",
    preview: ["#8b5cf6", "#a78bfa", "#08051a"],
    vars: {
      "--color-primary": "#8b5cf6",
      "--color-primary-hover": "#7c3aed",
      "--background": "#08051a",
      "--foreground": "#f5f3ff",
      "--primary": "#8b5cf6",
      "--primary-hover": "#7c3aed",
      "--accent": "#a78bfa",
      "--secondary": "#15102a",
      "--border": "rgba(139, 92, 246, 0.18)",
      "--surface": "rgba(21, 16, 42, 0.92)",
      "--surface-strong": "rgba(8, 5, 26, 0.98)",
      "--cyan": "#c4b5fd",
      "--cyan-glow": "rgba(139, 92, 246, 0.2)",
      "--theme-glow-1": "rgba(139, 92, 246, 0.14)",
      "--theme-glow-2": "rgba(167, 139, 250, 0.08)",
      "--theme-gradient-from": "#15102a",
      "--theme-gradient-mid": "#08051a",
      "--theme-gradient-to": "#040210",
      "--sidebar-background": "260 42% 7%",
      "--sidebar-foreground": "260 20% 94%",
      "--sidebar-accent": "260 38% 13%",
      "--sidebar-accent-foreground": "260 15% 97%",
      "--sidebar-border": "260 32% 15%",
      "--sidebar-ring": "258 90% 66%",
      "--sidebar-highlight": "258 90% 66%",
    },
  },
  amber: {
    id: "amber",
    label: "Golden",
    description: "Dourado elegante — premium.",
    className: "theme-amber",
    preview: ["#f59e0b", "#fcd34d", "#14100a"],
    vars: {
      "--color-primary": "#f59e0b",
      "--color-primary-hover": "#d97706",
      "--background": "#14100a",
      "--foreground": "#fffbeb",
      "--primary": "#f59e0b",
      "--primary-hover": "#d97706",
      "--accent": "#fcd34d",
      "--secondary": "#241c10",
      "--border": "rgba(245, 158, 11, 0.18)",
      "--surface": "rgba(36, 28, 16, 0.92)",
      "--surface-strong": "rgba(20, 16, 10, 0.98)",
      "--cyan": "#fcd34d",
      "--cyan-glow": "rgba(245, 158, 11, 0.2)",
      "--theme-glow-1": "rgba(245, 158, 11, 0.14)",
      "--theme-glow-2": "rgba(252, 211, 77, 0.08)",
      "--theme-gradient-from": "#241c10",
      "--theme-gradient-mid": "#14100a",
      "--theme-gradient-to": "#0a0804",
      "--sidebar-background": "38 38% 7%",
      "--sidebar-foreground": "45 25% 94%",
      "--sidebar-accent": "38 32% 13%",
      "--sidebar-accent-foreground": "45 20% 97%",
      "--sidebar-border": "38 28% 15%",
      "--sidebar-ring": "38 92% 50%",
      "--sidebar-highlight": "38 92% 50%",
    },
  },
  snow: {
    id: "snow",
    label: "Neve",
    description: "Branco limpo com azul — foco total.",
    className: "theme-snow",
    mode: "light",
    preview: ["#5865f2", "#3b82f6", "#ffffff"],
    vars: {
      "--color-primary": "#5865f2",
      "--color-primary-hover": "#4752c4",
      "--color-accent": "#3b82f6",
      "--color-surface": "rgba(0, 0, 0, 0.03)",
      "--background": "#ffffff",
      "--foreground": "#1e293b",
      "--primary": "#5865f2",
      "--primary-hover": "#4752c4",
      "--accent": "#3b82f6",
      "--secondary": "#f1f5f9",
      "--muted": "#94a3b8",
      "--border": "rgba(0, 0, 0, 0.08)",
      "--surface": "rgba(255, 255, 255, 0.95)",
      "--surface-strong": "#ffffff",
      "--cyan": "#3b82f6",
      "--cyan-glow": "rgba(88, 101, 242, 0.08)",
      "--theme-glow-1": "rgba(88, 101, 242, 0.04)",
      "--theme-glow-2": "rgba(59, 130, 246, 0.03)",
      "--theme-gradient-from": "#f8fafc",
      "--theme-gradient-mid": "#f1f5f9",
      "--theme-gradient-to": "#e2e8f0",
      "--sidebar-background": "220 20% 97%",
      "--sidebar-foreground": "222 47% 11%",
      "--sidebar-accent": "220 16% 93%",
      "--sidebar-accent-foreground": "222 47% 8%",
      "--sidebar-border": "220 13% 89%",
      "--sidebar-ring": "235 86% 57%",
      "--sidebar-highlight": "235 86% 57%",
    },
  },
  daylight: {
    id: "daylight",
    label: "Luz do Dia",
    description: "Teal suave e cinza — calmo e produtivo.",
    className: "theme-daylight",
    mode: "light",
    preview: ["#0d9488", "#14b8a6", "#f8fafc"],
    vars: {
      "--color-primary": "#0d9488",
      "--color-primary-hover": "#0f766e",
      "--color-accent": "#14b8a6",
      "--color-surface": "rgba(0, 0, 0, 0.03)",
      "--background": "#f8fafc",
      "--foreground": "#1e293b",
      "--primary": "#0d9488",
      "--primary-hover": "#0f766e",
      "--accent": "#14b8a6",
      "--secondary": "#f0fdfa",
      "--muted": "#94a3b8",
      "--border": "rgba(0, 0, 0, 0.08)",
      "--surface": "rgba(255, 255, 255, 0.95)",
      "--surface-strong": "#ffffff",
      "--cyan": "#0d9488",
      "--cyan-glow": "rgba(13, 148, 136, 0.08)",
      "--theme-glow-1": "rgba(13, 148, 136, 0.04)",
      "--theme-glow-2": "rgba(20, 184, 166, 0.03)",
      "--theme-gradient-from": "#f0fdfa",
      "--theme-gradient-mid": "#f8fafc",
      "--theme-gradient-to": "#e2e8f0",
      "--sidebar-background": "170 20% 97%",
      "--sidebar-foreground": "175 30% 12%",
      "--sidebar-accent": "170 16% 93%",
      "--sidebar-accent-foreground": "175 30% 8%",
      "--sidebar-border": "170 13% 89%",
      "--sidebar-ring": "162 76% 36%",
      "--sidebar-highlight": "162 76% 36%",
    },
  },
  cream: {
    id: "cream",
    label: "Creme",
    description: "Off-white quente com âmbar — acolhedor.",
    className: "theme-cream",
    mode: "light",
    preview: ["#d97706", "#f59e0b", "#fffdf7"],
    vars: {
      "--color-primary": "#d97706",
      "--color-primary-hover": "#b45309",
      "--color-accent": "#f59e0b",
      "--color-surface": "rgba(0, 0, 0, 0.03)",
      "--background": "#fffdf7",
      "--foreground": "#292524",
      "--primary": "#d97706",
      "--primary-hover": "#b45309",
      "--accent": "#f59e0b",
      "--secondary": "#fef9ee",
      "--muted": "#a8a29e",
      "--border": "rgba(0, 0, 0, 0.08)",
      "--surface": "rgba(255, 255, 255, 0.95)",
      "--surface-strong": "#ffffff",
      "--cyan": "#d97706",
      "--cyan-glow": "rgba(217, 119, 6, 0.08)",
      "--theme-glow-1": "rgba(245, 158, 11, 0.05)",
      "--theme-glow-2": "rgba(217, 119, 6, 0.03)",
      "--theme-gradient-from": "#fffdf7",
      "--theme-gradient-mid": "#fef9ee",
      "--theme-gradient-to": "#fef3c7",
      "--sidebar-background": "40 30% 97%",
      "--sidebar-foreground": "24 15% 14%",
      "--sidebar-accent": "40 20% 93%",
      "--sidebar-accent-foreground": "24 15% 10%",
      "--sidebar-border": "40 15% 89%",
      "--sidebar-ring": "32 95% 44%",
      "--sidebar-highlight": "32 95% 44%",
    },
  },
  pearl: {
    id: "pearl",
    label: "Pérola",
    description: "Branco perolado com violeta — elegante.",
    className: "theme-pearl",
    mode: "light",
    preview: ["#7c3aed", "#8b5cf6", "#faf9fe"],
    vars: {
      "--color-primary": "#7c3aed",
      "--color-primary-hover": "#6d28d9",
      "--color-accent": "#8b5cf6",
      "--color-surface": "rgba(0, 0, 0, 0.03)",
      "--background": "#faf9fe",
      "--foreground": "#1e1b4b",
      "--primary": "#7c3aed",
      "--primary-hover": "#6d28d9",
      "--accent": "#8b5cf6",
      "--secondary": "#f5f3ff",
      "--muted": "#a78bfa",
      "--border": "rgba(0, 0, 0, 0.08)",
      "--surface": "rgba(255, 255, 255, 0.95)",
      "--surface-strong": "#ffffff",
      "--cyan": "#7c3aed",
      "--cyan-glow": "rgba(124, 58, 237, 0.08)",
      "--theme-glow-1": "rgba(124, 58, 237, 0.04)",
      "--theme-glow-2": "rgba(139, 92, 246, 0.03)",
      "--theme-gradient-from": "#faf9fe",
      "--theme-gradient-mid": "#f5f3ff",
      "--theme-gradient-to": "#ede9fe",
      "--sidebar-background": "265 25% 97%",
      "--sidebar-foreground": "260 30% 14%",
      "--sidebar-accent": "265 18% 93%",
      "--sidebar-accent-foreground": "260 30% 10%",
      "--sidebar-border": "265 14% 89%",
      "--sidebar-ring": "262 83% 58%",
      "--sidebar-highlight": "262 83% 52%",
    },
  },
};

export function getAllThemeClassNames(): string[] {
  return Object.values(APP_THEMES).map((theme) => theme.className);
}

export function resolveAvatarBorder(borderId: string | null | undefined) {
  if (!borderId) return null;
  return AVATAR_BORDERS[borderId] ?? null;
}

export function getAvatarBorderClassName(borderId: string | null | undefined) {
  const border = resolveAvatarBorder(borderId);
  if (!border) return null;
  return `avatar-border avatar-border--${border.rarity} avatar-border--${border.id}`;
}

export function resolveAppTheme(themeId: string | null | undefined): AppThemeDef {
  if (!themeId || !APP_THEMES[themeId]) return APP_THEMES.default;
  return APP_THEMES[themeId];
}

export function getThemeMode(themeId: string | null | undefined): "dark" | "light" {
  return resolveAppTheme(themeId).mode ?? "dark";
}

/** Efeitos especiais por tier de tema — classes aplicadas em <html>/<body>. */
export const THEME_FX: Record<string, string[]> = {
  cyberpunk: ["fx-glow-pulse", "fx-shimmer", "fx-aurora-bg"],
  hacker: ["fx-glow-pulse"],
  obsidian: ["fx-glow-pulse", "fx-shimmer"],
  sunset: ["fx-glow-pulse"],
  ocean: ["fx-glow-pulse", "fx-aurora-bg"],
  sakura: ["fx-glow-pulse", "fx-shimmer", "fx-aurora-bg"],
  midnight: ["fx-glow-pulse", "fx-shimmer"],
  amber: ["fx-glow-pulse"],
};

export function themeFxClasses(themeId: string | null | undefined): string {
  if (!themeId) return "";
  return (THEME_FX[themeId] ?? []).join(" ");
}

export function buildThemeStyleBlock(themeId: string | null | undefined): string | null {
  const theme = resolveAppTheme(themeId);
  if (theme.id === "default" || Object.keys(theme.vars).length === 0) return null;

  const declarations = Object.entries(theme.vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n  ");

  return `html.${theme.className}, .${theme.className} {\n  ${declarations}\n}`;
}

/** CSS estático de TODOS os temas — evita sidebar/fundo/cards dessincronizados. */
export function buildAllThemesStyleBlock(): string {
  return Object.values(APP_THEMES)
    .filter((theme) => theme.id !== "default" && Object.keys(theme.vars).length > 0)
    .map((theme) => {
      const declarations = Object.entries(theme.vars)
        .map(([key, value]) => `${key}: ${value};`)
        .join("\n  ");
      return `html.${theme.className}, .${theme.className} {\n  ${declarations}\n}`;
    })
    .join("\n\n");
}

export const RARITY_LABELS: Record<AvatarBorderRarity, string> = {
  common: "Comum",
  rare: "Rara",
  legendary: "Lendária",
  premium: "Premium",
};

export type ProfileIconDef = {
  id: string;
  label: string;
  lucideName: string;
  className: string;
};

export const PROFILE_ICONS: Record<string, ProfileIconDef> = {
  "icon-flame": {
    id: "icon-flame",
    label: "Chama",
    lucideName: "Flame",
    className: "text-orange-400",
  },
  "icon-brain": {
    id: "icon-brain",
    label: "Mente Brilhante",
    lucideName: "Brain",
    className: "text-violet-400",
  },
  "icon-trophy": {
    id: "icon-trophy",
    label: "Troféu",
    lucideName: "Trophy",
    className: "text-amber-400",
  },
  "icon-star": {
    id: "icon-star",
    label: "Estrela",
    lucideName: "Star",
    className: "text-yellow-400",
  },
  "icon-rocket": {
    id: "icon-rocket",
    label: "Foguete",
    lucideName: "Rocket",
    className: "text-cyan-400",
  },
  "icon-gem": {
    id: "icon-gem",
    label: "Gema",
    lucideName: "Gem",
    className: "text-pink-400",
  },
  "icon-shield": {
    id: "icon-shield",
    label: "Escudo",
    lucideName: "Shield",
    className: "text-emerald-400",
  },
  "icon-book": {
    id: "icon-book",
    label: "Livro",
    lucideName: "BookOpen",
    className: "text-blue-400",
  },
};

export function resolveProfileIcon(iconId: string | null | undefined) {
  if (!iconId) return null;
  return PROFILE_ICONS[iconId] ?? null;
}

export type ProfileFrameDef = {
  id: string;
  label: string;
  rarity: AvatarBorderRarity;
  style: Record<string, string>;
  animationClass?: string;
};

export const PROFILE_FRAMES: Record<string, ProfileFrameDef> = {
  "frame-neon": {
    id: "frame-neon", label: "Moldura Neon", rarity: "rare",
    style: { border: "2px solid #22d3ee", borderRadius: "1rem", boxShadow: "0 0 14px rgba(34,211,238,0.45)", "--frame-glow": "rgba(34,211,238,0.45)" } as Record<string, string>,
    animationClass: "animate-frame-neon",
  },
  "frame-geometria": {
    id: "frame-geometria", label: "Moldura Geometria", rarity: "common",
    style: { border: "2px dashed rgba(148,163,184,0.6)", borderRadius: "1rem", outline: "2px dashed rgba(148,163,184,0.25)", outlineOffset: "3px" },
  },
  "frame-madeira": {
    id: "frame-madeira", label: "Moldura Madeira", rarity: "common",
    style: { border: "3px solid #b45309", borderRadius: "1rem", boxShadow: "inset 0 0 0 1px rgba(251,191,36,0.35)" },
  },
  "frame-fire": {
    id: "frame-fire", label: "Moldura Fogo", rarity: "rare",
    style: { border: "2px solid #f97316", borderRadius: "1rem", boxShadow: "0 0 16px rgba(249,115,22,0.5)", "--frame-glow": "rgba(249,115,22,0.5)" } as Record<string, string>,
    animationClass: "animate-frame-pulse",
  },
  "frame-ice": {
    id: "frame-ice", label: "Moldura Gelo", rarity: "rare",
    style: { border: "2px solid #93c5fd", borderRadius: "1rem", boxShadow: "0 0 12px rgba(147,197,253,0.5)", "--frame-glow": "rgba(147,197,253,0.5)" } as Record<string, string>,
    animationClass: "animate-frame-pulse",
  },
  "frame-cyber": {
    id: "frame-cyber", label: "Moldura Cyber", rarity: "legendary",
    style: { border: "2px solid #a855f7", borderRadius: "1rem", boxShadow: "0 0 18px rgba(168,85,247,0.55)", "--frame-glow": "rgba(168,85,247,0.55)" } as Record<string, string>,
    animationClass: "animate-frame-neon",
  },
  "frame-crystal": {
    id: "frame-crystal", label: "Moldura Cristal", rarity: "rare",
    style: { border: "2px solid rgba(255,255,255,0.4)", borderRadius: "1rem", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2), 0 0 12px rgba(255,255,255,0.15)", "--frame-glow": "rgba(255,255,255,0.2)" } as Record<string, string>,
    animationClass: "animate-frame-shimmer",
  },
  "frame-flower": {
    id: "frame-flower", label: "Moldura Flores", rarity: "common",
    style: { border: "2px solid #f472b6", borderRadius: "1rem", boxShadow: "0 0 10px rgba(244,114,182,0.4)" },
  },
  "frame-shadow": {
    id: "frame-shadow", label: "Moldura Sombra", rarity: "common",
    style: { border: "2px solid #334155", borderRadius: "1rem", boxShadow: "inset 0 0 0 1px rgba(51,65,85,0.5), 0 0 14px rgba(0,0,0,0.6)" },
  },
  "frame-gold": {
    id: "frame-gold", label: "Moldura Ouro", rarity: "legendary",
    style: { border: "2px solid #eab308", borderRadius: "1rem", boxShadow: "0 0 18px rgba(234,179,8,0.5)", "--frame-glow": "rgba(234,179,8,0.5)" } as Record<string, string>,
    animationClass: "animate-frame-rotate",
  },
  "frame-rainbow": {
    id: "frame-rainbow", label: "Moldura Arco-Íris", rarity: "rare",
    style: { border: "2px solid #a78bfa", borderRadius: "1rem", boxShadow: "0 0 12px rgba(167,139,250,0.4)", "--frame-glow": "rgba(167,139,250,0.4)" } as Record<string, string>,
    animationClass: "animate-frame-shimmer",
  },
  "frame-dark": {
    id: "frame-dark", label: "Moldura Dark", rarity: "common",
    style: { border: "2px solid #1e293b", borderRadius: "1rem", boxShadow: "inset 0 0 0 1px rgba(30,41,59,0.6)" },
  },
  "frame-light": {
    id: "frame-light", label: "Moldura Luz", rarity: "common",
    style: { border: "2px solid #e2e8f0", borderRadius: "1rem", boxShadow: "0 0 14px rgba(226,232,240,0.3)" },
  },
  "frame-volcanic": {
    id: "frame-volcanic", label: "Moldura Vulcânica", rarity: "rare",
    style: { border: "2px solid #dc2626", borderRadius: "1rem", boxShadow: "0 0 16px rgba(220,38,38,0.5)", "--frame-glow": "rgba(220,38,38,0.5)" } as Record<string, string>,
    animationClass: "animate-frame-pulse",
  },
  "frame-neon-purple": {
    id: "frame-neon-purple", label: "Moldura Neon Roxo", rarity: "rare",
    style: { border: "2px solid #a855f7", borderRadius: "1rem", boxShadow: "0 0 16px rgba(168,85,247,0.5)", "--frame-glow": "rgba(168,85,247,0.5)" } as Record<string, string>,
    animationClass: "animate-frame-neon",
  },
  "frame-electric-blue": {
    id: "frame-electric-blue", label: "Moldura Elétrica Azul", rarity: "rare",
    style: { border: "2px solid #3b82f6", borderRadius: "1rem", boxShadow: "0 0 16px rgba(59,130,246,0.5)", "--frame-glow": "rgba(59,130,246,0.5)" } as Record<string, string>,
    animationClass: "animate-frame-pulse",
  },
  "frame-royal": {
    id: "frame-royal", label: "Moldura Real", rarity: "legendary",
    style: { border: "2px solid #d97706", borderRadius: "1rem", boxShadow: "0 0 20px rgba(217,119,6,0.5)", "--frame-glow": "rgba(217,119,6,0.5)" } as Record<string, string>,
    animationClass: "animate-frame-rotate",
  },
  "frame-mint": {
    id: "frame-mint", label: "Moldura Menta", rarity: "common",
    style: { border: "2px solid #34d399", borderRadius: "1rem", boxShadow: "0 0 10px rgba(52,211,153,0.35)" },
  },
  "frame-rain": {
    id: "frame-rain", label: "Moldura Chuva", rarity: "rare",
    style: { border: "2px solid #60a5fa", borderRadius: "1rem", boxShadow: "0 0 14px rgba(96,165,250,0.4)", "--frame-glow": "rgba(96,165,250,0.4)" } as Record<string, string>,
    animationClass: "animate-frame-rain",
  },
  "frame-forest": {
    id: "frame-forest", label: "Moldura Floresta", rarity: "rare",
    style: { border: "2px solid #22c55e", borderRadius: "1rem", boxShadow: "0 0 14px rgba(34,197,94,0.4)", "--frame-glow": "rgba(34,197,94,0.4)" } as Record<string, string>,
    animationClass: "animate-frame-forest",
  },
};

export type ProfileBackgroundDef = {
  id: string;
  label: string;
  rarity: AvatarBorderRarity;
  style: Record<string, string>;
  animationClass?: string;
};

export const PROFILE_BACKGROUNDS: Record<string, ProfileBackgroundDef> = {
  "bg-galaxy": {
    id: "bg-galaxy", label: "Fundo Galaxy", rarity: "rare",
    style: { background: "radial-gradient(ellipse at 20% 0%, rgba(88,101,242,0.3) 0%, rgba(88,101,242,0.05) 50%, #1a1b1e 80%)" },
    animationClass: "animate-bg-glow",
  },
  "bg-sunset-gradient": {
    id: "bg-sunset-gradient", label: "Fundo Sunset", rarity: "common",
    style: { background: "radial-gradient(ellipse at 30% 10%, rgba(235,69,158,0.25) 0%, rgba(254,231,92,0.08) 50%, #1a1b1e 80%)" },
  },
  "bg-matrix": {
    id: "bg-matrix", label: "Fundo Matrix", rarity: "rare",
    style: { background: "radial-gradient(ellipse at 50% 0%, rgba(87,242,135,0.15) 0%, rgba(87,242,135,0.03) 50%, #1a1b1e 80%)" },
    animationClass: "animate-bg-glow",
  },
  "bg-aurora": {
    id: "bg-aurora", label: "Fundo Aurora", rarity: "rare",
    style: { background: "radial-gradient(ellipse at 25% 0%, rgba(87,242,135,0.2) 0%, rgba(88,101,242,0.15) 40%, #1a1b1e 75%)" },
    animationClass: "animate-bg-aurora",
  },
  "bg-rain": {
    id: "bg-rain", label: "Fundo Chuva", rarity: "common",
    style: { background: "radial-gradient(ellipse at 60% 10%, rgba(88,101,242,0.12) 0%, rgba(88,101,242,0.02) 60%, #1a1b1e 90%)" },
  },
  "bg-beach": {
    id: "bg-beach", label: "Fundo Praia", rarity: "common",
    style: { background: "radial-gradient(ellipse at 40% 0%, rgba(254,231,92,0.15) 0%, rgba(87,242,135,0.05) 50%, #1a1b1e 80%)" },
  },
  "bg-mountain": {
    id: "bg-mountain", label: "Fundo Montanha", rarity: "rare",
    style: { background: "radial-gradient(ellipse at 50% 0%, rgba(139,145,160,0.2) 0%, rgba(88,101,242,0.08) 50%, #1a1b1e 80%)" },
    animationClass: "animate-bg-breathe",
  },
  "bg-city": {
    id: "bg-city", label: "Fundo Cidade", rarity: "common",
    style: { background: "radial-gradient(ellipse at 50% 100%, rgba(88,101,242,0.15) 0%, rgba(30,31,34,0.5) 50%, #1a1b1e 90%)" },
  },
  "bg-forest": {
    id: "bg-forest", label: "Fundo Floresta", rarity: "common",
    style: { background: "radial-gradient(ellipse at 30% 0%, rgba(87,242,135,0.15) 0%, rgba(34,197,94,0.05) 50%, #1a1b1e 80%)" },
  },
  "bg-space": {
    id: "bg-space", label: "Fundo Espaço", rarity: "rare",
    style: { background: "radial-gradient(ellipse at 40% 20%, rgba(88,101,242,0.25) 0%, rgba(139,92,246,0.1) 40%, #1a1b1e 75%)" },
    animationClass: "animate-bg-shift",
  },
  "bg-electric": {
    id: "bg-electric", label: "Fundo Elétrico", rarity: "rare",
    style: { background: "radial-gradient(ellipse at 35% 10%, rgba(88,101,242,0.3) 0%, rgba(59,130,246,0.08) 50%, #1a1b1e 80%)" },
    animationClass: "animate-bg-glow",
  },
  "bg-desert": {
    id: "bg-desert", label: "Fundo Deserto", rarity: "common",
    style: { background: "radial-gradient(ellipse at 50% 10%, rgba(254,231,92,0.12) 0%, rgba(245,158,11,0.05) 50%, #1a1b1e 80%)" },
  },
  "bg-underwater": {
    id: "bg-underwater", label: "Fundo Subaquático", rarity: "rare",
    style: { background: "radial-gradient(ellipse at 45% 0%, rgba(6,182,212,0.2) 0%, rgba(88,101,242,0.08) 50%, #1a1b1e 80%)" },
    animationClass: "animate-bg-breathe",
  },
};

export function resolveProfileFrame(frameId: string | null | undefined) {
  if (!frameId) return null;
  return PROFILE_FRAMES[frameId] ?? null;
}

export function getProfileFrameStyle(frameId: string | null | undefined): Record<string, string> | null {
  return resolveProfileFrame(frameId)?.style ?? null;
}

export function resolveProfileBackground(backgroundId: string | null | undefined) {
  if (!backgroundId) return null;
  return PROFILE_BACKGROUNDS[backgroundId] ?? null;
}

export function getProfileBackgroundStyle(
  backgroundId: string | null | undefined,
): Record<string, string> | null {
  return resolveProfileBackground(backgroundId)?.style ?? null;
}

export { DEFAULT_SIDEBAR, DEFAULT_SURFACE };
