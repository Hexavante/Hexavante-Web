"use client";

import dynamic from "next/dynamic";
import { type ComponentProps } from "react";

// Lazy load the ActivityChart component (uses recharts which is heavy)
const ActivityChartComponent = dynamic(
  () =>
    import("./activity-chart").then((mod) => ({
      default: mod.ActivityChart,
    })),
  {
    loading: () => (
      <div className="h-72 w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-white/10" />
        <div className="h-[85%] w-full animate-pulse rounded bg-white/5" />
      </div>
    ),
    ssr: false,
  }
);

type ActivityChartProps = ComponentProps<typeof import("./activity-chart").ActivityChart>;

export function LazyActivityChart(props: ActivityChartProps) {
  return <ActivityChartComponent {...props} />;
}
