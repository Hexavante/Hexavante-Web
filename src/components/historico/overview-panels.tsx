import Link from "next/link";
import { BookOpen, ChartPie } from "lucide-react";
import { AppLink } from "@/components/ui/app-link";
import { Card } from "@/components/ui/card";
import type {
  HistoricoCursoItem,
  ScoreDistributionBucket,
} from "@/services/historico.service";

const BUCKET_BAR_CLASSES = [
  "bg-red-400",
  "bg-amber-400",
  "bg-sky-400",
  "bg-emerald-400",
];

/** Distribuição das notas dos simulados por faixa — dados reais do overview. */
export function DistribuicaoResultadosPanel({
  distribution,
  total,
}: {
  distribution: ScoreDistributionBucket[];
  total: number;
}) {
  return (
    <Card padding="md">
      <div className="mb-1 flex items-center gap-2">
        <ChartPie className="h-4 w-4 text-teal-300" aria-hidden />
        <h2 className="font-semibold text-white">Distribuição das notas</h2>
      </div>
      <p className="mb-4 text-sm text-slate-400">
        {total === 0
          ? "Faça um simulado para ver a distribuição das suas notas aqui."
          : `${total} ${total === 1 ? "tentativa finalizada" : "tentativas finalizadas"}`}
      </p>

      {total === 0 ? (
        <AppLink href="/simulados" className="text-sm">
          Ver simulados →
        </AppLink>
      ) : (
        <ul className="space-y-3">
          {distribution.map((bucket, index) => {
            const pct = total > 0 ? Math.round((bucket.count / total) * 100) : 0;
            return (
              <li key={bucket.faixa}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-300">{bucket.faixa}</span>
                  <span className="font-semibold text-slate-200">
                    {bucket.count} <span className="font-normal text-slate-500">({pct}%)</span>
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${bucket.count} tentativas na faixa ${bucket.faixa}`}
                >
                  <div
                    className={`h-full rounded-full ${BUCKET_BAR_CLASSES[index % BUCKET_BAR_CLASSES.length]}`}
                    style={{ width: `${Math.max(bucket.count > 0 ? pct : 0, bucket.count > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/** Cursos em andamento com maior progresso — dados reais via getHistoricoCursos. */
export function CursosProgressoPanel({ items }: { items: HistoricoCursoItem[] }) {
  return (
    <Card padding="md">
      <div className="mb-1 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-sky-300" aria-hidden />
        <h2 className="font-semibold text-white">Cursos em andamento</h2>
      </div>
      <p className="mb-4 text-sm text-slate-400">
        {items.length === 0
          ? "Nenhum curso em andamento no momento."
          : "Continue de onde parou."}
      </p>

      {items.length === 0 ? (
        <AppLink href="/courses" className="text-sm">
          Explorar cursos →
        </AppLink>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const pct = Math.min(100, Math.max(0, Math.round(item.progress)));
            return (
              <li key={item.id}>
                <Link
                  href={`/courses/${item.course.slug}/learn`}
                  className="block rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 transition-colors hover:border-sky-400/30"
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-medium text-slate-200">
                      {item.course.title}
                    </span>
                    <span className="shrink-0 font-semibold text-sky-300">{pct}%</span>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progresso em ${item.course.title}: ${pct}%`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-teal-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
