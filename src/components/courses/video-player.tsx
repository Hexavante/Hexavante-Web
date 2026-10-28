import { ExternalLink, Play } from "lucide-react";
import { getVideoEmbedUrl, isDirectVideoUrl, isTeraBoxUrl } from "@/lib/video";

type VideoPlayerProps = {
  url: string;
  provider?: string | null;
  title?: string;
  poster?: string | null;
};

function getFileName(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.split("/").pop() ?? "vídeo";
    return decodeURIComponent(path).replace(/\.[^.]+$/, "");
  } catch {
    return "vídeo";
  }
}

export function VideoPlayer({ url, provider, title, poster }: VideoPlayerProps) {
  const embedUrl = getVideoEmbedUrl(url, provider);
  const label = title ?? "Videoaula";

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title={label}
        className="aspect-video w-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (isDirectVideoUrl(url)) {
    return (
      <video
        src={url}
        poster={poster ?? undefined}
        preload="metadata"
        controls
        className="aspect-video w-full rounded-lg bg-black"
      >
        {label} — seu navegador não suporta vídeos.
      </video>
    );
  }

  if (isTeraBoxUrl(url)) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg bg-gradient-to-br from-sky-900/30 to-slate-900 border border-white/10 gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-sky-500/15 text-sky-400">
          <Play className="h-7 w-7 ml-0.5" />
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-medium text-white">{getFileName(url)}</p>
          <p className="mt-1 text-xs text-slate-400">Vídeo hospedado no TeraBox</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-500/20 border border-sky-500/30 px-5 py-2.5 text-sm font-medium text-sky-300 transition hover:bg-sky-500/30 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir vídeo no TeraBox
        </a>
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900 border border-white/10 gap-3">
      <Play className="h-10 w-10 text-slate-500" />
      <p className="text-sm text-slate-400">Vídeo não disponível ou URL inválida.</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-sky-400 hover:underline"
      >
        Abrir link original
      </a>
    </div>
  );
}
