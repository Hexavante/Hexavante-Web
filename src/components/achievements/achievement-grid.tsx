import {
  Award,
  BookOpen,
  Coins,
  Flame,
  Lock,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { TIER_STYLES } from "@/lib/achievements";
import type { UserAchievementView } from "@/services/achievement.service";

const ICONS = {
  book: BookOpen,
  trophy: Trophy,
  star: Star,
  target: Target,
  coins: Coins,
  users: Users,
  zap: Zap,
  award: Award,
  flame: Flame,
} as const;

type Props = {
  achievements: UserAchievementView[];
  compact?: boolean;
};

export function AchievementGrid({ achievements, compact = false }: Props) {
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  if (achievements.length === 0) {
    return <p className="text-sm text-slate-400">Nenhuma conquista disponível.</p>;
  }

  return (
    <div className="space-y-6">
      {!compact && (
        <p className="text-sm text-slate-400">
          {unlocked.length} de {achievements.length} conquistas desbloqueadas
        </p>
      )}

      <div className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {unlocked.map((achievement) => {
          const Icon = ICONS[achievement.icon as keyof typeof ICONS] ?? Award;
          const tierStyle = TIER_STYLES[achievement.tier as keyof typeof TIER_STYLES];

          return (
            <div
              key={achievement.key}
              className={`rounded-xl border p-4 ${tierStyle}`}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/20">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-white">{achievement.title}</p>
                  <p className="mt-1 text-sm opacity-80">{achievement.description}</p>
                  {achievement.unlockedAt && !compact && (
                    <p className="mt-2 text-xs opacity-60">
                      {new Date(achievement.unlockedAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!compact &&
          locked.map((achievement) => (
            <div
              key={achievement.key}
              className="rounded-xl border border-white/8 bg-white/[0.02] p-4 opacity-60"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/20 text-slate-500">
                  <Lock className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-300">{achievement.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{achievement.description}</p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
