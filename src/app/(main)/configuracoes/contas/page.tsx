import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { getLinkedAccounts, removeAccountAction, switchAccountAction } from "@/app/actions/security";

export default async function ContasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/configuracoes/contas");
  const currentUserId = session.user.id;

  const accounts = await getLinkedAccounts();
  const others = accounts.filter((a) => a.userId !== currentUserId);

  return (
    <PageShell size="md">
      <div className=" ">
        <PageHeader
          badge="Conta"
          icon={UsersRound}
          title="Trocar de conta"
          description="Use mais de uma conta neste dispositivo sem fazer logout."
          action={
            <Link
              href="/login?addAccount=1&callbackUrl=%2Fconfiguracoes%2Fcontas"
              className="hx-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Adicionar conta
            </Link>
          }
        />
      </div>

      <div className=" rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Conta em uso</p>
        <div className="mt-3 flex items-center gap-3">
          <Avatar src={session.user.image} alt={session.user.username ?? ""} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {session.user.name ?? session.user.username}
            </p>
            <p className="truncate text-xs text-slate-500">@{session.user.username}</p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
            Ativa
          </span>
        </div>
      </div>

      <h2 className=" mt-8 text-lg font-bold text-white">
        Outras contas
      </h2>
      {others.length === 0 ? (
        <div className=" ">
          <EmptyState
            icon={UsersRound}
            title="Nenhuma outra conta vinculada."
            description="Adicione outra conta para alternar rapidamente entre elas."
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {others.map((account, i) => (
            <div
              key={account.userId}
              className=" flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <Avatar src={account.avatarUrl} alt={account.username ?? ""} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{account.name}</p>
                <p className="truncate text-xs text-slate-500">@{account.username}</p>
              </div>
              <form action={switchAccountAction.bind(null, account.userId)}>
                <button
                  type="submit"
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.08]"
                >
                  Usar
                </button>
              </form>
              <form action={removeAccountAction.bind(null, account.userId)}>
                <button
                  type="submit"
                  className="rounded-lg border border-red-500/25 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-red-500/60 hover:text-red-400"
                >
                  Remover
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
