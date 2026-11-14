"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  confirmTwoFactorAction,
  disableTwoFactorAction,
  enableTwoFactorAction,
} from "@/app/actions/security";

export function TwoFactorManager({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [vid, setVid] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const startEnable = async () => {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
    const result = await enableTwoFactorAction();
    setPending(false);
    if (!result.ok || !result.verificationId) {
      setError(result.error ?? "Erro ao ativar.");
      return;
    }
    setVid(result.verificationId);
    } catch { setError("Não foi possível conectar. Tente novamente."); } finally { setPending(false); }
  };

  const confirmEnable = async () => {
    if (!vid) return;
    setPending(true);
    setError(null);
    try {
    const result = await confirmTwoFactorAction(vid, code);
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Código inválido.");
      return;
    }
    setEnabled(true);
    setVid(null);
    setCode("");
    setSuccess("Verificação em duas etapas ativada!");
    } catch { setError("Não foi possível conectar. Tente novamente."); } finally { setPending(false); }
  };

  const disable = async () => {
    if (!confirm("Desativar a verificação em duas etapas?")) return;
    setPending(true);
    setError(null);
    try {
    const result = await disableTwoFactorAction();
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Erro ao desativar.");
      return;
    }
    setEnabled(false);
    setSuccess("Verificação em duas etapas desativada.");
    } catch { setError("Não foi possível conectar. Tente novamente."); } finally { setPending(false); }
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            {enabled ? (
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
            ) : (
              <ShieldOff className="h-4 w-4 text-slate-400" />
            )}
            Verificação em duas etapas (2FA)
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {enabled
              ? "Ativa: todo login pede um código enviado ao seu e-mail."
              : "Exija um código por e-mail em todos os logins, mesmo em dispositivos conhecidos."}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            enabled ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-400"
          }`}
        >
          {enabled ? "Ativado" : "Desativado"}
        </span>
      </div>

      {!enabled && !vid && (
        <Button onClick={() => void startEnable()} disabled={pending} size="sm" className="mt-4">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ativar 2FA"}
        </Button>
      )}

      {!enabled && vid && (
        <div className=" mt-4 space-y-3 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
          <p className="text-xs text-slate-300">
            Enviamos um código ao seu e-mail. Digite para confirmar a ativação:
          </p>
          <div>
            <Label htmlFor="tfa-code">Código de 6 dígitos</Label>
            <Input
              id="tfa-code"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="mt-1 max-w-[200px] text-center font-mono text-lg tracking-[0.4em]"
            />
          </div>
          <Button onClick={() => void confirmEnable()} disabled={pending || code.length !== 6} size="sm">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar ativação"}
          </Button>
        </div>
      )}

      {enabled && (
        <Button onClick={() => void disable()} disabled={pending} variant="outline" size="sm" className="mt-4">
          Desativar 2FA
        </Button>
      )}

      {error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
      {success && <p role="status" className="mt-3 text-xs text-emerald-300">{success}</p>}
    </div>
  );
}
