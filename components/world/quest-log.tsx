"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TRACK_NONE,
  describeQuestCondition,
  objectiveSpotsFor,
  trackedQuestId,
  guideForQuest,
  getItem,
  getQuest,
  type QuestReward,
} from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { confirmDialog } from "@/store/confirm-store";
import { cn } from "@/lib/utils";
import { SagaList } from "./saga-list";

// Quest log. Tabbed list view:
//   - กำลังทำ   (active)  — ongoing quests; player can cancel from here
//   - สำเร็จ    (done)    — completed for the run
//   - ละทิ้ง   (failed)  — abandoned or failed; only side quests fail and
//                          they stay here as a record (never re-offered)
//
// Each row shows just the quest name by default (one line per quest);
// the player clicks a row to expand and read the full briefing, stage
// checklist, rewards, and (on active quests) a "ละทิ้งภารกิจ" button.
// Side quests get a ✦ marker; main quests use ★.
//
// Two render modes:
//   - "card"  (default) — wraps the body in a Card for sidebar use
//   - "popup"           — bare body for use inside the menu-bar Modal

type QuestStatus = "active" | "done" | "failed";
type QuestTab = QuestStatus | "story";

interface QuestLogProps {
  variant?: "card" | "popup";
}

const TAB_LABEL: Record<QuestTab, string> = {
  active: "กำลังทำ",
  done: "สำเร็จ",
  failed: "ละทิ้ง",
  story: "ตำนาน",
};

export function QuestLog({ variant = "card" }: QuestLogProps = {}) {
  const quests = useWorldStore((s) => s.quests);
  const [tab, setTab] = useState<QuestTab>("active");
  // Track which quest rows are expanded — Set so independent rows toggle
  // freely without forcing an accordion-of-one. Cleared per-tab so the
  // expansion state doesn't leak across status filters.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const entries = Object.values(quests);
  const counts: Record<QuestTab, number> = {
    active: entries.filter((q) => q.status === "active").length,
    done: entries.filter((q) => q.status === "done").length,
    failed: entries.filter((q) => q.status === "failed").length,
    story: entries.filter((q) => q.id.startsWith("st_")).length,
  };
  const list = entries.filter((q) => q.status === tab);

  const onToggle = (questId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(questId)) next.delete(questId);
      else next.add(questId);
      return next;
    });
  };
  const onSwitchTab = (next: QuestTab) => {
    if (next === tab) return;
    setTab(next);
    setExpanded(new Set());
  };

  const body = (
    <div className="space-y-3">
      <TabBar tab={tab} counts={counts} onSelect={onSwitchTab} />
      {tab === "story" ? <SagaList /> : list.length === 0 ? (
        <div className="menu-empty" data-glyph="令">
          <strong>{tab === "active"
            ? "ยังไม่มีภารกิจที่กำลังทำ"
            : tab === "done"
              ? "ยังไม่มีภารกิจที่สำเร็จ"
              : "ยังไม่มีภารกิจที่ละทิ้ง"}</strong>
          {tab === "active" && <span>ผู้ที่มีเครื่องหมาย <b className="menu-empty-mark">!</b> เหนือศีรษะมีงานให้ทำ — เดินไปคุยเพื่อรับภารกิจ</span>}
        </div>
      ) : (
        <ul className="space-y-1.5">
          {list.map((q) => (
            <QuestRow
              key={q.id}
              questId={q.id}
              status={q.status as QuestStatus}
              stage={q.stage}
              expanded={expanded.has(q.id)}
              onToggle={() => onToggle(q.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );

  if (variant === "popup") return body;

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <h3 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
          ภารกิจ
        </h3>
        {body}
      </CardContent>
    </Card>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────

interface TabBarProps {
  tab: QuestTab;
  counts: Record<QuestTab, number>;
  onSelect: (t: QuestTab) => void;
}

function TabBar({ tab, counts, onSelect }: TabBarProps) {
  const order: QuestTab[] = ["active", "done", "failed", "story"];
  return (
    <div className="flex gap-1 border-b pb-2">
      {order.map((t) => {
        const isActive = tab === t;
        return (
          <Button
            key={t}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            className="text-xs h-7"
            onClick={() => onSelect(t)}
          >
            {TAB_LABEL[t]}
            <span
              className={cn(
                "ml-1.5 text-[10px] tabular-nums",
                isActive ? "opacity-90" : "text-muted-foreground",
              )}
            >
              {counts[t]}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

// ─── Quest row (collapsed by default; click to expand) ────────────────

interface QuestRowProps {
  questId: string;
  status: QuestStatus;
  stage: number;
  expanded: boolean;
  onToggle: () => void;
}

function QuestRow({
  questId,
  status,
  stage,
  expanded,
  onToggle,
}: QuestRowProps) {
  const def = getQuest(questId);
  const abandonQuest = useWorldStore((s) => s.abandonQuest);
  // Subscribe to whole world state so progress lines stay live as the
  // player gathers / defeats / etc. between quest log opens.
  const worldState = useWorldStore();
  const setFlag = useWorldStore((s) => s._setFlag);
  if (!def) return null;
  const guide = status === "active" ? guideForQuest(worldState, questId) : null;
  const tracked = status === "active" && trackedQuestId(worldState) === questId;
  const guiding = !!guide && tracked;
  const spots = status === "active" ? objectiveSpotsFor(worldState, def) : [];
  const onTrack = () => {
    setFlag("trackedQuestId", tracked ? TRACK_NONE : questId);
    toast("info", tracked ? "เลิกติดตามภารกิจ" : `ติดตามภารกิจ: ${def.name}`);
  };
  const isSide = def.type === "side";

  const onCancel = async () => {
    const ok = await confirmDialog({
      title: "ละทิ้งภารกิจ",
      message: `ยืนยันละทิ้งภารกิจ "${def.name}"?\nภารกิจรองที่ล้มเหลวจะไม่กลับมาให้รับอีก`,
      confirmText: "ละทิ้ง",
      variant: "danger",
    });
    if (!ok) return;
    const r = abandonQuest(questId);
    if (r.ok) toast("warn", `ละทิ้งภารกิจ: ${def.name}`);
    else toast("error", "ละทิ้งภารกิจไม่ได้");
  };

  return (
    <li className={cn("border border-border bg-muted/20 overflow-hidden", tracked && "border-jade/70 bg-jade/5")}
      data-quest-id={questId} data-tracked={tracked || undefined}>
      {/* Collapsed header — name + track pin, click the name to expand. */}
      <div className="flex items-stretch">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2 text-left",
          "hover:bg-muted/40 transition-colors",
        )}
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="shrink-0 text-vermilion">{def.type === "story" ? "📜" : isSide ? "✦" : "★"}</span>
          <strong className="text-sm font-display truncate">{def.name}</strong>
          {(isSide || def.type === "story") && (
            <Badge variant="outline" className="text-[9px] opacity-70">
              {def.type === "story" ? "ตำนาน" : def.lineage ? "สืบทอดวิชา" : "รอง"}
            </Badge>
          )}
        </span>
        <span
          className={cn(
            "shrink-0 text-xs text-muted-foreground transition-transform",
            expanded && "rotate-90",
          )}
          aria-hidden="true"
        >
          ▸
        </span>
      </button>
      {status === "active" && (
        <button
          type="button"
          onClick={onTrack}
          aria-pressed={tracked}
          aria-label={tracked ? "เลิกติดตามภารกิจนี้" : "ติดตามภารกิจนี้"}
          title={tracked ? "กำลังติดตาม — แตะเพื่อเลิก" : "ติดตามภารกิจนี้บนจอเกม"}
          className={cn(
            "quest-track shrink-0 border-l border-border px-2 text-[11px] font-semibold transition-colors",
            tracked ? "bg-jade/20 text-jade" : "text-muted-foreground hover:bg-muted/40",
          )}
        >
          📌 {tracked ? "ติดตามอยู่" : "ติดตาม"}
        </button>
      )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/60 bg-background/40">
          <p className="text-xs text-muted-foreground">
            {def.briefSummary ?? def.description}
          </p>

          <ul className="text-xs pl-2 border-l-2 border-vermilion/60 space-y-0.5">
            {def.stages.map((s, idx) => {
              const stepStatus = stepStatusFor(status, stage, idx);
              // Show live progress lines for the current stage's
              // autoAdvance condition (only — past stages already done,
              // future stages not yet trackable). Lines are flattened
              // from the condition tree by `describeQuestCondition`.
              const progress =
                stepStatus === "current" && s.autoAdvance
                  ? describeQuestCondition(worldState, s.autoAdvance, 0, worldState.quests[questId])
                  : [];
              return (
                <li
                  key={s.id}
                  className={cn(
                    "flex flex-col gap-0.5",
                    stepStatus === "done" &&
                      "text-emerald-700/80 line-through opacity-70",
                    stepStatus === "current" &&
                      "text-amber-800 font-medium",
                    stepStatus === "pending" && "text-muted-foreground",
                  )}
                >
                  <span className="flex gap-1.5">
                    <span className="shrink-0 w-3 text-center">
                      {stepStatus === "done"
                        ? "✓"
                        : stepStatus === "current"
                          ? "▸"
                          : "○"}
                    </span>
                    <span>
                      {idx + 1}. {s.description}
                    </span>
                  </span>
                  {stepStatus === "current" && guide && (
                    <div className="quest-guide ml-5 mt-1 flex items-center gap-2 border border-jade/50 bg-jade/10 px-2 py-1 text-[11px] font-normal text-foreground">
                      <span className="flex-1 min-w-0">
                        🎯 <strong>{guide.action}</strong>
                        {guide.progress && <span className="tabular-nums"> ({guide.progress.current}/{guide.progress.required})</span>}
                        {guide.locationName && <>
                          <br />📍 {guide.locationName}
                          <span className="text-muted-foreground">
                            {guide.path.length <= 1 ? " — อยู่ที่นี่" : ` — อีก ${guide.path.length - 1} ช่วงทาง`}
                          </span>
                        </>}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant={guiding ? "secondary" : "outline"}
                        className="h-6 shrink-0 px-2 text-[11px]"
                        aria-pressed={guiding}
                        disabled={!guide.locationName}
                        onClick={() => {
                          setFlag("trackedQuestId", questId);
                          toast("info", `นำทาง: ${guide.action}${guide.locationName ? ` · ${guide.locationName}` : ""}`);
                        }}
                      >
                        {guiding ? "➤ กำลังนำทาง" : "➤ นำทาง"}
                      </Button>
                    </div>
                  )}
                  {stepStatus === "current" && spots.length > 0 && (
                    <ul className="pl-5 space-y-0.5 mt-0.5">
                      {spots.map((spot) => (
                        <li key={spot.spotIndex} className={cn("flex items-center gap-1.5 text-[11px] no-underline",
                          spot.done ? "text-emerald-700" : "text-muted-foreground")}>
                          <span className="shrink-0 w-3 text-center">{spot.done ? "✓" : "🔍"}</span>
                          <span className="flex-1">{spot.spot.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {progress.length > 0 && (
                    <ul className="pl-5 space-y-0.5 mt-0.5">
                      {progress.map((p, pIdx) => (
                        <li
                          key={pIdx}
                          className={cn(
                            "flex items-center gap-1.5 text-[11px] no-underline",
                            p.done
                              ? "text-emerald-700"
                              : "text-muted-foreground",
                          )}
                        >
                          <span className="shrink-0 w-3 text-center">
                            {p.done ? "✓" : "○"}
                          </span>
                          <span className="flex-1">
                            {p.negated ? "ห้าม " : ""}
                            {p.label}
                          </span>
                          <span className="tabular-nums shrink-0">
                            {p.current}/{p.required}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
            <li
              className={cn(
                "flex gap-1.5",
                status === "done" &&
                  "text-emerald-700/80 line-through opacity-70",
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

          {status === "active" && !def.story && !def.lineage && (
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                variant="outline"
                className="text-[11px] h-7 border-rose-400 text-rose-700 hover:bg-rose-50"
                onClick={onCancel}
              >
                ละทิ้งภารกิจ
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

type StepStatus = "done" | "current" | "pending";

function stepStatusFor(
  questStatus: QuestStatus,
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
