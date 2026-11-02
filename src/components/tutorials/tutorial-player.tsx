"use client";

import { useRef, useState } from "react";
import { ExternalLink, Pause, Play } from "lucide-react";
import {
  getVimeoEmbedUrl,
  getYoutubeEmbedUrl,
  isDirectVideoUrl,
  isTeraBoxUrl,
} from "@/lib/video";
import styles from "./tutorials.module.css";

type Props = {
  url: string;
  provider?: string | null;
  title: string;
  poster?: string | null;
};

/** Envia comandos ao embed do YouTube via IFrame API (mesmo padrão do player de música). */
function postYoutubeCommand(frame: HTMLIFrameElement | null, func: string) {
  frame?.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func, args: [] }),
    "https://www.youtube.com",
  );
}

/**
 * Player dos tutoriais: reprodução e pausa apenas.
 * Sem barra de progresso, sem pular, sem vídeos sugeridos e sem teclado.
 */
export function TutorialPlayer({ url, title, poster }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!url) {
    return <div className={styles.noVideo}>Vídeo indisponível no momento.</div>;
  }

  if (isTeraBoxUrl(url)) {
    return (
      <div className={styles.noVideo}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-5 py-2.5 text-cyan-200 transition hover:bg-cyan-500/20"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir vídeo hospedado
        </a>
      </div>
    );
  }

  const youtube = getYoutubeEmbedUrl(url);
  const vimeo = getVimeoEmbedUrl(url);

  if (youtube || vimeo) {
    let src: string;
    if (youtube) {
      const id = youtube.split("/").filter(Boolean).pop() ?? "";
      const params = new URLSearchParams({
        controls: "0",
        disablekb: "1",
        rel: "0",
        modestbranding: "1",
        playsinline: "1",
        iv_load_policy: "3",
        enablejsapi: "1",
        // Reinicia ao terminar: impede tela final com vídeos sugeridos.
        loop: "1",
        playlist: id,
      });
      src = `${youtube}?${params.toString()}`;
    } else {
      src = `${vimeo}?controls=0&title=0&byline=0&portrait=0&loop=1`;
    }

    const toggle = () => {
      if (youtube) {
        postYoutubeCommand(frameRef.current, playing ? "pauseVideo" : "playVideo");
      } else {
        frameRef.current?.contentWindow?.postMessage(
          JSON.stringify({ method: playing ? "pause" : "play" }),
          "https://player.vimeo.com",
        );
      }
      setPlaying((current) => !current);
    };

    return (
      <div className={styles.playerBox}>
        <iframe
          ref={frameRef}
          src={src}
          title={title}
          allow="autoplay; accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={false}
        />
        <div className={styles.lockedBar}>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pausar vídeo" : "Reproduzir vídeo"}
            className={styles.lockedControl}
          >
            {playing ? (
              <Pause size={17} fill="currentColor" />
            ) : (
              <Play size={17} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          <span>Só pausar</span>
        </div>
      </div>
    );
  }

  if (isDirectVideoUrl(url)) {
    const toggle = () => {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        setFailed(false);
        void video.play().catch(() => setFailed(true));
      }
      else video.pause();
    };

    return (
      <div className={styles.playerBox}>
        <video
          ref={videoRef}
          src={url}
          poster={poster ?? undefined}
          preload="metadata"
          loop
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => { setFailed(true); setPlaying(false); }}
          onContextMenu={(event) => event.preventDefault()}
        >
          {title} — seu navegador não suporta vídeos.
        </video>
        {failed && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 p-5 text-center text-sm text-slate-200">
          <p>Não foi possível reproduzir o vídeo. Verifique sua conexão ou tente novamente.</p>
          <button type="button" className="rounded-lg bg-cyan-500/15 px-4 py-2 text-cyan-300" onClick={() => { setFailed(false); videoRef.current?.load(); }}>Tentar novamente</button>
        </div>}
        <div className={styles.lockedBar}>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pausar vídeo" : "Reproduzir vídeo"}
            className={styles.lockedControl}
          >
            {playing ? (
              <Pause size={17} fill="currentColor" />
            ) : (
              <Play size={17} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          <span>Só pausar</span>
        </div>
      </div>
    );
  }

  return <div className={styles.noVideo}>Vídeo não suportado ou URL inválida.</div>;
}
