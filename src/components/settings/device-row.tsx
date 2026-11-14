"use client";

import { useState } from "react";
import { MonitorSmartphone, Trash2, Loader2 } from "lucide-react";
import { revokeDeviceAction, type DeviceInfo } from "@/app/actions/security";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export function DeviceRow({ device, isCurrent }: { device: DeviceInfo; isCurrent: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRevoke = async () => {
    if (!confirm(`Desconectar "${device.name}"?`)) return;
    setPending(true);
    setError(null);
    try {
    const result = await revokeDeviceAction(device.id);
    if (!result.ok) {
      setError(result.error ?? "Erro ao remover.");
      setPending(false);
      return;
    }
    if (result.signedOut) {
      window.location.assign("/login");
      return;
    }
    window.location.reload();
    } catch {
      setError("Não foi possível desconectar. Tente novamente.");
      setPending(false);
    }
  };

  return (
    <div className=" flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300">
        <MonitorSmartphone className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {device.name}
          {isCurrent && (
            <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Este dispositivo
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {device.ipAddress ? `${device.ipAddress} · ` : ""}visto {timeAgo(device.lastSeenAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void onRevoke()}
        disabled={pending}
        title="Desconectar dispositivo"
        aria-label={`Desconectar ${device.name}`}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-500/25 text-slate-500 transition hover:border-red-500/60 hover:text-red-400 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
      {error && <p role="alert" className="w-full text-xs text-red-300">{error}</p>}
    </div>
  );
}
