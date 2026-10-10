"use client";

import { cn } from "@/lib/cn";

type Props = {
  activityData: Record<string, number>; // date string -> count
  className?: string;
  weeks?: number;
};

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function ActivityHeatmap({ activityData, className, weeks = 12 }: Props) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - weeks * 7);
  startDate.setHours(0, 0, 0, 0);

  // Find max value for color scaling
  const maxValue = Math.max(...Object.values(activityData), 1);

  // Generate weeks data
  const weeksData: { date: Date; day: number; week: number; value: number }[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().slice(0, 10);
    const value = activityData[dateStr] || 0;
    weeksData.push({
      date: new Date(currentDate),
      day: currentDate.getDay(),
      week: Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)),
      value,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const maxWeek = Math.max(...weeksData.map((d) => d.week));

  const getIntensity = (value: number) => {
    if (value === 0) return 0;
    if (value <= maxValue * 0.25) return 1;
    if (value <= maxValue * 0.5) return 2;
    if (value <= maxValue * 0.75) return 3;
    return 4;
  };

  const intensityColors = [
    "hsl(var(--sidebar-border))", // 0
    "hsl(var(--sidebar-highlight)/0.15)", // 1
    "hsl(var(--sidebar-highlight)/0.3)", // 2
    "hsl(var(--sidebar-highlight)/0.5)", // 3
    "hsl(var(--sidebar-highlight))", // 4
  ];

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex items-start gap-2 min-w-max">
        {/* Day labels */}
        <div className="flex flex-col justify-between h-56 pr-2">
          {WEEK_DAYS.map((day, i) => (
            <div
              key={day}
              className={cn(
                "h-7 flex items-end text-[10px] text-slate-500 font-medium select-none",
                i === 0 || i === 6 ? "text-slate-400" : "",
              )}
              style={{ height: "56px" }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex flex-col">
          {/* Month labels */}
          <div className="flex h-5 mb-1">
            {Array.from({ length: maxWeek + 1 }, (_, w) => {
              const weekStart = new Date(startDate);
              weekStart.setDate(startDate.getDate() + w * 7);
              const month = weekStart.getMonth();
              const isNewMonth = w === 0 || new Date(startDate.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000).getMonth() !== month;
              return (
                <div
                  key={w}
                  className={cn("w-7 text-center text-[10px] text-slate-500", !isNewMonth && "invisible")}
                >
                  {isNewMonth ? MONTHS[month] : ""}
                </div>
              );
            })}
          </div>

          {/* Cells */}
          <div className="flex flex-col gap-1">
            {WEEK_DAYS.map((_, dayIndex) => (
              <div key={dayIndex} className="flex gap-1">
                {Array.from({ length: maxWeek + 1 }, (_, weekIndex) => {
                  const cellData = weeksData.find((d) => d.day === dayIndex && d.week === weekIndex);
                  const value = cellData?.value ?? 0;
                  const intensity = getIntensity(value);
                  const isFuture = cellData && cellData.date > today;

                  return (
                    <div
                      key={`${dayIndex}-${weekIndex}`}
                      className={cn(
                        "w-7 h-7 rounded transition-all duration-200 cursor-pointer group",
                        "hover:scale-125 hover:z-10 hover:shadow-lg",
                      )}
                      style={{
                        backgroundColor: isFuture ? "hsl(var(--sidebar-border)/0.5)" : intensityColors[intensity],
                        opacity: isFuture ? 0.5 : 1,
                      }}
                      title={cellData
                        ? `${cellData.date.toLocaleDateString("pt-BR")}: ${value} ${value === 1 ? "atividade" : "atividades"}`
                        : ""}
                    >
                      {intensity > 0 && (
                        <div
                          className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] font-medium text-white rounded bg-slate-900 whitespace-nowrap shadow-lg"
                          style={{ zIndex: 10 }}
                        >
                          {value} {value === 1 ? "atividade" : "atividades"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span>Menos</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-5 h-5 rounded"
              style={{ backgroundColor: intensityColors[i] }}
            />
          ))}
        </div>
        <span>Mais</span>
        <span className="ml-auto text-slate-400">
          {Object.values(activityData).reduce((a, b) => a + b, 0)} atividades nos últimos {weeks} semanas
        </span>
      </div>
    </div>
  );
}