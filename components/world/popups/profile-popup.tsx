"use client";

import { useState } from "react";
import { Wardrobe } from "../wardrobe";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  SLOT_LABELS,
  STAT_BUDGET,
  STAT_KEYS,
  STAT_LABEL,
  DERIVED_HINT,
  WEAPON_FAMILY_HINT,
  WEAPON_FAMILY_LABEL,
  affixQuality,
  affixText,
  derivedSourceParts,
  enhanceParts,
  gearTierLabel,
  parseGear,
  statFeedParts,
  bpMultiplier,
  combinedStats,
  derive,
  deriveAll,
  gearFamilyMods,
  gearName,
  equipBonusParts,
  equipStatParts,
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
  { label: "PA",  thai: "โจมตีภายนอก", key: "PA" },
  { label: "IA",  thai: "โจมตีภายใน", key: "IA" },
  { label: "PD",  thai: "ป้องกันภายนอก", key: "PD" },
  { label: "ID",  thai: "ป้องกันภายใน", key: "ID" },
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

/** "พลังโจมตี +14" → the name and its number apart, so a list reads as a table
 *  ("กระบวนท่าสายกระบี่ แรงขึ้น 15%" → "กระบวนท่าสายกระบี่" | "+15%"). */
function statPart(part: string) {
  const worded = part.match(/^(.*) (แรงขึ้น|เบาลง) (\d[\d.]*%)$/);
  if (worded) return <><span>{worded[1]}</span><b>{worded[2] === "เบาลง" ? "−" : "+"}{worded[3]}</b></>;
  const at = part.search(/ [+\-−]?\d[\d.,]*%?(?: |$)/);
  if (at < 0) return <span>{part}</span>;
  return <><span>{part.slice(0, at)}</span><b>{part.slice(at + 1)}</b></>;
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
  // The gear tab's picked slot ("BR-1"…); none shows everything worn, summed.
  const [gearPick, setGearPick] = useState<string | null>(null);
  if (!player) return null;

  const base = player.stats;
  const combined = combinedStats(player);
  // Per-source breakdown — used by the stat-cell tooltips so the player
  // can see where each stat point comes from (skills + arts count toward
  // the learn-skill gate; equipment doesn't).
  const breakdown = statBreakdown(player);
  const derivedAll = deriveAll(player);
  const derivedBase = derive(base);
  // Stats alone (with moves, arts and meridians), before gear and flat bonuses.
  const derivedStats = derive(combined);
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
  // The per-family options (gear.ts) aren't in EquipBonus: listed after it.
  const fam = gearFamilyMods(player.equipment);
  const equipSummary = [
    ...equipBonusParts(eb, sb),
    ...Object.entries(fam.dmg).map(([f, v]) => `กระบวนท่าสาย${WEAPON_FAMILY_LABEL[f as WeaponFamily]} แรงขึ้น ${v}%`),
    ...Object.entries(fam.red).map(([f, v]) => `รับกระบวนท่าสาย${WEAPON_FAMILY_LABEL[f as WeaponFamily]} เบาลง ${v}%`),
  ];

  const slotId = (row: EquipSlotRow) => {
    const slot = player.equipment[row.type];
    return Array.isArray(slot) ? slot[row.index ?? 0] : slot;
  };

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
            <VitalBar label="ชีวิต" tone="hp" value={hpNow} max={derivedAll.HP} />
            <VitalBar label="ปราณ" tone="mp" value={mpNow} max={derivedAll.MP} />
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
                    <span className="profile-stat-name">{STAT_LABEL[k]}</span>
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
                        <strong className="font-display">{STAT_LABEL[k]}</strong>
                        <span className="text-base font-semibold">{c}</span>
                      </div>
                      <ul className="space-y-0.5 text-[13px]">
                        <li className="flex justify-between"><span className="text-muted-foreground">พลังพื้นฐาน</span><span className="font-mono">{b}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">ลมปราณ</span><span className="font-mono">{fromArts > 0 ? `+${fromArts}` : fromArts}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">กระบวนท่า</span><span className="font-mono">{fromSkills > 0 ? `+${fromSkills}` : fromSkills}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">ชีพจร</span><span className="font-mono">{fromMeridians > 0 ? `+${fromMeridians}` : fromMeridians}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">อุปกรณ์</span><span className="font-mono">{fromEquipment > 0 ? `+${fromEquipment}` : fromEquipment}</span></li>
                      </ul>
                      <p className="profile-feeds"><b>ทุก 1 แต้ม เพิ่ม</b> {statFeedParts(k).join(" · ")}</p>
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
              <ul className="profile-gear-slots">
                {EQUIP_ROWS.map((row) => {
                  const rowKey = `${row.type}-${row.index ?? "x"}`;
                  const id = slotId(row);
                  const g = parseGear(id);
                  return (
                    <li key={rowKey}>
                      <button
                        type="button"
                        aria-pressed={gearPick === rowKey}
                        disabled={!g}
                        title={row.label}
                        data-gear-slot={rowKey}
                        onClick={() => setGearPick((p) => (p === rowKey ? null : rowKey))}
                      >
                        <span className="profile-gear-icon" aria-hidden>{row.label.split(" ")[0]}</span>
                        <span className="sr-only">{row.label.slice(row.label.indexOf(" ") + 1)}: </span>
                        <span className="profile-gear-name">{g ? gearName(id) : <i>— ว่าง —</i>}</span>
                        {g && g.affixes.length > 0 && <small className="profile-gear-count">✦{g.affixes.length}</small>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {(() => {
                const row = EQUIP_ROWS.find((r) => `${r.type}-${r.index ?? "x"}` === gearPick);
                const id = row ? slotId(row) : null;
                const g = parseGear(id);
                if (!row || !g) {
                  return (
                    <div className="profile-gear-detail" data-testid="gear-total">
                      <p className="profile-gear-head"><b>รวมจากอุปกรณ์ที่สวม</b><small>แตะชิ้นใดเพื่อดูรายละเอียด</small></p>
                      {equipSummary.length > 0 ? (
                        <ul className="profile-gear-parts">{equipSummary.map((part) => <li key={part}>{statPart(part)}</li>)}</ul>
                      ) : <p className="profile-gear-none">ยังไม่ได้สวมอุปกรณ์</p>}
                    </div>
                  );
                }
                const e = g.def;
                return (
                  <div className="profile-gear-detail" data-testid="gear-piece">
                    <p className="profile-gear-head">
                      <b>{gearName(id)}</b>
                      <small>{row.label.slice(row.label.indexOf(" ") + 1)} · ชั้น{gearTierLabel(e.ti)}{e.fam ? ` · สาย${WEAPON_FAMILY_LABEL[e.fam]}` : ""}</small>
                      <button type="button" className="profile-gear-back" aria-label="ดูผลรวม" title="ดูผลรวม" onClick={() => setGearPick(null)}>✕</button>
                    </p>
                    <p className="profile-gear-sub">ค่าพื้นฐาน</p>
                    <ul className="profile-gear-parts">{equipStatParts(e).map((part) => <li key={part}>{statPart(part)}</li>)}</ul>
                    {g.enhance > 0 && (
                      <>
                        <p className="profile-gear-sub">⚒ เสริมพลัง +{g.enhance}</p>
                        <ul className="profile-gear-parts">{enhanceParts(e.ty, g.enhance).map((part) => <li key={part}>{statPart(part)}</li>)}</ul>
                      </>
                    )}
                    <p className="profile-gear-sub">✦ ออฟชั่นเสริม</p>
                    {g.affixes.length > 0 ? (
                      <ul className="profile-gear-parts profile-gear-affixes">
                        {g.affixes.map((a) => <li key={a.k} className={`affix-q${affixQuality(a)}`}>{statPart(affixText(a))}</li>)}
                      </ul>
                    ) : <p className="profile-gear-none">ไม่มี</p>}
                  </div>
                );
              })()}
            </div>
          )}
          {tab === "outfit" && <Wardrobe />}
        </section>

        {/* ─── 3. Detailed status ──────────────────────────────────── */}
        <section className="menu-col profile-status" aria-label="สถานะละเอียด">
          <div className="menu-col-head"><span className="menu-col-title">สถานะละเอียด</span><small className="profile-budget">คะแนนพลัง {totalSpent}/{STAT_BUDGET}</small></div>
          <div className="profile-derived">
            {DERIVED_ROWS.map(({ label, thai, key }) => {
              const cv = derivedAll[key];
              const bv = derivedBase[key as keyof typeof derivedBase] ?? cv;
              const diff = cv - bv;
              const fromStats = derivedStats[key as keyof typeof derivedStats] ?? cv;
              const row = (
                <div className="profile-derived-row" data-derived={key}>
                  <span>{thai}</span>
                  <b>{cv}{diff > 0 && <em>+{diff}</em>}</b>
                </div>
              );
              return (
                <InfoPopover key={label} trigger={row} side="left" contentClassName="w-72">
                  <div className="profile-explain">
                    <p className="profile-explain-head"><strong>{thai}</strong><b>{cv}</b></p>
                    <p>{DERIVED_HINT[key]}</p>
                    <p className="profile-explain-from"><b>มาจากค่าพลัง</b> {derivedSourceParts(key).join(" · ")}</p>
                    <ul>
                      <li><span>จากค่าพลัง (รวมวิชา ชีพจร)</span><b>{fromStats}</b></li>
                      <li><span>อุปกรณ์และโบนัสอื่น</span><b>{cv - fromStats >= 0 ? `+${cv - fromStats}` : cv - fromStats}</b></li>
                    </ul>
                  </div>
                </InfoPopover>
              );
            })}
          </div>
          <p className="profile-hint">แตะค่าใดก็ได้เพื่อดูว่าค่านั้นทำอะไร</p>
          <div className="profile-mastery">
            <span className="profile-mastery-label">ความชำนาญ</span>
            {Object.keys(mastery).length === 0 ? <span className="text-muted-foreground">ยังไม่มี</span> : Object.entries(mastery).map(([w, v]) => (
              <span key={w} className="profile-chip" title={WEAPON_FAMILY_HINT[w as WeaponFamily]}>
                {WEAPON_FAMILY_LABEL[w as WeaponFamily]} <b>{Math.floor(v ?? 0)}</b> <small>×{(1 + ((v ?? 0) / 200) * 0.5).toFixed(2)}</small>
              </span>
            ))}
          </div>
          <p className="profile-bonus">โบนัสจากวิชา: {Object.entries(skillStatBonus).length > 0 ? Object.entries(skillStatBonus).map(([k, v]) => `${STAT_LABEL[k as keyof typeof STAT_LABEL] ?? k} +${v}`).join(" · ") : "—"}</p>
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
  { id: "outfit", label: "ชุด" },
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
