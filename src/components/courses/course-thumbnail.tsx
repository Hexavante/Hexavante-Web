import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  url?: string | null;
  title: string;
  className?: string;
  priority?: boolean;
};

export function CourseThumbnail({ url, title, className, priority }: Props) {
  if (url) {
    return (
      <div className={cn("relative overflow-hidden bg-slate-900", className)}>
        <Image
          src={url}
          alt={`Capa do curso ${title}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 400px"
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-slate-900", className)} aria-hidden>
      <Image
        src="/brand/icon-curso.png"
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, 400px"
      />
    </div>
  );
}
