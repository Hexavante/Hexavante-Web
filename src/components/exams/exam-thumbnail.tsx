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
        "relative flex flex-col justify-end overflow-hidden bg-[hsl(var(--sidebar-highlight)/0.1)] p-4",

        className,
      )}
      aria-hidden
    >
      {/* Sem capa: o próprio título vira a capa, com o ícone grande ao fundo. */}
      <ClipboardList className="absolute -right-4 -top-4 h-28 w-28 rotate-12 text-[hsl(var(--sidebar-highlight)/0.14)]" />
      <p className="relative line-clamp-2 text-lg font-black leading-tight tracking-tight text-white/90">{title}</p>
    </div>
  );
}
