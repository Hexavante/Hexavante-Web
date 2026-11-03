import { splitMindMap } from "@/lib/mind-map";
import Link from "next/link";
import { Eye, Play } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import styles from "./tutorials.module.css";

type Props = {
  slug: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  categoryName?: string;
  authorName: string;
  authorAvatar?: string | null;
  duration?: number | null;
  viewCount: number;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TutorialCard({
  slug,
  title,
  description,
  thumbnailUrl,
  categoryName,
  authorName,
  authorAvatar,
  duration,
  viewCount,
}: Props) {
  return (
    <Link href={`/tutorials/${slug}`} className={styles.card}>
      <div className={styles.cover}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className={styles.coverImage} />
        ) : (
          <div className={styles.generatedCover} aria-hidden>
            <span className={styles.coverLabel}>{categoryName ?? "Tutorial"}</span>
            <strong className={styles.coverTitle}>{title}</strong>
            <i className={styles.coverLines} />
          </div>
        )}
        <span className={styles.playIcon} aria-hidden>
          <Play size={15} fill="currentColor" />
        </span>
        {duration != null && duration > 0 && (
          <span className={styles.duration}>{formatDuration(duration)}</span>
        )}
      </div>
      <div className={styles.cardBody}>
        {categoryName && <span className={styles.category}>{categoryName}</span>}
        <h3>{title}</h3>
        {splitMindMap(description).description && <p>{splitMindMap(description).description}</p>}
        <div className={styles.author}>
          <Avatar src={authorAvatar} alt={authorName} size="sm" />
          <span>{authorName}</span>
          <span className={styles.views}>
            <Eye size={13} aria-hidden /> {viewCount}
          </span>
        </div>
        <div className={styles.cardFooter}>
          Assistir agora
          <Play size={13} aria-hidden />
        </div>
      </div>
    </Link>
  );
}
