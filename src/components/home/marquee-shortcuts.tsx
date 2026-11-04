"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NavigationIcon } from "@/components/brand/navigation-icon";
import { cn } from "@/lib/cn";

type ShortcutItem = {
  href: string;
  label: string;
  iconHref?: string;
};

const QUICK_ACTION_META: Record<
  string,
  { tone: string; iconTone: string }
> = {
  "/courses": {
    tone: "hover:border-[hsl(var(--sidebar-highlight)/0.35)] hover:bg-[hsl(var(--sidebar-highlight)/0.1)]",
    iconTone: "bg-[hsl(var(--sidebar-highlight)/0.15)] hx-accent-text",
  },
  "/simulados": {
    tone: "hover:border-teal-400/35 hover:bg-teal-400/10",
    iconTone: "bg-teal-400/15 text-teal-300",
  },
  "/historico": {
    tone: "hover:border-violet-400/35 hover:bg-violet-400/10",
    iconTone: "bg-violet-400/15 text-violet-300",
  },
  "/anotacoes": {
    tone: "hover:border-emerald-400/35 hover:bg-emerald-400/10",
    iconTone: "bg-emerald-400/15 text-emerald-300",
  },
  "/estatisticas": {
    tone: "hover:border-cyan-400/35 hover:bg-cyan-400/10",
    iconTone: "bg-cyan-400/15 text-cyan-300",
  },
  "/ranking": {
    tone: "hover:border-amber-400/35 hover:bg-amber-400/10",
    iconTone: "bg-amber-400/15 text-amber-300",
  },
  "/certificados": {
    tone: "hover:border-yellow-400/35 hover:bg-yellow-400/10",
    iconTone: "bg-yellow-400/15 text-yellow-300",
  },
  "/live-rooms": {
    tone: "hover:border-rose-400/35 hover:bg-rose-400/10",
    iconTone: "bg-rose-400/15 text-rose-300",
  },
};

const defaultMeta = {
  tone: "hover:border-[hsl(var(--sidebar-highlight)/0.35)] hover:bg-[hsl(var(--sidebar-highlight)/0.1)]",
  iconTone: "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground)/0.72)]",
};

function ShortcutCard({ item }: { item: ShortcutItem }) {
  const meta = QUICK_ACTION_META[item.href] ?? defaultMeta;


  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2.5 rounded-xl border border-[hsl(var(--sidebar-border))] bg-[var(--surface)] px-3 py-2.5 text-sm font-semibold hx-text-body transition shrink-0",
        meta.tone,
      )}
    >
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition group-hover:scale-105",
          meta.iconTone,
        )}
      >
        <NavigationIcon href={item.iconHref ?? item.href} className="h-5 w-5" />
      </span>
      <span className="whitespace-nowrap">{item.label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-[hsl(var(--sidebar-highlight)/0.85)]" />
    </Link>
  );
}

export function MarqueeShortcuts({ items }: { items: ShortcutItem[] }) {
  const duplicated = [...items, ...items];

  return (
    <section className="mt-10" data-tour="marquee-shortcuts">
      <div className="mb-4 flex items-center gap-2 hx-accent-text">
        <p className="text-xs font-bold uppercase tracking-wide">Atalhos rápidos</p>
      </div>
      <div className="marquee-container rounded-xl">
        <div className="marquee-track gap-3">
          {duplicated.map((item, i) => (
            <ShortcutCard key={`${item.href}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
