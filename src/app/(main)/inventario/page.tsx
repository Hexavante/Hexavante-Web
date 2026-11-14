import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { auth } from "@/auth";
import { InventoryPanel } from "@/components/shop/inventory-panel";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { getShopState } from "@/services/shop.service";

export default async function InventarioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/inventario");

  const { inventory, activeBooster } = await getShopState(session.user.id);

  return (
    <PageShell size="lg">
      <div className=" ">
        <PageHeader
          badge="Conta"
          icon={Package}
          title="Inventário"
          description="Todos os itens que você comprou: cosméticos para equipar, boosters, passes e pacotes de revisão."
        />
      </div>

      <div className="mt-6 ">
        <InventoryPanel inventory={inventory} activeBooster={activeBooster} />
      </div>

      <p className="mt-8 text-center text-sm text-slate-500 ">
        Equipe temas e cosméticos aqui — as mudanças aparecem em todo o app.{" "}
        <Link href="/configuracoes/perfil" className="hx-accent-link hover:underline">
          Editar perfil
        </Link>
      </p>
    </PageShell>
  );
}
