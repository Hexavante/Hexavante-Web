"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Coins,
  Flame,
  Target,
  Trophy,
  Zap,
  Clock,
  TrendingUp,
  Brain,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { XpProgressBar } from "@/components/gamification/xp-progress-bar";
import { StatCard } from "@/components/stats/stat-card";
import { XpTimelineChart } from "@/components/stats/xp-timeline-chart";
import { SkillsRadarChart } from "@/components/stats/skills-radar-chart";
import { ActivityHeatmap } from "@/components/stats/activity-heatmap";
import { CategoryDistributionChart } from "@/components/stats/category-distribution-chart";
import { WeeklyProgressChart } from "@/components/stats/weekly-progress-chart";
import { cn } from "@/lib/cn";
import type { PersonalStats } from "@/services/personal-stats.service";
import type { PersonalStatsCharts } from "@/services/personal-stats.service";

type Props = {
  stats: PersonalStats;
  charts?: PersonalStatsCharts;
  variant?: "full" | "compact";
  showHeader?: boolean;
  tourId?: string;
};

const TABS = [
  { id: "overview", label: "Visão geral", icon: BarChart3 },
  { id: "progress", label: "Progresso", icon: TrendingUp },
  { id: "skills", label: "Habilidades", icon: Brain },
  { id: "activity", label: "Atividade", icon: Calendar },
  { id: "distribution", label: "Distribuição", icon: Award },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PersonalStatsView({
  stats,
  charts,
  variant = "full",
  showHeader = true,
  tourId,
}: Props) {
  const compact = variant === "compact";
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [mounted, setMounted] = useState(false);

  // Garante hidratação completa antes de renderizar gráficos client-only
  useEffect(() => {
    setMounted(true);
  }, []);

  if (compact) {
    return renderCompactView(stats);
  }

  return (
    <section data-tour={tourId} className="space-y-6">
      {showHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-3 ">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 hx-accent-text" />
              <h2 className="text-lg font-bold text-white">Suas estatísticas</h2>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Acompanhe XP, estudos, simulados e conquistas em detalhe
            </p>
          </div>
          <Link
            href="/estatisticas"
            className="hidden text-sm font-semibold hx-accent-link sm:inline-flex sm:items-center sm:gap-1"
          >
            Ver página completa →
          </Link>
        </div>
      ) : null}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-[var(--surface)] rounded-xl p-1 border border-white/5 ">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === tab.id
                ? "bg-[hsl(var(--sidebar-highlight))/0.15] text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className=" ">
        {activeTab === "overview" && mounted && charts && renderOverviewTab(stats, charts)}
        {activeTab === "progress" && mounted && charts && renderProgressTab(stats, charts)}
        {activeTab === "skills" && mounted && charts && renderSkillsTab(stats, charts)}
        {activeTab === "activity" && mounted && charts && renderActivityTab(stats, charts)}
        {activeTab === "distribution" && mounted && charts && renderDistributionTab(stats, charts)}
        {!mounted && (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-[hsl(var(--sidebar-highlight))] border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    </section>
  );
}

function renderCompactView(stats: PersonalStats) {
  return (
    <section className="space-y-4">
      <Card padding="md" className="space-y-6 border-[hsl(var(--sidebar-highlight)/0.15)] bg-gradient-to-br from-[hsl(var(--sidebar-highlight)/0.06)] via-transparent to-[hsl(var(--sidebar-accent)/0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[hsl(var(--sidebar-border))] pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="sky">Nível {stats.level}</Badge>
              {stats.rank && (
                <Badge variant="default">
                  <Trophy className="h-3.5 w-3.5" />#{stats.rank} no ranking
                </Badge>
              )}
              {stats.studyStreakDays > 0 && (
                <Badge variant="emerald">
                  <Flame className="h-3.5 w-3.5" />
                  {stats.studyStreakDays} dias seguidos
                </Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {stats.totalXp.toLocaleString("pt-BR")} XP total ·{" "}
              {stats.xpThisWeek.toLocaleString("pt-BR")} XP esta semana
            </p>
          </div>
          <div className="min-w-[200px] flex-1 sm:max-w-xs">
            <XpProgressBar
              level={stats.level}
              currentXp={Math.round((stats.progressPercent / 100) * stats.xpToNextLevel)}
              xpToNextLevel={stats.xpToNextLevel}
              progressPercent={stats.progressPercent}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={BookOpen} label="Aulas concluídas" value={stats.lessonsCompleted} />
          <StatCard
            icon={Award}
            label="Cursos concluídos"
            value={stats.coursesCompleted}
            sub={`${stats.coursesEnrolled} matriculados`}
            tone="text-teal-300"
          />
          <StatCard
            icon={Target}
            label="Simulados"
            value={stats.examsTaken}
            sub={
              stats.averageExamScore != null
                ? `Média ${Math.round(stats.averageExamScore)}% · ${stats.examsPassed} aprovados`
                : `${stats.examsPassed} aprovados`
            }
            tone="text-amber-300"
          />
          <StatCard
            icon={Coins}
            label="Moedas"
            value={stats.coins.toLocaleString("pt-BR")}
            sub={`${stats.certificatesCount} certificados`}
            tone="text-yellow-300"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={Zap}
            label="Conquistas"
            value={`${stats.achievementsUnlocked}/${stats.achievementsTotal}`}
            sub="Desbloqueadas no perfil"
            tone="text-violet-300"
          />
          <StatCard
            icon={Calendar}
            label="Dias ativos"
            value={stats.activeDays}
            sub="Com atividade registrada"
            tone="text-slate-300"
          />
          <StatCard
            icon={Flame}
            label="Sequência"
            value={stats.studyStreakDays > 0 ? `${stats.studyStreakDays} dias` : "—"}
            sub="Estudando em dias consecutivos"
            tone="text-orange-300"
          />
        </div>
      </Card>
    </section>
  );
}

function renderOverviewTab(stats: PersonalStats, charts: PersonalStatsCharts) {
  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Trophy}
          label="Nível"
          value={stats.level}
          sub={`${stats.totalXp.toLocaleString("pt-BR")} XP total`}
          tone="hx-accent-text"
        />
        <StatCard
          icon={TrendingUp}
          label="XP esta semana"
          value={stats.xpThisWeek.toLocaleString("pt-BR")}
          sub={`${stats.xpToNextLevel} para próximo nível`}
          tone="text-sky-300"
        />
        <StatCard
          icon={Flame}
          label="Sequência"
          value={stats.studyStreakDays > 0 ? `${stats.studyStreakDays} dias` : "—"}
          sub={stats.studyStreakDays > 0 ? "Continue assim!" : "Comece hoje"}
          tone="text-orange-300"
        />
        <StatCard
          icon={Coins}
          label="Moedas"
          value={stats.coins.toLocaleString("pt-BR")}
          sub={`${stats.certificatesCount} certificados`}
          tone="text-yellow-300"
        />
      </div>

      {/* XP Progress */}
      <Card padding="md" className="border-[hsl(var(--sidebar-highlight)/0.15)] bg-gradient-to-br from-[hsl(var(--sidebar-highlight)/0.06)] via-transparent to-[hsl(var(--sidebar-accent)/0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[hsl(var(--sidebar-border))] pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="sky">Nível {stats.level}</Badge>
              {stats.rank && (
                <Badge variant="default">
                  <Trophy className="h-3.5 w-3.5" />#{stats.rank} no ranking
                </Badge>
              )}
              {stats.studyStreakDays > 0 && (
                <Badge variant="emerald">
                  <Flame className="h-3.5 w-3.5" />
                  {stats.studyStreakDays} dias seguidos
                </Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {stats.totalXp.toLocaleString("pt-BR")} XP total ·{" "}
              {stats.xpThisWeek.toLocaleString("pt-BR")} XP esta semana
            </p>
          </div>
          <div className="min-w-[200px] flex-1 sm:max-w-xs">
            <XpProgressBar
              level={stats.level}
              currentXp={Math.round((stats.progressPercent / 100) * stats.xpToNextLevel)}
              xpToNextLevel={stats.xpToNextLevel}
              progressPercent={stats.progressPercent}
            />
          </div>
        </div>

        {/* XP Timeline Chart */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-white">Evolução de XP (últimos 90 dias)</h3>
          <XpTimelineChart data={charts.xpTimeline} showCumulative={true} />
        </div>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Aulas concluídas" value={stats.lessonsCompleted} />
        <StatCard
          icon={Award}
          label="Cursos concluídos"
          value={stats.coursesCompleted}
          sub={`${stats.coursesEnrolled} matriculados`}
          tone="text-teal-300"
        />
        <StatCard
          icon={Target}
          label="Simulados"
          value={stats.examsTaken}
          sub={
            stats.averageExamScore != null
              ? `Média ${Math.round(stats.averageExamScore)}% · ${stats.examsPassed} aprovados`
              : `${stats.examsPassed} aprovados`
          }
          tone="text-amber-300"
        />
        <StatCard
          icon={Zap}
          label="Conquistas"
          value={`${stats.achievementsUnlocked}/${stats.achievementsTotal}`}
          sub="Desbloqueadas no perfil"
          tone="text-violet-300"
        />
      </div>
    </div>
  );
}

function renderProgressTab(stats: PersonalStats, charts: PersonalStatsCharts) {
  return (
    <div className="space-y-6">
      {/* Weekly Progress Chart */}
      <Card padding="md">
        <h3 className="mb-4 text-sm font-semibold text-white">Progresso semanal (últimas 12 semanas)</h3>
        <WeeklyProgressChart data={charts.weeklyProgress} />
      </Card>

      {/* Study Time Estimate */}
      <Card padding="md" className="bg-gradient-to-br from-amber-400/10 via-transparent to-orange-400/5 border-amber-400/20">
        <div className="flex items-center gap-3">
          <span className="hx-icon-box bg-amber-400/20 text-amber-300">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Tempo estimado de estudo</p>
            <p className="mt-1 text-3xl font-bold text-amber-300">
              {formatMinutes(charts.studyTimeEstimate)}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Baseado em {stats.lessonsCompleted} aulas ({stats.lessonsCompleted * 15} min) e{" "}
              {stats.examsTaken} simulados ({stats.examsTaken * 30} min)
            </p>
          </div>
        </div>
      </Card>

      {/* Additional metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="Dias ativos (90d)"
          value={stats.activeDays}
          sub="Com atividade registrada"
          tone="text-slate-300"
        />
        <StatCard
          icon={Flame}
          label="Maior sequência"
          value={stats.studyStreakDays > 0 ? `${stats.studyStreakDays} dias` : "—"}
          sub="Dias consecutivos estudando"
          tone="text-orange-300"
        />
        <StatCard
          icon={Target}
          label="Taxa de aprovação"
          value={stats.examsTaken > 0 ? `${Math.round((stats.examsPassed / stats.examsTaken) * 100)}%` : "—"}
          sub={`${stats.examsPassed}/${stats.examsTaken} simulados`}
          tone="text-emerald-300"
        />
        <StatCard
          icon={Award}
          label="Certificados"
          value={stats.certificatesCount}
          sub="Conquistas oficiais"
          tone="text-yellow-300"
        />
      </div>
    </div>
  );
}

function renderSkillsTab(stats: PersonalStats, charts: PersonalStatsCharts) {
  return (
    <div className="space-y-6">
      {/* Skills Radar */}
      <Card padding="md">
        <h3 className="mb-4 text-sm font-semibold text-white">Perfil de habilidades</h3>
        <SkillsRadarChart data={charts.skillRadar} />
      </Card>

      {/* Skill breakdown */}
      <Card padding="md">
        <h3 className="mb-4 text-sm font-semibold text-white">Detalhamento</h3>
        <div className="space-y-3">
          {charts.skillRadar.map((skill) => (
            <div key={skill.skill} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-slate-300">{skill.skill}</div>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r transition-all duration-1000"
                  style={{
                    width: `${skill.maxValue > 0 ? (skill.value / skill.maxValue) * 100 : 0}%`,
                    backgroundColor: skill.color,
                  }}
                />
              </div>
              <div className="w-20 text-right text-sm font-semibold text-white">
                {skill.value}/{skill.maxValue}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function renderActivityTab(stats: PersonalStats, charts: PersonalStatsCharts) {
  return (
    <div className="space-y-6">
      {/* Activity Heatmap */}
      <Card padding="md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Mapa de calor de atividade (últimas 12 semanas)</h3>
          <Badge variant="sky" className="text-xs">
            {Object.values(charts.activityHeatmap).reduce((a, b) => a + b, 0)} atividades no período
          </Badge>
        </div>
        <ActivityHeatmap activityData={charts.activityHeatmap} weeks={12} />
      </Card>

      {/* Activity summary */}
      <Card padding="md">
        <h3 className="mb-4 text-sm font-semibold text-white">Resumo de atividade</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={Zap}
            label="XP esta semana"
            value={stats.xpThisWeek.toLocaleString("pt-BR")}
            sub="Últimos 7 dias"
            tone="text-sky-300"
          />
          <StatCard
            icon={Calendar}
            label="Dias ativos (90d)"
            value={stats.activeDays}
            sub="Dos últimos 90 dias"
            tone="text-slate-300"
          />
          <StatCard
            icon={Flame}
            label="Sequência atual"
            value={stats.studyStreakDays > 0 ? `${stats.studyStreakDays} dias` : "—"}
            sub="Dias consecutivos"
            tone="text-orange-300"
          />
        </div>
      </Card>
    </div>
  );
}

function renderDistributionTab(stats: PersonalStats, charts: PersonalStatsCharts) {
  const categoryTotal = charts.categoryDistribution.reduce(
    (sum, d) => sum + (Number.isFinite(d.value) ? d.value : 0),
    0,
  );
  const scoreDistribution = charts.examScoreDistribution ?? [];
  const scoreTotal = scoreDistribution.reduce(
    (sum, d) => sum + (Number.isFinite(d.value) ? d.value : 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Category Distribution */}
      <Card padding="md">
        <h3 className="mb-4 text-sm font-semibold text-white">Distribuição por categoria</h3>
        {categoryTotal > 0 ? (
          <CategoryDistributionChart data={charts.categoryDistribution} />
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">
            Sem distribuição suficiente — conclua aulas para ver sua distribuição por categoria.
          </p>
        )}
      </Card>

      {/* Exam Performance */}
      <Card padding="md">
        <h3 className="mb-4 text-sm font-semibold text-white">Desempenho em simulados</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={Target}
            label="Total"
            value={stats.examsTaken}
            sub="Simulados realizados"
            tone="text-amber-300"
          />
          <StatCard
            icon={Award}
            label="Aprovados"
            value={stats.examsPassed}
            sub={stats.examsTaken > 0 ? `${Math.round((stats.examsPassed / stats.examsTaken) * 100)}% taxa` : "—"}
            tone="text-emerald-300"
          />
          <StatCard
            icon={TrendingUp}
            label="Média"
            value={stats.averageExamScore != null ? `${Math.round(stats.averageExamScore)}%` : "—"}
            sub="Pontuação média"
            tone="text-sky-300"
          />
        </div>

        {stats.examsTaken > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Distribuição de notas</h4>
            {scoreTotal > 0 ? (
              <CategoryDistributionChart
                data={scoreDistribution}
                valueKey="value"
              />
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">
                Sem distribuição suficiente — faça mais simulados para ver a distribuição das suas notas.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  return `${minutes}min`;
}