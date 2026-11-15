"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Duração em minutos e segundos; o servidor continua recebendo `duration` em segundos. */
export function DurationField({ initialSeconds }: { initialSeconds?: number | null }) {
  const [minutes, setMinutes] = useState(initialSeconds ? String(Math.floor(initialSeconds / 60)) : "");
  const [seconds, setSeconds] = useState(initialSeconds ? String(initialSeconds % 60) : "");

  const total = (Number(minutes) || 0) * 60 + (Number(seconds) || 0);

  return (
    <div>
      <Label htmlFor="durationMinutes">Duração do vídeo</Label>
      <div className="flex items-center gap-2">
        <Input
          id="durationMinutes"
          type="number"
          min={0}
          max={600}
          placeholder="0"
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          className="w-24"
          aria-label="Minutos"
        />
        <span className="text-sm text-slate-400">min</span>
        <Input
          type="number"
          min={0}
          max={59}
          placeholder="0"
          value={seconds}
          onChange={(event) => setSeconds(event.target.value)}
          className="w-24"
          aria-label="Segundos"
        />
        <span className="text-sm text-slate-400">s</span>
      </div>
      <input type="hidden" name="duration" value={total > 0 ? String(total) : ""} />
    </div>
  );
}
