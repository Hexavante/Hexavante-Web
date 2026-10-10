"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Dot,
} from "recharts";
import { cn } from "@/lib/cn";

type WeeklyDataPoint = {
  week: string;
  xp: number;
  lessons: number;
  exams: number;
  streak: number;
};

type Props = {
  data: WeeklyDataPoint[];
  className?: string;
};

export function WeeklyProgressChart({ data, className }: Props) {
  if (!data.length) {
    return (
      <div className={cn("h-64 flex items-center justify-center", className)}>
        <p className="text-slate-500 text-sm">Sem dados semanais para exibir</p>
      </div>
    );
  }

  return (
    <div className={cn("h-72 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="xp-weekly-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--sidebar-highlight))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--sidebar-highlight))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lessons-weekly-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            strokeOpacity={0.05}
            vertical={false}
          />
          <XAxis
            dataKey="week"
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
            labelFormatter={(week) => `Semana ${week}`}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                xp: "XP ganho",
                lessons: "Aulas concluídas",
                exams: "Simulados",
                streak: "Dias de sequência",
              };
              const numericValue = typeof value === "number" ? value : Number(value);
              const key = String(name);
              return [Number.isFinite(numericValue) ? numericValue.toLocaleString("pt-BR") : String(value), labels[key] ?? key];
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            iconSize={10}
            formatter={(value) => (
              <span style={{ color: "hsl(var(--sidebar-foreground)/0.7)", fontSize: 12 }}>{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="xp"
            name="XP ganho"
            stroke="hsl(var(--sidebar-highlight))"
            strokeWidth={2}
            dot={<Dot r={4} strokeWidth={2} fill="hsl(var(--background))" />}
            activeDot={{ r: 6, strokeWidth: 3 }}
          />
          <Line
            type="monotone"
            dataKey="lessons"
            name="Aulas concluídas"
            stroke="#22d3ee"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={<Dot r={4} strokeWidth={2} fill="hsl(var(--background))" />}
            activeDot={{ r: 6, strokeWidth: 3 }}
          />
          <Line
            type="monotone"
            dataKey="exams"
            name="Simulados"
            stroke="#f97316"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={<Dot r={4} strokeWidth={2} fill="hsl(var(--background))" />}
            activeDot={{ r: 6, strokeWidth: 3 }}
          />
          <Line
            type="monotone"
            dataKey="streak"
            name="Sequência (dias)"
            stroke="#4ade80"
            strokeWidth={2}
            dot={<Dot r={4} strokeWidth={2} fill="hsl(var(--background))" />}
            activeDot={{ r: 6, strokeWidth: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
