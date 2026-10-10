import { BookOpenCheck, Sparkles, Target } from "lucide-react";
import { HexavanteLogo } from "@/components/brand/hexavante-logo";

type Props = { children: React.ReactNode; variant?: "login" | "register" };

export function AuthPageShell({ children, variant = "login" }: Props) {
  const isRegister = variant === "register";
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#11151f] px-4 py-6 sm:px-7 lg:p-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#1c2230] shadow-2xl shadow-black/40 lg:grid-cols-[1.03fr_0.97fr]">
        <section className="relative hidden min-h-[680px] overflow-hidden bg-[linear-gradient(135deg,#243a8f_0%,#5d5ce6_55%,#8778f7_100%)] p-12 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_90%_0%,white_0,transparent_34%),radial-gradient(circle_at_0%_100%,#0c1456_0,transparent_52%)]" />
          <div className="relative"><HexavanteLogo size="md" wordmarkClassName="text-white" /></div>
          <div className="relative my-auto max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-100">
              {isRegister ? "Sua jornada começa aqui" : "Estude no seu ritmo"}
            </p>
            <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight">
              {isRegister ? "Transforme metas em conquistas." : "Seu próximo passo começa agora."}
            </h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-indigo-50/90">
              {isRegister ? "Organize seus estudos, encontre conteúdos que fazem sentido e evolua todos os dias." : "Retome sua rotina, acompanhe seu progresso e siga aprendendo com a Hexavante."}
            </p>
            <div className="mt-9 space-y-3 text-sm font-medium text-white/95">
              <p className="flex items-center gap-2"><BookOpenCheck className="h-4 w-4" /> Trilhas para o seu objetivo</p>
              <p className="flex items-center gap-2"><Target className="h-4 w-4" /> Progresso claro a cada etapa</p>
              <p className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Uma experiência feita para você</p>
            </div>
          </div>
        </section>
        <section className="flex min-h-[min(760px,calc(100vh-3rem))] items-center justify-center bg-[#1d2330] px-5 py-9 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-9 lg:hidden"><HexavanteLogo size="md" wordmarkClassName="text-white" /></div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
