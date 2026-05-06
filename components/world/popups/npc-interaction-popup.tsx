"use client";

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  evaluateCondition,
  getItem,
  getQuest,
  getQuestsForNpc,
  getScene,
  isQuestOfferable,
  isQuestTurnInForNpc,
  type NpcDef,
  type NpcStateEntry,
  type QuestDef,
  type QuestReward,
} from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";

interface Props {
  open: boolean;
  npc: NpcDef | null;
  onClose: () => void;
}

// Generic NPC interaction popup. Renders one button per supported NPC
// capability: ทักทาย (talk), ขอประลอง (spar), and a quest section listing
// offerable / in-progress side quests anchored to this NPC.
//
// Side quests appear iff the player has never started them and any
// `prereqs` evaluate true. Once a side quest is `done` or `failed`, it
// disappears from the offer list permanently — that's how single-time
// side quests are enforced.
export function NpcInteractionPopup({ open, npc, onClose }: Props) {
  const gotoScene = useWorldStore((s) => s.gotoScene);
  const startSparWith = useWorldStore((s) => s.startSparWith);
  const meetNpc = useWorldStore((s) => s.meetNpc);
  const acceptQuest = useWorldStore((s) => s.acceptQuest);
  const finishQuestNow = useWorldStore((s) => s.finishQuestNow);
  const npcStates = useWorldStore((s) => s.npcStates);
  // Subscribing to the whole world state for the offer/turn-in checks is
  // intentional — these are read-only condition evaluations and the popup
  // is only mounted while the player is interacting with this one NPC.
  const worldState = useWorldStore();

  if (!npc) return null;
  const state: NpcStateEntry = npcStates[npc.id] ?? {};

  const onTalk = () => {
    if (!npc.dialogSceneId) return;
    meetNpc(npc.id);
    onClose();
    gotoScene(npc.dialogSceneId);
  };

  const onSpar = () => {
    if (!npc.sparOpponentId) return;
    const r = startSparWith(npc.id);
    if (!r.ok) return;
    onClose();
  };

  // Quest offers anchored to this NPC. Non-offerable quests (already
  // started, done, failed, or prereqs unmet) are filtered out so the player
  // only sees what they can actually accept right now.
  const npcQuests = getQuestsForNpc(npc.id);
  const offerable = npcQuests.filter((q) => isQuestOfferable(worldState, q));
  const turnIns = npcQuests.filter((q) => isQuestTurnInForNpc(worldState, q, npc.id));
  const inProgress = npcQuests.filter((q) => {
    const entry = worldState.quests[q.id];
    return entry?.status === "active" && !isQuestTurnInForNpc(worldState, q, npc.id);
  });

  const onAcceptQuest = (def: QuestDef) => {
    // Always start the quest engine-side first — guarantees `quests[id]`
    // becomes "active" even if the offer scene is missing or doesn't emit
    // `startQuest` itself. The startQuest dispatcher is idempotent, so
    // running it again from the offer scene's choice is a no-op.
    const r = acceptQuest(def.id);
    if (!r.ok) {
      toast("warn", "ยังรับภารกิจนี้ไม่ได้");
      return;
    }
    toast("success", `รับภารกิจ: ${def.name}`);

    // Routing in priority order:
    //   1. `qs_<id>_offer` — gives the player the briefing dialog with the
    //      "what to do next" instructions (which itemId to fetch, where to
    //      travel, etc.). Without this hop the player just lands back on
    //      an ambient greet and has no idea what they accepted.
    //   2. NPC's ambient `dialogSceneId` — fallback for quests with no
    //      offer scene authored (engine-side accept already ran above).
    const offerSceneId = `qs_${def.id}_offer`;
    const target =
      getScene(offerSceneId) !== null
        ? offerSceneId
        : npc.dialogSceneId ?? null;
    onClose();
    if (target) gotoScene(target);
  };

  const onTurnInQuest = (def: QuestDef) => {
    // Turn-in routing, in priority order:
    //   1. `qs_<questId>_complete` — content-author convention. Calling
    //      finishQuest from that scene grants rewards.
    //   2. Engine fallback — call `finishQuestNow` directly so the quest
    //      still pays out even when no complete scene was authored. Pops
    //      a toast since there's no narrative beat to show.
    const completeSceneId = `qs_${def.id}_complete`;
    if (getScene(completeSceneId)) {
      onClose();
      gotoScene(completeSceneId);
      return;
    }
    const r = finishQuestNow(def.id);
    if (r.ok) {
      toast("success", `สำเร็จภารกิจ: ${def.name}`);
    } else {
      toast("warn", "ยังส่งมอบภารกิจไม่ได้");
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`💬 ${npc.name}`} maxWidth="max-w-md">
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {state.met && (
            <Badge variant="outline" className="text-[9px]">เคยพบ</Badge>
          )}
          {typeof state.relationship === "number" && state.relationship !== 0 && (
            <Badge variant="outline" className="text-[9px]">
              ความสัมพันธ์ {state.relationship > 0 ? `+${state.relationship}` : state.relationship}
            </Badge>
          )}
          {npc.tags?.map((t) => (
            <Badge key={t} variant="outline" className="text-[9px] opacity-70">
              {t}
            </Badge>
          ))}
        </div>

        {npc.description && (
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            {npc.description}
          </p>
        )}

        <div className="space-y-1.5 pt-1">
          {npc.dialogSceneId && (
            <Button
              variant="outline"
              onClick={onTalk}
              className="w-full justify-start text-left h-auto py-2 whitespace-normal"
            >
              <span className="flex flex-col items-start gap-0.5">
                <span className="font-semibold text-sm">💬 ทักทาย</span>
                <span className="text-[10px] text-muted-foreground">
                  พูดคุยกับ{npc.name}
                </span>
              </span>
            </Button>
          )}
          {npc.sparOpponentId && (
            <Button
              variant="outline"
              onClick={onSpar}
              className="w-full justify-start text-left h-auto py-2 whitespace-normal"
            >
              <span className="flex flex-col items-start gap-0.5">
                <span className="font-semibold text-sm">⚔ ขอประลอง</span>
                <span className="text-[10px] text-muted-foreground">
                  ฝีมือต่อฝีมือ — ชนะได้ชื่อเสียง +{npc.sparFameReward ?? 0}
                </span>
              </span>
            </Button>
          )}

          {turnIns.length > 0 && (
            <div className="pt-2 space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                ส่งมอบภารกิจ
              </div>
              {turnIns.map((q) => (
                <Button
                  key={q.id}
                  variant="outline"
                  onClick={() => onTurnInQuest(q)}
                  className="w-full justify-start text-left h-auto py-2 whitespace-normal border-emerald-300"
                >
                  <span className="flex flex-col items-start gap-0.5">
                    <span className="font-semibold text-sm">✓ {q.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {q.briefSummary ?? "ส่งมอบภารกิจที่สำเร็จแล้ว"}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          )}

          {offerable.length > 0 && (
            <div className="pt-2 space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                ภารกิจที่เปิดให้รับ
              </div>
              {offerable.map((q) => (
                <Button
                  key={q.id}
                  variant="outline"
                  onClick={() => onAcceptQuest(q)}
                  className="w-full justify-start text-left h-auto py-2 whitespace-normal border-amber-300"
                  disabled={!isOfferableNow(worldState, q)}
                >
                  <span className="flex flex-col items-start gap-0.5">
                    <span className="font-semibold text-sm flex items-center gap-1.5">
                      {q.type === "side" ? "✦" : "★"} {q.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {q.briefSummary ?? q.description}
                    </span>
                    {q.rewards && q.rewards.length > 0 && (
                      <span className="text-[10px] text-emerald-700">
                        รางวัล: {summarizeRewards(q.rewards)}
                      </span>
                    )}
                  </span>
                </Button>
              ))}
            </div>
          )}

          {inProgress.length > 0 && (
            <div className="pt-2 space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                ภารกิจที่กำลังทำ
              </div>
              {inProgress.map((q) => {
                const def = getQuest(q.id)!;
                const entry = worldState.quests[q.id]!;
                const stage = def.stages[entry.stage];
                return (
                  <div key={q.id} className="rounded border border-border/40 bg-muted/40 p-2">
                    <div className="text-sm font-semibold">{def.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      ขั้นที่ {entry.stage + 1}/{def.stages.length}: {stage?.description}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Helper for readable reward summaries inside the offer button.
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
        parts.push(`+${r.amount} xp · ${r.skillId}`);
        break;
      case "trait":
        parts.push(`${r.trait} +${r.amount}`);
        break;
      case "npcRelationship":
        parts.push(`สัมพันธ์ ${r.npcId} ${r.amount > 0 ? "+" : ""}${r.amount}`);
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

// True when the offer can be accepted right now. Mirrors `isQuestOfferable`
// but evaluates against the live store snapshot — the offer button uses
// this to greys-out when prereqs flicker between renders. (In practice the
// outer filter has already excluded ineligible quests, so this is a
// belt-and-braces guard.)
function isOfferableNow(state: ReturnType<typeof useWorldStore.getState>, q: QuestDef): boolean {
  if (state.quests[q.id]) return false;
  if (q.prereqs && !evaluateCondition(state, q.prereqs)) return false;
  return true;
}
