import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { PresencePicker } from "@/components/presence/presence-picker";
import { TwoFactorManager } from "@/components/settings/two-factor-manager";
import { getSecurityProfile } from "@/app/actions/security";

export default async function SegurancaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/configuracoes/seguranca");

  const profile = await getSecurityProfile();

  return (
    <PageShell size="md">
      <div className=" ">
        <PageHeader
          badge="Conta"
          icon={ShieldCheck}
          title="Segurança"
          description="Proteja sua conta com verificação em duas etapas e controle sua visibilidade."
        />
      </div>

      <div className=" space-y-4">
        <TwoFactorManager initialEnabled={profile.twoFactorEnabled} />

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-sm font-bold text-white">Status de presença</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Mostrado no seu perfil. Após 5 minutos sem atividade você aparece offline.
          </p>
          <div className="mt-4">
            <PresencePicker initial={profile.presence} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
