import { redirect } from "next/navigation";
import { BookOpen, Target } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { LinkButton } from "@/components/ui/button";
import { DailyStudyPlan } from "@/components/home/daily-study-plan";
import { completeDailyTaskAction } from "@/app/actions/daily-plan";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";
import { getOrCreateDailyPlan } from "@/services/daily-plan.service";

export default async function DailyPlanPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/plano-diario");

  const userId = session.user.id;
  let dailyPlan = null;
  let migrationPending = false;
  let loadError = false;

  try {
    dailyPlan = await getOrCreateDailyPlan(userId);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      migrationPending = true;
    } else {
      logger.error("Erro ao carregar plano diário", err, { userId });
      loadError = true;
    }
  }

  return (
    <PageShell>
      <div className="anim-enter anim-d1">
        <PageHeader
          badge="Hoje"
          icon={BookOpen}
          title="Plano de estudos do dia"
          description="Tarefas personalizadas para você completar hoje e manter seu progresso."
        />
      </div>

      {migrationPending ? (
        <div className="anim-enter anim-d2 mt-8 flex flex-col items-center gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-12 text-center">
          <BookOpen className="h-10 w-10 text-amber-400" aria-hidden />
          <p className="text-lg font-semibold text-white">Funcionalidade em implantação</p>
          <p className="max-w-md text-sm text-slate-400">
            O plano diário será ativado assim que a atualização do servidor for concluída. Tente
            novamente em alguns minutos.
          </p>
          <LinkButton href="/app" variant="outline" size="sm">
            Voltar ao painel
          </LinkButton>
        </div>
      ) : loadError ? (
        <div className="anim-enter anim-d2 mt-8 flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center">
          <BookOpen className="h-10 w-10 text-red-400" aria-hidden />
          <p className="text-lg font-semibold text-white">Não foi possível carregar o plano</p>
          <p className="max-w-md text-sm text-slate-400">
            Tente novamente em alguns instantes. Se o erro persistir, entre em contato com o suporte.
          </p>
          <LinkButton href="/app" variant="outline" size="sm">
            Voltar ao painel
          </LinkButton>
        </div>
      ) : dailyPlan ? (
        <div className="anim-enter anim-d2 mt-6">
          <DailyStudyPlan
            dailyPlan={dailyPlan}
            onCompleteTask={async (taskId) => {
              "use server";
              await completeDailyTaskAction(taskId);
            }}
          />
        </div>
      ) : (
        /* Sem plano ainda - usuário novo */
        <div className="anim-enter anim-d2 mt-8 flex flex-col items-center gap-6 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-14 text-center">
          <BookOpen className="h-12 w-12 text-slate-500" aria-hidden />
          <div>
            <p className="text-xl font-bold text-white">Comece a estudar para gerar seu plano</p>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Seu plano diário é gerado automaticamente com base nos seus cursos, simulados e sequência
              de estudos. Explore o catálogo para começar.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <LinkButton href="/courses" size="sm">
              <BookOpen className="h-4 w-4" />
              Explorar cursos
            </LinkButton>
            <LinkButton href="/simulados" variant="outline" size="sm">
              <Target className="h-4 w-4" />
              Fazer um simulado
            </LinkButton>
          </div>
        </div>
      )}
    </PageShell>
  );
}
