"use client";

import { useState } from "react";
import { getArt, getSkill } from "@/lib/game";
import { MYSTERY_MOVE_LABEL, describeQuestCondition, getNpc, getQuest } from "@/lib/world";
import { STORY_ARCS, getCutscene } from "@/lib/world/story/registry";
import type { StoryArcInfo } from "@/lib/world/story/types";
import { useWorldStore } from "@/store/world-store";
import { cn } from "@/lib/utils";
import { CutscenePlayer } from "./cutscene-player";

/**
 * The quest log's ตำนาน tab: every story saga, those under way first, with
 * chapter progress, what opens the next chapter, and replays of the films
 * already seen.
 */
export function SagaList() {
  const state = useWorldStore();
  const [open, setOpen] = useState<string | null>(null);
  const [film, setFilm] = useState<string | null>(null);
  const progress = (arc: StoryArcInfo) => arc.questIds.filter((id) => state.quests[id]?.status === "done").length;
  const started = (arc: StoryArcInfo) => arc.questIds.some((id) => state.quests[id]);
  // The main story always leads; then sagas under way.
  const arcs = [...STORY_ARCS].sort((a, b) => Number(!!b.main) - Number(!!a.main) || Number(started(b)) - Number(started(a)) || progress(b) - progress(a));

  if (!arcs.length) return <div className="menu-empty" data-glyph="傳"><strong>ยังไม่มีตำนาน</strong></div>;
  return (
    <>
      <p className="text-xs text-muted-foreground">ตำนานแห่งยุทธภพ — เรื่องเล่ายาวหลายบทที่นำไปสู่วิชาลึกลับของแต่ละสำนัก</p>
      <ul className="space-y-1.5" data-testid="saga-list">
        {arcs.map((arc) => {
          const done = progress(arc);
          const expanded = open === arc.id;
          const finished = done === arc.questIds.length;
          // The move stays a mystery until the last chapter hands over its scroll.
          const reward = !arc.reward ? "★" : finished ? (arc.reward.kind === "skill" ? getSkill(arc.reward.id)?.n : getArt(arc.reward.id).n) : MYSTERY_MOVE_LABEL;
          const next = arc.questIds.find((id) => state.quests[id]?.status !== "done");
          const nextDef = next ? getQuest(next) : null;
          const nextState = next ? state.quests[next] : undefined;
          const gates = nextDef && !nextState ? describeQuestCondition(state, nextDef.prereqs ?? { t: "and", all: [] }).filter((l) => !l.done && !l.negated) : [];
          const seen = arc.cutsceneIds.filter((id) => state.flags[`seen-cutscene:${id}`] === true);
          return (
            <li key={arc.id} className={cn("border border-border bg-muted/20", started(arc) && "border-jade/60")} data-saga-id={arc.id}>
              <button type="button" className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/40"
                aria-expanded={expanded} onClick={() => setOpen(expanded ? null : arc.id)}>
                <span className="min-w-0">
                  <strong className="block text-sm font-display truncate">{arc.main ? "★" : "📜"} {arc.title}</strong>
                  <span className="block text-[11px] text-muted-foreground truncate">{arc.sc} · {reward}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums">{finished ? "✓ จบแล้ว" : `${done}/${arc.questIds.length}`}</span>
              </button>
              {expanded && (
                <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/60 bg-background/40 text-xs">
                  <p className="italic text-muted-foreground">{arc.tagline}</p>
                  <ol className="space-y-0.5">
                    {arc.chapterTitles.map((title, i) => {
                      const status = state.quests[arc.questIds[i]]?.status;
                      return <li key={i} className={cn(status === "done" ? "text-jade" : status === "active" ? "font-semibold" : "text-muted-foreground")}>
                        {status === "done" ? "✓" : status === "active" ? "▶" : "○"} บทที่ {i + 1}: {status || i === done ? title : "…"}
                      </li>;
                    })}
                  </ol>
                  {nextDef && !nextState && (
                    <p className="text-muted-foreground">
                      บทต่อไปรับได้จาก <b>{getNpc(nextDef.giverNpcId)?.name ?? "—"}</b>
                      {gates.length > 0 && <> · ต้องการ {gates.map((g) => g.label).join(", ")}</>}
                    </p>
                  )}
                  {seen.length > 0 && <div className="flex flex-wrap gap-1.5">
                    {seen.map((id) => (
                      <button key={id} type="button" className="rounded-full border border-border px-2 py-0.5 hover:bg-muted/40"
                        onClick={() => setFilm(id)}>🎬 {getCutscene(id)?.label.split(" — ").pop() ?? "ชมฉาก"}</button>
                    ))}
                  </div>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {film && <CutscenePlayer cutsceneId={film} onDone={() => setFilm(null)} />}
    </>
  );
}
