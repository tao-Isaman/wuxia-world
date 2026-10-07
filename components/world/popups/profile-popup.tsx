"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  SLOT_LABELS,
  STAT_BUDGET,
  STAT_KEYS,
  STAT_LABEL,
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
  powerBreakdown,
  powerTierOf,
  statBreakdown,
  totalStatPoints,
} from "@/lib/game";
import { InfoPopover } from "@/components/ui/wuxia/info-popover";
import type { EquipSlotType, WeaponFamily } from "@/lib/game";
import { useWorldStore } from "@/store/world-store";
import { PowerTierBadge } from "@/components/world/power-tier-badge";
import { xpToNextStatLevel } from "@/lib/world/stat-progression";
import { GENDER_LABEL, SECT_MEMBERSHIPS, TRAIT_KEYS, TRAIT_LABEL } from "@/lib/world";
import { heroEpithet } from "@/lib/world/epithet";
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

// Profile — a read-only character sheet in three landscape columns:
//   1. who: name and ฉายา, HP / MP / stamina, sect, power tier, reputation;
//   2. tabs: base stats (training bars, tap for sources) | equipment;
//   3. detailed status: combat numbers, weapon mastery, move bonuses.
export function ProfilePopup({ open, onClose }: Props) {
  const player = useWorldStore((s) => s.playerBuild);
  const gold = useWorldStore((s) => s.gold);
  const statExp = useWorldStore((s) => s.statExp);
  const traits = useWorldStore((s) => s.traits);
  const gender = useWorldStore((s) => s.gender);
  const sectMembership = useWorldStore((s) => s.sectMembership);
  const tournamentHistory = useWorldStore((s) => s.tournamentHistory);
  const wanted = useWorldStore((s) => s.wanted);
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
  // Power tier: stats + inner arts + moves, never equipment (lib/game/power-tier.ts).
  const powerTier = powerTierOf(powerBreakdown(player).total);

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
  const sects = Object.entries(sectMembership).filter(([, m]) => m);
  const epithet = heroEpithet({ traits, tournamentHistory, sectMembership, wanted });

  return (
    <Modal open={open} onClose={onClose} title={`👤 โปรไฟล์ — ${player.name}`} fill>
      <div className="menu-cols profile-cols">
        {/* ─── 1. Who: name, ฉายา, vitals, sect, power, reputation ───── */}
        <section className="menu-col profile-who" aria-label="ข้อมูลทั่วไป" data-testid="profile-general">
          <div className="profile-id">
            <div className="profile-figure" aria-hidden="true"><CharacterPreview id={bodyId} animate /></div>
            <div className="min-w-0">
              <h3 className="profile-name">{player.name}</h3>
              <p className="profile-epithet" data-testid="profile-epithet">“{epithet}”</p>
              <p className="profile-meta">{GENDER_LABEL[gender]} · ทอง <strong>{gold.toLocaleString()}</strong></p>
            </div>
          </div>
          <div className="profile-bars">
            <VitalBar label="HP" tone="hp" value={hpNow} max={derivedAll.HP} />
            <VitalBar label="MP" tone="mp" value={mpNow} max={derivedAll.MP} />
            <VitalBar label="พลัง" tone="st" value={stamina} max={staminaMax} pct={staminaPct} />
          </div>
          <dl className="profile-facts">
            <div><dt>ระดับพลัง</dt><dd className="profile-power" data-testid="profile-power" data-tier={powerTier.tier}><PowerTierBadge tier={powerTier} /></dd></div>
            <div><dt>สำนัก</dt><dd>
              {sects.length === 0 ? <span className="text-muted-foreground">ยังไม่สังกัด</span> : sects.map(([sid, m]) => {
                const def = SECT_MEMBERSHIPS[sid as keyof typeof SECT_MEMBERSHIPS];
                return def && m ? <span key={sid} className="profile-sect"><Badge variant="seal">{def.name}</Badge> ขั้น {m.rank}</span> : null;
              })}
            </dd></div>
          </dl>
          <div className="profile-fame" aria-label="ชื่อเสียงและคุณธรรม">
            {TRAIT_KEYS.map((k) => (
              <span key={k} className={`profile-trait profile-trait--${k}`} title={TRAIT_LABEL[k]}><small>{TRAIT_SHORT[k]}</small><b>{traits[k] ?? 0}</b></span>
            ))}
          </div>
        </section>

        {/* ─── 2. Stats / equipment ────────────────────────────────── */}
        <section className="menu-col profile-mid">
          <div className="menu-tabs" role="tablist" aria-label="ข้อมูลตัวละคร">
            {PROFILE_TABS.map((entry) => (
              <button key={entry.id} type="button" role="tab" aria-selected={tab === entry.id} onClick={() => setTab(entry.id)}>
                {entry.label}
              </button>
            ))}
          </div>
          {tab === "stats" && (
            <div className="profile-stats" role="tabpanel" aria-label="ค่าพลัง">
              {STAT_KEYS.map((k) => {
                const b = base[k];
                const c = combined[k];
                const d = c - b;
                const fromArts = breakdown.fromArts[k];
                const fromSkills = breakdown.fromSkills[k];
                const fromEquipment = breakdown.fromEquipment[k];
                const fromMeridians = breakdown.fromMeridians[k];
                // Sum used by learn-skill / learn-art gates (no equipment).
                const learnable = b + fromArts + fromSkills + fromMeridians;
                const xp = statExp[k] ?? 0;
                const cost = xpToNextStatLevel(b, k);
                const xpPct = cost > 0 ? Math.min(100, Math.round((xp / cost) * 100)) : 0;
                const cellTrigger = (
                  <div className="profile-stat">
                    <span className="profile-stat-name">{STAT_LABEL[k]}<small>{k}</small></span>
                    <b className="profile-stat-value">{c}{d > 0 && <em>+{d}</em>}</b>
                    <span className="profile-stat-train" aria-label={`ฝึก ${xp} จาก ${cost}`}>
                      <i><span style={{ width: `${xpPct}%` }} /></i>
                      <small>{xp}/{cost}</small>
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
                        <li className="flex justify-between"><span className="text-muted-foreground">ลมปราณ</span><span className="font-mono">{fromArts > 0 ? `+${fromArts}` : fromArts}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">กระบวนท่า</span><span className="font-mono">{fromSkills > 0 ? `+${fromSkills}` : fromSkills}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">ชีพจร</span><span className="font-mono">{fromMeridians > 0 ? `+${fromMeridians}` : fromMeridians}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">อุปกรณ์</span><span className="font-mono">{fromEquipment > 0 ? `+${fromEquipment}` : fromEquipment}</span></li>
                      </ul>
                      <div className="border-t pt-1.5 space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">เกณฑ์เรียนตำรา</span>
                          <span className="font-mono font-semibold text-emerald-700">{learnable}</span>
                        </div>
                        <div className="text-muted-foreground italic">ใช้รวม ลมปราณ + กระบวนท่า — ไม่นับอุปกรณ์</div>
                      </div>
                    </div>
                  </InfoPopover>
                );
              })}
            </div>
          )}
          {tab === "gear" && (
            <div className="profile-gear" role="tabpanel" aria-label="อุปกรณ์">
              <ul>
                {EQUIP_ROWS.map((row) => {
                  const slot = player.equipment[row.type];
                  const id = Array.isArray(slot) ? slot[row.index ?? 0] : slot;
                  const e = getEquip(id);
                  return (
                    <li key={`${row.type}-${row.index ?? "x"}`}>
                      <span className="profile-gear-slot">{row.label}</span>
                      <span className="profile-gear-name">{e ? e.n : <i>— ว่าง —</i>}</span>
                      {e && <small>{describeEquip(id)}</small>}
                    </li>
                  );
                })}
              </ul>
              <p className="profile-gear-total">รวม: {equipSummary.length > 0 ? equipSummary.join(" · ") : "ไม่มีโบนัส"}</p>
            </div>
          )}
        </section>

        {/* ─── 3. Detailed status ──────────────────────────────────── */}
        <section className="menu-col profile-status" aria-label="สถานะละเอียด">
          <div className="menu-col-head"><span className="menu-col-title">สถานะละเอียด</span><small className="profile-budget">คะแนนพลัง {totalSpent}/{STAT_BUDGET}</small></div>
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
          <div className="profile-mastery">
            <span className="profile-mastery-label">ความชำนาญ</span>
            {Object.keys(mastery).length === 0 ? <span className="text-muted-foreground">ยังไม่มี</span> : Object.entries(mastery).map(([w, v]) => (
              <span key={w} className="profile-chip" title={WEAPON_FAMILY_HINT[w as WeaponFamily]}>
                {WEAPON_FAMILY_LABEL[w as WeaponFamily]} <b>{Math.floor(v ?? 0)}</b> <small>×{(1 + ((v ?? 0) / 200) * 0.5).toFixed(2)}</small>
              </span>
            ))}
          </div>
          <p className="profile-bonus">โบนัสจากวิชา: {Object.entries(skillStatBonus).length > 0 ? Object.entries(skillStatBonus).map(([k, v]) => `${k}+${v}`).join(" ") : "—"}</p>
        </section>
      </div>
    </Modal>
  );
}

// Trait names short enough for one chip each.
const TRAIT_SHORT: Record<(typeof TRAIT_KEYS)[number], string> = { good: "ความดี", evil: "ความเลว", arrogance: "ทะนง", humility: "ถ่อมตน", fame: "ชื่อเสียง" };

// Moves live in the วิชา section, reputation in the first column.
const PROFILE_TABS = [
  { id: "stats", label: "ค่าพลัง" },
  { id: "gear", label: "อุปกรณ์" },
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
