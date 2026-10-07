"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { WuxiaButton } from "@/components/ui/wuxia/button";
import { useWorldStore } from "@/store/world-store";
import {
  SECT_MEMBERSHIPS,
  getQuestsForSect,
  isSectQuestOfferable,
  isQuestOfferable,
  isSecretSectQuest,
  MYSTERY_MOVE_LABEL,
  describeQuestCondition,
  getNpc,
  getQuest,
  rankUpGold,
} from "@/lib/world";
import { sectLineageQuests } from "@/lib/world/story/registry";
import type { SectId, QuestDef } from "@/lib/world";
import { getSkill, getArt } from "@/lib/game";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "rewards" | "quests" | "art";

const TAB_LABEL: Record<Tab, string> = {
  rewards: "🎖 ขั้นและวิชา",
  quests: "📜 ภารกิจประจำ",
  art: "☯ ลมปราณ",
};

// Multi-tab sect popup. Sect picker (when player has more than one
// membership) sits at the very top; below that:
//   - rewards: rank-up (pays gold) and the sect's martial line — every skill
//              and art, the lineage quest or saga that teaches it, and its gate
//   - quests: repeatable sect quests with cooldown countdown + accept
//   - art:    one-shot rank-gated art quests
export function SectMembershipPopup({ open, onClose }: Props) {
  const sectMembership = useWorldStore((s) => s.sectMembership);
  const upgradeSectRank = useWorldStore((s) => s.upgradeSectRank);
  const acceptSectQuest = useWorldStore((s) => s.acceptSectQuest);
  const resignSect = useWorldStore((s) => s.resignSect);
  const betraySect = useWorldStore((s) => s.betraySect);
  const day = useWorldStore((s) => s.day);
  // Subscribing to whole state for offer checks — popup is mounted only
  // while interacting with the sect tab so the read cost is fine.
  const worldState = useWorldStore();

  // Only ACTIVE memberships are shown in this popup (resigned / betrayed
  // tombstones are tracked silently for skill-XP freeze + hunter spawn).
  const joinedIds = useMemo(
    () =>
      Object.keys(sectMembership).filter((k) => {
        const m = sectMembership[k as SectId];
        return m && (m.status ?? "active") === "active";
      }) as SectId[],
    [sectMembership],
  );

  // Two-step confirm for the ออกจากสำนัก button. `null` = closed; a
  // sectId means the confirm modal is open for that sect.
  const [leaveConfirm, setLeaveConfirm] = useState<SectId | null>(null);

  const [activeId, setActiveId] = useState<SectId | null>(joinedIds[0] ?? null);
  const [tab, setTab] = useState<Tab>("rewards");
  const current = activeId ?? joinedIds[0] ?? null;

  if (!open) return null;

  if (joinedIds.length === 0 || !current) {
    return (
      <Modal open={open} onClose={onClose} title="🪷 สำนัก" maxWidth="max-w-md">
        <div className="menu-empty" data-glyph="門">
          <strong>ยังไม่ได้เข้าสำนักใด</strong>
          <span>เดินทางไปยังสำนักที่สนใจ แล้วคุยกับเจ้าอาวาสหรืออาจารย์ใหญ่เพื่อขอเข้าเป็นศิษย์ บางสำนักรับเฉพาะเพศหรือต้องมีคุณสมบัติก่อน</span>
        </div>
      </Modal>
    );
  }

  const def = SECT_MEMBERSHIPS[current];
  const m = sectMembership[current]!;
  const atTop = m.rank <= def.topRank;
  const nextRank = m.rank - 1;
  const nextCost = atTop ? Infinity : def.rankUpCost(nextRank);
  const canRankUp = !atTop && m.points >= nextCost;
  const sectQuests = getQuestsForSect(current);
  const repeatable = sectQuests.filter((q) => !q.isArtQuest);
  // The T4 saga trials stay secret: their giver offers them in person.
  const artQuests = sectQuests.filter((q) => q.isArtQuest && !isSecretSectQuest(q.id));

  return (
    <Modal open={open} onClose={onClose} title={`🪷 ศิษย์${def.name}`} maxWidth="max-w-2xl">
      {/* Sect picker (only when player belongs to >1 sect). */}
      {joinedIds.length > 1 && (
        <div className="flex gap-1 mb-3">
          {joinedIds.map((id) => {
            const d = SECT_MEMBERSHIPS[id];
            return (
              <button
                key={id}
                onClick={() => setActiveId(id)}
                className={`px-2 py-1 text-xs border ${
                  id === current
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border bg-background"
                }`}
              >
                {d.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Status banner ───────────────────────────────────────── */}
      <section className="space-y-1 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="seal" className="mr-2">
              {def.name}
            </Badge>
            <span className="text-sm">
              ขั้นที่ <strong className="text-base text-vermilion">{m.rank}</strong>
              <span className="text-muted-foreground text-xs ml-1">
                / สูงสุด {def.topRank}
              </span>
            </span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">แต้มสำนัก </span>
            <strong className="text-vermilion">{m.points}</strong>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          เข้าสำนักวันที่ {m.joinedDay} · วันนี้วันที่ {day}
        </div>
      </section>

      {/* ─── Tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border mb-3">
        {(["rewards", "quests", "art"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs border-b-2 transition-colors ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {/* ─── Tab body ────────────────────────────────────────────── */}
      <div className="space-y-4 text-sm">
        {tab === "rewards" && (
          <RewardsTab
            def={def}
            rank={m.rank}
            atTop={atTop}
            nextRank={nextRank}
            nextCost={nextCost}
            canRankUp={canRankUp}
            worldState={worldState}
            onUpgrade={() => upgradeSectRank(current)}
          />
        )}

        {tab === "quests" && (
          <QuestsTab
            quests={repeatable}
            sectId={current}
            cooldownDays={def.questCooldownDays}
            day={day}
            worldState={worldState}
            onAccept={(qid) => acceptSectQuest(current, qid)}
          />
        )}

        {tab === "art" && (
          <ArtQuestsTab
            quests={artQuests}
            sectId={current}
            cooldownDays={def.questCooldownDays}
            artQuestsDone={m.artQuestsDone}
            worldState={worldState}
            onAccept={(qid) => acceptSectQuest(current, qid)}
          />
        )}
      </div>

      {/* ─── Leave sect ─────────────────────────────────────────────
        * Disciple can either formally resign (skills freeze, no hunters)
        * or betray (skills keep leveling but hunters spawn). Both clear
        * `anySectMember` so the player can join another sect.
        */}
      <div className="mt-4 pt-3 border-t border-border flex justify-end">
        <button
          onClick={() => setLeaveConfirm(current)}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          🚪 ออกจากสำนัก
        </button>
      </div>

      {/* Leave-sect confirm modal — overlays the parent popup. */}
      {leaveConfirm && (
        <LeaveSectConfirm
          sectId={leaveConfirm}
          sectName={SECT_MEMBERSHIPS[leaveConfirm].name}
          onClose={() => setLeaveConfirm(null)}
          onResign={() => {
            resignSect(leaveConfirm);
            setLeaveConfirm(null);
            onClose();
          }}
          onBetray={() => {
            betraySect(leaveConfirm);
            setLeaveConfirm(null);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

// ─── Leave-sect confirm ──────────────────────────────────────────────
// Two-choice confirmation. Resign = clean break (skills freeze, no
// hunters). Betray = keep growing skills but a sect-hunter NPC may
// ambush in random events (cleared by the redemption quest).
function LeaveSectConfirm({
  sectName,
  onClose,
  onResign,
  onBetray,
}: {
  sectId: SectId;
  sectName: string;
  onClose: () => void;
  onResign: () => void;
  onBetray: () => void;
}) {
  return (
    <Modal open onClose={onClose} title={`ออกจาก${sectName}`} maxWidth="max-w-md">
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          เลือกวิธีออกจากสำนัก — แต่ละทางเลือกมีผลแตกต่างกัน
        </p>
        <button
          onClick={onResign}
          className="w-full text-left p-3 border border-border hover:border-primary transition-colors"
        >
          <div className="font-semibold">ลาออกอย่างเป็นทางการ</div>
          <div className="text-xs text-muted-foreground mt-1">
            จากกันด้วยดี — ไม่มีนักล่ามาตามล่า · แต่วิชา / ลมปราณที่ได้จากสำนักจะหยุดเลื่อนขั้น (ระดับเดิมยังใช้ได้)
          </div>
        </button>
        <button
          onClick={onBetray}
          className="w-full text-left p-3 border border-border hover:border-destructive text-destructive transition-colors"
        >
          <div className="font-semibold">ทรยศสำนัก</div>
          <div className="text-xs text-muted-foreground mt-1">
            หนีโดยไม่บอกใคร — วิชาจากสำนักยังเลื่อนขั้นได้ตามปกติ · แต่นักล่าจากสำนักจะตามล่าเจ้าในที่ต่าง ๆ (เช็กหนีด้วย AGI + LUK) · ล้างได้ด้วยภารกิจไถ่บาปกับเจ้าสำนัก
          </div>
        </button>
        <button
          onClick={onClose}
          className="w-full text-center p-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ยกเลิก
        </button>
      </div>
    </Modal>
  );
}

// ─── Rewards tab ─────────────────────────────────────────────────────
interface RewardsTabProps {
  def: import("@/lib/world").SectMembershipDef;
  rank: number;
  atTop: boolean;
  nextRank: number;
  nextCost: number;
  canRankUp: boolean;
  worldState: import("@/lib/world").WorldStateData;
  onUpgrade: () => void;
}

function RewardsTab({ def, rank, atTop, nextRank, nextCost, canRankUp, worldState, onUpgrade }: RewardsTabProps) {
  const learnedSkills = worldState.playerBuild?.learnedSkillIds ?? [];
  const learnedArts = worldState.playerBuild?.learnedArtIds ?? [];
  // T4 moves come from sagas the sect window never lists; the rest show as
  // "วิชาลึกลับ" until learned.
  const lineage = sectLineageQuests(def.name);
  return (
    <>
      {/* ─── Rank-up ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <strong>เลื่อนขั้น</strong>
          {atTop ? (
            <span className="text-xs text-muted-foreground">ขั้นสูงสุดแล้ว</span>
          ) : (
            <span className="text-xs text-muted-foreground">
              ต้องการ <strong className="text-foreground">{nextCost}</strong> แต้มสำนัก
              เพื่อเลื่อนเป็นขั้น {nextRank}
            </span>
          )}
        </div>
        {!atTop && (
          <WuxiaButton variant={canRankUp ? "primary" : "default"} disabled={!canRankUp} onClick={onUpgrade}>
            เลื่อนเป็นขั้น {nextRank} (จ่าย {nextCost} · รับ {rankUpGold(def, nextRank)} ตำลึง)
          </WuxiaButton>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          ขั้นที่สูงขึ้นเปิดภารกิจสืบทอดวิชาและตำนานของสำนัก — วิชาทุกวิชาได้จากภารกิจเหล่านั้นเท่านั้น
        </p>
      </section>

      {/* ─── The sect's martial line ─────────────────────────────── */}
      <section className="border-t border-border pt-3 space-y-1.5" data-testid="sect-lineage">
        <strong>วิชาของสำนัก</strong>
        {lineage.length === 0 && <div className="text-xs text-muted-foreground">สำนักนี้ยังไม่มีวิชาให้สืบทอด</div>}
        {lineage.map((e) => {
          // A tier quest with several moves is one choice: the row names the one
          // picked, or how many there are to pick from.
          const options = e.options;
          const learnedId = options.find((id) => (e.kind === "skill" ? learnedSkills : learnedArts).includes(id));
          const item = learnedId ? (e.kind === "skill" ? getSkill(learnedId) : getArt(learnedId)) : null;
          const quest = getQuest(e.questId);
          const qs = worldState.quests[e.questId];
          const giver = quest?.giverNpcId ? getNpc(quest.giverNpcId)?.name : undefined;
          let status: string;
          if (learnedId) status = "✓ เรียนแล้ว";
          else if (qs?.status === "done") status = "✓ ได้คัมภีร์แล้ว";
          else if (qs?.status === "active") status = "▶ กำลังทำ";
          else if (e.rank !== null && rank > e.rank) status = `ต้องขั้น ${e.rank}`;
          else if (quest && isQuestOfferable(worldState, quest)) status = `รับได้จาก ${giver ?? "—"}`;
          else {
            const unmet = quest ? describeQuestCondition(worldState, quest.prereqs ?? { t: "and", all: [] }).filter((l) => !l.done && !l.negated) : [];
            status = unmet.length ? `ต้องการ ${unmet.map((l) => l.label).join(", ")}` : "ยังไม่ครบเงื่อนไข";
          }
          return (
            <div key={e.questId} className="flex items-baseline justify-between gap-2 text-xs" data-lineage-id={e.id} data-lineage-options={options.length}>
              <span className="min-w-0 truncate">
                {item ? item.n : MYSTERY_MOVE_LABEL}{" "}
                <span className="text-muted-foreground text-[10px]">
                  {item ? `T${item.ti} · ` : ""}{e.kind === "skill" ? "กระบวนท่า" : "ลมปราณ"}
                  {!item && options.length > 1 ? ` · เลือก 1 จาก ${options.length}` : ""}
                </span>
              </span>
              <span className={`shrink-0 ${learnedId ? "text-jade" : "text-muted-foreground"}`}>{status}</span>
            </div>
          );
        })}
      </section>
    </>
  );
}

// ─── Repeatable sect quests tab ─────────────────────────────────────
interface QuestsTabProps {
  quests: QuestDef[];
  sectId: SectId;
  cooldownDays: number;
  day: number;
  worldState: import("@/lib/world").WorldStateData;
  onAccept: (questId: string) => { ok: boolean; reason?: string };
}

function QuestsTab({ quests, cooldownDays, day, worldState, onAccept }: QuestsTabProps) {
  if (quests.length === 0) {
    return <div className="text-xs text-muted-foreground">ยังไม่มีภารกิจประจำสำนัก</div>;
  }
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        ภารกิจประจำ — รับซ้ำได้ทุก {cooldownDays} วันหลังจากทำสำเร็จ
      </div>
      {quests.map((q) => {
        const status = isSectQuestOfferable(worldState, q, cooldownDays);
        const active = worldState.quests[q.id]?.status === "active";
        return (
          <div
            key={q.id}
            className="border border-border bg-card/50 p-2 space-y-1"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-sm font-bold">{q.name}</div>
                <div className="text-xs text-muted-foreground">
                  {q.briefSummary ?? q.description}
                </div>
              </div>
              <div className="text-[10px] text-right whitespace-nowrap">
                {q.minSectRank != null && (
                  <div className="text-muted-foreground">≤ ขั้น {q.minSectRank}</div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs">
                {active ? (
                  <span className="text-vermilion">📜 กำลังทำอยู่</span>
                ) : status.offerable ? (
                  <span className="text-jade">พร้อมรับ</span>
                ) : status.cooldownLeft > 0 ? (
                  <span className="text-muted-foreground">
                    คูลดาวน์อีก {status.cooldownLeft} วัน
                  </span>
                ) : (
                  <span className="text-muted-foreground">{status.reason ?? "—"}</span>
                )}
              </div>
              <WuxiaButton
                variant={status.offerable ? "primary" : "default"}
                size="sm"
                disabled={!status.offerable}
                onClick={() => onAccept(q.id)}
              >
                รับภารกิจ
              </WuxiaButton>
            </div>
          </div>
        );
      })}
      <div className="text-[10px] text-muted-foreground pt-1">
        วันนี้วันที่ {day} · ทำสำเร็จแล้วจะเริ่มนับคูลดาวน์
      </div>
    </div>
  );
}

// ─── Art quest tab ─────────────────────────────────────────────────
interface ArtQuestsTabProps {
  quests: QuestDef[];
  sectId: SectId;
  cooldownDays: number;
  artQuestsDone: readonly string[];
  worldState: import("@/lib/world").WorldStateData;
  onAccept: (questId: string) => { ok: boolean; reason?: string };
}

function ArtQuestsTab({
  quests,
  cooldownDays,
  artQuestsDone,
  worldState,
  onAccept,
}: ArtQuestsTabProps) {
  if (quests.length === 0) {
    return <div className="text-xs text-muted-foreground">ยังไม่มีภารกิจลมปราณของสำนักนี้</div>;
  }
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        ภารกิจหายาก — ทำได้ครั้งเดียว เพื่อรับลมปราณระดับสูง
      </div>
      {quests.map((q) => {
        const status = isSectQuestOfferable(worldState, q, cooldownDays);
        const done = artQuestsDone.includes(q.id);
        const active = worldState.quests[q.id]?.status === "active";
        return (
          <div
            key={q.id}
            className="border border-border bg-card/50 p-2 space-y-1"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-sm font-bold">
                  {q.name}{" "}
                  {done && <span className="text-jade text-xs">✓ เรียนแล้ว</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {q.briefSummary ?? q.description}
                </div>
              </div>
              <div className="text-[10px] text-right whitespace-nowrap">
                {q.minSectRank != null && (
                  <div className="text-muted-foreground">≤ ขั้น {q.minSectRank}</div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs">
                {done ? (
                  <span className="text-jade">รับวิชาแล้ว</span>
                ) : active ? (
                  <span className="text-vermilion">📜 กำลังทำอยู่</span>
                ) : status.offerable ? (
                  <span className="text-jade">พร้อมรับ</span>
                ) : (
                  <span className="text-muted-foreground">{status.reason ?? "—"}</span>
                )}
              </div>
              <WuxiaButton
                variant={status.offerable ? "primary" : "default"}
                size="sm"
                disabled={!status.offerable}
                onClick={() => onAccept(q.id)}
              >
                รับภารกิจ
              </WuxiaButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}
