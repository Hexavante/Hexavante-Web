import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import styles from "./tutorials.module.css";

type Category = { id: string; name: string };

type Props = {
  categories: Category[];
  current: {
    category?: string;
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
  return qs ? `/tutorials?${qs}` : "/tutorials";
}

export function TutorialFilters({ categories, current }: Props) {
  return (
    <form method="get" className={styles.filters}>
      <div className={styles.filterTop}>
        <div>
          <label htmlFor="q" className={styles.filterLabel}>
            Buscar
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={current.q ?? ""}
            placeholder="Nome ou descrição do tutorial..."
          />
        </div>
        <div className={styles.sortWrap}>
          <label htmlFor="sort" className={styles.filterLabel}>
            Ordenar
          </label>
          <NativeSelect id="sort" name="sort" defaultValue={current.sort ?? "recent"}>
            <option value="recent">Mais recentes</option>
            <option value="popular">Mais vistos</option>
          </NativeSelect>
        </div>
        {current.category && <input type="hidden" name="category" value={current.category} />}
        <Button type="submit">
          <Search className="h-4 w-4" />
          Filtrar
        </Button>
      </div>

      {categories.length > 0 && (
        <div className={styles.pills}>
          <Link
            href={buildHref({ q: current.q, sort: current.sort })}
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
              href={buildHref({ category: cat.id, q: current.q, sort: current.sort })}
              className={cn(
                "hx-filter-pill",
                current.category === cat.id ? "hx-filter-pill-active" : "hx-filter-pill-inactive",
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}
    </form>
  );
}
