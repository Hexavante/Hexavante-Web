import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { cn } from "@/lib/cn";

type Category = { id: string; name: string };

type Props = {
  categories: Category[];
  current: {
    category?: string;
    level?: string;
    q?: string;
    sort?: string;
  };
};

function buildHref(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `/courses?${qs}` : "/courses";
}

export function CourseFilters({ categories, current }: Props) {
  return (
    <Card padding="md" className="mb-6 space-y-4">
      <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="q" className="mb-1.5 block text-sm font-semibold text-slate-200">
            Buscar
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={current.q ?? ""}
            placeholder="Nome ou descrição do curso..."
          />
        </div>
        <div className="w-full sm:w-40">
          <label htmlFor="level" className="mb-1.5 block text-sm font-semibold text-slate-200">
            Nível
          </label>
          <NativeSelect id="level" name="level" defaultValue={current.level ?? ""}>
            <option value="">Todos</option>
            <option value="BEGINNER">Iniciante</option>
            <option value="INTERMEDIATE">Intermediário</option>
            <option value="ADVANCED">Avançado</option>
          </NativeSelect>
        </div>
        <div className="w-full sm:w-44">
          <label htmlFor="sort" className="mb-1.5 block text-sm font-semibold text-slate-200">
            Ordenar
          </label>
          <NativeSelect id="sort" name="sort" defaultValue={current.sort ?? "recent"}>
            <option value="recent">Mais recentes</option>
            <option value="popular">Mais populares</option>
          </NativeSelect>
        </div>
        {current.category && <input type="hidden" name="category" value={current.category} />}
        <Button type="submit" className="sm:mb-0">
          <Search className="h-4 w-4" />
          Filtrar
        </Button>
        {(current.q || current.category || current.level || (current.sort && current.sort !== "recent")) && (
          <Link href="/courses" className="px-3 py-2 text-sm font-medium underline underline-offset-4">Limpar filtros</Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref({ q: current.q, level: current.level, sort: current.sort })}
          className={cn(
            "hx-filter-pill",
            !current.category ? "hx-filter-pill-active" : "hx-filter-pill-inactive",
          )}
        >
          Todas categorias
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={buildHref({
              category: cat.id,
              q: current.q,
              level: current.level,
              sort: current.sort,
            })}
            className={cn(
              "hx-filter-pill",
              current.category === cat.id ? "hx-filter-pill-active" : "hx-filter-pill-inactive",
            )}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </Card>
  );
}
