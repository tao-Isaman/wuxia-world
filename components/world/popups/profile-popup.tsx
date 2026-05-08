"use client";

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  SLOT_LABELS,
  STAT_BUDGET,
  STAT_KEYS,
  STAT_LABEL,
  TIERS,
  WEAPON_FAMILY_HINT,
  WEAPON_FAMILY_LABEL,
  bpMultiplier,
  combinedStats,
  derive,
  deriveAll,
  getArt,
  getEquip,
  getEquipBonus,
  getEquipStatBonus,
  getMasteryMap,
  getSkill,
  parseSlotId,
  statBreakdown,
  totalStatPoints,
} from "@/lib/game";
import { InfoPopover } from "@/components/ui/wuxia/info-popover";
import type { EquipSlotType, Skill, StatKey, WeaponFamily } from "@/lib/game";
import { useWorldStore } from "@/store/world-store";
import { xpToNextStatLevel } from "@/lib/world/stat-progression";
import { TRAIT_KEYS, TRAIT_LABEL } from "@/lib/world";
import { ArtTooltip, SkillTooltip } from "../skill-tooltip";

interface Props {
  open: boolean;
  onClose: () => void;
}

const DERIVED_ROWS: { label: string; key: keyof ReturnType<typeof deriveAll> }[] = [
  { label: "HP",  key: "HP" },
  { label: "MP",  key: "MP" },
  { label: "ATK", key: "Atk" },
  { label: "PA",  key: "PA" },
  { label: "IA",  key: "IA" },
  { label: "PD",  key: "PD" },
  { label: "ID",  key: "ID" },
  { label: "SPD", key: "Spd" },
  { label: "Eva", key: "Eva" },
  { label: "Acc", key: "Acc" },
  { label: "Cri", key: "Cri" },
  { label: "Res", key: "Res" },
];

type EquipSlotRow = {
  type: EquipSlotType;
  label: string;
  index?: 0 | 1;
};

const EQUIP_ROWS: readonly EquipSlotRow[] = [
  { type: "W",  label: `🗡 ${SLOT_LABELS.W}` },
  { type: "A",  label: `👘 ${SLOT_LABELS.A}` },
  { type: "H",  label: `🪖 ${SLOT_LABELS.H}` },
  { type: "B",  label: `👟 ${SLOT_LABELS.B}` },
  { type: "BR", label: `💪 ${SLOT_LABELS.BR} 1`, index: 0 },
  { type: "BR", label: `💪 ${SLOT_LABELS.BR} 2`, index: 1 },
  { type: "R",  label: `💍 ${SLOT_LABELS.R} 1`,  index: 0 },
  { type: "R",  label: `💍 ${SLOT_LABELS.R} 2`,  index: 1 },
  { type: "C",  label: `🎖 ${SLOT_LABELS.C} 1`,  index: 0 },
  { type: "C",  label: `🎖 ${SLOT_LABELS.C} 2`,  index: 1 },
];

function skillKindIcon(sk: Skill | null): string {
  if (!sk) return "";
  if (sk.at === "phy") return "⚔";
  if (sk.at === "int") return "💜";
  return sk.se ? "⟳" : "💥";
}

function describeEquip(id: string | null): string {
  if (!id) return "";
  const e = getEquip(id);
  if (!e) return "";
  const parts: string[] = [];
  if (e.atkb) parts.push(`Atk+${e.atkb}`);
  if (e.pdb)  parts.push(`PD+${e.pdb}`);
  if (e.idb)  parts.push(`ID+${e.idb}`);
  if (e.hpb)  parts.push(`HP+${e.hpb}`);
  if (e.mpb)  parts.push(`MP+${e.mpb}`);
  const sb = Object.entries(e.st).map(([k, v]) => `${k}+${v}`).join(" ");
  if (sb) parts.push(sb);
  if (e.eff) {
    if (e.eff.t === "pct_atk")    parts.push(`+${e.eff.v}%ATK`);
    else if (e.eff.t === "flat_cri")    parts.push(`Cri+${e.eff.v}`);
    else if (e.eff.t === "flat_eva")    parts.push(`Eva+${e.eff.v}`);
    else if (e.eff.t === "pct_reduce")  parts.push(`ลดDmg${e.eff.v}%`);
    else if (e.eff.t === "hp_regen")    parts.push(`ฟื้น${e.eff.v}%/ตา`);
    else if (e.eff.t === "on_hit")      parts.push(`OnHit:${e.eff.db.t.replace("debuff_", "")}${e.eff.db.v}`);
  }
  return parts.join(" ");
}

// Profile popup — read-only character sheet that mirrors the /debug
// CharacterCard layout: stat budget, base stats, derived stats, inner art
// summary, move-skill slots with mastery + bonus rollup, and full equipment
// list with the same bonus summary the /debug page surfaces.
//
// Because the world player is currently locked to STARTER_BUILD with no
// editor UI, every section here is display-only; once an in-world progression
// editor exists, this popup is the natural "current state" snapshot.
export function ProfilePopup({ open, onClose }: Props) {
  const player = useWorldStore((s) => s.playerBuild);
  const gold = useWorldStore((s) => s.gold);
  const statExp = useWorldStore((s) => s.statExp);
  const traits = useWorldStore((s) => s.traits);
  if (!player) return null;

  const base = player.stats;
  const combined = combinedStats(player);
  // Per-source breakdown — used by the stat-cell tooltips so the player
  // can see where each stat point comes from (skills + arts count toward
  // the learn-skill gate; equipment doesn't).
  const breakdown = statBreakdown(player);
  const derivedAll = deriveAll(player);
  const derivedBase = derive(base);
  const art = getArt(player.artId);
  const lv = player.artLevel;

  const totalSpent = totalStatPoints(base);
  const remaining = STAT_BUDGET - totalSpent;
  const budgetPct = (totalSpent / STAT_BUDGET) * 100;
  const budgetColor =
    remaining <= 0 ? "#E24B4A" : remaining < 20 ? "#BA7517" : "#7F77DD";

  // Skills + mastery + per-skill stat bonus aggregation. Stat contribution
  // scales with skill level via bpMultiplier — keep this in sync with
  // combinedStats() in derive.ts so the rollup matches engine behavior.
  const mastery = getMasteryMap(player.skillIds, player.skillLevels);
  const skillStatBonus: Record<string, number> = {};
  for (const sid of player.skillIds) {
    if (!sid) continue;
    const sk = getSkill(sid);
    if (!sk) continue;
    const lv = player.skillLevels?.[sid] ?? 1;
    const mul = bpMultiplier(lv);
    for (const [k, v] of Object.entries(sk.st)) {
      skillStatBonus[k] =
        (skillStatBonus[k] ?? 0) + Math.floor((v as number) * mul);
    }
  }

  // Equipment bonus summary (mirrors EquipmentSlots).
  const eb = getEquipBonus(player.equipment);
  const sb = getEquipStatBonus(player.equipment);
  const equipSummary: string[] = [];
  if (eb.atk)      equipSummary.push(`Atk+${eb.atk}`);
  if (eb.pd)       equipSummary.push(`PD+${eb.pd}`);
  if (eb.id_)      equipSummary.push(`ID+${eb.id_}`);
  if (eb.hp)       equipSummary.push(`HP+${eb.hp}`);
  if (eb.mp)       equipSummary.push(`MP+${eb.mp}`);
  if (eb.cri)      equipSummary.push(`Cri+${eb.cri}`);
  if (eb.eva)      equipSummary.push(`Eva+${eb.eva}`);
  if (eb.pct_atk)  equipSummary.push(`ATK+${eb.pct_atk}%`);
  if (eb.pct_red)  equipSummary.push(`ลดDmg${eb.pct_red}%`);
  if (eb.hp_regen) equipSummary.push(`ฟื้น${eb.hp_regen}%/ตา`);
  for (const [k, v] of Object.entries(sb)) equipSummary.push(`${k}+${v}`);

  return (
    <Modal open={open} onClose={onClose} title={`👤 โปรไฟล์ — ${player.name}`} maxWidth="max-w-3xl">
      <div className="space-y-4">
        {/* ─── Header ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between">
            <strong className="text-base">{player.name}</strong>
            <div className="text-xs">
              <span className="text-muted-foreground">ทอง </span>
              <strong className="text-amber-600">{gold}</strong>
            </div>
          </div>
        </section>

        {/* ─── Stat budget ─────────────────────────────────────────── */}
        <section>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>คะแนนพลัง <strong className="text-foreground">{totalSpent}</strong>/{STAT_BUDGET}</span>
            <span className={remaining <= 0 ? "text-destructive" : ""}>เหลือ {remaining}</span>
          </div>
          <Progress value={budgetPct} indicatorColor={budgetColor} className="h-2" />
        </section>

        {/* ─── Base stats ──────────────────────────────────────────── */}
        <section>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
            พลังพื้นฐาน
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {STAT_KEYS.map((k) => {
              const b = base[k];
              const c = combined[k];
              const d = c - b;
              const fromArts = breakdown.fromArts[k];
              const fromSkills = breakdown.fromSkills[k];
              const fromEquipment = breakdown.fromEquipment[k];
              // Sum used by learn-skill / learn-art gates (no equipment).
              const learnable = b + fromArts + fromSkills;
              const xp = statExp[k] ?? 0;
              const cost = xpToNextStatLevel(b, k);
              const xpPct = cost > 0 ? Math.min(100, Math.round((xp / cost) * 100)) : 0;
              const cellTrigger = (
                <div className="w-full rounded bg-muted/40 px-2 py-1.5 cursor-help">
                  <div className="text-[9px] text-muted-foreground">
                    {k} <span className="opacity-70">{STAT_LABEL[k]}</span>
                  </div>
                  <div className="text-xs font-semibold">
                    {c}
                    {d > 0 && <span className="text-[9px] text-emerald-600 ml-1">+{d}</span>}
                  </div>
                  <div className="mt-1 h-1 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${xpPct}%` }} />
                  </div>
                  <div className="text-[8px] text-muted-foreground mt-0.5 font-mono">
                    {xp}/{cost}
                  </div>
                </div>
              );
              return (
                <InfoPopover
                  key={k}
                  trigger={cellTrigger}
                  contentClassName="w-64"
                >
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-baseline justify-between">
                      <strong className="font-display">
                        {k} · {STAT_LABEL[k]}
                      </strong>
                      <span className="text-sm font-semibold">{c}</span>
                    </div>
                    <ul className="space-y-0.5 text-[11px]">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">พลังพื้นฐาน</span>
                        <span className="font-mono">{b}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">วิชาในกาย</span>
                        <span className="font-mono">
                          {fromArts > 0 ? `+${fromArts}` : fromArts}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">วิชาฝีมือ</span>
                        <span className="font-mono">
                          {fromSkills > 0 ? `+${fromSkills}` : fromSkills}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">อุปกรณ์</span>
                        <span className="font-mono">
                          {fromEquipment > 0 ? `+${fromEquipment}` : fromEquipment}
                        </span>
                      </li>
                    </ul>
                    <div className="border-t pt-1.5 space-y-0.5 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">เกณฑ์เรียนตำรา</span>
                        <span className="font-mono font-semibold text-emerald-700">
                          {learnable}
                        </span>
                      </div>
                      <div className="text-muted-foreground italic">
                        ใช้รวม วิชาในกาย + วิชาฝีมือ — ไม่นับอุปกรณ์
                      </div>
                    </div>
                    <div className="border-t pt-1.5 text-[10px] text-muted-foreground">
                      ค่ารบ: รวมทุกแหล่ง = <strong className="text-foreground">{c}</strong>
                    </div>
                  </div>
                </InfoPopover>
              );
            })}
          </div>
        </section>

        {/* ─── Derived stats ───────────────────────────────────────── */}
        <section>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
            พลังที่คำนวณ
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {DERIVED_ROWS.map(({ label, key }) => {
              const cv = derivedAll[key];
              const bv = derivedBase[key as keyof typeof derivedBase] ?? cv;
              const diff = cv - bv;
              return (
                <div key={label} className="rounded bg-muted/40 px-2 py-1.5">
                  <div className="text-[9px] text-muted-foreground">{label}</div>
                  <div className="text-xs font-semibold">
                    {cv}
                    {diff > 0 && <span className="text-[9px] text-emerald-600 ml-1">+{diff}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Traits / reputation ─────────────────────────────────── */}
        <section className="border-t pt-3">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
            ชื่อเสียงและคุณธรรม
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {TRAIT_KEYS.map((k) => {
              const v = traits[k] ?? 0;
              return (
                <div key={k} className="rounded bg-muted/40 px-2 py-1.5 text-center">
                  <div className="text-[9px] text-muted-foreground">{TRAIT_LABEL[k]}</div>
                  <div className="text-sm font-semibold">{v}</div>
                </div>
              );
            })}
          </div>
        </section>
        {/* ─── Equipped skills (both move skills + inner arts) ──────── */}
        <section className="border-t pt-3">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">
            วิชาที่ติดตั้ง ({player.skillIds.length} ช่อง)
          </div>
          <div className="space-y-1.5">
            {player.skillIds.map((sid, i) => {
              const info = sid ? parseSlotId(sid) : null;
              if (!info) {
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground w-4 text-center shrink-0">{i + 1}</span>
                    <span className="flex-1 text-[11px] text-muted-foreground italic px-2">— ว่าง —</span>
                  </div>
                );
              }
              if (info.kind === "art") {
                const a = info.art;
                const aLv = player.artLevels?.[a.id] ?? 1;
                const artStatRow = (Object.entries(a.stats) as [StatKey, number][])
                  .map(([k, v]) => `${k}+${Math.floor((v * aLv) / 10)}`)
                  .join(" ");
                return (
                  <div key={i} className="rounded bg-muted/30 px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-[10px] text-muted-foreground shrink-0">{i + 1}</span>
                        <Badge variant="default" className="text-[9px]">☯</Badge>
                        <ArtTooltip art={a} level={aLv}>
                          <strong className="text-xs cursor-help underline decoration-dotted underline-offset-2">
                            {a.n}
                          </strong>
                        </ArtTooltip>
                        <Badge variant="outline" className="text-[9px]">{a.sc}</Badge>
                        <Badge variant="outline" className="text-[9px]">{a.tp}</Badge>
                        <Badge variant="outline" className="text-[9px]">ขั้น {aLv}</Badge>
                      </div>
                      {a.act && (
                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                          ⚡ MP{a.act.c} CD{a.act.cd}
                        </span>
                      )}
                    </div>
                    {(artStatRow || a.hL || a.mL) && (
                      <div className="text-[10px] text-emerald-700 mt-0.5">
                        โบนัส:{artStatRow ? ` ${artStatRow}` : ""}
                        {a.hL ? ` HP+${a.hL * aLv}` : ""}
                        {a.mL ? ` MP+${a.mL * aLv}` : ""}
                      </div>
                    )}
                    {a.act && (
                      <div className="text-[10px] text-muted-foreground">
                        ⚡ <strong>{a.act.n}</strong>: {a.act.d}
                      </div>
                    )}
                    {a.pas && (
                      <div className="text-[10px] text-muted-foreground">◆ {a.pas.d}</div>
                    )}
                  </div>
                );
              }
              const sk = info.skill;
              const tier = TIERS[sk.ti];
              const skLv = player.skillLevels?.[sk.id] ?? 1;
              const skMul = bpMultiplier(skLv);
              const skStatRow = (Object.entries(sk.st) as [StatKey, number][])
                .map(([k, v]) => `${k}+${Math.floor(v * skMul)}`)
                .join(" ");
              return (
                <div key={i} className="rounded bg-muted/30 px-2 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="text-[10px] text-muted-foreground shrink-0">{i + 1}</span>
                      <Badge variant="default" className="text-[9px]">⚔</Badge>
                      <SkillTooltip skill={sk} level={skLv}>
                        <strong className="text-xs cursor-help underline decoration-dotted underline-offset-2">
                          {sk.n}
                        </strong>
                      </SkillTooltip>
                      <Badge variant="default" className="text-[9px]">Lv.{skLv}</Badge>
                      <Badge variant="outline" className="text-[9px]">{tier?.n}</Badge>
                      <Badge
                        variant="outline"
                        className="text-[9px]"
                        title={WEAPON_FAMILY_HINT[sk.w]}
                      >
                        {WEAPON_FAMILY_LABEL[sk.w]}
                      </Badge>
                    </div>
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                      {skillKindIcon(sk)} CD{tier?.cd ?? 0}
                    </span>
                  </div>
                  {skStatRow && (
                    <div className="text-[10px] text-emerald-700 mt-0.5">
                      โบนัส: {skStatRow}
                      <span className="opacity-60"> (×{Math.round(skMul * 100)}% ของ Lv.10)</span>
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground">{sk.d}</div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(mastery).map(([w, v]) => {
              const pts = Math.floor(v ?? 0);
              const mult = (1 + ((v ?? 0) / 200) * 0.5).toFixed(2);
              return (
                <span
                  key={w}
                  className="text-[10px] bg-muted/40 px-2 py-0.5 rounded"
                  title={WEAPON_FAMILY_HINT[w as WeaponFamily]}
                >
                  <strong className="text-primary">{pts}</strong>
                  <span className="opacity-70"> pt</span>{" "}
                  <span className="opacity-70">×{mult}</span>{" "}
                  {WEAPON_FAMILY_LABEL[w as WeaponFamily]}
                </span>
              );
            })}
            {Object.keys(mastery).length === 0 && (
              <span className="text-[10px] text-muted-foreground">ยังไม่มีความเชี่ยวชาญ</span>
            )}
          </div>

          <div className="text-[10px] text-muted-foreground mt-1">
            โบนัสจากวิชา:{" "}
            {Object.entries(skillStatBonus).length > 0
              ? Object.entries(skillStatBonus).map(([k, v]) => `${k}+${v}`).join(" ")
              : "—"}
          </div>
        </section>

        {/* ─── Equipment ───────────────────────────────────────────── */}
        <section className="border-t pt-3">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">
            อุปกรณ์ ({EQUIP_ROWS.length} ช่อง)
          </div>
          <div className="space-y-1">
            {EQUIP_ROWS.map((row) => {
              const slot = player.equipment[row.type];
              const id = Array.isArray(slot) ? slot[row.index ?? 0] : slot;
              const e = getEquip(id);
              const key = `${row.type}-${row.index ?? "x"}`;
              return (
                <div key={key} className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] text-muted-foreground w-24 shrink-0">{row.label}</span>
                  <div className="flex-1 min-w-0">
                    {e ? <strong>{e.n}</strong> : <span className="text-[10px] text-muted-foreground italic">— ว่าง —</span>}
                  </div>
                  {e && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                      {describeEquip(id)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-2 rounded-md bg-muted/40 p-2 border-l-2 border-orange-500 text-[10px] leading-relaxed">
            รวม: {equipSummary.length > 0 ? equipSummary.join(" · ") : "ไม่มีโบนัส"}
          </div>
        </section>
      </div>
    </Modal>
  );
}
