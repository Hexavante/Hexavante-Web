import Link from "next/link";
import {
  Award,
  BookOpen,
  Calendar,
  Flame,
  History,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientRelativeTime } from "@/components/ui/client-relative-time";
import type { HistoricoOverview, RecentActivityItem } from "@/services/historico.service";

type Props = {
  data: HistoricoOverview;
};

const ACTIVITY_ICONS: Record<RecentActivityItem["type"], React.ElementType> = {
  lesson: BookOpen,
  exam: Target,
  certificate: Award,
  xp: Zap,
};

const ACTIVITY_COLORS: Record<RecentActivityItem["type"], string> = {
  lesson: "text-sky-400",
  exam: "text-amber-400",
  certificate: "text-emerald-400",
  xp: "text-violet-400",
};

function MetricCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  highlight?: string;
}) {
  return (
    <Card padding="sm" className="flex items-center gap-4">
      <span className="hx-icon-box shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`mt-0.5 text-xl font-bold ${highlight ?? "text-white"}`}>{value}</p>
      </div>
    </Card>
  );
}

export function OverviewTab({ data }: Props) {
  const studyHours =
    data.studyTimeMinutes >= 60
      ? `${Math.floor(data.studyTimeMinutes / 60)}h ${data.studyTimeMinutes % 60}min`
      : `${data.studyTimeMinutes}min`;

  return (
    <div id="panel-overview" role="tabpanel" className="space-y-6">
      {/* Métricas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard icon={BookOpen} label="Aulas concluídas" value={data.totalLessons} />
        <MetricCard
          icon={Award}
          label="Cursos concluídos"
          value={`${data.completedCourses} / ${data.totalCourses}`}
          highlight="text-emerald-300"
        />
        <MetricCard
          icon={Target}
          label="Simulados realizados"
          value={data.totalExams}
        />
        <MetricCard
          icon={Star}
          label="Média nos simulados"
          value={data.totalExams > 0 ? `${data.averageExamScore}%` : "—"}
          highlight={
            data.averageExamScore >= 70
              ? "text-emerald-300"
              : data.averageExamScore > 0
                ? "text-amber-300"
                : "text-slate-400"
          }
        />
        <MetricCard
          icon={Zap}
          label="XP total ganho"
          value={data.totalXpEarned.toLocaleString("pt-BR")}
          highlight="text-violet-300"
        />
        <MetricCard
          icon={Calendar}
          label="Dias de estudo"
          value={data.activeDays}
          highlight="text-sky-300"
        />
        <MetricCard icon={Flame} label="Tempo de estudo" value={studyHours} />
        <MetricCard
          icon={Target}
          label="Aprovações"
          value={
            data.totalExams > 0
              ? `${data.passedExams} / ${data.totalExams}`
              : "—"
          }
          highlight="text-emerald-300"
        />
      </div>

      {/* Atividades recentes */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-200">Atividades recentes</h2>

        {data.recentActivity.length === 0 ? (
          <EmptyState
            icon={History}
            title="Nenhuma atividade registrada ainda."
            description="Comece a estudar para ver seu progresso aparecer aqui."
          />
        ) : (
          <ul className="space-y-2">
            {data.recentActivity.map((item, i) => {
              const Icon = ACTIVITY_ICONS[item.type];
              const colorClass = ACTIVITY_COLORS[item.type];
              const content = (
                <>
                  <span className={`shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
                    {item.label}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    <ClientRelativeTime date={item.date} />
                  </span>
                </>
              );

              return (
                <li
                  key={`${item.type}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                >
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex w-full items-center gap-3 hover:opacity-80"
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
