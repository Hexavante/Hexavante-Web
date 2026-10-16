import { redirect } from "next/navigation";
import { buildSimuladosHistoryRedirect } from "@/lib/historico";

type Props = {
  searchParams: Promise<{ tipo?: string; examType?: string; page?: string }>;
};

/**
 * Rota legada — redireciona para a área unificada de Histórico.
 * Preserva `?tipo=` e `?page=` quando presentes.
 */
export default async function SimuladosHistoricoRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  redirect(
    buildSimuladosHistoryRedirect({ tipo: params.tipo, examType: params.examType, page: params.page }),
  );
}
