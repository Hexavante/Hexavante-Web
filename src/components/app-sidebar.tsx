"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BarChart2,
  BarChart3,
  BookOpen,
  Compass,
  GraduationCap,
  History,
  Radio,
  Settings,
  Shield,
  ShoppingBag,
  Package,
  Target,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { ClientOnly } from "@/components/ui/client-only";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { canModerate, isInstructor } from "@/lib/permissions";
import type { NavSession } from "@/lib/nav-session";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  requiresAuth?: boolean;
  requiresInstructor?: boolean;
  requiresModerator?: boolean;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    id: "home",
    label: "Início",
    items: [{ icon: Compass, label: "Painel", href: "/app" }],
  },
  {
    id: "study",
    label: "Estudos",
    items: [
      { icon: BookOpen, label: "Cursos", href: "/courses" },
      { icon: Video, label: "Tutoriais", href: "/tutorials" },
      { icon: Target, label: "Simulados", href: "/simulados" },
      { icon: BarChart3, label: "Estatísticas", href: "/estatisticas", requiresAuth: true },
      { icon: ShoppingBag, label: "Loja", href: "/shop", requiresAuth: true },
      { icon: Package, label: "Inventário", href: "/inventario", requiresAuth: true },
    ],
  },
  {
    id: "social",
    label: "Social",
    items: [
      { icon: Radio, label: "Ao vivo", href: "/live-rooms", requiresAuth: true },
      { icon: BarChart2, label: "Ranking", href: "/ranking" },
      { icon: Award, label: "Certificados", href: "/certificados", requiresAuth: true },
      {
        icon: History,
        label: "Histórico de simulados",
        href: "/simulados/historico",
        requiresAuth: true,
      },
    ],
  },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { icon: Settings, label: "Gerenciar", href: "/instructor/gerenciar", requiresInstructor: true },
  { icon: Shield, label: "Moderação", href: "https://painel.hexavante.com.br", requiresModerator: true },
];

type Props = {
  session: NavSession;
};

function isItemVisible(item: NavItem, session: NavSession): boolean {
  if (item.requiresModerator && !canModerate(session?.user.roles)) return false;
  if (item.requiresInstructor && !isInstructor(session?.user.roles)) return false;
  return true;
}

function resolveNavHref(item: NavItem, session: NavSession): string {
  if (item.requiresAuth && !session) {
    return `/login?callbackUrl=${encodeURIComponent(item.href)}`;
  }
  return item.href;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app" || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarBrand() {
  return (
    <Link href="/app" className="hx-sidebar-brand group" aria-label="Hexavante - Página inicial">
      <span className="hx-sidebar-brand-mark">
        <Image
          src="/brand/hexavante-logo.png"
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
          priority
          aria-hidden
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-extrabold tracking-tight text-[hsl(var(--sidebar-foreground))] transition group-hover:hx-accent-text">
          HEXAVANTE
        </span>
        <span className="hx-sidebar-brand-subtitle block truncate text-[11px] font-medium">
          Plataforma de estudos
        </span>
      </span>
    </Link>
  );
}

function NavSectionBlock({
  section,
  session,
  pathname,
  sectionIndex,
}: {
  section: NavSection;
  session: NavSession;
  pathname: string;
  sectionIndex: number;
}) {
  const visible = section.items.filter((item) => isItemVisible(item, session));
  if (!visible.length) return null;

  return (
    <SidebarGroup className="px-2 py-1 sidebar-section-animate" style={{ animationDelay: `${0.05 + sectionIndex * 0.12}s` }}>
      <SidebarGroupLabel className="hx-sidebar-group-label">{section.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {visible.map((item, itemIndex) => {
            const href = resolveNavHref(item, session);
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href} className="sidebar-item-animate" style={{ animationDelay: `${0.08 + sectionIndex * 0.12 + itemIndex * 0.05}s` }}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.label}
                  className={cn("hx-sidebar-link", active && "hx-sidebar-link-active")}
                >
                  <Link href={href} title={item.label}>
                    <span className={cn("hx-sidebar-link-icon", active && "hx-sidebar-link-icon-active")}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function SidebarNavSkeleton() {
  return (
    <div className="space-y-4 px-2 py-2">
      {["Início", "Estudos", "Comunidade"].map((label) => (
        <div key={label} className="space-y-2">
          <div className="h-3 w-16 rounded bg-white/5" aria-hidden />
          {Array.from({ length: label === "Estudos" ? 5 : label === "Comunidade" ? 4 : 1 }).map(
            (_, index) => (
              <SidebarMenuSkeleton key={`${label}-${index}`} showIcon />
            ),
          )}
        </div>
      ))}
    </div>
  );
}

function SidebarNav({ session, pathname, accountItems }: { session: NavSession; pathname: string; accountItems: NavItem[] }) {
  const accountSection: NavSection = {
    id: "account",
    label: "Conta",
    items: accountItems,
  };

  return (
    <>
      {NAV_SECTIONS.map((section, index) => (
        <NavSectionBlock key={section.id} section={section} session={session} pathname={pathname} sectionIndex={index} />
      ))}
      {accountItems.length > 0 ? (
        <>
          <SidebarSeparator className="mx-3 bg-sidebar-border/80" />
          <NavSectionBlock section={accountSection} session={session} pathname={pathname} sectionIndex={NAV_SECTIONS.length} />
        </>
      ) : null}
    </>
  );
}

function SidebarUserFooter({ session }: { session: NavSession }) {
  if (!session) {
    return (
      <div className="flex flex-col gap-2">
        <Link href="/login" className="hx-sidebar-auth-btn hx-sidebar-auth-btn-secondary">
          Entrar
        </Link>
        <Link href="/register" className="hx-sidebar-auth-btn hx-sidebar-auth-btn-primary">
          Criar conta
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Link href={session.user.username ? `/perfil/${session.user.username}` : "/perfil"} className="hx-sidebar-profile">
        <Avatar
          src={session.user.image}
          alt={session.user.username ?? session.user.id}
          size="sm"
          borderClassName={session.user.avatarBorderClassName}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">
            {session.user.username ? `@${session.user.username}` : "Meu perfil"}
          </span>
          <span className="block truncate text-xs text-[hsl(var(--sidebar-foreground)/0.5)]">Ver perfil</span>
        </span>
      </Link>
      <Link href="/configuracoes" className="hx-sidebar-settings">
        <Settings className="h-4 w-4" />
        Configurações
      </Link>
    </div>
  );
}

export function AppSidebar({ session }: Props) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  const roles = session?.user.roles;

  const accountItems = useMemo(() => {
    return ACCOUNT_ITEMS.filter((item) => isItemVisible(item, session)).map((item) => {
      if (item.label === "Gerenciar" && (!session || !isInstructor(roles))) {
        return { ...item, label: "Instrutor", href: "/instructor/apply", requiresInstructor: false, requiresAuth: true };
      }
      return item;
    });
  }, [session, roles]);

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar" className="hx-sidebar-shell">
      <SidebarHeader className="hx-sidebar-header border-b border-sidebar-border px-3 py-3">
        <SidebarBrand />
      </SidebarHeader>

      <SidebarContent className="hx-sidebar-content gap-1 py-2" data-tour="sidebar-nav">
        <ClientOnly fallback={<SidebarNavSkeleton />}>
          <SidebarNav session={session} pathname={pathname} accountItems={accountItems} />
        </ClientOnly>
      </SidebarContent>

      <SidebarFooter className="hx-sidebar-footer mt-auto shrink-0 border-t border-sidebar-border px-3 py-3">
        <SidebarUserFooter session={session} />
      </SidebarFooter>
    </Sidebar>
  );
}
