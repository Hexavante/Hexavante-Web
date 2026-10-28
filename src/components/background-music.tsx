"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Headphones,
} from "lucide-react";
import styles from "./background-music.module.css";

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

function readStorage(): {
  videoId: string | null;
  volume: number | null;
  playing: boolean | null;
} {
  const result = {
    videoId: null as string | null,
    volume: null as number | null,
    playing: null as boolean | null,
  };
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
  const lastVolumeRef = useRef(DEFAULT_VOLUME);

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
      target.postMessage(JSON.stringify(message), "https://www.youtube.com");
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
      if (stored.volume > 0) lastVolumeRef.current = stored.volume;
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
    if (next > 0) lastVolumeRef.current = next;
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

  return (
    <section className={styles.player} aria-label="Música para estudar">
      <div
        id="study-music-panel"
        className={expanded ? styles.panel : styles.collapsed}
        aria-hidden={!expanded}
        inert={!expanded}
      >
        <header className={styles.header}>
          <span className={styles.art}>
            <Headphones size={23} />
          </span>
          <div>
            <small>SEU MOMENTO DE FOCO</small>
            <h2>Música para estudar</h2>
          </div>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setExpanded(false)}
            aria-label="Recolher player"
          >
            <ChevronDown size={19} />
          </button>
        </header>
        {started ? (
          <iframe
            ref={iframeRef}
            tabIndex={-1}
            src={embedUrl}
            title="Player de música de fundo"
            width={320}
            height={180}
            allow="autoplay; encrypted-media"
            className={styles.video}
          />
        ) : (
          <div className={styles.placeholder}>
            <Headphones size={32} />
            <strong>Dê ritmo aos seus estudos</strong>
            <span>Comece com nossa seleção ou escolha um vídeo.</span>
          </div>
        )}
        <div className={styles.controls}>
          <button
            type="button"
            onClick={togglePlay}
            className={styles.play}
            aria-label={playing ? "Pausar música" : "Tocar música"}
          >
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <div className={styles.track}>
            <strong>
              {videoId === DEFAULT_VIDEO_ID
                ? "Seleção Hexavante"
                : "Seu vídeo do YouTube"}
            </strong>
            <small>
              {playing
                ? "Reprodução ativada"
                : "Pronto para o seu próximo foco"}
            </small>
          </div>
        </div>
        <div className={styles.volume}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={volume === 0 ? "Ativar som" : "Silenciar"}
            onClick={() =>
              changeVolume(volume === 0 ? lastVolumeRef.current : 0)
            }
          >
            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(event) => changeVolume(Number(event.target.value))}
            aria-label="Volume da música"
          />
          <output>{volume}%</output>
        </div>
        <form onSubmit={handleUrlSubmit} className={styles.form}>
          <label htmlFor="study-music-url">Sua música, seu ritmo</label>
          <div>
            <input
              id="study-music-url"
              type="text"
              inputMode="url"
              value={urlDraft}
              onChange={(event) => {
                setUrlDraft(event.target.value);
                setUrlError(null);
              }}
              placeholder="Cole um link do YouTube"
              aria-invalid={Boolean(urlError)}
              aria-describedby={urlError ? "study-music-error" : undefined}
            />
            <button type="submit">Tocar</button>
          </div>
          {urlError && (
            <p id="study-music-error" role="alert">
              {urlError}
            </p>
          )}
          <small>O vídeo precisa permitir reprodução em outros sites.</small>
        </form>
      </div>
      <div className={styles.dock}>
        <button
          type="button"
          className={styles.expand}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls="study-music-panel"
        >
          <Headphones size={18} />
          <span>Música de foco</span>
          {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        <button
          type="button"
          className={styles.dockPlay}
          onClick={togglePlay}
          aria-label={playing ? "Pausar música" : "Tocar música"}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
      </div>
    </section>
  );
}
