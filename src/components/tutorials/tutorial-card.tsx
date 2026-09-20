import Link from "next/link";
import { Eye, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

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
    <Link
      href={`/tutorials/${slug}`}
      className="group overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition hover:border-cyan-400/30 hover:bg-white/[0.04]"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <img
            src="/brand/icon-tutorial.png"
            alt=""
            aria-hidden
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        )}
        {duration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(duration)}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-cyan-300 transition">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs text-slate-400 line-clamp-2">{description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar src={authorAvatar} alt={authorName} size="sm" />
            <span className="text-xs text-slate-400">{authorName}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {viewCount}
            </span>
          </div>
        </div>
        {categoryName && (
          <span className="mt-2 inline-block rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
            {categoryName}
          </span>
        )}
      </div>
    </Link>
  );
}
