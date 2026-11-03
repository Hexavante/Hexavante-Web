export function CreationSection({ number, title, hint, children }: {
  number: string; title: string; hint: string; children: React.ReactNode;
}) {
  return <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
    <header className="flex items-start gap-3 border-b border-[var(--border)] pb-4">
      <span className="hx-accent-soft rounded-lg bg-[hsl(var(--sidebar-highlight)/0.1)] px-2.5 py-1 font-mono text-sm font-bold">{number}</span>
      <div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm opacity-75">{hint}</p></div>
    </header>{children}
  </section>;
}
