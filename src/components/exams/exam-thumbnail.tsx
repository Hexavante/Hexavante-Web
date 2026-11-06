"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";

import Image from "next/image";

import { cn } from "@/lib/cn";

type Props = {
  url?: string | null;

  title: string;

  className?: string;

  priority?: boolean;
};

export function ExamThumbnail({ url, title, className, priority }: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (url && failedUrl !== url) {
    return (
      <div className={cn("relative overflow-hidden bg-slate-900", className)}>
        <Image
          src={url}
          alt={`Capa do simulado ${title}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 400px"
          priority={priority}
          unoptimized
          onError={() => setFailedUrl(url)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-teal-900/50 to-slate-900",

        className,
      )}
      aria-hidden
    >
      <ClipboardList className="h-10 w-10 text-teal-400/50" />
    </div>
  );
}
