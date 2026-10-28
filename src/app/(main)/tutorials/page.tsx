import { Search, Video } from "lucide-react";
import { TutorialCard } from "@/components/tutorials/tutorial-card";
import { TutorialFilters } from "@/components/tutorials/tutorial-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell } from "@/components/ui/page-shell";
import { listCategories } from "@/services/course.service";
import { searchPublishedTutorials } from "@/services/tutorial.service";
import styles from "@/components/tutorials/tutorials.module.css";

type Props = {
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: string;
  }>;
};

export default async function TutorialsPage({ searchParams }: Props) {
  const params = await searchParams;
  const sort = params.sort === "popular" ? "popular" : "recent";

  const [tutorials, categories] = await Promise.all([
    searchPublishedTutorials({
      categoryId: params.category,
      q: params.q,
      sort,
    }),
    listCategories(),
  ]);

  return (
    <PageShell>
      <section className={`${styles.hero} anim-enter anim-d1`}>
        <div>
          <span className={styles.eyebrow}>
            <Video size={13} aria-hidden /> Catálogo de vídeos
          </span>
          <h1>
            Aprenda em <em>vídeo</em>, no seu ritmo
          </h1>
          <p>
            Tutoriais curtos e diretos: escolha um tema, assista em minutos e
            coloque em prática no seu caderno de estudos.
          </p>
        </div>
        <div className={styles.heroCount}>
          <strong>{tutorials.length}</strong>{" "}
          {tutorials.length === 1 ? "tutorial encontrado" : "tutoriais encontrados"}
        </div>
      </section>

      <div className="anim-enter anim-d2">
        <TutorialFilters
          categories={categories}
          current={{
            category: params.category,
            q: params.q,
            sort,
          }}
        />
      </div>

      {tutorials.length === 0 ? (
        <div className="anim-enter-fade anim-d3">
          <EmptyState
            icon={Search}
            title="Nenhum tutorial encontrado."
            description="Tente outros termos de busca ou remova alguns filtros."
          />
        </div>
      ) : (
        <>
          <div className={styles.results}>
            <h2>Vídeos para assistir</h2>
            <span>
              {sort === "popular" ? "Ordenados por mais vistos" : "Ordenados por mais recentes"}
            </span>
          </div>
          <div className={styles.grid}>
            {tutorials.map((tut) => (
              <div key={tut.id}>
                <TutorialCard
                  slug={tut.slug}
                  title={tut.title}
                  description={tut.description}
                  thumbnailUrl={tut.thumbnailUrl}
                  categoryName={tut.category?.name}
                  authorName={tut.author.fullName}
                  authorAvatar={tut.author.avatarUrl}
                  duration={tut.duration}
                  viewCount={tut.viewCount}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
