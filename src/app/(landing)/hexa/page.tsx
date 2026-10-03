import { auth } from "@/auth";
import {
  Check,
  Crown,
  Hexagon,
  Star,
} from "lucide-react";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { HexaCheckoutCta } from "@/components/landing/hexa-checkout-cta";
import { Badge } from "@/components/ui/badge";
import { fetchPaymentsCatalog, formatBrl } from "@/lib/payments";
import { resolvePremiumState } from "@/services/premium.service";

const freeFeatures = [
  "Acesso a todos os cursos gratuitos",
  "Simulados com gabarito",
  "Ranking e sistema de XP",
  "Perfil personalizável",
  "Comunidade de estudantes",
];

const hexaFeatures = [
  "Todos os benefícios do plano gratuito",
  "Cursos premium exclusivos",
  "Simulados ilimitados com estatísticas avançadas",
  "Cosméticos exclusivos (animados)",
  "Badge Hexa no perfil",
  "Acesso antecipado a novos recursos",
  "Suporte prioritário",
  "Certificados verificáveis",
];

export default async function HexaPage() {
  const session = await auth();
  const user = session?.user ?? null;

  // Preços vêm sempre do catálogo da API — nunca hardcoded.
  // Catálogo (público) e estado premium rodam em paralelo: /hexa é página
  // pública e não deve esperar duas chamadas em série.
  const [catalogResult, premium] = await Promise.all([
    fetchPaymentsCatalog(),
    user?.id ? resolvePremiumState(user.id, user) : Promise.resolve(null),
  ]);
  const premiumPlan = catalogResult.ok ? catalogResult.data.premium : null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <LandingHeader user={user} />

      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-amber-500/[0.06] blur-[10rem]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Badge variant="amber">
            <Crown className="mr-1 h-3 w-3" />
            Assinatura premium
          </Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[hsl(var(--sidebar-foreground))] sm:text-5xl">
            Desbloqueie o{" "}
            <span className="text-amber-400">Hexa</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[hsl(var(--sidebar-foreground)/0.56)] sm:text-lg">
            Acesso ilimitado a todo o conteúdo premium, cosméticos exclusivos e
            recursos avançados para acelerar seus estudos.
          </p>
        </div>
      </section>

      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="hx-card p-8">
              <div className="mb-6">
                <div className="mb-3 hx-icon-box h-10 w-10">
                  <Star className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-[hsl(var(--sidebar-foreground))]">Gratuito</h3>
                <p className="mt-1 text-sm text-[hsl(var(--sidebar-foreground)/0.48)]">
                  Para sempre. Sem cartão de crédito.
                </p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-[hsl(var(--sidebar-foreground))]">R$ 0</span>
                <span className="text-sm text-[hsl(var(--sidebar-foreground)/0.36)]">/mês</span>
              </div>
              <ul className="mb-8 space-y-3">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-[hsl(var(--sidebar-foreground)/0.78)]">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--sidebar-foreground)/0.36)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={user ? "/app" : "/register"}
                className="hx-btn-secondary block w-full rounded-lg border border-white/10 bg-white/[0.03] py-3 text-center text-sm font-medium text-[hsl(var(--sidebar-foreground))] transition hover:bg-white/[0.08]"
              >
                {user ? "Ir para o painel" : "Criar conta grátis"}
              </a>
            </div>

            <div className="hx-card-accent relative overflow-hidden p-8">
              <div className="relative mb-6">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-300">
                  <Hexagon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-[hsl(var(--sidebar-foreground))]">
                  Hexa <span className="text-amber-400">✦</span>
                </h3>
                <p className="mt-1 text-sm text-[hsl(var(--sidebar-foreground)/0.48)]">
                  Tudo de uma vez. Sem limites.
                </p>
              </div>
              <div className="relative mb-6">
                {premiumPlan ? (
                  <>
                    <span className="text-4xl font-black text-[hsl(var(--sidebar-foreground))]">
                      {formatBrl(premiumPlan.priceBrl)}
                    </span>
                    <span className="text-sm text-[hsl(var(--sidebar-foreground)/0.36)]">
                      {premiumPlan.days === 30 ? "/mês" : `/${premiumPlan.days} dias`}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-[hsl(var(--sidebar-foreground)/0.48)]">
                    Valor temporariamente indisponível.
                  </span>
                )}
              </div>
              <ul className="relative mb-8 space-y-3">
                {hexaFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-[hsl(var(--sidebar-foreground)/0.78)]">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <HexaCheckoutCta
                isLoggedIn={Boolean(user)}
                isPremiumActive={premium?.isActive ?? false}
                premiumExpiresAt={
                  premium?.expiresAt ? premium.expiresAt.toISOString() : null
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-black text-[hsl(var(--sidebar-foreground))]">
            Perguntas frequentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Posso cancelar a qualquer momento?",
                a: "Sim. Você pode cancelar sua assinatura Hexa a qualquer momento pelo painel de configurações. O acesso continua até o fim do período já pago.",
              },
              {
                q: "O que muda entre o plano gratuito e o Hexa?",
                a: "O plano gratuito dá acesso a cursos básicos, simulados e ranking. O Hexa desbloqueia todo o conteúdo premium, cosméticos exclusivos, estatísticas avançadas e suporte prioritário.",
              },
              {
                q: "Há desconto para estudantes?",
                a: "Estamos preparando um plano educacional com desconto. Entre em contato para mais informações.",
              },
              {
                q: "Como funciona o acesso antecipado?",
                a: "Assinantes Hexa recebem acesso a novos cursos e funcionalidades antes do lançamento oficial.",
              },
            ].map((item) => (
              <div key={item.q} className="hx-card p-5">
                <h3 className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--sidebar-foreground)/0.56)]">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
