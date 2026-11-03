"use client";

import { ProfileIconBadge } from "@/components/profile/profile-icon-badge";
import { Avatar } from "@/components/ui/avatar";
import { Award } from "lucide-react";
import { resolveProfileBackground, resolveProfileFrame } from "@/lib/cosmetics";

type PreviewCosmetics = {
  equippedTitle: string | null;
  avatarBorderClassName: string | null;
  profileIconId: string | null;
  badgeLabel?: string | null;
  frameId?: string | null;
  profileBackgroundId?: string | null;
  emojiPackEmojis?: string[] | null;
};

type Props = {
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
  cosmetics: PreviewCosmetics;
};

export function ShopProfilePreview({ fullName, username, avatarUrl, cosmetics }: Props) {
  const frame = resolveProfileFrame(cosmetics.frameId);
  const background = resolveProfileBackground(cosmetics.profileBackgroundId);
  const frameStyle = frame?.style ?? null;
  const backgroundStyle = background?.style ?? null;
  const cardStyle = frameStyle ?? {};
  const bgAnimationClass = background?.animationClass ?? "";
  const frameAnimationClass = frame?.animationClass ?? "";

  return (
    <section
      className={`hx-panel !p-4 ${frameAnimationClass}`}
      style={Object.keys(cardStyle).length ? cardStyle : undefined}
    >
      {backgroundStyle && <div aria-hidden className={`mb-4 h-20 rounded-xl ${bgAnimationClass}`} style={backgroundStyle} />}
      <p className="text-sm font-semibold hx-text-body">Prévia do perfil</p>
      <p className="mt-1 text-xs hx-text-muted">Veja como sua vitrine aparece para outros.</p>

      <div className="mt-4 flex items-start gap-3">
        <Avatar
          src={avatarUrl}
          alt={username ?? ""}
          size="md"
          borderClassName={cosmetics.avatarBorderClassName}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-bold hx-text-title">{fullName}</p>
            {cosmetics.profileIconId && <ProfileIconBadge iconId={cosmetics.profileIconId} />}
            {cosmetics.badgeLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-200">
                <Award className="h-3.5 w-3.5" />
                {cosmetics.badgeLabel}
              </span>
            )}
          </div>
          <p className="text-sm hx-text-muted">@{username}</p>
          {cosmetics.equippedTitle && (
            <p className="mt-2 inline-flex rounded-full border border-[hsl(var(--sidebar-highlight)/0.28)] bg-[hsl(var(--sidebar-highlight)/0.1)] px-2.5 py-0.5 text-xs font-semibold hx-accent-text">
              {cosmetics.equippedTitle}
            </p>
          )}
          {cosmetics.emojiPackEmojis && cosmetics.emojiPackEmojis.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 text-lg leading-none">
              {cosmetics.emojiPackEmojis.map((emoji, index) => (
                <span key={index} aria-hidden>
                  {emoji}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
