"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
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
import { GENDER_LABEL, SECT_MEMBERSHIPS, TRAIT_KEYS, TRAIT_LABEL } from "@/lib/world";
import { ArtTooltip, SkillTooltip } from "../skill-tooltip";
import { CharacterPreview } from "@/components/game/character-preview";

interface Props {
  open: boolean;
  onClose: () => void;
}

const DERIVED_ROWS: { label: string; thai: string; key: keyof ReturnType<typeof deriveAll> }[] = [
  { label: "HP",  thai: "พลังชีวิต", key: "HP" },
  { label: "MP",  thai: "พลังปราณ", key: "MP" },
  { label: "ATK", thai: "พลังโจมตี", key: "Atk" },
  { label: "PA",  thai: "โจมตีกาย", key: "PA" },
  { label: "IA",  thai: "โจมตีใน", key: "IA" },
  { label: "PD",  thai: "ป้องกันกาย", key: "PD" },
  { label: "ID",  thai: "ป้องกันใน", key: "ID" },
  { label: "SPD", thai: "ความเร็ว", key: "Spd" },
  { label: "Eva", thai: "หลบหลีก", key: "Eva" },
  { label: "Acc", thai: "แม่นยำ", key: "Acc" },
  { label: "Cri", thai: "คริติคอล", key: "Cri" },
  { label: "Res", thai: "ต้านทาน", key: "Res" },
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
  const gender = useWorldStore((s) => s.gender);
  const sectMembership = useWorldStore((s) => s.sectMembership);
  const bodyId = useWorldStore((s) => s.playerBodyId);
  const currentHp = useWorldStore((s) => s.currentHp);
  const currentMp = useWorldStore((s) => s.currentMp);
  const stamina = useWorldStore((s) => s.stamina);
  const staminaMax = useWorldStore((s) => s.staminaMax);
  const [tab, setTab] = useState<ProfileTab>("stats");
  if (!player) return null;

  const base = player.stats;
  const combined = combinedStats(player);
  // Per-source breakdown — used by the stat-cell tooltips so the player
  // can see where each stat point comes from (skills + arts count toward
  // the learn-skill gate; equipment doesn't).
  const breakdown = statBreakdown(player);
  const derivedAll = deriveAll(player);
  const derivedBase = derive(base);

  const totalSpent = totalStatPoints(base);

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

  const staminaPct = staminaMax > 0 ? Math.min(100, (stamina / staminaMax) * 100) : 0;
  const hpNow = Math.min(currentHp, derivedAll.HP), mpNow = Math.min(currentMp, derivedAll.MP);

  return (
    <Modal open={open} onClose={onClose} title={`👤 โปรไฟล์ — ${player.name}`} maxWidth="max-w-3xl">
      <div className="profile">
        {/* ─── Header: who, and how they are right now ─────────────── */}
        <section className="profile-hero">
          <div className="profile-figure" aria-hidden="true"><CharacterPreview id={bodyId} animate /></div>
          <div className="profile-identity">
            <h3>{player.name}</h3>
            <p>{GENDER_LABEL[gender]} · ทอง <strong>{gold.toLocaleString()}</strong> ตำลึง</p>
            <div className="profile-bars">
              <VitalBar label="HP" tone="hp" value={hpNow} max={derivedAll.HP} />
              <VitalBar label="MP" tone="mp" value={mpNow} max={derivedAll.MP} />
              <VitalBar label="พลัง" tone="st" value={stamina} max={staminaMax} pct={staminaPct} />
            </div>
          </div>
          {/* Sect memberships — one row per joined sect. */}
          {Object.entries(sectMembership).filter(([, m]) => m).length > 0 && (
            <div className="mt-2 space-y-0.5">
              {Object.entries(sectMembership).map(([sid, m]) => {
                if (!m) return null;
                const def = SECT_MEMBERSHIPS[sid as keyof typeof SECT_MEMBERSHIPS];
                if (!def) return null;
                return (
                  <div key={sid} className="text-xs flex items-center gap-2">
                    <Badge variant="seal">{def.name}</Badge>
                    <span className="text-muted-foreground">
                      ขั้นที่ <strong className="text-foreground">{m.rank}</strong>
                      <span className="mx-1">·</span>
                      <span className="text-vermilion">{m.points}</span> sect points
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="profile-tabs" role="tablist" aria-label="ข้อมูลตัวละคร">
          {PROFILE_TABS.map((entry) => (
            <button key={entry.id} type="button" role="tab" aria-selected={tab === entry.id} onClick={() => setTab(entry.id)}>
              {entry.label}
            </button>
          ))}
        </div>

        {tab === "stats" && <>
          {/* ─── Base stats: name, value, training progress ─────────── */}
          <section className="profile-panel">
            <div className="profile-heading">พลังพื้นฐาน <small>แตะเพื่อดูที่มา</small></div>
            <div className="profile-stats">
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
                  <div className="profile-stat">
                    <span className="profile-stat-name">{STAT_LABEL[k]}<small>{k}</small></span>
                    <b className="profile-stat-value">{c}{d > 0 && <em>+{d}</em>}</b>
                    <span className="profile-stat-train" aria-label={`ฝึก ${xp} จาก ${cost}`}>
                      <i><span style={{ width: `${xpPct}%` }} /></i>
                      <small>ฝึก {xp}/{cost}</small>
                    </span>
                  </div>
                );
                return (
                  <InfoPopover key={k} trigger={cellTrigger} contentClassName="w-64">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-baseline justify-between">
                        <strong className="font-display">{STAT_LABEL[k]} · {k}</strong>
                        <span className="text-base font-semibold">{c}</span>
                      </div>
                      <ul className="space-y-0.5 text-[13px]">
                        <li className="flex justify-between"><span className="text-muted-foreground">พลังพื้นฐาน</span><span className="font-mono">{b}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">วิชาในกาย</span><span className="font-mono">{fromArts > 0 ? `+${fromArts}` : fromArts}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">วิชาฝีมือ</span><span className="font-mono">{fromSkills > 0 ? `+${fromSkills}` : fromSkills}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">อุปกรณ์</span><span className="font-mono">{fromEquipment > 0 ? `+${fromEquipment}` : fromEquipment}</span></li>
                      </ul>
                      <div className="border-t pt-1.5 space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">เกณฑ์เรียนตำรา</span>
                          <span className="font-mono font-semibold text-emerald-700">{learnable}</span>
                        </div>
                        <div className="text-muted-foreground italic">ใช้รวม วิชาในกาย + วิชาฝีมือ — ไม่นับอุปกรณ์</div>
                      </div>
                    </div>
                  </InfoPopover>
                );
              })}
            </div>
          </section>

          {/* ─── Combat numbers ──────────────────────────────────────── */}
          <section className="profile-panel">
            <div className="profile-heading">ค่าต่อสู้</div>
            <dl className="profile-derived">
              {DERIVED_ROWS.map(({ label, thai, key }) => {
                const cv = derivedAll[key];
                const bv = derivedBase[key as keyof typeof derivedBase] ?? cv;
                const diff = cv - bv;
                return (
                  <div key={label}>
                    <dt>{thai}<small>{label}</small></dt>
                    <dd>{cv}{diff > 0 && <em>+{diff}</em>}</dd>
                  </div>
                );
              })}
            </dl>
            <p className="profile-budget">คะแนนพลังรวม {totalSpent}/{STAT_BUDGET}</p>
          </section>
        </>}

        {tab === "skills" && <>
        {/* ─── Equipped skills (both move skills + inner arts) ──────── */}
        <section className="profile-panel">
          <div className="profile-heading">
            วิชาที่ติดตั้ง ({player.skillIds.length} ช่อง)
          </div>
          <div className="space-y-1.5">
            {player.skillIds.map((sid, i) => {
              const info = sid ? parseSlotId(sid) : null;
              if (!info) {
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[13px] text-muted-foreground w-4 text-center shrink-0">{i + 1}</span>
                    <span className="flex-1 text-[13px] text-muted-foreground italic px-2">— ว่าง —</span>
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
                        <span className="text-[13px] text-muted-foreground shrink-0">{i + 1}</span>
                        <Badge variant="default" className="text-sm">☯</Badge>
                        <ArtTooltip art={a} level={aLv}>
                          <strong className="text-sm cursor-help underline decoration-dotted underline-offset-2">
                            {a.n}
                          </strong>
                        </ArtTooltip>
                        <Badge variant="outline" className="text-sm">{a.sc}</Badge>
                        <Badge variant="outline" className="text-sm">{a.tp}</Badge>
                        <Badge variant="outline" className="text-sm">ขั้น {aLv}</Badge>
                      </div>
                      {a.act && (
                        <span className="text-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                          ⚡ MP{a.act.c} CD{a.act.cd}
                        </span>
                      )}
                    </div>
                    {(artStatRow || a.hL || a.mL) && (
                      <div className="text-[13px] text-emerald-700 mt-0.5">
                        โบนัส:{artStatRow ? ` ${artStatRow}` : ""}
                        {a.hL ? ` HP+${a.hL * aLv}` : ""}
                        {a.mL ? ` MP+${a.mL * aLv}` : ""}
                      </div>
                    )}
                    {a.act && (
                      <div className="text-[13px] text-muted-foreground">
                        ⚡ <strong>{a.act.n}</strong>: {a.act.d}
                      </div>
                    )}
                    {a.pas && (
                      <div className="text-[13px] text-muted-foreground">◆ {a.pas.d}</div>
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
                      <span className="text-[13px] text-muted-foreground shrink-0">{i + 1}</span>
                      <Badge variant="default" className="text-sm">⚔</Badge>
                      <SkillTooltip skill={sk} level={skLv}>
                        <strong className="text-sm cursor-help underline decoration-dotted underline-offset-2">
                          {sk.n}
                        </strong>
                      </SkillTooltip>
                      <Badge variant="default" className="text-sm">Lv.{skLv}</Badge>
                      <Badge variant="outline" className="text-sm">{tier?.n}</Badge>
                      <Badge
                        variant="outline"
                        className="text-sm"
                        title={WEAPON_FAMILY_HINT[sk.w]}
                      >
                        {WEAPON_FAMILY_LABEL[sk.w]}
                      </Badge>
                    </div>
                    <span className="text-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                      {skillKindIcon(sk)} CD{tier?.cd ?? 0}
                    </span>
                  </div>
                  {skStatRow && (
                    <div className="text-[13px] text-emerald-700 mt-0.5">
                      โบนัส: {skStatRow}
                      <span className="opacity-60"> (×{Math.round(skMul * 100)}% ของ Lv.10)</span>
                    </div>
                  )}
                  <div className="text-[13px] text-muted-foreground">{sk.d}</div>
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
                  className="text-[13px] bg-muted/40 px-2 py-0.5 rounded"
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
              <span className="text-[13px] text-muted-foreground">ยังไม่มีความเชี่ยวชาญ</span>
            )}
          </div>

          <div className="text-[13px] text-muted-foreground mt-1">
            โบนัสจากวิชา:{" "}
            {Object.entries(skillStatBonus).length > 0
              ? Object.entries(skillStatBonus).map(([k, v]) => `${k}+${v}`).join(" ")
              : "—"}
          </div>
        </section>

        </>}

        {tab === "gear" && <>
        {/* ─── Equipment ───────────────────────────────────────────── */}
        <section className="profile-panel">
          <div className="profile-heading">
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
                  <span className="text-[13px] text-muted-foreground w-28 shrink-0">{row.label}</span>
                  <div className="flex-1 min-w-0">
                    {e ? <strong>{e.n}</strong> : <span className="text-[13px] text-muted-foreground italic">— ว่าง —</span>}
                  </div>
                  {e && (
                    <span className="text-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                      {describeEquip(id)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-2 rounded-md bg-muted/40 p-2 border-l-2 border-orange-500 text-[13px] leading-relaxed">
            รวม: {equipSummary.length > 0 ? equipSummary.join(" · ") : "ไม่มีโบนัส"}
          </div>
        </section>
        </>}

        {tab === "fame" && (
          <section className="profile-panel">
            <div className="profile-heading">ชื่อเสียงและคุณธรรม</div>
            <dl className="profile-derived">
              {TRAIT_KEYS.map((k) => (
                <div key={k}><dt>{TRAIT_LABEL[k]}</dt><dd>{traits[k] ?? 0}</dd></div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </Modal>
  );
}

const PROFILE_TABS = [
  { id: "stats", label: "ค่าพลัง" },
  { id: "skills", label: "วิชาที่ใช้" },
  { id: "gear", label: "อุปกรณ์" },
  { id: "fame", label: "ชื่อเสียง" },
] as const;
type ProfileTab = (typeof PROFILE_TABS)[number]["id"];

function VitalBar({ label, tone, value, max, pct }: { label: string; tone: "hp" | "mp" | "st"; value: number; max: number; pct?: number }) {
  const width = pct ?? (max > 0 ? Math.min(100, (value / max) * 100) : 0);
  return (
    <div className={`profile-bar profile-bar--${tone}`}>
      <span>{label}</span>
      <i role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}><span style={{ width: `${width}%` }} /></i>
      <b>{Math.round(value)}<small>/{max}</small></b>
    </div>
  );
}
