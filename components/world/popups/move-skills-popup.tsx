"use client";

import { useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboOption } from "@/components/ui/combobox";
import {
  ART_LEVEL_MAX,
  SKILL_LEVEL_MAX,
  SKILL_TYPE_LABEL,
  TIERS,
  WEAPON_FAMILY_HINT,
  WEAPON_FAMILY_LABEL,
  bpMultiplier,
  computeConflictFactors,
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

interface Props {
  open: boolean;
  onClose: () => void;
}

// Move-skills popup — the unified "skill tab". Each of the 10 slots can
// hold either a learned move skill or a learned inner art. The Combobox
// per slot lists everything the player has learned so they can switch
// loadout in place. The lower section shows the library of learned things
// for reference (and to spot something that's not yet slotted).
export function MoveSkillsPopup({ open, onClose }: Props) {
  const player = useWorldStore((s) => s.playerBuild);
  const skillLevel = useWorldStore((s) => s.skillLevel);
  const skillExp = useWorldStore((s) => s.skillExp);
  const artExp = useWorldStore((s) => s.artExp);
  const wExp = useWorldStore((s) => s.wExp);
  const levelUpFromWExp = useWorldStore((s) => s.levelUpSkillFromWExp);
  const levelUpArtFromWExp = useWorldStore((s) => s.levelUpArtFromWExp);
  const equipSlot = useWorldStore((s) => s.equipSlot);

  const learnedSkillIds = player?.learnedSkillIds ?? [];
  const learnedArtIds = player?.learnedArtIds ?? [];

  // Build the picker option list once per build — grouped so move skills
  // and inner arts stay visually separate inside the dropdown.
  const options: ComboOption[] = useMemo(() => {
    const out: ComboOption[] = [];
    for (const sid of learnedSkillIds) {
      const sk = getSkill(sid);
      if (!sk) continue;
      const tier = TIERS[sk.ti];
      out.push({
        value: sid,
        label: sk.n,
        group: "วิชาฝีมือ",
        hint: `${WEAPON_FAMILY_LABEL[sk.w]} · ${tier?.n ?? ""}`,
      });
    }
    for (const aid of learnedArtIds) {
      const art = getArt(aid);
      if (!art || art.id === "none") continue;
      out.push({
        value: encodeArtSlot(aid),
        label: `☯ ${art.n}`,
        group: "วิชาในกาย",
        hint: art.tp,
      });
    }
    return out;
  }, [learnedSkillIds, learnedArtIds]);

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

  // Already-slotted ids — disabled in other slots' pickers so the player
  // doesn't accidentally double-slot the same id (the action would move
  // it anyway, but this is clearer UI).
  const equippedSet = new Set(slots.filter((s): s is string => !!s));

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

  return (
    <Modal open={open} onClose={onClose} title={`🥋 วิชาฝีมือ (${slots.length} ช่อง)`}>
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

      <div className="space-y-2">
        {slots.map((raw, i) => {
          const info = parseSlotId(raw);
          const disabled = new Set(equippedSet);
          if (raw) disabled.delete(raw);

          // Slot header — Combobox + clear button.
          const slotHeader = (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground w-6 text-right shrink-0">
                #{i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <Combobox
                  options={options}
                  value={raw ?? null}
                  onChange={(v) => equipSlot(i, v)}
                  placeholder="— ว่าง —"
                  searchPlaceholder="ค้นหาวิชา…"
                  disabledValues={disabled}
                />
              </div>
              {raw && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[10px] text-muted-foreground"
                  onClick={() => equipSlot(i, null)}
                  title="ถอดออก"
                >
                  ถอด
                </Button>
              )}
            </div>
          );

          if (!info) {
            return (
              <div key={i} className="rounded border border-dashed border-muted-foreground/30 px-2 py-2 space-y-1.5">
                {slotHeader}
                <p className="text-[10px] text-muted-foreground italic text-center pl-7">
                  ช่องว่าง — เลือกวิชาที่เรียนรู้แล้วมาติดตั้ง
                </p>
              </div>
            );
          }

          if (info.kind === "art") {
            const art = info.art;
            const lv = player.artLevels?.[art.id] ?? 1;
            const types = effectiveTypes(art);
            const cFactor = getStatusFactor(art, conflict);
            const artStatRow = Object.entries(art.stats)
              .map(([k, v]) => `${k}+${Math.floor((v * lv) / 10)}`)
              .join(" ");
            const artMaxed = lv >= ART_LEVEL_MAX;
            const aXp = artExp[art.id] ?? 0;
            const aCost = artMaxed ? Infinity : xpToNextArtLevel(art, lv);
            const aXpCapped = artMaxed ? 1 : Math.min(aXp, aCost);
            const aXpPct = artMaxed
              ? 100
              : Math.min(100, Math.round((aXp / aCost) * 100));
            const canArtWExp = !artMaxed && wExp >= aCost;
            return (
              <div key={i} className="rounded bg-muted/30 px-2 py-2 space-y-1.5">
                {slotHeader}
                <div className="pl-7 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default" className="text-[10px]">☯ วิชาในกาย</Badge>
                    <strong className="text-sm">{art.n}</strong>
                    <Badge variant="default" className="text-[10px]">
                      ขั้น {lv}{artMaxed ? " (สูงสุด)" : ""}
                    </Badge>
                    <Badge variant="outline" className="text-[9px]">{art.sc}</Badge>
                    <Badge variant="outline" className="text-[9px]">{art.tp}</Badge>
                    {types.map((t) => (
                      <Badge key={t} variant="outline" className="text-[9px] opacity-80">
                        {SKILL_TYPE_LABEL[t]}
                      </Badge>
                    ))}
                    {cFactor < 1 && (
                      <Badge variant="outline" className="text-[9px] border-rose-400 text-rose-600">
                        ขัดแย้ง ×{cFactor.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  {(artStatRow || art.hL || art.mL) && (
                    <div className="text-[10px] text-emerald-700">
                      โบนัส:{artStatRow ? ` ${artStatRow}` : ""}
                      {art.hL ? ` HP+${art.hL * lv}` : ""}
                      {art.mL ? ` MP+${art.mL * lv}` : ""}
                    </div>
                  )}
                  {art.act && (
                    <div className="text-[11px] text-muted-foreground">
                      ⚡ <strong>{art.act.n}</strong> · MP {art.act.c} · CD {art.act.cd} · {art.act.d}
                    </div>
                  )}
                  {art.pas && (
                    <div className="text-[10px] text-muted-foreground">◆ {art.pas.d}</div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">
                        {artMaxed
                          ? "ขั้นสูงสุดแล้ว"
                          : `xp ${aXpCapped}/${aCost} (ตี-${art.ti + 1} · 2× ของวิชาฝีมือ)`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded overflow-hidden">
                      <div
                        className={`h-full ${artMaxed ? "bg-amber-500" : "bg-primary"}`}
                        style={{ width: `${aXpPct}%` }}
                      />
                    </div>
                  </div>
                  {!artMaxed && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] text-muted-foreground italic">
                        เลื่อนขั้นเองเมื่อ xp เต็ม
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7"
                        disabled={!canArtWExp}
                        onClick={() => levelUpArtFromWExp(art.id)}
                        title={canArtWExp ? `ใช้ ${aCost} w-exp` : `ต้องการ ${aCost} w-exp`}
                      >
                        เร่งด้วย w-exp ({aCost})
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Move skill slot
          const sk = info.skill;
          const tier = TIERS[sk.ti];
          const lv = skillLevel[sk.id] ?? 1;
          const xp = skillExp[sk.id] ?? 0;
          const maxed = lv >= SKILL_LEVEL_MAX;
          const cost = maxed ? Infinity : xpToNextLevel(sk, lv);
          const xpCapped = maxed ? 1 : Math.min(xp, cost);
          const xpPct = maxed ? 100 : Math.min(100, Math.round((xp / cost) * 100));
          const eBp = Math.round(effectiveBp(sk, lv));
          const eMg = Math.round(effectiveMg(sk, lv));
          const bpMul = Math.round(bpMultiplier(lv) * 100);
          const mgMul = Math.round(mgMultiplier(lv) * 100);
          const canWExp = !maxed && wExp >= cost;
          const skillTypes = effectiveTypes(sk);
          const cFactor = getStatusFactor(sk, conflict);
          return (
            <div key={i} className="rounded bg-muted/30 px-2 py-2 space-y-1.5">
              {slotHeader}
              <div className="pl-7 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default" className="text-[10px]">⚔ วิชาฝีมือ</Badge>
                  <strong className="text-sm">{sk.n}</strong>
                  <Badge variant="default" className="text-[10px]">Lv.{lv}{maxed ? " (สูงสุด)" : ""}</Badge>
                  {tier && (
                    <Badge variant="outline" className="text-[9px]">{tier.n}</Badge>
                  )}
                  <Badge variant="outline" className="text-[9px]" title={WEAPON_FAMILY_HINT[sk.w]}>
                    {WEAPON_FAMILY_LABEL[sk.w]}
                  </Badge>
                  {sk.at && (
                    <Badge variant="outline" className="text-[9px]">
                      {sk.at === "phy" ? "ทางกาย" : "ทางใน"}
                    </Badge>
                  )}
                  {skillTypes.map((t) => (
                    <Badge key={t} variant="outline" className="text-[9px] opacity-80">
                      {SKILL_TYPE_LABEL[t]}
                    </Badge>
                  ))}
                  {cFactor < 1 && (
                    <Badge variant="outline" className="text-[9px] border-rose-400 text-rose-600">
                      ขัดแย้ง ×{cFactor.toFixed(1)}
                    </Badge>
                  )}
                </div>
                {Object.keys(sk.st).length > 0 && (
                  <div className="text-[10px] text-emerald-700">
                    โบนัส:{" "}
                    {Object.entries(sk.st)
                      .map(([k, v]) => `${k}+${Math.floor((v as number) * bpMultiplier(lv))}`)
                      .join(" ")}
                    <span className="opacity-60"> ({bpMul}% ของ Lv.10)</span>
                  </div>
                )}
                <div className="text-[11px] text-muted-foreground">{sk.d}</div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                  <span>BP {eBp} <span className="opacity-60">({bpMul}% ของ {sk.bp})</span></span>
                  {sk.p > 0 && <span>+{sk.p}%</span>}
                  {sk.f > 0 && <span>+{sk.f} flat</span>}
                  {sk.dm !== 1 && <span>×{sk.dm}</span>}
                  {sk.dr ? <span>ดูด {sk.dr}%</span> : null}
                  <span>ฝีมือ +{eMg} <span className="opacity-60">({mgMul}% ของ {sk.mg})</span></span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">
                      {maxed ? "ระดับสูงสุดแล้ว" : `xp ${xpCapped}/${cost} (ตี-${sk.ti + 1})`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded overflow-hidden">
                    <div
                      className={`h-full ${maxed ? "bg-amber-500" : "bg-primary"}`}
                      style={{ width: `${xpPct}%` }}
                    />
                  </div>
                </div>
                {!maxed && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-muted-foreground italic">
                      เลื่อนขั้นเองเมื่อ xp เต็ม
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[11px] h-7"
                      disabled={!canWExp}
                      onClick={() => levelUpFromWExp(sk.id)}
                      title={canWExp ? `ใช้ ${cost} w-exp` : `ต้องการ ${cost} w-exp`}
                    >
                      เร่งด้วย w-exp ({cost})
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Library section ─────────────────────────────────────────── */}
      <div className="mt-4 border-t pt-3 space-y-1.5">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
          วิชาที่เรียนรู้แล้ว ({learnedSkillIds.length + learnedArtIds.length})
        </div>
        {learnedSkillIds.length === 0 && learnedArtIds.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-1">
            ยังไม่ได้เรียนรู้วิชาใด
          </p>
        ) : (
          <ul className="space-y-1">
            {learnedSkillIds.map((sid) => {
              const sk = getSkill(sid);
              if (!sk) return null;
              const slotIdx = slotForRaw.get(sid);
              return (
                <li
                  key={sid}
                  className="flex items-center justify-between gap-2 text-xs px-2 py-1 rounded hover:bg-muted/40"
                >
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[9px]">⚔</Badge>
                    <strong>{sk.n}</strong>
                    <span className="text-[10px] text-muted-foreground">{WEAPON_FAMILY_LABEL[sk.w]}</span>
                  </span>
                  {typeof slotIdx === "number" ? (
                    <Badge variant="outline" className="text-[9px]">ติดตั้งช่อง {slotIdx + 1}</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => {
                        const free = slots.findIndex((s) => s === null);
                        if (free >= 0) equipSlot(free, sid);
                      }}
                      disabled={!slots.some((s) => s === null)}
                    >
                      ติดตั้ง
                    </Button>
                  )}
                </li>
              );
            })}
            {learnedArtIds.map((aid) => {
              const art = getArt(aid);
              if (!art || art.id === "none") return null;
              const raw = encodeArtSlot(aid);
              const slotIdx = slotForRaw.get(raw);
              return (
                <li
                  key={aid}
                  className="flex items-center justify-between gap-2 text-xs px-2 py-1 rounded hover:bg-muted/40"
                >
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[9px]">☯</Badge>
                    <strong>{art.n}</strong>
                    <span className="text-[10px] text-muted-foreground">{art.sc}</span>
                  </span>
                  {typeof slotIdx === "number" ? (
                    <Badge variant="outline" className="text-[9px]">ติดตั้งช่อง {slotIdx + 1}</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => {
                        const free = slots.findIndex((s) => s === null);
                        if (free >= 0) equipSlot(free, raw);
                      }}
                      disabled={!slots.some((s) => s === null)}
                    >
                      ติดตั้ง
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}

// Quiet the unused-import warning while leaving the helper available for
// future authoring — `isArtSlot` is handy when iterating raw slot ids.
void isArtSlot;
