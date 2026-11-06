import { ProfileIconBadge } from "@/components/profile/profile-icon-badge";
import { ProfileShowcase } from "@/components/profile/profile-showcase";
import { PresenceDot, PRESENCE_META } from "@/components/presence/presence-dot";
import Link from "next/link";
import { Award, Pencil, Settings, Store } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/social/follow-button";
import { ProfileTabs } from "./profile-tabs";
import { resolveProfileBackground, resolveProfileFrame } from "@/lib/cosmetics";
import type { getPublicProfile } from "@/services/public-profile.service";

type ProfileData = NonNullable<Awaited<ReturnType<typeof getPublicProfile>>>;

type Props = {
  profile: ProfileData;
  viewerId?: string;
  viewerUsername?: string | null;
};

export function PublicProfileView({ profile, viewerId, viewerUsername }: Props) {
  const {
    user,
    isOwner,
    isPrivate,
    xp,
    followCounts,
    isFollowing,
    completedCourses,
    cosmetics,
    enrollments,
    activities,
    achievements,
    showcase,
    certificates,
  } = profile;

  if (isPrivate) {
    const isLikelyOwner =
      viewerUsername != null &&
      user.username != null &&
      viewerUsername.toLowerCase() === user.username.toLowerCase();

    return (
      <div className="rounded-xl border border-[hsl(var(--sidebar-border))] bg-[var(--surface-strong)] p-10 text-center">
        <p className="text-lg font-semibold text-white">Este perfil é privado</p>
        <p className="mt-2 text-sm text-slate-400">
          @{user.username} restringiu a visualização do perfil.
        </p>
        {isLikelyOwner && (
          <Link
            href="/configuracoes/perfil"
            className="hx-btn-primary mt-6 inline-flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Editar visibilidade do perfil
          </Link>
        )}
      </div>
    );
  }

  const frame = cosmetics ? resolveProfileFrame(cosmetics.frameId) : null;
  const background = cosmetics ? resolveProfileBackground(cosmetics.profileBackgroundId) : null;
  const frameStyle = frame?.style ?? null;
  const backgroundStyle = background?.style ?? null;
  const cardStyle = frameStyle ?? {};
  const frameAnimationClass = frame?.animationClass ?? "";

  return (
    <>
      <section className={`hx-profile-card relative isolate ${frameAnimationClass}`} style={Object.keys(cardStyle).length ? cardStyle : undefined}>
      {backgroundStyle && <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-35" style={backgroundStyle} />}
        <div className="relative">
          <div
            className="hx-profile-banner min-h-32 sm:min-h-44 bg-[var(--surface-strong)]"
            style={user.bannerUrl ? {
              backgroundImage: `url(${user.bannerUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              minHeight: 180,
            } : undefined}
          />
          {isOwner && (
            <Link
              href="/configuracoes/perfil"
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/80"
            >
              <Pencil className="h-3 w-3" />
              Editar capa
            </Link>
          )}
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[180px_minmax(0,1fr)]">
          <div className="-mt-16 flex flex-col items-center gap-3 lg:items-start">
            <span className="relative inline-block">
              <Avatar
                src={user.avatarUrl}
                alt={user.username ?? ""}
                size="xl"
                borderClassName={cosmetics?.avatarBorderClassName}
              />
              <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-[var(--surface-strong)] p-0.5">
                <PresenceDot status={"presence" in user ? user.presence : "OFFLINE"} size="md" />
              </span>
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-black tracking-tight text-white">{user.fullName}</h1>
                  {"presence" in user && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                      <PresenceDot status={user.presence} size="sm" />
                      {PRESENCE_META[user.presence as keyof typeof PRESENCE_META]?.label ?? user.presence}
                    </span>
                  )}
                  {cosmetics?.profileIconId && (
                    <ProfileIconBadge iconId={cosmetics.profileIconId} />
                  )}
                  {cosmetics?.badgeLabel && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-200">
                      <Award className="h-3.5 w-3.5" />
                      {cosmetics.badgeLabel}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-slate-400">@{user.username}</p>
                {cosmetics?.equippedTitle && (
                  <p className="mt-2 text-sm font-semibold hx-accent-text">{cosmetics.equippedTitle}</p>
                )}
                {cosmetics?.emojiPackEmojis && cosmetics.emojiPackEmojis.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-lg leading-none">
                    {cosmetics.emojiPackEmojis.map((emoji, index) => (
                      <span key={index} aria-hidden>
                        {emoji}
                      </span>
                    ))}
                  </div>
                )}
                {user.bio && (
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">{user.bio}</p>
                )}
                {xp && (
                  <p className="mt-3 text-sm text-slate-400">
                    Nível {xp.level} · {xp.totalXp.toLocaleString("pt-BR")} XP total
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {isOwner ? (
                  <>
                    <Link
                      href="/configuracoes/perfil"
                      className="hx-btn-secondary inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar perfil
                    </Link>
                    <Link
                      href="/configuracoes"
                      className="hx-btn-secondary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
                      aria-label="Configurações"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Link>
                    <Link href="/shop" className="hx-header-stat">
                      <Store className="h-4 w-4 hx-header-stat-icon" />
                      Loja
                    </Link>
                  </>
                ) : viewerId ? (
                  <FollowButton userId={user.id} initialFollowing={isFollowing} />
                ) : (
                  <Link
                    href={`/login?callbackUrl=/perfil/${user.username}`}
                    className="hx-btn-primary"
                  >
                    Entrar para seguir
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--border)] pt-4 text-sm text-slate-300">
              <span>
                <strong className="text-white">{followCounts.followers}</strong> seguidores
              </span>
              <span>
                <strong className="text-white">{followCounts.following}</strong> seguindo
              </span>
              <span>
                <strong className="text-white">{completedCourses}</strong> cursos concluídos
              </span>
              {showcase && showcase.certificatesCount > 0 && (
                <span>
                  <strong className="text-white">{showcase.certificatesCount}</strong> certificados
                </span>
              )}
            </div>

            {showcase && <ProfileShowcase showcase={showcase} />}
          </div>
        </div>
      </section>

      <ProfileTabs
        activities={activities}
        enrollments={enrollments}
        canInteract={Boolean(viewerId)}
        achievements={achievements}
        certificates={certificates}
      />
    </>
  );
}
