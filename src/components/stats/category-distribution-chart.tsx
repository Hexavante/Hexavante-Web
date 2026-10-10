"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/cn";

type CategoryData = {
  category: string;
  value: number;
  percentage?: number;
  color: string;
  label?: string;
};

type Props = {
  data: CategoryData[];
  className?: string;
  title?: string;
  valueKey?: "value" | "percentage";
};

export function CategoryDistributionChart({ data, className, title, valueKey = "value" }: Props) {
  if (!data.length) {
    return (
      <div className={cn("h-64 flex items-center justify-center", className)}>
        <p className="text-slate-500 text-sm">Sem dados para exibir</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d[valueKey] ?? 0));
  const totalValue = data.reduce((sum, d) => sum + (d[valueKey] ?? 0), 0);

  return (
    <div className={cn("h-64 w-full", className)}>
      {title && (
        <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.05} horizontal={false} />
          <XAxis type="number" tick={{ display: "none" }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="category"
            width={100}
            tick={{ fill: "hsl(var(--sidebar-foreground)/0.7)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--surface-strong))",
              border: "1px solid hsl(var(--sidebar-border))",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "hsl(var(--sidebar-foreground))", fontWeight: 600 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
              if (value === undefined || value === null) return ["—", name ?? "—"];
              const num = Number(value);
              return [valueKey === "percentage" ? `${num}%` : num.toLocaleString("pt-BR"), name ?? "—"];
            }}
            labelFormatter={(label) => {
              const item = data.find((d) => d.category === label);
              return item?.label ?? label;
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            iconSize={10}
            formatter={(value) => (
              <span style={{ color: "hsl(var(--sidebar-foreground)/0.7)", fontSize: 12 }}>{value}</span>
            )}
          />
          <Bar
            dataKey={valueKey}
            name={valueKey === "percentage" ? "Porcentagem" : "Quantidade"}
            radius={[0, 4, 4, 0]}
            maxBarSize={32}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
        <span>Total: <span className="text-white font-medium">{totalValue.toLocaleString("pt-BR")}</span></span>
        <span>Categorias: <span className="text-white font-medium">{data.length}</span></span>
        {data.length > 0 && (
          <span>
            Maior:{" "}
            <span className="text-white font-medium">
              {data.reduce((max: CategoryData, d: CategoryData) => ((d[valueKey] ?? 0) > (max[valueKey] ?? 0) ? d : max)).category}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}