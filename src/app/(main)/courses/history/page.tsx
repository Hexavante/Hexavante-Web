import { redirect } from "next/navigation";
import { buildCoursesHistoryRedirect } from "@/lib/historico";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

/**
 * Rota legada — redireciona para a área unificada de Histórico.
 * Preserva `?page=` quando presente.
 */
export default async function CourseHistoryRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  redirect(buildCoursesHistoryRedirect({ page: params.page }));
}
