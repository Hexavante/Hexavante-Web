"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/cn";

type DataPoint = {
  date: string;
  xp: number;
  cumulativeXp: number;
};

type Props = {
  data: DataPoint[];
  className?: string;
  showCumulative?: boolean;
};

export function XpTimelineChart({ data, className, showCumulative = true }: Props) {
  if (!data.length) {
    return (
      <div className={cn("h-64 flex items-center justify-center", className)}>
        <p className="text-slate-500 text-sm">Sem dados de XP para exibir</p>
      </div>
    );
  }

  const chartData = data.map((d, i) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    index: i,
  }));

  const maxXp = Math.max(...chartData.map((d) => d.xp));
  const maxCumulative = Math.max(...chartData.map((d) => d.cumulativeXp));

  return (
    <div className={cn("h-72 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="xp-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--sidebar-highlight))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--sidebar-highlight))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="cumulative-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--sidebar-highlight))/0.8" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--sidebar-highlight))/0.8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            strokeOpacity={0.05}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "hsl(var(--sidebar-foreground)/0.5)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "hsl(var(--sidebar-foreground)/0.5)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--surface-strong))",
              border: "1px solid hsl(var(--sidebar-border))",
              borderRadius: "8px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
            labelStyle={{ color: "hsl(var(--sidebar-foreground))", fontWeight: 600 }}
            formatter={(value, name) => {
              const numericValue = typeof value === "number" ? value : Number(value);
              return [
                Number.isFinite(numericValue) ? numericValue.toLocaleString("pt-BR") : String(value),
                String(name) === "xp" ? "XP ganho" : "XP acumulado",
              ];
            }}
            labelFormatter={(label) => `Dia ${label}`}
          />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            iconSize={10}
            formatter={(value) => (
              <span style={{ color: "hsl(var(--sidebar-foreground)/0.7)", fontSize: 12 }}>{value}</span>
            )}
          />
          {showCumulative && (
            <Area
              type="monotone"
              dataKey="cumulativeXp"
              name="XP acumulado"
              stroke="hsl(var(--sidebar-highlight))/0.8"
              strokeWidth={2}
              fill="url(#cumulative-gradient)"
              opacity={0.8}
            />
          )}
          <Area
            type="monotone"
            dataKey="xp"
            name="XP diário"
            stroke="hsl(var(--sidebar-highlight))"
            strokeWidth={2}
            fill="url(#xp-gradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
