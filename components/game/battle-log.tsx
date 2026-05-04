"use client";

import { useEffect, useRef } from "react";
import type { LogLine } from "@/lib/game";
import { cn } from "@/lib/utils";

const CLASS_MAP: Record<LogLine["cls"], string> = {
  lA: "text-indigo-700 dark:text-indigo-300",
  lB: "text-orange-700 dark:text-orange-300",
  lS: "text-muted-foreground italic",
  lC: "text-amber-600 font-bold",
};

interface Props {
  log: LogLine[];
}

export function BattleLog({ log }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = 0;
  }, [log.length]);

  // Render newest first.
  return (
    <div
      ref={ref}
      className="h-44 overflow-y-auto bg-muted/40 rounded-md p-3 text-xs leading-relaxed space-y-0.5"
    >
      {log
        .slice()
        .reverse()
        .map((l, i) => (
          <div
            key={log.length - i}
            className={cn(CLASS_MAP[l.cls])}
            dangerouslySetInnerHTML={{ __html: l.txt }}
          />
        ))}
    </div>
  );
}
