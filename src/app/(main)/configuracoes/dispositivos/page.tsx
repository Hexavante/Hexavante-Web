import { redirect } from "next/navigation";
import { MonitorSmartphone } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { DeviceRow } from "@/components/settings/device-row";
import { getMyDevices } from "@/app/actions/security";

export default async function DispositivosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/configuracoes/dispositivos");

  const { devices, error } = await getMyDevices();

  return (
    <PageShell size="md">
      <div className=" ">
        <PageHeader
          badge="Segurança"
          icon={MonitorSmartphone}
          title="Dispositivos conectados"
          description="Veja onde sua conta está conectada. Desconecte o que não reconhecer."
        />
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-amber-400/30 p-5">
          <p>{error}</p>
          <a href="/configuracoes/dispositivos" className="mt-3 inline-block underline">Tentar novamente</a>
        </div>
      ) : devices.length === 0 ? (
        <div className=" ">
          <EmptyState
            icon={MonitorSmartphone}
            title="Nenhum dispositivo registrado."
            description="Novos acessos aparecem aqui após a confirmação por e-mail."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((device, i) => (
            <div key={device.id} className=" ">
              <DeviceRow device={device} isCurrent={false} />
            </div>
          ))}
          <p className=" pt-2 text-xs text-slate-500">
            Os dispositivos estão ordenados pelo último acesso. Ao desconectar um dispositivo, as
            sessões dele são encerradas.
          </p>
        </div>
      )}
    </PageShell>
  );
}
