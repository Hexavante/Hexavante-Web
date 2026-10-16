import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone?: string;
};

export function StatCard({ icon: Icon, label, value, sub, tone = "text-sky-300" }: Props) {
  return (
    <div className="hx-stat-card rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-400/20 hover:bg-white/[0.05]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Icon className={`h-4 w-4 ${tone}`} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs leading-5 text-slate-500">{sub}</p> : null}
    </div>
  );
}
