import {
  Award,
  BarChart3,
  BookOpen,
  Clock,
  Flame,
  GraduationCap,
  Sparkles,
  Trophy,
} from "lucide-react";
import { XpProgressBar } from "@/components/gamification/xp-progress-bar";
import { LeagueBadge } from "@/components/ranking/league-badge";
import { formatStudyDuration } from "@/lib/course-learning";
import type { ProfileShowcase as ProfileShowcaseData } from "@/services/profile-showcase.service";

type Props = {
  showcase: ProfileShowcaseData;
};

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Trophy;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-[hsl(var(--sidebar-border))] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className={`h-4 w-4 ${accent}`} />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

export function ProfileShowcase({ showcase }: Props) {
  const achievementsLabel = `${showcase.achievementsUnlocked}/${showcase.achievementsTotal}`;

  return (
    <section className="mt-6 rounded-xl border border-[hsl(var(--sidebar-border))] bg-[var(--surface)] p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider hx-accent-text">
            Vitrine da jornada
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Cursos, certificados, XP e conquistas em um só lugar.
          </p>
        </div>
        <LeagueBadge league={showcase.league} size="md" />
      </div>

      <XpProgressBar
        level={showcase.level}
        currentXp={showcase.currentXp}
        xpToNextLevel={showcase.xpToNextLevel}
        progressPercent={showcase.progressPercent}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BarChart3}
          label="Ranking global"
          value={showcase.rank ? `#${showcase.rank}` : "—"}
          accent="text-amber-300"
        />
        <StatCard
          icon={Sparkles}
          label="XP total"
          value={showcase.totalXp.toLocaleString("pt-BR")}
          accent="hx-accent-text"
        />
        <StatCard
          icon={Clock}
          label="Tempo estudado"
          value={formatStudyDuration(showcase.studyMinutes)}
          accent="text-teal-300"
        />
        <StatCard
          icon={Flame}
          label="Sequência"
          value={
            showcase.studyStreakDays > 0 ? `${showcase.studyStreakDays} dias` : "—"
          }
          accent="text-orange-300"
        />
        <StatCard
          icon={GraduationCap}
          label="Cursos concluídos"
          value={showcase.coursesCompleted}
          accent="text-emerald-300"
        />
        <StatCard
          icon={Award}
          label="Certificados"
          value={showcase.certificatesCount}
          accent="text-amber-300"
        />
        <StatCard
          icon={Trophy}
          label="Conquistas"
          value={achievementsLabel}
          accent="text-violet-300"
        />
        <StatCard
          icon={BookOpen}
          label="Aulas concluídas"
          value={showcase.lessonsCompleted}
          accent="text-blue-300"
        />
      </div>
    </section>
  );
}
