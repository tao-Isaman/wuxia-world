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
  mgMultiplier,
  parseSlotId,
  xpToNextArtLevel,
  xpToNextLevel,
} from "@/lib/game";
import type { WeaponFamily } from "@/lib/game";
import { useWorldStore } from "@/store/world-store";
import { confirmDialog } from "@/store/confirm-store";
import { ArtTooltip, SkillTooltip } from "../skill-tooltip";
import { UpgradePayoff, type UpgradeReceipt } from "./upgrade-payoff";
import { ArtIcon, SkillIcon } from "@/components/game/skill-icon";
import { rarityColor } from "@/lib/ui/rarity";

interface Props {
  open: boolean;
  onClose: () => void;
}

type LibraryFilter = "all" | "skill" | "art";
const FILTER_LABEL: Record<LibraryFilter, string> = { all: "ทั้งหมด", skill: "⚔ ฝีมือ", art: "☯ ในกาย" };

// Move-skills popup — the unified "skill tab". The 10 round slots across the
// top are the loadout (each holds a learned move skill or inner art). Below,
// the library of everything learned sits on the left as icon + name; the
// right shows the picked one in full, with equip / remove / level / forget.
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
        label: "พลังท่า (BP)",
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
          ? "พลังท่าและความชำนาญช่วยเพิ่มความเสียหายเมื่อโจมตี"
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
      title: info.kind === "art" ? "ลืมวิชาในกาย" : "ลืมวิชา",
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
    <Modal open={open} onClose={onClose} title={`🥋 วิชาฝีมือ (${slots.length} ช่อง)`} maxWidth="max-w-4xl">
      {/* ─── Tab status — what's been gained ───────────────────────── */}
      <div className="mb-3 rounded bg-muted/30 px-3 py-2 space-y-1.5 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            สถานะที่สั่งสม
          </span>
          <span>วิชาฝีมือ <strong>{totalSkills}</strong></span>
          <span>วิชาในกาย <strong>{totalArts}</strong></span>
          <span>ขั้นรวม <strong className="text-emerald-600">{skillLevelSum}</strong></span>
          {equippedArtLv !== null && (
            <span>วิชาในกายขั้น <strong>{equippedArtLv}</strong></span>
          )}
          <span>w-exp <strong className="font-mono text-primary">{wExp}</strong></span>
        </div>
        {Object.keys(mastery).length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="text-muted-foreground">ฝีมือ:</span>
            {Object.entries(mastery).map(([w, v]) => (
              <span
                key={w}
                className="bg-muted/50 px-1.5 py-0.5 rounded"
                title={WEAPON_FAMILY_HINT[w as WeaponFamily]}
              >
                <strong className="text-primary">{Math.floor(v ?? 0)}</strong>
                <span className="opacity-70"> pt </span>
                {WEAPON_FAMILY_LABEL[w as WeaponFamily]}
              </span>
            ))}
          </div>
        )}
        {conflictedTypes.length > 0 && (
          <div className="text-[10px] text-rose-600">
            ขัดแย้ง:{" "}
            {conflictedTypes
              .map((t) => `${SKILL_TYPE_LABEL[t]} ×${(conflict[t] ?? 1).toFixed(1)}`)
              .join(", ")}
          </div>
        )}
      </div>

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
              {info ? (info.kind === "art" ? <ArtIcon art={info.art} size={34} /> : <SkillIcon skill={info.skill} size={34} />) : <span aria-hidden="true">+</span>}
              {info && <b className="skill-slot-level">{lv}</b>}
            </span>
            <span className="skill-slot-name">{name}</span>
          </button>;
        })}
      </div>

      <div className="skills-layout">
        {/* ─── Left: the library ───────────────────────────────────── */}
        <section className="skills-library" aria-label="คลังวิชา" data-testid="skill-library">
          <div className="skills-library-head">
            <strong className="bag-heading">คลังวิชา ({library.length})</strong>
            <div className="bag-filters" role="tablist" aria-label="กรองคลังวิชา">
              {(Object.keys(FILTER_LABEL) as LibraryFilter[]).map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}>{FILTER_LABEL[f]}</button>
              ))}
            </div>
          </div>
          {visible.length === 0 ? (
            <p className="bag-empty text-xs italic py-2">ยังไม่ได้เรียนรู้วิชาใด — ทำภารกิจเพื่อรับคัมภีร์วิชา แล้วอ่านจากย่าม</p>
          ) : (
            <ul className="skills-library-list">
              {visible.map((raw) => {
                const info = parseSlotId(raw)!;
                const def = info.kind === "art" ? info.art : info.skill;
                const lv = info.kind === "art" ? player.artLevels?.[info.art.id] ?? 1 : skillLevel[info.skill.id] ?? 1;
                const slotIdx = slotForRaw.get(raw);
                return (
                  <li key={raw}>
                    <button type="button" className="skills-library-item" aria-pressed={shownRaw === raw}
                      data-library-id={raw} onClick={() => setPicked(raw)}
                      style={{ "--rarity": rarityColor(def.ti) } as React.CSSProperties}>
                      <span className="skills-library-icon">
                        {info.kind === "art" ? <ArtIcon art={info.art} size={30} /> : <SkillIcon skill={info.skill} size={30} />}
                      </span>
                      <span className="skills-library-name">
                        <span>{def.n}</span>
                        <small>{info.kind === "art" ? "☯ ในกาย" : `⚔ ${WEAPON_FAMILY_LABEL[info.skill.w]}`} · Lv.{lv}</small>
                      </span>
                      {typeof slotIdx === "number" && <b className="skills-library-slot" title={`ติดตั้งช่อง ${slotIdx + 1}`}>{slotIdx + 1}</b>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ─── Right: the picked skill ─────────────────────────────── */}
        <section className="skills-detail" aria-label="รายละเอียดวิชา" data-testid="skill-detail">
          {!shown || !shownRaw ? (
            <p className="bag-detail-hint text-xs italic">เลือกวิชาจากคลังด้านซ้ายเพื่อดูรายละเอียด</p>
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
            {info.kind === "art" ? "☯ วิชาในกาย" : "⚔ วิชาฝีมือ"} · {info.kind === "art" ? "ขั้น" : "Lv."}{lv}{maxed ? " (สูงสุด)" : ""}
            {typeof slot === "number" ? ` · ติดตั้งช่อง ${slot + 1}` : ""}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {tier && <Badge variant="outline" className="text-[9px]">{tier.n}</Badge>}
        {def.sc && <Badge variant="outline" className="text-[9px]">{def.sc}</Badge>}
        {info.kind === "art" ? (
          <Badge variant="outline" className="text-[9px]">{info.art.tp}</Badge>
        ) : (
          <>
            <Badge variant="outline" className="text-[9px]" title={WEAPON_FAMILY_HINT[info.skill.w]}>{WEAPON_FAMILY_LABEL[info.skill.w]}</Badge>
            {info.skill.at && <Badge variant="outline" className="text-[9px]">{info.skill.at === "phy" ? "ทางกาย" : "ทางใน"}</Badge>}
          </>
        )}
        {types.map((t) => (
          <Badge key={t} variant="outline" className="text-[9px] opacity-80">{SKILL_TYPE_LABEL[t]}</Badge>
        ))}
        {cFactor < 1 && (
          <Badge variant="outline" className="text-[9px] border-rose-400 text-rose-600">ขัดแย้ง ×{cFactor.toFixed(1)}</Badge>
        )}
      </div>

      {info.kind === "art" ? <ArtNumbers art={info.art} lv={lv} /> : <SkillNumbers skill={info.skill} lv={lv} />}

      <div className="space-y-1">
        <div className="text-[10px] text-muted-foreground">
          {maxed
            ? "ขั้นสูงสุดแล้ว"
            : info.kind === "art"
              ? `xp ${xpCapped}/${cost} (ตี-${def.ti + 1} · 2× ของวิชาฝีมือ)`
              : `xp ${xpCapped}/${cost} (ตี-${def.ti + 1})`}
        </div>
        <div className="h-1.5 bg-muted rounded overflow-hidden">
          <div className={`h-full ${maxed ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${xpPct}%` }} />
        </div>
      </div>
      {!maxed && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground italic">เลื่อนขั้นเองเมื่อ xp เต็ม</span>
          <Button size="sm" variant="outline" className="text-[11px] h-7" disabled={!canWExp} onClick={onUpgrade}
            title={canWExp ? `ใช้ ${wExpCost} w-exp (xp ${xpCapped}/${cost})` : `ต้องการ ${wExpCost} w-exp`}>
            เร่งด้วย w-exp ({wExpCost})
          </Button>
        </div>
      )}

      <div className="skills-detail-actions">
        {typeof slot === "number" ? (
          <Button size="sm" variant="outline" className="h-8 text-[12px]" onClick={() => onUnequip(slot)}>ถอดออกจากช่อง {slot + 1}</Button>
        ) : (
          <Button size="sm" className="h-8 text-[12px]" data-testid="skill-equip" onClick={onEquip}>{equipLabel}</Button>
        )}
        <Button size="sm" variant="ghost" className="h-8 px-2 text-[12px] text-destructive hover:bg-destructive/10"
          title="ลบออกจากวิชาที่เรียนแล้ว — ลดการขัดแย้งของวิชา" onClick={onForget}>
          ลืมวิชา
        </Button>
      </div>

      {receipt && <UpgradePayoff key={`${raw}-${receipt.level}`} receipt={receipt} onDismiss={onDismissReceipt} />}
    </div>
  );
}

function ArtNumbers({ art, lv }: { art: ReturnType<typeof getArt>; lv: number }) {
  const statRow = Object.entries(art.stats).map(([k, v]) => `${k}+${Math.floor((v * lv) / 10)}`).join(" ");
  return (
    <>
      {(statRow || art.hL || art.mL) && (
        <div className="text-[11px] text-emerald-700">
          โบนัส:{statRow ? ` ${statRow}` : ""}{art.hL ? ` HP+${art.hL * lv}` : ""}{art.mL ? ` MP+${art.mL * lv}` : ""}
        </div>
      )}
      {art.act && <div className="text-[11px] text-muted-foreground">⚡ <strong>{art.act.n}</strong> · MP {art.act.c} · CD {art.act.cd} · {art.act.d}</div>}
      {art.pas && <div className="text-[11px] text-muted-foreground">◆ {art.pas.d}</div>}
    </>
  );
}

function SkillNumbers({ skill: sk, lv }: { skill: NonNullable<ReturnType<typeof getSkill>>; lv: number }) {
  const bpMul = Math.round(bpMultiplier(lv) * 100);
  const mgMul = Math.round(mgMultiplier(lv) * 100);
  return (
    <>
      {Object.keys(sk.st).length > 0 && (
        <div className="text-[11px] text-emerald-700">
          โบนัส: {Object.entries(sk.st).map(([k, v]) => `${k}+${Math.floor((v as number) * bpMultiplier(lv))}`).join(" ")}
          <span className="opacity-60"> ({bpMul}% ของ Lv.10)</span>
        </div>
      )}
      <div className="text-[11px] text-muted-foreground">{sk.d}</div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
        <span>BP {Math.round(effectiveBp(sk, lv))} <span className="opacity-60">({bpMul}% ของ {sk.bp})</span></span>
        {sk.p > 0 && <span>+{sk.p}%</span>}
        {sk.f > 0 && <span>+{sk.f} flat</span>}
        {sk.dm !== 1 && <span>×{sk.dm}</span>}
        {sk.dr ? <span>ดูด {sk.dr}%</span> : null}
        <span>ฝีมือ +{Math.round(effectiveMg(sk, lv))} <span className="opacity-60">({mgMul}% ของ {sk.mg})</span></span>
      </div>
    </>
  );
}

// Quiet the unused-import warning while leaving the helper available for
// future authoring — `isArtSlot` is handy when iterating raw slot ids.
void isArtSlot;
