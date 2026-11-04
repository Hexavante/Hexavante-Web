import Link from "next/link";
import { Suspense } from "react";
import { HexavanteLogo } from "@/components/brand/hexavante-logo";
import { HeaderGamificationHud } from "@/components/gamification/header-gamification-hud";
import { HeaderGamificationHudSkeleton } from "@/components/gamification/header-gamification-hud-skeleton";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Avatar } from "@/components/ui/avatar";
import { hasTeachingRole } from "@/lib/permissions";
import { Award, GraduationCap } from "lucide-react";
import type { NavSession } from "@/lib/nav-session";
import { HeaderAuthActions } from "./header-auth-actions";
import { HeaderSignOut } from "./header-sign-out";
import { SearchBar } from "./search-bar";
import { SidebarToggleButton } from "./sidebar-toggle-button";

type Props = {
  session: NavSession;
};

function profileHref(username: string | null | undefined): string {
  return username ? `/perfil/${username}` : "/perfil";
}

export function HeaderBar({ session }: Props) {
  return (
    <header className="hx-header-bar sticky top-0 z-20">
      <div className="flex h-full w-full items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <SidebarToggleButton />

        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link
            href="/app"
            className="hx-header-brand group shrink-0"
            aria-label="Hexavante - Página inicial"
          >
            <HexavanteLogo
              showWordmark
              size="lg"
              className="gap-2 sm:gap-2.5"
              imageClassName="hx-header-logo-glow h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12"
              wordmarkClassName="hx-header-wordmark hidden lg:inline lg:text-[1.35rem]"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <SearchBar />
          </div>
        </div>

        <nav className="flex min-w-0 max-w-full items-center gap-1.5 text-sm sm:gap-2">
          {session?.user ? (
            <>
              {hasTeachingRole(session.user.roles) ? (
                <Link href="/instructor/gerenciar" className="hx-btn-secondary inline-flex items-center gap-2 px-3 py-2" aria-label="Gerenciar conteúdo do professor">
                  <GraduationCap size={18} aria-hidden /><span className="hidden sm:inline">Gerenciar</span>
                </Link>
              ) : <Suspense fallback={<HeaderGamificationHudSkeleton />}>
                <div data-tour="header-gamification" className="flex min-w-0 max-w-full">
                  <HeaderGamificationHud userId={session.user.id} />
                </div>
              </Suspense>}
              <Link
                href="/anotacoes"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
                title="Meu Caderno de Estudos"
                aria-label="Caderno de Estudos"
              >
                <Award className="h-4 w-4 hidden" />
                <span className="sr-only">Caderno</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" />
                  <path d="M2 6h4" />
                  <path d="M2 10h4" />
                  <path d="M2 14h4" />
                  <path d="M2 18h4" />
                  <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
                </svg>
              </Link>
              <NotificationBell />
              <Link
                href={profileHref(session.user.username)}
                className="relative hidden rounded-full transition hover:ring-2 sm:inline-flex hx-header-avatar-ring"
                aria-label={`Perfil de @${session.user.username ?? session.user.id}`}
              >
                <Avatar
                  src={session.user.image}
                  alt={session.user.username ?? session.user.id}
                  size="sm"
                  borderClassName={session.user.avatarBorderClassName}
                />
                {session.user.badgeLabel && (
                  <span
                    className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-black/40 bg-amber-400 text-black"
                    title={session.user.badgeLabel}
                  >
                    <Award className="h-2.5 w-2.5" />
                  </span>
                )}
              </Link>
              <HeaderSignOut />
            </>
          ) : (
            <HeaderAuthActions />
          )}
        </nav>
      </div>
    </header>
  );
}
