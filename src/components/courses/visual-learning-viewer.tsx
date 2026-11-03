import { Network } from "lucide-react";

export function MindMap({ title, topics }: { title: string; topics: string[] }) {
  if (!topics.length) return null;
  return <section className="my-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
    <header className="mb-3 flex items-center gap-2 font-bold"><Network className="hx-accent-soft" size={20} /><h2>Mapa mental</h2></header>
    <p className="inline-block rounded-xl bg-[hsl(var(--sidebar-highlight)/0.14)] px-3 py-2 font-semibold">{title}</p>
    <ul className="ml-4 border-l border-[hsl(var(--sidebar-highlight)/0.5)] pl-4">
      {topics.map((text, index) => {
        const separator = text.indexOf(":");
        const hasDetail = separator > 0 && !!text.slice(separator + 1).trim();
        return <li key={index} className="relative pt-2 before:absolute before:-left-4 before:top-6 before:w-4 before:border-t before:border-[var(--border)]">
          {hasDetail ? <details className="rounded-lg border border-[var(--border)] px-3 py-2">
            <summary className="cursor-pointer font-medium">{text.slice(0, separator)}</summary>
            <p className="mt-2 text-sm">{text.slice(separator + 1).trim()}</p>
          </details> : <p className="rounded-lg border border-[var(--border)] px-3 py-2">{text}</p>}
        </li>;
      })}
    </ul>
  </section>;
}
