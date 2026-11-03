"use client";

import { useState } from "react";
import { MindMap } from "./visual-learning-viewer";

export function MindMapField({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <div className="space-y-2 rounded-xl border border-[var(--border)] p-3">
    <label className="block font-semibold">Mapa mental (opcional)
      <span className="my-1 block text-sm font-normal opacity-75">O título vira o centro do mapa. Escreva um ramo por linha e use dois-pontos para acrescentar uma explicação.</span>
      <textarea name="mindMap" rows={3} className="w-full rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm" placeholder={"Variáveis: guardam valores\nCondições: escolhem um caminho"} value={value} onChange={e => setValue(e.target.value)} />
    </label>
    <MindMap title="Prévia dos ramos" topics={value.split("\n").map(line => line.trim()).filter(Boolean)} />
  </div>;
}
