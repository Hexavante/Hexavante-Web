"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpen, History, LayoutDashboard, Target } from "lucide-react";
import { cn } from "@/lib/cn";

type Tab = {
  id: string;
  label: string;
  icon: React.ElementType;
};

const TABS: Tab[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "cursos", label: "Cursos", icon: BookOpen },
  { id: "simulados", label: "Simulados", icon: Target },
  { id: "atividades", label: "Atividades", icon: History },
];

type Props = {
  activeTab: string;
};

export function HistoricoTabs({ activeTab }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(tabId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("aba", tabId);
    // Ao trocar de aba, reseatar a página
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  }

  return (
    <nav
      role="tablist"
      aria-label="Abas do histórico"
      className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <Link
            key={tab.id}
            href={buildHref(tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            className={cn(
              "inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              isActive
                ? "bg-sky-500/20 text-sky-200"
                : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
