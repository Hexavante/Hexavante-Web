"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/cn";

type SkillData = {
  skill: string;
  value: number;
  maxValue: number;
  color: string;
};

type Props = {
  data: SkillData[];
  className?: string;
};

export function SkillsRadarChart({ data, className }: Props) {
  if (!data.length) {
    return (
      <div className={cn("h-72 flex items-center justify-center", className)}>
        <p className="text-slate-500 text-sm">Sem dados de habilidades para exibir</p>
      </div>
    );
  }

  // Normalize values to 0-100 scale
  const chartData = data.map((d) => ({
    subject: d.skill,
    value: d.maxValue > 0 ? Math.round((d.value / d.maxValue) * 100) : 0,
    fullMark: 100,
  }));

  const colors = data.map((d) => d.color);

  return (
    <div className={cn("h-72 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid
            gridType="polygon"
            stroke="currentColor"
            strokeOpacity={0.1}
            radialLines={false}
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "hsl(var(--sidebar-foreground)/0.6)", fontSize: 11 }}
            axisLine={false}
          />
          <PolarRadiusAxis
            angle={30}
            axisLine={false}
            tick={{ fill: "hsl(var(--sidebar-foreground)/0.4)", fontSize: 10 }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--surface-strong))",
              border: "1px solid hsl(var(--sidebar-border))",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "hsl(var(--sidebar-foreground))", fontWeight: 600 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => (value === undefined || value === null ? ["—%", "Proficiência"] : [`${value}%`, "Proficiência"])}
          />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            iconSize={10}
            formatter={(value) => (
              <span style={{ color: "hsl(var(--sidebar-foreground)/0.7)", fontSize: 12 }}>{value}</span>
            )}
          />
          <Radar
            name="Proficiência"
            dataKey="value"
            stroke="hsl(var(--sidebar-highlight))"
            fill="hsl(var(--sidebar-highlight))"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={false}
          />
          <Radar
            name="Máximo"
            dataKey="fullMark"
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
            strokeDasharray="5 5"
            fill="none"
            dot={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}