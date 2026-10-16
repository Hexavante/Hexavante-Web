"use client";

import { useEffect, useState } from "react";

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "agora há pouco";
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

type Props = {
  date: Date;
  className?: string;
};

export function ClientRelativeTime({ date, className }: Props) {
  const [label, setLabel] = useState(() => formatRelative(date));

  useEffect(() => {
    const interval = window.setInterval(() => setLabel(formatRelative(date)), 60_000);
    return () => window.clearInterval(interval);
  }, [date]);

  return (
    <span className={className} suppressHydrationWarning>
      {label}
    </span>
  );
}
