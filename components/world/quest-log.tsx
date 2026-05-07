"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getItem, getQuest, type QuestReward } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { cn } from "@/lib/utils";

// Quest log sidebar. Three buckets:
//   - Active   → currently underway (shows current stage + brief summary)
//   - Done     → completed for the run (success path)
//   - Failed   → abandoned or failed; only side quests can fail and they
//                stay in this bucket as a record (never re-offered)
//
// Side quests get a ✦ marker before the name; main quests use ★. Rewards
// preview only appears for active quests where the player has yet to claim.
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

  const active = entries.filter((q) => q.status === "active");
  const done = entries.filter((q) => q.status === "done");
  const failed = entries.filter((q) => q.status === "failed");

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <h3 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
          ภารกิจ
        </h3>

        {active.length > 0 && (
          <Section title="กำลังทำ" tone="active">
            {active.map((q) => (
              <QuestRow key={q.id} questId={q.id} status="active" stage={q.stage} />
            ))}
          </Section>
        )}

        {done.length > 0 && (
          <Section title="สำเร็จแล้ว" tone="done">
            {done.map((q) => (
              <QuestRow key={q.id} questId={q.id} status="done" stage={q.stage} />
            ))}
          </Section>
        )}

        {failed.length > 0 && (
          <Section title="ล้มเหลว" tone="failed">
            {failed.map((q) => (
              <QuestRow key={q.id} questId={q.id} status="failed" stage={q.stage} />
            ))}
          </Section>
        )}
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "active" | "done" | "failed";
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "text-[10px] font-semibold tracking-wider uppercase",
          tone === "active" && "text-amber-700",
          tone === "done" && "text-emerald-700",
          tone === "failed" && "text-rose-700",
        )}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function QuestRow({
  questId,
  status,
  stage,
}: {
  questId: string;
  status: "active" | "done" | "failed";
  stage: number;
}) {
  const def = getQuest(questId);
  if (!def) return null;
  const isSide = def.type === "side";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <strong className="text-sm">
          {isSide ? "✦" : "★"} {def.name}
        </strong>
        {isSide && (
          <Badge variant="outline" className="text-[9px] opacity-70">
            ภารกิจรอง
          </Badge>
        )}
        <Badge
          className={cn(
            "text-[9px]",
            status === "active" && "bg-amber-100 text-amber-800",
            status === "done" && "bg-emerald-100 text-emerald-800",
            status === "failed" && "bg-rose-100 text-rose-800",
          )}
        >
          {status === "active" ? "กำลังทำ" : status === "done" ? "สำเร็จ" : "ล้มเหลว"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{def.briefSummary ?? def.description}</p>
      {/* Full stage checklist — every step shown so the player can plan. */}
      <ul className="text-xs pl-2 border-l-2 border-amber-400 space-y-0.5">
        {def.stages.map((s, idx) => {
          const stepStatus = stepStatusFor(status, stage, idx);
          return (
            <li
              key={s.id}
              className={cn(
                "flex gap-1.5",
                stepStatus === "done" && "text-emerald-700/80 line-through opacity-70",
                stepStatus === "current" && "text-amber-800 font-medium",
                stepStatus === "pending" && "text-muted-foreground",
              )}
            >
              <span className="shrink-0 w-3 text-center">
                {stepStatus === "done" ? "✓" : stepStatus === "current" ? "▸" : "○"}
              </span>
              <span>
                {idx + 1}. {s.description}
              </span>
            </li>
          );
        })}
        {/* Final reward step — visible last so the player sees the payoff. */}
        <li
          className={cn(
            "flex gap-1.5",
            status === "done" && "text-emerald-700/80 line-through opacity-70",
            status !== "done" && "text-muted-foreground",
          )}
        >
          <span className="shrink-0 w-3 text-center">
            {status === "done" ? "✓" : "○"}
          </span>
          <span>
            {def.stages.length + 1}. รับรางวัล
            {def.rewards && def.rewards.length > 0
              ? ` — ${summarizeRewards(def.rewards)}`
              : ""}
          </span>
        </li>
      </ul>
    </div>
  );
}

type StepStatus = "done" | "current" | "pending";

function stepStatusFor(
  questStatus: "active" | "done" | "failed",
  currentStage: number,
  idx: number,
): StepStatus {
  if (questStatus === "done") return "done";
  if (questStatus === "failed") return idx < currentStage ? "done" : "pending";
  // active
  if (idx < currentStage) return "done";
  if (idx === currentStage) return "current";
  return "pending";
}

function summarizeRewards(rewards: readonly QuestReward[]): string {
  const parts: string[] = [];
  for (const r of rewards) {
    switch (r.t) {
      case "gold":
        parts.push(`+${r.amount}🟡`);
        break;
      case "item": {
        const def = getItem(r.itemId);
        parts.push(`${def?.name ?? r.itemId}×${r.count ?? 1}`);
        break;
      }
      case "wExp":
        parts.push(`+${r.amount} w-exp`);
        break;
      case "skillExp":
        parts.push(`+${r.amount} xp`);
        break;
      case "trait":
        parts.push(`${r.trait} +${r.amount}`);
        break;
      case "npcRelationship":
        parts.push(`สัมพันธ์ ${r.amount > 0 ? "+" : ""}${r.amount}`);
        break;
      case "learnSkill":
        parts.push(`วิชา ${r.skillId}`);
        break;
      case "learnArt":
        parts.push(`วิชาในกาย ${r.artId}`);
        break;
    }
  }
  return parts.join(" · ");
}
