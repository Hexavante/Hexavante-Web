"use client";

import { useId, useState } from "react";
import { Video, X } from "lucide-react";

type Props = {
  initialUrl?: string;
  name?: string;
};

export function VideoUploadInput({ initialUrl, name = "videoUrl" }: Props) {
  const [videoUrl, setVideoUrl] = useState(initialUrl ?? "");
  const id = useId();

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
        URL do vídeo
      </label>

      <input type="hidden" name={name} value={videoUrl} />

      {videoUrl ? (
        <div className="relative overflow-hidden rounded-lg border border-cyan-400/30 bg-cyan-500/5 p-3">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5 text-cyan-400" />
            <span className="flex-1 truncate text-sm text-white">{videoUrl}</span>
            <button
              aria-label="Limpar URL do vídeo"
              type="button"
              onClick={() => setVideoUrl("")}
              className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
        <input
          id={id}
          type="text"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
        />

      <p className="text-xs text-slate-500">
        Cole um link do YouTube, Vimeo ou arquivo de vídeo. O endereço pode ser editado a qualquer momento.
      </p>
    </div>
  );
}
