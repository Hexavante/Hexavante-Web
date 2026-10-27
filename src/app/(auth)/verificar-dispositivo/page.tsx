"use client";

import { useState } from "react";
import { useActionState } from "react";
import { MonitorSmartphone, ShieldCheck } from "lucide-react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendDeviceCodeAction, verifyDeviceAction } from "@/app/actions/device-auth";

type Props = {
  searchParams: Promise<{ vid?: string; callbackUrl?: string; motivo?: string }>;
};

export default function VerificarDispositivoPage({ searchParams }: Props) {
  return <VerificarDispositivoForm searchParams={searchParams} />;
}

import { use } from "react";
import { useEffect } from "react";

function VerificarDispositivoForm({ searchParams }: Props) {
  const { vid = "", callbackUrl = "/app", motivo = "" } = use(searchParams);
  const isEmail = motivo === "email";
  const [step, setStep] = useState<"device" | "2fa">(motivo === "2fa" ? "2fa" : "device");
  const is2fa = step === "2fa";
  const [code, setCode] = useState("");
  const [vid2, setVid2] = useState(vid);
  const [state, action, pending] = useActionState(
    async (): Promise<Awaited<ReturnType<typeof verifyDeviceAction>> | null> => {
      try {
        const result = await verifyDeviceAction(vid2, code);
        // Dispositivo/e-mail confirmados, mas a conta exige 2FA: troca a
        // etapa usando o novo verificationId, sem recarregar a página.
        if (result.requiresTwoFactor && result.verificationId) {
          setVid2(result.verificationId);
          setStep("2fa");
          setCode("");
        }
        return result;
      } catch {
        return { ok: false, error: "Erro inesperado. Tente novamente." };
      }
    },
    null as Awaited<ReturnType<typeof verifyDeviceAction>> | null,
  );
  const [resendState, resendAction, resending] = useActionState(
    async () => {
      const result = await resendDeviceCodeAction(vid2);
      if (result.ok && result.verificationId) setVid2(result.verificationId);
      return result;
    },
    null as Awaited<ReturnType<typeof resendDeviceCodeAction>> | null,
  );

  useEffect(() => {
    if (state?.ok) {
      window.location.assign(callbackUrl.startsWith("/") ? callbackUrl : "/app");
    }
  }, [state?.ok, callbackUrl]);

  if (state?.ok) {
    return (
      <AuthPageShell>
        <p className="anim-enter-fade text-center text-sm text-slate-400">
          Verificado! Redirecionando...
        </p>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <div className="anim-enter-fade mb-6 text-center">
        <div className="anim-enter-scale mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10">
          <MonitorSmartphone className="h-7 w-7 text-cyan-300" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
          {isEmail ? "Confirme seu e-mail" : is2fa ? "Verificação em duas etapas" : "Novo dispositivo"}
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
          {isEmail ? "Ative sua conta" : "Confirme que é você"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isEmail
            ? "Enviamos um código de 6 dígitos para o seu e-mail. Confirme para ativar sua conta."
            : is2fa
              ? "Sua conta usa verificação em duas etapas. Enviamos o código para o seu e-mail."
              : "Enviamos um código de 6 dígitos para o seu e-mail. Ele expira em 10 minutos."}
        </p>
      </div>

      <form action={action} className="anim-enter-fade space-y-4" style={{ animationDelay: "0.1s" }}>
        <div>
          <Label htmlFor="code">Código de verificação</Label>
          <Input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="h-12 text-center text-2xl tracking-[0.5em] font-mono"
            autoFocus
          />
        </div>

        {state?.error && <p className="text-sm text-red-300">{state.error}</p>}

        <Button type="submit" disabled={pending || code.length !== 6} className="hx-lift h-11 w-full" size="lg">
          {pending ? "Verificando..." : is2fa ? "Confirmar código" : "Confirmar dispositivo"}
        </Button>
      </form>

      {resendState?.error && (
        <p className="mt-3 text-center text-sm text-red-300">{resendState.error}</p>
      )}
      {resendState?.ok && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm text-emerald-300">
          <ShieldCheck className="h-4 w-4" /> Novo código enviado!
        </p>
      )}

      <form action={resendAction} className="mt-2">
        <Button type="submit" variant="ghost" disabled={resending} className="w-full">
          {resending ? "Enviando..." : "Não recebeu? Reenviar código"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
