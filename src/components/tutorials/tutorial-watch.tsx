import { MindMap } from "@/components/courses/visual-learning-viewer";
import { splitMindMap } from "@/lib/mind-map";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Eye,
  NotebookPen,
  Play,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { TutorialPlayer } from "./tutorial-player";
import styles from "./tutorials.module.css";
type Props = {
  tutorial: {
    title: string;
    description: string | null;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    duration: number | null;
    viewCount: number;
    category: { name: string } | null;
    author: {
      fullName: string;
      username: string | null;
      avatarUrl: string | null;
    };
    tags: { tag: { id: string; name: string } }[];
  };
};
export function TutorialWatch({ tutorial }: Props) {
  const { description, topics } = splitMindMap(tutorial.description);
  return (
    <div className={styles.watch}>
      <Link href="/tutorials" className={styles.back}>
        <ArrowLeft size={16} /> Explorar tutoriais
      </Link>
      <header className={styles.watchHeading}>
        <span className={styles.eyebrow}>
          <Play size={14} /> {tutorial.category?.name ?? "APRENDA NA PRÁTICA"}
        </span>
        <h1>{tutorial.title}</h1>
        <div className={styles.metadata}>
          {tutorial.duration != null && tutorial.duration > 0 && (
            <span>
              <Clock size={14} />
              {Math.floor(tutorial.duration / 60)}:
              {String(tutorial.duration % 60).padStart(2, "0")}
            </span>
          )}
          <span>
            <Eye size={14} />
            {tutorial.viewCount} visualizações
          </span>
        </div>
        {topics.length > 0 && <a className="hx-accent-link" href="#mapa-mental">Ver mapa mental ↓</a>}
      </header>
      <div className={styles.watchGrid}>
        <div className={styles.mainColumn}>
          <div className={styles.playerFrame}>
            <TutorialPlayer
              url={tutorial.videoUrl ?? ""}
              title={tutorial.title}
              poster={tutorial.thumbnailUrl}
            />
          </div>
          {topics.length > 0 && <div className="scroll-mt-28" id="mapa-mental"><MindMap title={tutorial.title} topics={topics} /></div>}
          <section className={styles.about}>
            <span className={styles.eyebrow}>ENTENDA E COLOQUE EM PRÁTICA</span>
            <h2>Sobre este tutorial</h2>
            <p>
              {description ||
                "Assista ao tutorial e coloque o que aprendeu em prática."}
            </p>
            {tutorial.tags.length > 0 && (
              <div className={styles.tags}>
                {tutorial.tags.map(({ tag }) => (
                  <span key={tag.id}>#{tag.name}</span>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className={styles.watchAside}>
          <section className={styles.creator}>
            <span className={styles.eyebrow}>QUEM ENSINA</span>
            <div className={styles.creatorIdentity}>
              <Avatar
                src={tutorial.author.avatarUrl}
                alt={tutorial.author.fullName}
                size="md"
              />
              <div>
                <strong>{tutorial.author.fullName}</strong>
                {tutorial.author.username && (
                  <small>@{tutorial.author.username}</small>
                )}
              </div>
            </div>
            <p>Conhecimento compartilhado para o seu próximo passo.</p>
          </section>
          <section className={styles.studyTip}>
            <NotebookPen size={24} />
            <h2>Transforme em aprendizado</h2>
            <p>
              Pause, experimente e guarde suas ideias no caderno de estudos.
            </p>
            <Link href="/anotacoes">
              Abrir meu caderno <ArrowLeft size={15} className="rotate-180" />
            </Link>
          </section>
          <Link className={styles.exploreLink} href="/tutorials">
            <BookOpen size={17} /> Descobrir outros tutoriais
          </Link>
        </aside>
      </div>
    </div>
  );
}
