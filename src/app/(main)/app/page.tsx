import { NavigationIcon } from "@/components/brand/navigation-icon";
import styles from "@/components/home/dashboard-design.module.css";
import { redirect } from "next/navigation";
import { hasTeachingRole } from "@/lib/permissions";
import { auth } from "@/auth";
import {
  ArrowRight,
  Award,
  BookOpen,
  NotebookPen,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { StudentDashboard } from "@/components/home/student-dashboard";
import { StudyContinueHero } from "@/components/home/study-continue-hero";
import { CourseRecommendations } from "@/components/home/course-recommendations";
import { DashboardCommandCenter } from "@/components/home/dashboard-command-center";
import { DashboardHighlightsPanel } from "@/components/home/dashboard-highlights-panel";
import { DailyStudyPlan } from "@/components/home/daily-study-plan";
import { TutorialVideoModal } from "@/components/onboarding/tutorial-video-modal";
import { AchievementGrid } from "@/components/achievements/achievement-grid";
import { ScrollReveal } from "@/components/scroll-reveal";
import { MarqueeShortcuts } from "@/components/home/marquee-shortcuts";
import { getStudentHomeData } from "@/services/student.service";
import { getProfileCosmetics } from "@/services/shop.service";
import Link from "next/link";

const highlights = [
  {
    label: "Cursos",
    value: "Aprendizado guiado",
    icon: "BookOpen",
    tone: "hx-accent-text bg-[hsl(var(--sidebar-highlight)/0.1)]",
  },
  {
    label: "Simulados",
    value: "Prática com desempenho",
    icon: "Target",
    tone: "text-teal-300 bg-teal-400/10",
  },
  {
    label: "Certificados",
    value: "Evolução registrada",
    icon: "Award",
    tone: "text-amber-300 bg-amber-400/10",
  },
];

const shortcuts: {
  href: string;
  label: string;
  icon: string;
  requiresAuth?: boolean;
}[] = [
  { href: "/courses", label: "Catálogo de cursos", icon: "BookOpen" },
  { href: "/simulados", label: "Simulados", icon: "Target" },
  {
    href: "/historico",
    label: "Histórico",
    icon: "History",
    requiresAuth: true,
  },
  {
    href: "/anotacoes",
    label: "Caderno",
    icon: "NotebookPen",
    requiresAuth: true,
  },
  {
    href: "/estatisticas",
    label: "Estatísticas",
    icon: "BarChart3",
    requiresAuth: true,
  },
  { href: "/live-rooms", label: "Aulas ao vivo", icon: "Radio" },
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ modo?: string }> }) {
  const session = await auth();
  if (hasTeachingRole(session?.user?.roles) && (await searchParams).modo !== "estudo") {
    redirect("/instructor/gerenciar");
  }
  const userId = session?.user?.id;

  const [homeData, cosmetics] = userId
    ? await Promise.all([
        getStudentHomeData(userId).catch((error) => {
          console.error(
            "[painel] Falha ao carregar dados do estudante:",
            error,
          );
          return null;
        }),
        getProfileCosmetics(userId).catch((error) => {
          console.error("[painel] Falha ao carregar cosméticos:", error);
          return null;
        }),
      ])
    : [null, null];

  const themeClass = cosmetics?.themeClassName ?? "theme-default";
  const hasHighlights = Boolean(
    homeData?.highlights?.nextGoal ||
    homeData?.highlights?.lastCertificate ||
    homeData?.highlights?.nextLiveEvent,
  );
  const hasUnlockedAchievements = Boolean(
    homeData?.achievements?.some((a) => a.unlocked),
  );

  return (
    <PageShell className={`${themeClass} ${styles.dashboard}`}>
      {homeData?.showOnboardingTour && <TutorialVideoModal show />}

      {homeData && session?.user ? (
        <div className="mx-auto w-full min-w-0 max-w-6xl">
          <ScrollReveal>
            <section className={styles.welcome}>
              <p className={styles.eyebrow}>Seu espaço de evolução</p>
              <h1 className="font-black hx-text-title">
                Olá, {session.user.name?.split(" ")[0] ?? session.user.username}
                !
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 hx-text-muted">
                Um novo passo, uma nova conquista. O que você vai aprender hoje?
              </p>
              <div
                className={styles.overview}
                aria-label="Resumo dos seus estudos"
              >
                <div>
                  <BookOpen size={18} />
                  <span>
                    <strong>{homeData.inProgress.length}</strong>
                    <small>Cursos em andamento</small>
                  </span>
                </div>
                <div>
                  <Award size={18} />
                  <span>
                    <strong>{homeData.completedCount}</strong>
                    <small>Cursos concluídos</small>
                  </span>
                </div>
                <Link href="/plano-diario">
                  <Target size={18} />
                  <span>
                    <strong>Seu próximo passo</strong>
                    <small>Abrir meu plano de estudos →</small>
                  </span>
                </Link>
              </div>
              <div className={styles.quickLinks}>
                {[
                  {
                    href: "/plano-diario",
                    title: "Meu plano do dia",
                    detail: "Organize seu próximo passo",
                  },
                  {
                    href: "/estatisticas",
                    title: "Minha evolução",
                    detail: "Veja o quanto já avançou",
                  },
                  {
                    href: "/anotacoes",
                    title: "Meu caderno",
                    detail: "Suas ideias, sempre por perto",
                  },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={styles.quickLink}
                  >
                    <NavigationIcon href={item.href} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className={styles.sectionHeading}>
              <span>01 / CONTINUAR APRENDENDO</span>
              <p>Retome de onde parou</p>
            </div>
            <StudyContinueHero continuation={homeData.continuation} />
          </ScrollReveal>

          <div className="mt-6 grid w-full min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <div className="min-w-0 space-y-9">
              {homeData.dailyPlan && (
                <ScrollReveal delay={120}>
                  <DailyStudyPlan dailyPlan={homeData.dailyPlan} />
                </ScrollReveal>
              )}

              <ScrollReveal delay={180}>
                <DashboardCommandCenter pendingItems={homeData.pendingItems} />
              </ScrollReveal>

              {hasHighlights && (
                <ScrollReveal delay={220}>
                  <DashboardHighlightsPanel highlights={homeData.highlights} />
                </ScrollReveal>
              )}

              <ScrollReveal delay={100}>
                <div className={styles.sectionHeading}>
                  <span>02 / EXPLORE NOVOS CAMINHOS</span>
                </div>
                <CourseRecommendations courses={homeData.recommendations} />
              </ScrollReveal>

              {hasUnlockedAchievements && (
                <ScrollReveal delay={180}>
                  <section className="min-w-0">
                    <h2 className="mb-4 text-lg font-bold hx-text-title">
                      Conquistas recentes
                    </h2>
                    <AchievementGrid
                      achievements={homeData.achievements
                        .filter((a) => a.unlocked)
                        .slice(0, 4)}
                      compact
                    />
                  </section>
                </ScrollReveal>
              )}
            </div>

            <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
              <ScrollReveal delay={140}>
                <StudentDashboard
                  data={{
                    ...homeData,
                    cosmetics: {
                      themeId: cosmetics?.themeId ?? null,
                      themeClassName:
                        cosmetics?.themeClassName ?? "theme-default",
                      avatarBorderClassName:
                        cosmetics?.avatarBorderClassName ?? null,
                      profileBackgroundId:
                        cosmetics?.profileBackgroundId ?? null,
                      frameId: cosmetics?.frameId ?? null,
                    },
                  }}
                  userName={
                    session.user.name ?? session.user.username ?? "Estudante"
                  }
                  userAvatar={session.user.image ?? null}
                />
              </ScrollReveal>
            </aside>
          </div>
        </div>
      ) : session?.user ? (
        <ScrollReveal>
          <section
            className={`${styles.welcome} mx-auto w-full max-w-5xl py-8`}
          >
            <Badge variant="sky">Seu espaço de estudos</Badge>
            <h1 className="mt-3 text-2xl font-black tracking-tight hx-text-title sm:text-3xl">
              Olá, {session.user.name?.split(" ")[0] ?? session.user.username}!
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 hx-text-muted">
              Não conseguimos carregar seus dados agora, mas você pode continuar
              estudando pelos atalhos abaixo. Tente atualizar a página em
              instantes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/courses">
                <BookOpen className="h-4 w-4" />
                Explorar cursos
              </LinkButton>
              <LinkButton href="/simulados" variant="outline">
                <Target className="h-4 w-4" />
                Simulados
              </LinkButton>
              <LinkButton href="/anotacoes" variant="outline">
                <NotebookPen className="h-4 w-4" />
                Meu caderno
              </LinkButton>
            </div>
          </section>
        </ScrollReveal>
      ) : (
        <ScrollReveal>
          <section
            className={`${styles.welcome} grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-8`}
          >
            <div className="min-w-0">
              <Badge variant="sky">Plataforma educacional Hexavante</Badge>
              <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:mt-5 sm:text-4xl xl:text-5xl">
                Aprenda, pratique e acompanhe seu progresso em um só lugar.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:mt-5 sm:text-base lg:text-lg">
                Cursos, simulados, aulas ao vivo e gamificação para estudantes
                do ensino técnico, universitários de TI e candidatos ao ENEM.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/courses" size="lg">
                  Explorar cursos
                  <ArrowRight className="h-4 w-4" />
                </LinkButton>
                <LinkButton href="/register" variant="outline" size="lg">
                  Criar conta
                </LinkButton>
              </div>
            </div>

            <Card
              padding="md"
              className="min-w-0 shadow-2xl shadow-black/30 backdrop-blur"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Comece agora
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Tudo em uma plataforma
                  </p>
                </div>
                <Badge variant="teal">Gratuito</Badge>
              </div>
              <div className="mt-5 grid gap-3">
                {highlights.map((item) => {
                  const IconComponent =
                    item.icon === "BookOpen"
                      ? BookOpen
                      : item.icon === "Target"
                        ? Target
                        : Award;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.04] p-4"
                    >
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-lg ${item.tone}`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-400">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal>
        <MarqueeShortcuts
          items={shortcuts.map((item) => ({
            ...item,
            iconHref: item.href,
            href:
              item.requiresAuth && !session?.user
                ? `/login?callbackUrl=${encodeURIComponent(item.href)}`
                : item.href,
          }))}
        />
      </ScrollReveal>

    </PageShell>
  );
}
