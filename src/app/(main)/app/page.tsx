import { auth } from "@/auth";
import { ArrowRight, Award, BarChart3, BookOpen, Radio, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { StudentDashboard } from "@/components/home/student-dashboard";
import { StudyContinueHero } from "@/components/home/study-continue-hero";
import { CourseRecommendations } from "@/components/home/course-recommendations";
import { DashboardCommandCenter } from "@/components/home/dashboard-command-center";
import { DashboardHighlightsPanel } from "@/components/home/dashboard-highlights-panel";
import { TutorialVideoModal } from "@/components/onboarding/tutorial-video-modal";
import { AchievementGrid } from "@/components/achievements/achievement-grid";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { CertificateVortex } from "@/components/home/certificate-vortex";
import { MarqueeShortcuts } from "@/components/home/marquee-shortcuts";
import { getStudentHomeData } from "@/services/student.service";
import Link from "next/link";

const highlights = [
  {
    label: "Cursos",
    value: "Aprendizado guiado",
    icon: BookOpen,
    tone: "hx-accent-text bg-[hsl(var(--sidebar-highlight)/0.1)]",
  },
  {
    label: "Simulados",
    value: "Prática com desempenho",
    icon: Target,
    tone: "text-teal-300 bg-teal-400/10",
  },
  {
    label: "Certificados",
    value: "Evolução registrada",
    icon: Award,
    tone: "text-amber-300 bg-amber-400/10",
  },
];

const shortcuts = [
  { href: "/courses", label: "Catálogo de cursos", icon: "BookOpen" },
  { href: "/simulados", label: "Simulados", icon: "Target" },
  { href: "/estatisticas", label: "Estatísticas", icon: "BarChart3", requiresAuth: true },
  { href: "/live-rooms", label: "Aulas ao vivo", icon: "Radio" },
];

export default async function HomePage() {
  const session = await auth();
  const homeData = session?.user?.id ? await getStudentHomeData(session.user.id) : null;

  return (
    <PageShell>
      {homeData?.showOnboardingTour && <TutorialVideoModal show />}

      {homeData && session?.user ? (
        <>
          <ScrollReveal>
            <section className="relative mb-8">
              <div
                aria-hidden
                className="animate-bg-breathe pointer-events-none absolute -top-12 right-0 h-48 w-48 rounded-full bg-[hsl(var(--sidebar-highlight)/0.1)] blur-[5rem]"
              />
              <div className="relative">
                <Badge variant="sky">Seu espaço de estudos</Badge>
                <h1 className="mt-2 text-2xl font-black tracking-tight hx-text-title sm:text-3xl">
                  <span className="welcome-animated">
                    {"Olá, ".split("").map((char, i) => (
                      <span key={i} style={{ animationDelay: `${0.1 + i * 0.04}s` }}>
                        {char === " " ? "\u00A0" : char}
                      </span>
                    ))}
                    <span style={{ animationDelay: `${0.1 + "Olá, ".length * 0.04}s` }}>
                      {session.user.name?.split(" ")[0] ?? session.user.username}
                    </span>
                  </span>
                  !
                </h1>
                <p className="mt-2 max-w-2xl text-sm hx-text-muted anim-enter anim-d3">
                  Retome de onde parou, acompanhe suas estatísticas e descubra novos cursos.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 anim-enter anim-d4">
                  <Link href="/estatisticas" className="hx-intro-chip">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Ver estatísticas
                  </Link>
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <StudyContinueHero continuation={homeData.continuation} />
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <DashboardHighlightsPanel highlights={homeData.highlights} />
          </ScrollReveal>

          <ScrollReveal delay={250}>
            <DashboardCommandCenter pendingItems={homeData.pendingItems} />
          </ScrollReveal>

          <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <div className="min-w-0 space-y-8">
              <ScrollReveal>
                <CourseRecommendations courses={homeData.recommendations} />
              </ScrollReveal>

              {homeData.achievements.some((a) => a.unlocked) && (
                <ScrollReveal delay={150}>
                  <section>
                    <h2 className="mb-4 text-lg font-bold hx-text-title">Conquistas recentes</h2>
                    <AchievementGrid
                      achievements={homeData.achievements.filter((a) => a.unlocked).slice(0, 4)}
                      compact
                    />
                  </section>
                </ScrollReveal>
              )}
            </div>

            <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
              <ScrollReveal delay={150}>
                <StudentDashboard
                  data={homeData}
                  userName={session.user.name ?? session.user.username ?? "Estudante"}
                />
              </ScrollReveal>
            </div>
          </div>
        </>
      ) : (
        <ScrollReveal>
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-8">
            <div className="min-w-0">
              <Badge variant="sky">Plataforma educacional Hexavante</Badge>
              <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:mt-5 sm:text-4xl xl:text-5xl">
                Aprenda, pratique e acompanhe seu progresso em um só lugar.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:mt-5 sm:text-base lg:text-lg">
                Cursos, simulados, aulas ao vivo e gamificação para estudantes do ensino técnico,
                universitários de TI e candidatos ao ENEM.
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

            <Card padding="md" className="min-w-0 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-semibold text-white">Comece agora</p>
                  <p className="mt-1 text-xs text-slate-400">Tudo em uma plataforma</p>
                </div>
                <Badge variant="teal">Gratuito</Badge>
              </div>
              <div className="mt-5 grid gap-3">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.04] p-4"
                    >
                      <span className={`grid h-10 w-10 place-items-center rounded-lg ${item.tone}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.label}</p>
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
            href:
              item.requiresAuth && !session?.user
                ? `/login?callbackUrl=${encodeURIComponent(item.href)}`
                : item.href,
          }))}
        />
      </ScrollReveal>

      {session?.user && (
        <ScrollReveal delay={100}>
          <CertificateVortex hasCertificates={Boolean(homeData?.highlights?.lastCertificate)} />
        </ScrollReveal>
      )}
    </PageShell>
  );
}
