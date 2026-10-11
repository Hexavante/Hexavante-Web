import { auth } from "@/auth";
import { Clock3, Coins, Flame, History, Info, Sparkles, Trophy, Zap } from "lucide-react";
import { redirect } from "next/navigation";
import { LightningCountdown } from "@/components/lightning/lightning-countdown";
import { LightningGame } from "@/components/lightning/lightning-game";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import {
  LIGHTNING_COINS_PER_CORRECT,
  LIGHTNING_TIME_LIMIT_SECONDS,
  LIGHTNING_XP_PER_CORRECT,
  getLightningDailyStatus,
  getLightningQuestions,
  listLightningHistory,
} from "@/services/lightning-challenge.service";
import type { DailyStatus, LightningHistoryEntry } from "@/services/lightning-challenge.service";
import { isPrismaMissingTable } from "@/lib/prisma-errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Desafio Relâmpago | Hexavante",
  description: "5 questões em 60 segundos, 1 vez por dia. Ganhe XP e moedas.",
};

function formatDateBR(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}min ${String(s).padStart(2, "0")}s` : `${s}s`;
}

export default async function DesafioRelampagoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/desafio-relampago");

  let status: DailyStatus;
  let history: LightningHistoryEntry[];
  let migrationPending = false;

  try {
    [status, history] = await Promise.all([
      getLightningDailyStatus(session.user.id),
      listLightningHistory(session.user.id, 10),
    ]);
  } catch (error) {
    if (isPrismaMissingTable(error)) {
      logger.error("LIGHTNING_TABLE_MISSING", error instanceof Error ? error : undefined);
      migrationPending = true;
      status = { played: false, attempt: null };
      history = [];
    } else {
      throw error;
    }
  }

  // Só sorteia questões se ainda não jogou hoje (economiza query e evita
  // expor questões à toa). Retorna [] quando não há elegíveis — estado vazio
  // amigável, sem perguntas fictícias.
  const questions = status.played || migrationPending ? [] : await getLightningQuestions();

  return (
    <PageShell>
      <div className="anim-enter anim-d1">
        <PageHeader
          badge="Minigame diário"
          icon={Zap}
          title="Desafio Relâmpago"
          description={`5 questões em ${LIGHTNING_TIME_LIMIT_SECONDS} segundos. 1 tentativa por dia — reseta à meia-noite de Brasília.`}
          action={
            migrationPending ? (
              <Badge variant="default">Indisponível temporariamente</Badge>
            ) : status.played ? (
              <Badge variant="emerald">
                <Trophy className="h-3 w-3" />
                Concluído hoje
              </Badge>
            ) : (
              <Badge variant="amber">
                <Sparkles className="h-3 w-3" />
                Disponível hoje
              </Badge>
            )
          }
        />
      </div>

      {migrationPending && (
        <div className="anim-enter anim-d2 mb-4 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-amber-200">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-white">
                Desafio Relâmpago temporariamente indisponível (manutenção de base)
              </p>
              <p className="text-sm text-amber-200/80">
                O restante do app continua normal. Seu histórico de partidas é mantido abaixo.
              </p>
            </div>
          </div>
        </div>
      )}

      {status.played && status.attempt ? (
        <div className="anim-enter anim-d2">
          <Card padding="lg" className="border-emerald-400/25 bg-emerald-400/[0.06]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-200">
                  <Trophy className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                    Resultado de hoje
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {status.attempt.score}/{status.attempt.totalQuestions} acertos
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    +{status.attempt.xpAwarded} XP · +{status.attempt.coinsAwarded} moedas
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  Próximo desafio em
                </p>
                <p className="mt-1">
                  <LightningCountdown />
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : questions.length === 0 ? (
        <div className="anim-enter anim-d2">
          <EmptyState
            icon={Info}
            title="Sem questões elegíveis no momento."
            description="O Desafio Relâmpago usa questões de simulados publicados com gabarito. Volte mais tarde — assim que houver questões disponíveis, o desafio abre."
          >
            <div className="mt-4">
              <LinkButton href="/simulados" variant="outline">
                Explorar simulados
              </LinkButton>
            </div>
          </EmptyState>
        </div>
      ) : (
        <div className="anim-enter anim-d2">
          <LightningGame questions={questions} />
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3 anim-enter anim-d3">
        <Card padding="md">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/10 text-amber-200">
            <Zap className="h-5 w-5" />
          </span>
          <CardTitle className="mt-3 text-base">Como funciona</CardTitle>
          <CardDescription>
            5 questões de múltipla escolha sorteadas de simulados publicados. 60 segundos no
            relógio — o tempo esgotado envia automaticamente.
          </CardDescription>
        </Card>
        <Card padding="md">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-400/10 text-teal-200">
            <Coins className="h-5 w-5" />
          </span>
          <CardTitle className="mt-3 text-base">Recompensas</CardTitle>
          <CardDescription>
            Cada acerto vale {LIGHTNING_XP_PER_CORRECT} XP + {LIGHTNING_COINS_PER_CORRECT} moedas.
            Acertar as 5 dá bônus de +30 XP. Boosters ativos multiplicam o ganho.
          </CardDescription>
        </Card>
        <Card padding="md">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/10 text-violet-200">
            <Flame className="h-5 w-5" />
          </span>
          <CardTitle className="mt-3 text-base">Limite diário</CardTitle>
          <CardDescription>
            1 tentativa por dia por jogador. O desafio reseta à meia-noite de Brasília. Sem
            repetição no mesmo dia — nem com clique duplo.
          </CardDescription>
        </Card>
      </div>

      <section className="mt-8 anim-enter anim-d4" aria-label="Histórico do Desafio Relâmpago">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-4 w-4 hx-accent-text" />
          <h2 className="text-lg font-bold hx-text-title">Histórico de partidas</h2>
        </div>
        {history.length === 0 ? (
          <Card padding="md">
            <p className="text-sm hx-text-muted">
              Nenhuma partida ainda. Jogue o desafio de hoje para estrear seu histórico.
            </p>
          </Card>
        ) : (
          <Card padding="none">
            <ul className="divide-y divide-white/5">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-400/10 text-sm font-black text-amber-200">
                      {h.score}/{h.totalQuestions}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {formatDateBR(new Date(h.challengeDate))} · {h.score} de {h.totalQuestions} acertos
                      </p>
                      <p className="text-xs text-slate-400">
                        +{h.xpAwarded} XP · +{h.coinsAwarded} moedas · {formatTime(h.timeUsedSeconds)}
                      </p>
                    </div>
                  </div>
                  {h.score === h.totalQuestions && h.totalQuestions > 0 ? (
                    <Badge variant="amber">Perfeito ⚡</Badge>
                  ) : (
                    <Badge variant="default">{Math.round((h.score / Math.max(1, h.totalQuestions)) * 100)}%</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </PageShell>
  );
}
