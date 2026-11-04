"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  banUser,
  unbanUser,
  muteUser,
  unmuteUser,
  warnUser,
  deleteUserByAdmin,
  deleteProfileData,
} from "@/app/actions/moderation-users";

export type ModUser = {
  legacyRole?: string;
  id: string;
  username: string | null;
  fullName: string;
  avatarUrl: string | null;
  level: number;
  xp: number;
  coins: number;
  roles: string[];
  isBanned: boolean;
  isMuted: boolean;
  warnings: number;
};

export type ModalType =
  | "addxp"
  | "cargo"
  | "mute"
  | "unmute"
  | "ban"
  | "unban"
  | "warn"
  | "deleteUser"
  | "deleteProfile"
  | null;

type Props = {
  assignableRoles: readonly string[];
  user: ModUser | null;
  modal: ModalType;
  onClose: () => void;
  onSuccess: () => void;
};

const titles: Record<string, string> = {
  addxp: "Adicionar XP",
  cargo: "Alterar cargo",
  mute: "Silenciar usuário",
  unmute: "Remover silêncio",
  ban: "Banir usuário",
  unban: "Desbanir usuário",
  warn: "Avisar usuário",
  deleteUser: "Excluir conta",
  deleteProfile: "Limpar perfil",
};

export function UserActionModals({ user, modal, onClose, onSuccess, assignableRoles }: Props) {
  const [amount, setAmount] = useState("100");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("24h");
  const [role, setRole] = useState("USER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user || !modal) return null;

  const runTerminal = async (command: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/moderation/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = (await res.json()) as { status: string; message: string };
      if (data.status === "error") {
        setError(data.message);
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Falha ao executar ação.");
    } finally {
      setLoading(false);
    }
  };

  const runServerAction = async (fn: () => Promise<{ success: boolean; error?: string; message?: string }>) => {
    setLoading(true);
    setError("");
    const result = await fn();
    if (!result.success) {
      setError(result.error ?? "Erro desconhecido.");
      setLoading(false);
      return;
    }
    onSuccess();
    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/60 p-4">
      <div className="hx-dark-surface w-full max-w-md rounded-xl border border-[#1e1e2e] bg-[#0a0a0f] p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white">{titles[modal]}</h3>
        <p className="mt-1 text-sm text-slate-400">
          @{user.username} · {user.fullName}
        </p>

        {modal === "deleteUser" && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-300">
              Esta ação irá <strong>excluir permanentemente</strong> a conta de <strong>@{user.username}</strong> e todos os dados associados. Esta ação é irreversível.
            </p>
          </div>
        )}

        {modal === "deleteProfile" && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-300">
              Esta ação irá <strong>remover o avatar, banner e bio</strong> de <strong>@{user.username}</strong>. A conta não será excluída.
            </p>
          </div>
        )}

        {(modal === "unban" || modal === "unmute") && (
          <div className="mt-4 rounded-lg border border-sky-500/30 bg-sky-500/10 p-4">
            <p className="text-sm text-sky-300">
              {modal === "unban"
                ? `Tem certeza que deseja desbanir @${user.username}?`
                : `Tem certeza que deseja remover o silêncio de @${user.username}?`}
            </p>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {modal === "addxp" && (
            <div>
              <label className="mb-1 block text-sm text-slate-400">Quantidade de XP</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
              />
            </div>
          )}
          {modal === "cargo" && (
            <Select value={role} onValueChange={setRole}>
              <SelectItem value="USER">Usuário</SelectItem>
              <SelectItem value="INSTRUCTOR">Instrutor</SelectItem>
              {assignableRoles.includes("MODERATOR") && <SelectItem value="MODERATOR">Moderador</SelectItem>}
              {assignableRoles.includes("ADMIN") && <SelectItem value="ADMIN">Admin</SelectItem>}
            </Select>
          )}
          {modal === "mute" && (
            <Select value={duration} onValueChange={setDuration}>
              <SelectItem value="1h">1 hora</SelectItem>
              <SelectItem value="24h">24 horas</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
            </Select>
          )}
          {(modal === "ban" || modal === "mute" || modal === "warn") && (
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                {modal === "warn" ? "Motivo do aviso (obrigatório)" : "Motivo"}
              </label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={modal === "ban" || modal === "deleteUser" ? "danger" : modal === "warn" ? "outline" : "default"}
            disabled={
              loading ||
              (modal === "ban" && !reason.trim()) ||
              (modal === "warn" && !reason.trim())
            }
            onClick={() => {
              if (modal === "addxp") {
                void runTerminal(`/addxp @${user.username} ${amount}`);
              } else if (modal === "cargo") {
                void runTerminal(`/addcargo @${user.username} ${role}`);
              } else if (modal === "mute") {
                void runServerAction(() => muteUser(user.id, reason, duration));
              } else if (modal === "unmute") {
                void runServerAction(() => unmuteUser(user.id));
              } else if (modal === "ban") {
                void runServerAction(() => banUser(user.id, reason));
              } else if (modal === "unban") {
                void runServerAction(() => unbanUser(user.id));
              } else if (modal === "warn") {
                void runServerAction(() => warnUser(user.id, reason));
              } else if (modal === "deleteUser") {
                void runServerAction(() => deleteUserByAdmin(user.id));
              } else if (modal === "deleteProfile") {
                void runServerAction(() => deleteProfileData(user.id));
              }
            }}
          >
            {loading
              ? "Salvando..."
              : modal === "deleteUser"
                ? "Excluir conta"
                : modal === "deleteProfile"
                  ? "Limpar perfil"
                  : modal === "unban"
                    ? "Desbanir"
                    : modal === "unmute"
                      ? "Remover silêncio"
                      : "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
