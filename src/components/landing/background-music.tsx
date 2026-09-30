"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Volume2, VolumeX, Play, Pause, ChevronDown, ChevronUp } from "lucide-react";

const DEFAULT_VIDEO_ID = "MX-iaTDEyGI";
const DEFAULT_VOLUME = 70;
const COMMAND_DELAY_MS = 800;

const KEY_VIDEO = "hx_bg_video_id";
const KEY_VOLUME = "hx_bg_volume";
const KEY_PLAYING = "hx_bg_playing";
/** Chave legada (compatibilidade com quem já tinha preferência salva). */
const KEY_MUTED_LEGACY = "hx_bg_muted";

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const URL_ERROR = "Use um link do YouTube (watch, youtu.be ou shorts).";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Extrai o id de um vídeo do YouTube a partir de URL colada pelo usuário.
 * Aceita watch?v=, youtu.be/<id>, /shorts/, /embed/, /live/, /v/, com ou sem
 * esquema, e ignora parâmetros extras (`&t=`, `?si=`, playlists...).
 */
export function parseYouTubeVideoId(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;
  // Também aceita um id puro colado direto.
  if (VIDEO_ID_RE.test(input)) return input;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return VIDEO_ID_RE.test(id) ? id : null;
  }

  const isYoutube =
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtube-nocookie.com" ||
    host.endsWith(".youtube-nocookie.com");

  if (isYoutube) {
    const v = url.searchParams.get("v");
    if (v && VIDEO_ID_RE.test(v)) return v;

    const [first, second] = url.pathname.split("/").filter(Boolean);
    if (
      second &&
      (first === "shorts" ||
        first === "embed" ||
        first === "live" ||
        first === "v") &&
      VIDEO_ID_RE.test(second)
    ) {
      return second;
    }
  }

  return null;
}

function readStorage(): { videoId: string | null; volume: number | null; playing: boolean | null } {
  const result = { videoId: null as string | null, volume: null as number | null, playing: null as boolean | null };
  try {
    const video = localStorage.getItem(KEY_VIDEO);
    if (video && VIDEO_ID_RE.test(video)) result.videoId = video;

    const rawVolume = localStorage.getItem(KEY_VOLUME);
    if (rawVolume !== null) {
      const parsed = Number.parseInt(rawVolume, 10);
      if (Number.isFinite(parsed)) result.volume = clamp(parsed, 0, 100);
    }

    const rawPlaying = localStorage.getItem(KEY_PLAYING);
    if (rawPlaying !== null) {
      result.playing = rawPlaying === "true";
    } else {
      // Compatibilidade: sem `hx_bg_playing`, quem tinha `hx_bg_muted === "false"`
      // era quem estava ouvindo → retoma tocando.
      const muted = localStorage.getItem(KEY_MUTED_LEGACY);
      if (muted !== null) result.playing = muted === "false";
    }
  } catch {
    // localStorage indisponível (modo privado/restrito) — segue com defaults.
  }
  return result;
}

export function BackgroundMusic() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playingRef = useRef(false);
  const volumeRef = useRef(DEFAULT_VOLUME);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [videoId, setVideoId] = useState(DEFAULT_VIDEO_ID);
  /** Incrementa para rearmar a sequência de comandos (autoplay) do iframe. */
  const [replayToken, setReplayToken] = useState(0);

  const [urlDraft, setUrlDraft] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const post = useCallback((fn: string, arg?: unknown) => {
    const target = iframeRef.current?.contentWindow;
    if (!target) return;
    const message =
      arg !== undefined
        ? { event: "command", func: fn, args: [arg] }
        : { event: "command", func: fn, args: [] };
    try {
      target.postMessage(JSON.stringify(message), "*");
    } catch {
      // janela do iframe indisponível — ignorado
    }
  }, []);

  const persistPlaying = useCallback((value: boolean) => {
    try {
      localStorage.setItem(KEY_PLAYING, String(value));
      // Espelho da chave legada: "não silenciado" só quando tocando com volume.
      localStorage.setItem(
        KEY_MUTED_LEGACY,
        String(!(value && volumeRef.current > 0)),
      );
    } catch {
      // ignora
    }
  }, []);

  const persistVolume = useCallback((value: number) => {
    try {
      localStorage.setItem(KEY_VOLUME, String(value));
      if (localStorage.getItem(KEY_PLAYING) !== null) {
        localStorage.setItem(
          KEY_MUTED_LEGACY,
          String(!(playingRef.current && value > 0)),
        );
      }
    } catch {
      // ignora
    }
  }, []);

  // Restaura o estado salvo (iframe só monta depois deste efeito). O
  // localStorage é um sistema externo: a leitura precisa acontecer na montagem
  // (não dá para fazer no render sem quebrar a hidratação do SSR).
  /* eslint-disable react-hooks/set-state-in-effect -- restore único na montagem */
  useEffect(() => {
    const stored = readStorage();
    if (stored.videoId) setVideoId(stored.videoId);
    if (stored.volume !== null) {
      volumeRef.current = stored.volume;
      setVolume(stored.volume);
    }
    if (stored.playing) {
      playingRef.current = true;
      setStarted(true);
      setPlaying(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Depois de montar (ou trocar de vídeo), espera o player carregar e só então
  // manda os comandos. Nunca desmonta o iframe depois que `started` ficou true.
  useEffect(() => {
    if (!started) return;
    const timer = window.setTimeout(() => {
      if (playingRef.current) {
        post("playVideo");
        post("unMute");
        post("setVolume", volumeRef.current);
      } else {
        post("pauseVideo");
      }
    }, COMMAND_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [started, videoId, replayToken, post]);

  const startPlayback = useCallback(() => {
    playingRef.current = true;
    setStarted(true);
    setPlaying(true);
    setReplayToken((token) => token + 1);
    persistPlaying(true);
  }, [persistPlaying]);

  const togglePlay = () => {
    if (!started) {
      // Primeiro play: exige gesto do usuário (política de autoplay).
      startPlayback();
      return;
    }
    const next = !playing;
    playingRef.current = next;
    setPlaying(next);
    persistPlaying(next);
    if (next) {
      post("playVideo");
      post("unMute");
      post("setVolume", volumeRef.current);
    } else {
      post("pauseVideo");
    }
  };

  const changeVolume = (raw: number) => {
    const next = clamp(Math.round(raw), 0, 100);
    volumeRef.current = next;
    setVolume(next);
    persistVolume(next);
    if (!started) return;
    post("setVolume", next);
    if (next === 0) {
      post("mute");
    } else if (playingRef.current) {
      post("unMute");
    }
  };

  const handleUrlSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = parseYouTubeVideoId(urlDraft);
    if (!id) {
      setUrlError(URL_ERROR);
      return;
    }
    setUrlError(null);
    setUrlDraft("");
    try {
      localStorage.setItem(KEY_VIDEO, id);
    } catch {
      // ignora
    }
    if (id !== videoId) setVideoId(id);

    // Trocar de vídeo (ou confirmar o atual) sempre começa a tocar: rearma a
    // sequência de comandos e, se o iframe ainda não existe, monta ele.
    if (!started) {
      startPlayback();
    } else {
      playingRef.current = true;
      setPlaying(true);
      persistPlaying(true);
      setReplayToken((token) => token + 1);
    }
  };

  // O iframe fica no DOM desde o primeiro play até o fim da sessão; quando o
  // painel está recolhido ele só é escondido visualmente (sem display:none,
  // para o áudio não parar).
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&rel=0&loop=1&playlist=${videoId}`;

  const iconButton =
    "grid place-items-center rounded-full border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground)/0.7)] shadow-lg backdrop-blur transition hover:border-[hsl(var(--sidebar-foreground)/0.25)] hover:text-[hsl(var(--sidebar-foreground))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--sidebar-ring))]";

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2">
      {started && (
        <div
          aria-hidden={!expanded}
          className={
            expanded
              ? "overflow-hidden rounded-xl border border-[hsl(var(--sidebar-border))] bg-black shadow-2xl"
              : "pointer-events-none absolute right-0 top-0 h-0 w-0 overflow-hidden opacity-0"
          }
        >
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title="Player de música de fundo"
            width={320}
            height={180}
            tabIndex={-1}
            allow="autoplay; encrypted-media"
            className="pointer-events-none"
          />
        </div>
      )}

      {started && expanded && (
        <div className="w-80 rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] p-3 shadow-2xl">
          <form onSubmit={handleUrlSubmit} className="flex items-center gap-2">
            <input
              type="text"
              inputMode="url"
              value={urlDraft}
              onChange={(event) => {
                setUrlDraft(event.target.value);
                if (urlError) setUrlError(null);
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              aria-label="Link do vídeo do YouTube"
              className="h-10 min-w-0 flex-1 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-foreground)/0.06)] px-3 text-sm text-[hsl(var(--sidebar-foreground))] placeholder:text-[hsl(var(--sidebar-foreground)/0.45)] focus:border-[hsl(var(--sidebar-ring))] focus:outline-none"
            />
            <button
              type="submit"
              className="hx-btn-primary h-10 shrink-0 px-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--sidebar-ring))]"
            >
              Tocar
            </button>
          </form>

          {urlError && (
            <p
              role="alert"
              className="mt-1.5 inline-block rounded-md bg-rose-700 px-2 py-1 text-xs font-semibold text-slate-50"
            >
              {urlError}
            </p>
          )}

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              title={playing ? "Pausar música" : "Tocar música"}
              aria-label={playing ? "Pausar música" : "Tocar música"}
              className={`${iconButton} h-10 w-10 shrink-0`}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            {volume === 0 ? (
              <VolumeX className="h-4 w-4 shrink-0 text-[hsl(var(--sidebar-foreground)/0.5)]" aria-hidden />
            ) : (
              <Volume2 className="h-4 w-4 shrink-0 text-[hsl(var(--sidebar-foreground)/0.5)]" aria-hidden />
            )}

            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volume}
              onChange={(event) => changeVolume(Number(event.target.value))}
              aria-label="Volume da música"
              title={`Volume: ${volume}`}
              className="h-10 min-w-0 flex-1 cursor-pointer accent-[hsl(var(--sidebar-highlight))]"
            />
            <span className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums text-[hsl(var(--sidebar-foreground)/0.6)]">
              {volume}
            </span>
          </div>
        </div>
      )}

      {started && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? "Recolher player" : "Mostrar player"}
          title={expanded ? "Recolher player" : "Mostrar player"}
          className={`${iconButton} h-10 w-10`}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      )}

      <button
        type="button"
        onClick={togglePlay}
        title={
          !started
            ? "Tocar música de fundo"
            : playing
              ? "Pausar música"
              : "Retomar música"
        }
        aria-label={
          !started
            ? "Tocar música de fundo"
            : playing
              ? "Pausar música"
              : "Retomar música"
        }
        className={`${iconButton} h-11 w-11`}
      >
        {!started || !playing ? <Play className="h-4.5 w-4.5" /> : <Pause className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
}
