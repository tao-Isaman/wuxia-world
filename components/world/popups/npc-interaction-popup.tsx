"use client";

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  evaluateCondition,
  getItem,
  getNpc,
  TRAIT_LABEL,
  getQuest,
  MYSTERY_MOVE_LABEL,
  getScene,
  isQuestOfferable,
  isQuestTurnInForNpc,
  objectiveSpotsForNpc,
  npcPortrait,
  type NpcDef,
  type NpcStateEntry,
  type QuestDef,
  type QuestReward,
  type Scene,
} from "@/lib/world";
import {
  assassinateChance,
  badActionOffered,
  kidnapChance,
  stealChance,
} from "@/lib/world/bad-actions";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { confirmDialog } from "@/store/confirm-store";
import { flashLoading } from "@/store/loading-store";
import { NpcStatusBadge } from "../npc-status-badge";
import { getSkill } from "@/lib/game";
import { CharacterPreview } from "@/components/game/character-preview";
import { npcCharacterId } from "@/lib/characters/catalog";
import { GiftPicker } from "./gift-picker";
import { DECLINE_TEXT } from "@/lib/world/story/compile";
import { POWER_TIER_LABEL, heldQuests, npcPower, npcTitle, powerTier } from "@/lib/world/npc-life";
import { KILL_MARKS } from "@/lib/world/law";

/** What the jianghu knows of a simulated person now: journey, wounds, seclusion, family. */
function lifeLines(state: ReturnType<typeof useWorldStore.getState>, npcId: string): string[] {
  const ext = state.npcExt[npcId];
  if (!ext) return [];
  const place = (id: string) => getScene(id)?.kind === "location" ? (getScene(id) as { name: string }).name : id;
  const lines: string[] = [];
  if (ext.plan && ext.plan.path.length) lines.push(`กำลังเดินทางไป${place(ext.plan.to)}`);
  if (ext.status === "secluded") lines.push("กำลังปิดด่านฝึกวิชา ไม่รับคำท้าประลอง");
  if ((ext.woundedUntil ?? 0) > state.day) lines.push("บาดเจ็บจากการประลอง กำลังพักรักษาตัว");
  if (ext.masterId) lines.push(`ศิษย์ของ${getNpc(ext.masterId)?.name ?? "อาจารย์ผู้ล่วงลับ"}`);
  if (ext.spouseId) lines.push(`คู่ครอง: ${getNpc(ext.spouseId)?.name ?? "—"}`);
  if (ext.formerSect && !ext.sect) lines.push("เคยเป็นศิษย์สำนักอื่นมาก่อน");
  return lines;
}

const NPC_ROLE_LABEL: Record<string, string> = {
  healer: "แพทย์", scholar: "บัณฑิต", official: "ขุนนาง", authority: "ฝ่ายราชการ",
  merchant: "พ่อค้า", trader: "พ่อค้า", elder: "ผู้อาวุโส", master: "อาจารย์",
  disciple: "ศิษย์สำนัก", monk: "พระ", guard: "องครักษ์", spy: "สายข่าว",
  criminal: "นอกกฎหมาย", blackmarket: "ตลาดมืด", craftsman: "ช่างฝีมือ",
};

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
  const startKillDuel = useWorldStore((s) => s.startKillDuel);
  const meetNpc = useWorldStore((s) => s.meetNpc);
  const acceptQuest = useWorldStore((s) => s.acceptQuest);
  const finishQuestNow = useWorldStore((s) => s.finishQuestNow);
  const attemptSteal = useWorldStore((s) => s.attemptSteal);
  const attemptAssassinate = useWorldStore((s) => s.attemptAssassinate);
  const attemptKidnap = useWorldStore((s) => s.attemptKidnap);
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
    const r = startSparWith(npc.id);
    if (!r.ok) {
      toast("warn", r.reason === "secluded" ? `${npc.name}กำลังปิดด่าน ไม่รับคำท้า` : "ประลองไม่ได้ในตอนนี้");
      return;
    }
    onClose();
  };

  const power = npcPower(worldState, npc.id);
  const tierLabel = POWER_TIER_LABEL[powerTier(power)];
  const title = npcTitle(worldState, npc.id);
  const secluded = worldState.npcExt[npc.id]?.status === "secluded";

  const onKill = async () => {
    const charges = heldQuests(worldState, npc.id).filter((q) => worldState.quests[q.id]?.status === "active");
    const ok = await confirmDialog({
      title: "⚔ สังหาร",
      message: [
        `ชักอาวุธเข้าใส่${npc.name}และสู้กันถึงตาย?`,
        `ฝีมือของอีกฝ่าย: ${tierLabel}`,
        `ถ้าสังหารได้ ทางการจะออกหมายจับเพิ่ม ${KILL_MARKS} ทันที · ถ้าพลาดหรือหนี หมายจับ +2`,
        charges.length ? `ภารกิจที่ค้างกับผู้นี้ ${charges.length} อย่างอาจล้มเหลว` : "",
        "ถ้าแพ้ เจ้าจะสลบและฟื้นที่บ้านพร้อมสูญเสียทรัพย์",
      ].filter(Boolean).join("\n"),
      confirmText: "ลงมือ",
      variant: "danger",
    });
    if (!ok) return;
    const r = startKillDuel(npc.id);
    if (!r.ok) { toast("warn", "ลงมือไม่ได้ในตอนนี้"); return; }
    onClose();
  };

  // Quest offers anchored to this NPC. Non-offerable quests (already
  // started, done, failed, or prereqs unmet) are filtered out so the player
  // only sees what they can actually accept right now.
  // Their own quests, and those of the dead whose charges they now hold.
  const npcQuests = heldQuests(worldState, npc.id);
  const offerable = npcQuests.filter((q) => isQuestOfferable(worldState, q));
  const turnIns = npcQuests.filter((q) => isQuestTurnInForNpc(worldState, q, npc.id));
  // Hands-on objectives done with this person (hand over a letter, ask for a seal).
  const objectives = objectiveSpotsForNpc(worldState, npc.id).filter((entry) => entry.spot.locationId === worldState.currentSceneId);
  const inProgress = npcQuests.filter((q) => {
    const entry = worldState.quests[q.id];
    return entry?.status === "active" && !isQuestTurnInForNpc(worldState, q, npc.id);
  });

  const onAcceptQuest = async (def: QuestDef) => {
    // A sect move quest can be turned down. A compiled one's offer scene
    // carries รับคำ / ปฏิเสธ itself, so open it before accepting; a trial
    // without one asks first.
    const offerScene = getScene(`qs_${def.id}_offer`);
    if (isSectMoveQuest(def)) {
      if (offerScene && sceneStartsQuest(offerScene, def.id)) {
        onClose();
        gotoScene(offerScene.id);
        return;
      }
      const ok = await confirmDialog({
        title: def.name,
        message: `${def.briefSummary ?? def.description}\n\nรับภารกิจนี้หรือไม่?`,
        confirmText: "รับภารกิจ",
        cancelText: DECLINE_TEXT,
      });
      if (!ok) return;
    }
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
    // Turn-in routing:
    //   1. If `qs_<questId>_complete` exists AND its scene already fires
    //      finishQuest on entry or in a choice, just navigate there —
    //      the scene closes the quest itself.
    //   2. If the scene exists but does NOT fire finishQuest (legacy
    //      scenes where the dialog-choice fired finishQuest before
    //      navigating), the engine calls finishQuestNow as a safety net
    //      so the player can't re-turn-in indefinitely via the popup.
    //   3. No scene → finishQuestNow + toast.
    const completeSceneId = `qs_${def.id}_complete`;
    const sc = getScene(completeSceneId);
    if (sc) {
      const handlesFinish = sceneClosesQuest(sc, def.id);
      onClose();
      if (!handlesFinish) {
        // Best-effort close; ignore errors (e.g., quest already done).
        finishQuestNow(def.id);
      }
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
    <Modal open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-3">
        <div className="npc-card-portrait">
          {npcPortrait(npc.id) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={npcPortrait(npc.id)} alt={npc.name} draggable={false} />
          ) : <CharacterPreview id={npcCharacterId(npc.id)} animate framing="bust" />}
          <span className="npc-card-name">{npc.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Liveness Layer §4.3 — sim-status chip. Renders only for
              named NPCs in a non-alive state (dead / secluded /
              missing); generic NPCs and live named NPCs render
              nothing, so this is a no-op in the common case. */}
          <NpcStatusBadge npcId={npc.id} />
          {state.met && (
            <Badge variant="outline" className="text-[9px]">เคยพบ</Badge>
          )}
          {typeof state.relationship === "number" && state.relationship !== 0 && (
            <Badge variant="outline" className="text-[9px]">
              ความสัมพันธ์ {state.relationship > 0 ? `+${state.relationship}` : state.relationship}
            </Badge>
          )}
          {npc.tags?.filter((t) => NPC_ROLE_LABEL[t]).map((t) => (
            <Badge key={t} variant="outline" className="text-[9px] opacity-70">
              {NPC_ROLE_LABEL[t]}
            </Badge>
          ))}
        </div>

        {title && (
          <p className="text-xs font-semibold" data-testid="npc-life-title">{title}</p>
        )}
        {lifeLines(worldState, npc.id).map((line) => (
          <p key={line} className="text-[11px] text-muted-foreground">· {line}</p>
        ))}

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
                <span className="font-semibold text-sm npc-action-label">ทักทาย</span>
                <span className="text-[10px] text-muted-foreground">
                  พูดคุยกับ{npc.name}
                </span>
              </span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onSpar}
            disabled={secluded}
            className="w-full justify-start text-left h-auto py-2 whitespace-normal"
          >
            <span className="flex flex-col items-start gap-0.5">
              <span className="font-semibold text-sm npc-action-label">ขอประลอง</span>
              <span className="text-[10px] text-muted-foreground">
                ฝีมือต่อฝีมือ ({tierLabel}) — ชนะได้ชื่อเสียง +{npc.sparFameReward ?? 1 + powerTier(power) * 3}
              </span>
            </span>
          </Button>

          <GiftPicker npc={npc} />

          {badActionOffered(worldState, npc, "steal") && (
            <Button
              variant="outline"
              onClick={async () => {
                const stealXp = worldState.lifeSkillXp.steal ?? 0;
                const chance = stealChance(worldState.playerBuild, npc, stealXp);
                const ok = await confirmDialog({
                  title: "🥷 ขโมย",
                  message: `ขโมยจาก ${npc.name}?\nโอกาสสำเร็จประมาณ ${chance.toFixed(0)}% — ถ้าพลาดจะถูกตอบโต้`,
                  confirmText: "ลงมือขโมย",
                  variant: "warn",
                });
                if (!ok) return;
                // Suspense beat — show "กำลังย่องเข้าหา..." overlay for ~1 sec
                // before resolving so the steal feels like a real attempt
                // rather than an instant click. The overlay auto-hides via
                // its own timer; we await so the toast lands afterwards.
                flashLoading("กำลังย่องเข้าหา...", 1000, "stealth");
                await new Promise((r) => setTimeout(r, 1000));
                const r = attemptSteal(npc.id);
                if (!r.ok) {
                  toast(
                    "warn",
                    r.reason === "not-stealable"
                      ? `${npc.name} ไม่มีอะไรให้ขโมย`
                      : "ขโมยไม่ได้",
                  );
                  return;
                }
                if (r.outcome === "passed") {
                  const loot = r.items?.length
                    ? r.items
                        .map((it) => `${getItem(it.itemId)?.name ?? it.itemId}×${it.count}`)
                        .join(", ")
                    : "ไม่ได้ของ";
                  toast("success", `ขโมยสำเร็จ! ${loot}`);
                } else {
                  toast("error", `ถูกจับได้! ถูกออกหมายจับ ${useWorldStore.getState().wanted} — ต้องสู้หนีเอาตัวรอด`);
                  onClose();
                }
              }}
              className="w-full justify-start text-left h-auto py-2 whitespace-normal border-stone-400"
            >
              <span className="flex flex-col items-start gap-0.5">
                <span className="font-semibold text-sm npc-action-label">ขโมย</span>
                <span className="text-[10px] text-muted-foreground">
                  ความสำเร็จ ~{stealChance(worldState.playerBuild, npc, worldState.lifeSkillXp.steal ?? 0).toFixed(0)}% · ขโมยได้ +ความเลว
                </span>
              </span>
            </Button>
          )}

          {badActionOffered(worldState, npc, "assassinate") && (
            <Button
              variant="outline"
              onClick={async () => {
                const chance = assassinateChance(worldState.playerBuild, npc);
                const ok = await confirmDialog({
                  title: "🗡 ลอบทำร้าย",
                  message: `ลอบทำร้าย ${npc.name}?\nโอกาสสำเร็จ ~${chance.toFixed(0)}% — ถ้าพลาดต้องสู้ตาย`,
                  confirmText: "ลงมือ",
                  variant: "danger",
                });
                if (!ok) return;
                const r = attemptAssassinate(npc.id);
                if (!r.ok) {
                  toast(
                    "warn",
                    r.reason === "already-done" ? "เป้าหมายนี้ถูกจัดการไปแล้ว" : "ลอบทำร้ายไม่ได้",
                  );
                  return;
                }
                if (r.outcome === "passed") {
                  toast("success", `ลอบทำร้ายสำเร็จ — ${npc.name} ตายแล้ว`);
                  onClose();
                } else {
                  toast("error", `${npc.name} ตอบโต้ — ต้องสู้!`);
                  onClose();
                }
              }}
              className="w-full justify-start text-left h-auto py-2 whitespace-normal border-rose-500 bg-rose-50/40"
            >
              <span className="flex flex-col items-start gap-0.5">
                <span className="font-semibold text-sm text-rose-700 npc-action-label">ลอบทำร้าย</span>
                <span className="text-[10px] text-muted-foreground">
                  ความสำเร็จ ~{assassinateChance(worldState.playerBuild, npc).toFixed(0)}% · ฆ่าเป้าหมายเพื่อภารกิจร้าย
                </span>
              </span>
            </Button>
          )}

          {badActionOffered(worldState, npc, "kidnap") && (
            <Button
              variant="outline"
              onClick={async () => {
                const chance = kidnapChance(worldState.playerBuild, npc);
                const ok = await confirmDialog({
                  title: "🪢 ลักพาตัว",
                  message: `ลักพาตัว ${npc.name}?\nโอกาสสำเร็จ ~${chance.toFixed(0)}% — ถ้าพลาดถูกตอบโต้`,
                  confirmText: "ลักพาตัว",
                  variant: "warn",
                });
                if (!ok) return;
                const r = attemptKidnap(npc.id);
                if (!r.ok) {
                  toast(
                    "warn",
                    r.reason === "already-done" ? "เป้าหมายนี้ถูกลักพาตัวไปแล้ว" : "ลักพาตัวไม่ได้",
                  );
                  return;
                }
                if (r.outcome === "passed") {
                  toast("success", `ลักพาตัว ${npc.name} สำเร็จ`);
                  onClose();
                } else {
                  toast("error", `ผู้พิทักษ์รุมล้อม — ต้องสู้!`);
                  onClose();
                }
              }}
              className="w-full justify-start text-left h-auto py-2 whitespace-normal border-amber-600 bg-amber-50/40"
            >
              <span className="flex flex-col items-start gap-0.5">
                <span className="font-semibold text-sm text-amber-800">🪢 ลักพาตัว</span>
                <span className="text-[10px] text-muted-foreground">
                  ความสำเร็จ ~{kidnapChance(worldState.playerBuild, npc).toFixed(0)}% · ลักตัวเพื่อภารกิจร้าย
                </span>
              </span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={onKill}
            data-testid="npc-kill"
            className="w-full justify-start text-left h-auto py-2 whitespace-normal border-rose-700 bg-rose-50/40"
          >
            <span className="flex flex-col items-start gap-0.5">
              <span className="font-semibold text-sm text-rose-800 npc-action-label">⚔ สังหาร</span>
              <span className="text-[10px] text-muted-foreground">
                สู้กันถึงตาย · สำเร็จแล้วหมายจับ +{KILL_MARKS} ทันที
              </span>
            </span>
          </Button>

          {objectives.length > 0 && (
            <div className="pt-2 space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                งานภารกิจ
              </div>
              {objectives.map((entry) => (
                <Button
                  key={`${entry.questId}-${entry.spotIndex}`}
                  variant="outline"
                  data-quest-objective={entry.questId}
                  onClick={() => {
                    onClose();
                    if (!entry.spot.sceneId) flashLoading(`${entry.spot.label}...`, 1000, "work");
                    const r = useWorldStore.getState().doQuestObjective(entry.questId, entry.spotIndex);
                    if (!r.ok) { toast("warn", r.message); return; }
                    if (r.sceneId) return;
                    toast("success", r.message, 6000);
                    if (r.advanced) toast("info", `ภารกิจ「${entry.questName}」คืบหน้า`);
                  }}
                  className="w-full justify-start text-left h-auto py-2 whitespace-normal border-emerald-300"
                >
                  <span className="flex flex-col items-start gap-0.5">
                    <span className="font-semibold text-sm">🔍 {entry.spot.label}</span>
                    <span className="text-[10px] text-muted-foreground">{entry.questName}</span>
                  </span>
                </Button>
              ))}
            </div>
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
        parts.push(`+${r.amount} ประสบการณ์ · ${getSkill(r.skillId)?.n ?? "วิชา"}`);
        break;
      case "trait":
        parts.push(`${TRAIT_LABEL[r.trait]} +${r.amount}`);
        break;
      case "npcRelationship":
        parts.push(`สัมพันธ์ ${getNpc(r.npcId)?.name ?? "สหาย"} ${r.amount > 0 ? "+" : ""}${r.amount}`);
        break;
      case "learnSkill":
      case "learnArt":
        parts.push(MYSTERY_MOVE_LABEL);
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
// Lineage quests, saga chapters and the sect art trials: the ways to a sect
// move, which the hero may turn down and drop.
function isSectMoveQuest(q: QuestDef): boolean {
  return !!(q.lineage || q.story || q.isArtQuest);
}

// True when the scene (or one of its choices) runs `startQuest` for the quest.
function sceneStartsQuest(sc: Scene, questId: string): boolean {
  if (sc.kind !== "dialog") return false;
  const starts = (effects?: readonly { t: string; questId?: string }[]) => (effects ?? []).some((e) => e.t === "startQuest" && e.questId === questId);
  return starts(sc.onEnter) || (sc.choices ?? []).some((c) => starts(c.effects));
}

function isOfferableNow(state: ReturnType<typeof useWorldStore.getState>, q: QuestDef): boolean {
  if (state.quests[q.id]) return false;
  if (q.prereqs && !evaluateCondition(state, q.prereqs)) return false;
  return true;
}

// True when a scene definitively closes a quest — either via onEnter
// effects or any choice's effects firing `finishQuest` for that quest
// id. Used by the turn-in router to decide whether the engine needs to
// step in (legacy scenes that didn't author finishQuest themselves).
function sceneClosesQuest(sc: Scene, questId: string): boolean {
  if (sc.kind !== "dialog") return false;
  const inOnEnter = (sc.onEnter ?? []).some(
    (e) => e.t === "finishQuest" && e.questId === questId,
  );
  if (inOnEnter) return true;
  for (const c of sc.choices ?? []) {
    if (
      (c.effects ?? []).some(
        (e) => e.t === "finishQuest" && e.questId === questId,
      )
    ) {
      return true;
    }
  }
  return false;
}
