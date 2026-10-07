"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ART_LEVEL_MAX,
  SKILL_LEVEL_MAX,
  SKILL_TYPE_LABEL,
  TIERS,
  WEAPON_FAMILY_HINT,
  WEAPON_FAMILY_LABEL,
  bpMultiplier,
  computeConflictFactors,
  deriveAll,
  effectiveBp,
  effectiveMg,
  effectiveTypes,
  encodeArtSlot,
  getArt,
  getMasteryMap,
  getSkill,
  getStatusFactor,
  isArtSlot,
  parseSlotId,
  xpToNextArtLevel,
  xpToNextLevel,
} from "@/lib/game";
import type { WeaponFamily } from "@/lib/game";
import { ATTACK_KIND_LABEL, damageMultiplierText, passiveLine, plainThai, skillFlavour, skillSummaryLines, statLine } from "@/lib/game/skill-text";
import { useWorldStore } from "@/store/world-store";
import { confirmDialog } from "@/store/confirm-store";
import { ArtTooltip, SkillTooltip } from "../skill-tooltip";
import { UpgradePayoff, type UpgradeReceipt } from "./upgrade-payoff";
import { ArtIcon, SkillIcon } from "@/components/game/skill-icon";
import { rarityColor } from "@/lib/ui/rarity";
import { PagedGrid } from "@/components/ui/paged-grid";
import { useShortScreen } from "@/components/ui/use-short-screen";

interface Props {
  open: boolean;
  onClose: () => void;
}

type LibraryFilter = "all" | "skill" | "art";
const FILTER_LABEL: Record<LibraryFilter, string> = { all: "ทั้งหมด", skill: "⚔ กระบวนท่า", art: "☯ ลมปราณ" };

// Move-skills popup — the unified "skill tab", three landscape columns:
//   1. what's been gained (counts, weapon mastery, conflicts) and the 10 round
//      loadout slots (each holds a learned move skill or inner art);
//   2. the library of everything learned, icon + name, paged;
//   3. the picked one in full, with equip / remove / level / forget.
export function MoveSkillsPopup({ open, onClose }: Props) {
  const player = useWorldStore((s) => s.playerBuild);
  const skillLevel = useWorldStore((s) => s.skillLevel);
  const skillExp = useWorldStore((s) => s.skillExp);
  const artExp = useWorldStore((s) => s.artExp);
  const wExp = useWorldStore((s) => s.wExp);
  const levelUpFromWExp = useWorldStore((s) => s.levelUpSkillFromWExp);
  const levelUpArtFromWExp = useWorldStore((s) => s.levelUpArtFromWExp);
  const forgetSkill = useWorldStore((s) => s.forgetSkill);
  const forgetArt = useWorldStore((s) => s.forgetArt);
  const equipSlot = useWorldStore((s) => s.equipSlot);
  const [upgradeReceipt, setUpgradeReceipt] = useState<UpgradeReceipt | null>(null);
  // Hero's Adventure-style loadout: a row of round slots, one targeted at a
  // time; the library on the left picks what the right-hand panel shows.
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const short = useShortScreen();

  useEffect(() => {
    if (!open) setUpgradeReceipt(null);
  }, [open]);

  const upgrade = (rawId: string) => {
    // Snapshot the live store, not render-time values: rapid clicks must show
    // the level and cost of the action that actually succeeded.
    const before = useWorldStore.getState();
    const info = parseSlotId(rawId);
    if (!before.playerBuild || !info) return;
    const result = info.kind === "skill"
      ? levelUpFromWExp(info.skill.id)
      : levelUpArtFromWExp(info.art.id);
    if (!result.ok) return;
    const after = useWorldStore.getState();
    if (!after.playerBuild) return;

    const previousLevel = result.level - 1;
    const factors = computeConflictFactors(after.playerBuild, { getSkill, getArt });
    const definition = info.kind === "skill" ? info.skill : info.art;
    const factor = getStatusFactor(definition, factors);
    const changes: UpgradeReceipt["changes"] = [];
    if (info.kind === "skill") {
      const sk = info.skill;
      changes.push({
        label: "พลังโจมตีพื้นฐาน",
        before: Math.round(effectiveBp(sk, previousLevel) * factor),
        after: Math.round(effectiveBp(sk, result.level) * factor),
      }, {
        label: `ความชำนาญ${WEAPON_FAMILY_LABEL[sk.w]}`,
        before: getMasteryMap(before.playerBuild.skillIds, before.playerBuild.skillLevels, factors)[sk.w] ?? 0,
        after: getMasteryMap(after.playerBuild.skillIds, after.playerBuild.skillLevels, factors)[sk.w] ?? 0,
      });
    } else {
      const previousStats = deriveAll(before.playerBuild);
      const nextStats = deriveAll(after.playerBuild);
      changes.push(
        { label: "พลังชีวิตสูงสุด (HP)", before: previousStats.HP, after: nextStats.HP },
        { label: "ปราณสูงสุด (MP)", before: previousStats.MP, after: nextStats.MP },
      );
    }
    setUpgradeReceipt({
      rawId,
      name: definition.n,
      bodyId: after.playerBodyId,
      previousLevel,
      level: result.level,
      cost: result.cost,
      remaining: after.wExp,
      changes,
      detail: factor < 1
        ? "ค่าที่แสดงหักผลจากวิชาขัดแย้งแล้ว"
        : info.kind === "skill"
          ? "พลังโจมตีพื้นฐานและความชำนาญอาวุธช่วยเพิ่มความเสียหายเมื่อโจมตี"
          : "ค่าพลังสูงสุดใหม่มีผลแล้ว · พักผ่อนเพื่อฟื้นพลัง",
    });
  };

  const learnedSkillIds = player?.learnedSkillIds ?? [];
  const learnedArtIds = player?.learnedArtIds ?? [];

  if (!player) return null;

  const slots = player.skillIds;
  const conflict = computeConflictFactors(player, { getSkill, getArt });
  const conflictedTypes = (
    Object.keys(conflict) as (keyof typeof SKILL_TYPE_LABEL)[]
  ).filter((k) => (conflict[k] ?? 1) < 1);

  // For the library section: which slot (if any) currently holds each
  // learned thing. Helps the player see at a glance what's spare.
  const slotForRaw = new Map<string, number>();
  for (let i = 0; i < slots.length; i++) {
    const raw = slots[i];
    if (raw) slotForRaw.set(raw, i);
  }

  // Aggregate "what have I gained on this tab" — counts, total levels,
  // mastery points by weapon, currently-equipped art level.
  const totalSkills = learnedSkillIds.length;
  const totalArts = learnedArtIds.length;
  const skillLevelSum = learnedSkillIds.reduce(
    (sum, sid) => sum + (skillLevel[sid] ?? 1),
    0,
  );
  let equippedArtLv: number | null = null;
  for (const raw of slots) {
    const info = parseSlotId(raw);
    if (info?.kind === "art") {
      equippedArtLv = player.artLevels?.[info.art.id] ?? 1;
      break;
    }
  }
  const mastery = getMasteryMap(player.skillIds, player.skillLevels);

  // What the right-hand panel shows: the picked library entry, else the
  // targeted slot's, else the first thing learned.
  const library: string[] = [
    ...learnedSkillIds.filter((sid) => getSkill(sid)),
    ...learnedArtIds.filter((aid) => aid !== "none" && getArt(aid)).map(encodeArtSlot),
  ];
  const shownRaw = (picked && library.includes(picked) ? picked : null) ?? slots[selectedSlot] ?? library[0] ?? null;
  const shown = parseSlotId(shownRaw);
  const visible = library.filter((raw) => filter === "all" || (filter === "art") === raw.startsWith("art:"));
  const freeSlot = slots.findIndex((x) => x === null);
  // Equip into the targeted slot when it is empty, else the first free one,
  // else replace the targeted slot.
  const equipTarget = slots[selectedSlot] === null ? selectedSlot : freeSlot >= 0 ? freeSlot : selectedSlot;

  const forget = async (raw: string) => {
    const info = parseSlotId(raw);
    if (!info) return;
    const name = info.kind === "art" ? info.art.n : info.skill.n;
    const ok = await confirmDialog({
      title: info.kind === "art" ? "ลืมลมปราณ" : "ลืมวิชา",
      message: `ลืมวิชา "${name}"?\nระดับและค่าประสบการณ์ของวิชานี้จะถูกล้าง และต้องเรียนใหม่จากตำราอีกครั้ง`,
      confirmText: "ลืมวิชา",
      variant: "warn",
    });
    if (!ok) return;
    if (info.kind === "art") forgetArt(info.art.id);
    else forgetSkill(info.skill.id);
    setPicked(null);
  };

  return (
    <Modal open={open} onClose={onClose} title={`🥋 กระบวนท่า (${slots.length} ช่อง)`} fill>
      <div className="menu-cols skills-cols">
        {/* ─── 1. What's been gained, and the 10 slots ─────────────── */}
        <section className="menu-col skills-status" aria-label="สถานะวิชา" data-testid="skill-status">
          <div className="skills-stats">
            <span>กระบวนท่า <b>{totalSkills}</b></span>
            <span>ลมปราณ <b>{totalArts}</b></span>
            <span title="ระดับของทุกวิชารวมกัน">ระดับรวม <b className="text-emerald-600">{skillLevelSum}</b></span>
            {equippedArtLv !== null && <span>ระดับลมปราณ <b>{equippedArtLv}</b></span>}
            <span title="ประสบการณ์ยุทธ (w-exp) ใช้เลื่อนระดับวิชาได้ทันที">ประสบการณ์ยุทธ <b className="text-primary">{wExp}</b></span>
          </div>
          <div className="skills-mastery">
            <span className="skills-mastery-label" title="ยิ่งชำนาญอาวุธชนิดใด ท่าของอาวุธนั้นยิ่งแรง (สูงสุด 200)">ความชำนาญอาวุธ</span>
            {Object.keys(mastery).length === 0 ? <span className="text-muted-foreground">ยังไม่มี</span> : Object.entries(mastery).map(([w, v]) => (
              <span key={w} className="profile-chip" title={WEAPON_FAMILY_HINT[w as WeaponFamily]}>
                {WEAPON_FAMILY_LABEL[w as WeaponFamily]} <b>{Math.floor(v ?? 0)}</b>
              </span>
            ))}
          </div>
          {conflictedTypes.length > 0 && (
            <div className="skills-conflict" title="วิชาที่ติดตั้งเอียงไปทางหนึ่งมากเกินไป วิชาฝั่งตรงข้ามจึงอ่อนกำลังลง">
              วิชาขัดกัน: {conflictedTypes.map((t) => `สาย${SKILL_TYPE_LABEL[t]}${conflictText(conflict[t] ?? 1)}`).join(" · ")}
            </div>
          )}
          <div className="menu-col-head"><span className="menu-col-title">วิชาที่ติดตั้ง</span></div>
          <div className="skill-loadout" role="tablist" aria-label="ช่องวิชาที่ติดตั้ง">
            {slots.map((raw, i) => {
              const info = parseSlotId(raw);
              const name = info ? (info.kind === "art" ? info.art.n : info.skill.n) : "ว่าง";
              const lv = info ? (info.kind === "art" ? player.artLevels?.[info.art.id] ?? 1 : skillLevel[info.skill.id] ?? 1) : 0;
              const tierIndex = info ? (info.kind === "art" ? info.art.ti : info.skill.ti) : 0;
              return <button key={i} type="button" role="tab" aria-selected={selectedSlot === i}
                className={`skill-slot${info ? "" : " skill-slot--empty"}`} onClick={() => { setSelectedSlot(i); setPicked(raw); }}
                style={{ "--rarity": rarityColor(tierIndex) } as React.CSSProperties} title={`ช่อง ${i + 1}: ${name}`}>
                <span className="skill-slot-medal">
                  {info ? (info.kind === "art" ? <ArtIcon art={info.art} size={30} /> : <SkillIcon skill={info.skill} size={30} />) : <span aria-hidden="true">+</span>}
                  {info && <b className="skill-slot-level">{lv}</b>}
                </span>
                <span className="skill-slot-name">{name}</span>
              </button>;
            })}
          </div>
        </section>

        {/* ─── 2. The library ─────────────────────────────────────── */}
        <section className="menu-col skills-library" aria-label="คลังวิชา" data-testid="skill-library">
          <div className="menu-col-head">
            <span className="menu-col-title">คลังวิชา ({library.length})</span>
          </div>
          <div className="menu-tabs" role="tablist" aria-label="กรองคลังวิชา">
            {(Object.keys(FILTER_LABEL) as LibraryFilter[]).map((f) => (
              <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}>{FILTER_LABEL[f]}</button>
            ))}
          </div>
          <PagedGrid items={visible} itemKey={(raw) => raw} cellWidth={180} cellHeight={short ? 40 : 46} gap={4} resetKey={filter}
            focusKey={shownRaw} label="รายการวิชา"
            empty={<p className="bag-empty text-xs italic py-2">ยังไม่ได้เรียนรู้วิชาใด — ทำภารกิจเพื่อรับคัมภีร์วิชา แล้วอ่านจากย่าม</p>}
            render={(raw) => {
              const info = parseSlotId(raw)!;
              const def = info.kind === "art" ? info.art : info.skill;
              const lv = info.kind === "art" ? player.artLevels?.[info.art.id] ?? 1 : skillLevel[info.skill.id] ?? 1;
              const slotIdx = slotForRaw.get(raw);
              return (
                <button type="button" className="skills-library-item" aria-pressed={shownRaw === raw}
                  data-library-id={raw} onClick={() => setPicked(raw)}
                  style={{ "--rarity": rarityColor(def.ti) } as React.CSSProperties}>
                  <span className="skills-library-icon">
                    {info.kind === "art" ? <ArtIcon art={info.art} size={short ? 24 : 28} /> : <SkillIcon skill={info.skill} size={short ? 24 : 28} />}
                  </span>
                  <span className="skills-library-name">
                    <span>{def.n}</span>
                    <small>{info.kind === "art" ? "☯ ลมปราณ" : `⚔ ${WEAPON_FAMILY_LABEL[info.skill.w]}`} · ระดับ {lv}</small>
                  </span>
                  {typeof slotIdx === "number" && <b className="skills-library-slot" title={`ติดตั้งช่อง ${slotIdx + 1}`}>{slotIdx + 1}</b>}
                </button>
              );
            }} />
        </section>

        {/* ─── 3. The picked move, and what to do with it ─────────── */}
        <section className="menu-col menu-col--scroll skills-detail" aria-label="รายละเอียดวิชา" data-testid="skill-detail">
          {!shown || !shownRaw ? (
            <p className="bag-detail-hint text-xs italic">เลือกวิชาจากคลังเพื่อดูรายละเอียด</p>
          ) : (
            <SkillDetail
              raw={shownRaw}
              info={shown}
              level={shown.kind === "art" ? player.artLevels?.[shown.art.id] ?? 1 : skillLevel[shown.skill.id] ?? 1}
              xp={shown.kind === "art" ? artExp[shown.art.id] ?? 0 : skillExp[shown.skill.id] ?? 0}
              wExp={wExp}
              conflict={conflict}
              slot={slotForRaw.get(shownRaw)}
              equipLabel={slots[equipTarget] ? `แทนที่ช่อง ${equipTarget + 1}` : `ติดตั้งลงช่อง ${equipTarget + 1}`}
              onEquip={() => { equipSlot(equipTarget, shownRaw); setSelectedSlot(equipTarget); }}
              onUnequip={(slot) => equipSlot(slot, null)}
              onForget={() => forget(shownRaw)}
              onUpgrade={() => upgrade(shownRaw)}
              receipt={upgradeReceipt?.rawId === shownRaw ? upgradeReceipt : null}
              onDismissReceipt={() => setUpgradeReceipt(null)}
            />
          )}
        </section>
      </div>
    </Modal>
  );
}

interface SkillDetailProps {
  raw: string;
  info: NonNullable<ReturnType<typeof parseSlotId>>;
  level: number;
  xp: number;
  wExp: number;
  conflict: ReturnType<typeof computeConflictFactors>;
  /** The loadout slot holding it, if any. */
  slot: number | undefined;
  equipLabel: string;
  onEquip: () => void;
  onUnequip: (slot: number) => void;
  onForget: () => void;
  onUpgrade: () => void;
  receipt: UpgradeReceipt | null;
  onDismissReceipt: () => void;
}

// The right-hand panel: one move skill or inner art in full — badges, bonus,
// numbers, xp bar, the w-exp top-up, and equip / remove / forget.
function SkillDetail({ raw, info, level: lv, xp, wExp, conflict, slot, equipLabel, onEquip, onUnequip, onForget, onUpgrade, receipt, onDismissReceipt }: SkillDetailProps) {
  const def = info.kind === "art" ? info.art : info.skill;
  const types = effectiveTypes(def);
  const cFactor = getStatusFactor(def, conflict);
  const maxed = lv >= (info.kind === "art" ? ART_LEVEL_MAX : SKILL_LEVEL_MAX);
  const cost = maxed ? Infinity : info.kind === "art" ? xpToNextArtLevel(info.art, lv) : xpToNextLevel(info.skill, lv);
  const xpCapped = maxed ? 1 : Math.min(xp, cost);
  const xpPct = maxed ? 100 : Math.min(100, Math.round((xp / cost) * 100));
  const wExpCost = maxed ? Infinity : Math.max(0, cost - Math.min(xp, cost));
  const canWExp = !maxed && wExp >= wExpCost;
  const tier = TIERS[def.ti];

  return (
    <div className="space-y-2" data-detail-id={raw}>
      <div className="skills-detail-head">
        {info.kind === "art" ? <ArtIcon art={info.art} size={44} /> : <SkillIcon skill={info.skill} size={44} />}
        <div className="min-w-0 flex-1">
          {info.kind === "art" ? (
            <ArtTooltip art={info.art} level={lv}>
              <strong className="text-base cursor-help underline decoration-dotted underline-offset-2">{def.n}</strong>
            </ArtTooltip>
          ) : (
            <SkillTooltip skill={info.skill} level={lv}>
              <strong className="text-base cursor-help underline decoration-dotted underline-offset-2">{def.n}</strong>
            </SkillTooltip>
          )}
          <div className="text-[11px] text-muted-foreground">
            {info.kind === "art" ? "☯ ลมปราณ" : "⚔ กระบวนท่า"} · ระดับ {lv}{maxed ? " (สูงสุด)" : ""}
            {typeof slot === "number" ? ` · ติดตั้งช่อง ${slot + 1}` : ""}
          </div>
        </div>
      </div>

      <div className="skills-detail-actions">
        {typeof slot === "number" ? (
          <Button size="sm" variant="outline" className="h-8 text-[12px]" onClick={() => onUnequip(slot)}>ถอดออกจากช่อง {slot + 1}</Button>
        ) : (
          <Button size="sm" className="h-8 text-[12px]" data-testid="skill-equip" onClick={onEquip}>{equipLabel}</Button>
        )}
        {!maxed && (
          <Button size="sm" variant="outline" className="text-[12px] h-8" disabled={!canWExp} onClick={onUpgrade}
            title={canWExp ? `ใช้ประสบการณ์ยุทธ ${wExpCost} เลื่อนเป็นระดับถัดไปทันที` : `ต้องมีประสบการณ์ยุทธ ${wExpCost}`}>
            เลื่อนระดับ (ใช้ประสบการณ์ยุทธ {wExpCost})
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-8 px-2 text-[12px] text-destructive hover:bg-destructive/10"
          title="ลบออกจากวิชาที่เรียนแล้ว — ช่วยลดการขัดกันของวิชา" onClick={onForget}>
          ลืมวิชา
        </Button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {tier && <Badge variant="outline" className="text-[9px]">{tier.n}</Badge>}
        {def.sc && <Badge variant="outline" className="text-[9px]">{def.sc}</Badge>}
        {info.kind === "art" ? (
          <Badge variant="outline" className="text-[9px]">{info.art.tp}</Badge>
        ) : (
          <>
            <Badge variant="outline" className="text-[9px]" title={WEAPON_FAMILY_HINT[info.skill.w]}>{WEAPON_FAMILY_LABEL[info.skill.w]}</Badge>
            {info.skill.at && <Badge variant="outline" className="text-[9px]">{ATTACK_KIND_LABEL[info.skill.at] || "ท่าเสริม"}</Badge>}
          </>
        )}
        {types.length > 0 && (
          <Badge variant="outline" className="text-[9px] opacity-80" title="ลักษณะของวิชา — ถ้าติดตั้งวิชาสายเดียวกันมากเกินไป สายตรงข้ามจะอ่อนกำลังลง">
            สาย{types.map((t) => SKILL_TYPE_LABEL[t]).join("·")}
          </Badge>
        )}
        {cFactor < 1 && (
          <Badge variant="outline" className="text-[9px] border-rose-400 text-rose-600">วิชาขัดกัน{conflictText(cFactor)}</Badge>
        )}
      </div>

      {info.kind === "art" ? <ArtNumbers art={info.art} lv={lv} /> : <SkillNumbers skill={info.skill} lv={lv} />}

      <div className="space-y-1">
        <div className="text-[10px] text-muted-foreground">
          {maxed
            ? "ขั้นสูงสุดแล้ว"
            : info.kind === "art"
              ? `ค่าประสบการณ์ ${xpCapped}/${cost} สู่ระดับ ${lv + 1}`
              : `ค่าประสบการณ์ ${xpCapped}/${cost} สู่ระดับ ${lv + 1}`}
        </div>
        <div className="h-1.5 bg-muted rounded overflow-hidden">
          <div className={`h-full ${maxed ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${xpPct}%` }} />
        </div>
      </div>


      {receipt && <UpgradePayoff key={`${raw}-${receipt.level}`} receipt={receipt} onDismiss={onDismissReceipt} />}
    </div>
  );
}

function ArtNumbers({ art, lv }: { art: ReturnType<typeof getArt>; lv: number }) {
  const stats = statLine(art.stats, lv / 10);
  const extra = [art.hL ? `พลังชีวิต +${art.hL * lv}` : "", art.mL ? `ปราณ +${art.mL * lv}` : ""].filter(Boolean).join(" · ");
  return (
    <>
      {art.d && <div className="text-[11px] text-muted-foreground">{plainThai(art.d)}</div>}
      {(stats || extra) && (
        <div className="text-[11px] text-emerald-700">
          เพิ่มค่าสถานะ: {[stats, extra].filter(Boolean).join(" · ")}
          {lv < ART_LEVEL_MAX && <span className="opacity-60"> (เพิ่มขึ้นทุกระดับ)</span>}
        </div>
      )}
      {art.act && <div className="text-[11px] text-muted-foreground">⚡ ท่าออกพลัง <strong>{art.act.n}</strong> · ใช้ปราณ {art.act.c} · ใช้แล้วพัก {art.act.cd} ตา · {plainThai(art.act.d)}</div>}
      {art.pas && <div className="text-[11px] text-muted-foreground">◆ ติดตัว: {passiveLine(art.pas)}</div>}
    </>
  );
}

function SkillNumbers({ skill: sk, lv }: { skill: NonNullable<ReturnType<typeof getSkill>>; lv: number }) {
  const flavour = skillFlavour(sk);
  const bpMax = Math.round(effectiveBp(sk, SKILL_LEVEL_MAX));
  const mgMax = Math.round(effectiveMg(sk, SKILL_LEVEL_MAX));
  const atMax = lv >= SKILL_LEVEL_MAX;
  const dm = damageMultiplierText(sk.dm);
  return (
    <>
      {flavour && <div className="text-[11px] italic text-muted-foreground">{flavour}</div>}
      <ul className="text-[11px] text-foreground space-y-0.5">
        {skillSummaryLines(sk).map((line) => <li key={line}>• {line}</li>)}
      </ul>
      {Object.keys(sk.st).length > 0 && (
        <div className="text-[11px] text-emerald-700">
          เพิ่มค่าสถานะ: {statLine(sk.st, bpMultiplier(lv))}
          {!atMax && <span className="opacity-60"> (ระดับ 10: {statLine(sk.st, 1)})</span>}
        </div>
      )}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
        <span>พลังโจมตีพื้นฐาน <b className="text-foreground">{Math.round(effectiveBp(sk, lv))}</b>{!atMax && <span className="opacity-60"> (ระดับ 10: {bpMax})</span>}</span>
        {sk.p > 0 && <span>เสริมพลังท่า +{sk.p}%</span>}
        {sk.f > 0 && <span>ความเสียหายเพิ่ม +{sk.f}</span>}
        {dm && <span>{dm}</span>}
        <span>ความชำนาญ{WEAPON_FAMILY_LABEL[sk.w]} <b className="text-foreground">+{Math.round(effectiveMg(sk, lv))}</b>{!atMax && <span className="opacity-60"> (ระดับ 10: +{mgMax})</span>}</span>
      </div>
    </>
  );
}

/** "เหลือครึ่งเดียว" for a conflict factor. */
function conflictText(factor: number): string {
  if (factor <= 0) return "ไม่ได้ผลเลย";
  return `เหลือ ${Math.round(factor * 100)}%`;
}

// Quiet the unused-import warning while leaving the helper available for
// future authoring — `isArtSlot` is handy when iterating raw slot ids.
void isArtSlot;
