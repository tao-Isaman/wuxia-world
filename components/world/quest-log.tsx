"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getQuest } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { cn } from "@/lib/utils";

export function QuestLog() {
  const quests = useWorldStore((s) => s.quests);
  const entries = Object.values(quests);

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-3">
          <h3 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">
            ภารกิจ
          </h3>
          <p className="text-xs text-muted-foreground italic">ยังไม่มีภารกิจ</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <h3 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
          ภารกิจ
        </h3>
        {entries.map((q) => {
          const def = getQuest(q.id);
          if (!def) return null;
          const stage = def.stages[q.stage];
          return (
            <div key={q.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <strong className="text-sm">{def.name}</strong>
                <Badge
                  className={cn(
                    "text-[9px]",
                    q.status === "active" && "bg-amber-100 text-amber-800",
                    q.status === "done" && "bg-emerald-100 text-emerald-800",
                    q.status === "failed" && "bg-rose-100 text-rose-800",
                  )}
                >
                  {q.status === "active" ? "กำลังทำ" : q.status === "done" ? "สำเร็จ" : "ล้มเหลว"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{def.description}</p>
              {q.status === "active" && stage && (
                <p className="text-xs pl-2 border-l-2 border-amber-400">
                  ขั้นที่ {q.stage + 1}/{def.stages.length}: {stage.description}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
