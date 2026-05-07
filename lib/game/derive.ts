import type {
  StatBlock,
  Derived,
  CharacterBuild,
  EquipLoadout,
  PartialStats,
  WeaponFamily,
} from "./types";
import { STAT_KEYS } from "./types";
import { getSkill, getArt, getEquip } from "./data";
import { bpMultiplier, effectiveMg } from "./leveling";
import {
  computeConflictFactors,
  getStatusFactor,
  type ConflictFactors,
} from "./skill-conflict";
import type { Equipment } from "./types";

// Pure: base stats → derived combat stats.
// Mirrors `derive()` in demo.html — keep formulas in sync if tuning.
export function derive(o: StatBlock): Derived {
  return {
    HP: o.VIT * 20 + o.DEF * 10 + o.STR * 3,
    MP: o.POW * 12 + o.INT * 4,
    Atk: o.STR * 3 + o.AGI + o.POW + o.DEX + o.INT * 2,
    PA: o.STR * 2 + o.DEX + o.LUK,
    IA: o.POW * 2 + o.DEX + o.LUK,
    PD: o.DEF * 2 + o.VIT + o.INT * 2,
    ID: o.DEF * 2 + o.POW + o.VIT + o.INT * 2,
    Eva: o.AGI * 2,
    Acc: o.DEX * 2,
    Cri: o.STR + o.LUK,
    Res: o.LUK + Math.floor(o.DEF * 0.5),
    Spd: Math.max(o.AGI * 2, 1),
  };
}

function addPartialStats(target: StatBlock, src: PartialStats): void {
  for (const k of STAT_KEYS) {
    const v = src[k];
    if (v) target[k] += v;
  }
}

// Equipment iterator: flat list of equipped items for a build.
export function getEquippedItems(loadout: EquipLoadout): Equipment[] {
  const ids: (string | null)[] = [
    loadout.W,
    loadout.A,
    loadout.H,
    loadout.B,
    ...loadout.BR,
    ...loadout.R,
    ...loadout.C,
  ];
  return ids.map(getEquip).filter((e): e is Equipment => e !== null);
}

// Aggregate stat bonuses from equipped items.
export function getEquipStatBonus(loadout: EquipLoadout): PartialStats {
  const out: PartialStats = {};
  for (const e of getEquippedItems(loadout)) {
    for (const k of STAT_KEYS) {
      const v = e.st[k];
      if (v) out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}

export interface EquipBonus {
  atk: number;
  pd: number;
  id_: number;
  hp: number;
  mp: number;
  cri: number;
  eva: number;
  pct_atk: number;
  pct_red: number;
  hp_regen: number;
}

// Aggregate special effects + flat additions from equipment.
export function getEquipBonus(loadout: EquipLoadout): EquipBonus {
  const b: EquipBonus = {
    atk: 0, pd: 0, id_: 0, hp: 0, mp: 0,
    cri: 0, eva: 0, pct_atk: 0, pct_red: 0, hp_regen: 0,
  };
  for (const e of getEquippedItems(loadout)) {
    b.atk += e.atkb;
    b.pd += e.pdb;
    b.id_ += e.idb;
    b.hp += e.hpb;
    b.mp += e.mpb;
    if (!e.eff) continue;
    switch (e.eff.t) {
      case "flat_cri": b.cri += e.eff.v; break;
      case "flat_eva": b.eva += e.eff.v; break;
      case "pct_atk": b.pct_atk += e.eff.v; break;
      case "pct_reduce": b.pct_red += e.eff.v; break;
      case "hp_regen": b.hp_regen += e.eff.v; break;
      // on_hit handled at hit time, not in passive bonus aggregation
    }
  }
  return b;
}

function addScaledPartialStats(
  target: StatBlock,
  src: PartialStats,
  factor: number,
): void {
  if (factor === 1) {
    addPartialStats(target, src);
    return;
  }
  if (factor <= 0) return;
  for (const k of STAT_KEYS) {
    const v = src[k];
    if (v) target[k] += Math.floor(v * factor);
  }
}

// Per-source stat contribution buckets. `base` is just the build's
// innate stats; `fromArts` / `fromSkills` / `fromEquipment` are the
// deltas each source contributes after conflict + level scaling.
// Caller composes the buckets they need:
//   - battle / damage     → base + arts + skills + equipment (all)
//   - learn-skill gates   → base + arts + skills (no equipment)
//   - profile UI          → render each bucket separately
export interface StatBreakdown {
  base: StatBlock;
  fromArts: StatBlock;
  fromSkills: StatBlock;
  fromEquipment: StatBlock;
}

const emptyStatBlock = (): StatBlock => ({
  STR: 0, AGI: 0, POW: 0, VIT: 0, DEX: 0, LUK: 0, DEF: 0, INT: 0,
});

// Compute the four-bucket breakdown. Conflict factors and level scaling
// match `combinedStats`; consumers add buckets together to get the same
// totals.
export function statBreakdown(
  build: CharacterBuild,
  conflict?: ConflictFactors,
): StatBreakdown {
  const factors = conflict ?? computeConflictFactors(build, { getSkill, getArt });

  // ── Arts ──
  const fromArts = emptyStatBlock();
  const activeArt = getArt(build.artId);
  if (activeArt.id !== "none") {
    const f = (build.artLevel / 10) * getStatusFactor(activeArt, factors);
    for (const k of STAT_KEYS) {
      const v = activeArt.stats[k];
      if (v) fromArts[k] += Math.floor(v * f);
    }
  }
  for (const aid of build.learnedArtIds ?? []) {
    if (aid === build.artId) continue;
    const art = getArt(aid);
    if (!art || art.id === "none") continue;
    const lv = build.artLevels?.[aid] ?? 1;
    const f = (lv / 10) * getStatusFactor(art, factors);
    for (const k of STAT_KEYS) {
      const v = art.stats[k];
      if (v) fromArts[k] += Math.floor(v * f);
    }
  }

  // ── Move skills (slotted + learned-but-unslotted) ──
  const fromSkills = emptyStatBlock();
  const counted = new Set<string>();
  for (const sid of build.skillIds) {
    if (!sid) continue;
    counted.add(sid);
    const sk = getSkill(sid);
    if (!sk) continue;
    const lv = build.skillLevels?.[sid] ?? 1;
    const f = getStatusFactor(sk, factors) * bpMultiplier(lv);
    addScaledPartialStats(fromSkills, sk.st, f);
  }
  for (const sid of build.learnedSkillIds ?? []) {
    if (counted.has(sid)) continue;
    const sk = getSkill(sid);
    if (!sk) continue;
    const lv = build.skillLevels?.[sid] ?? 1;
    const f = getStatusFactor(sk, factors) * bpMultiplier(lv);
    addScaledPartialStats(fromSkills, sk.st, f);
  }

  // ── Equipment ──
  const fromEquipment = emptyStatBlock();
  addPartialStats(fromEquipment, getEquipStatBonus(build.equipment));

  return {
    base: { ...build.stats },
    fromArts,
    fromSkills,
    fromEquipment,
  };
}

export interface CombinedStatsOpts {
  /** Skip equipment stat additions. Used by gates that should reward
   *  bonuses earned through training (skills + arts) but not from worn
   *  gear — most notably the manual learn-skill / learn-art check. */
  excludeEquipment?: boolean;
}

// Combine base stats + art-scaled stats + skill stat bonuses + equipment
// bonuses. Reads from BOTH slotted skills and learned-but-unslotted
// skills (everyone learned contributes their `st`). Same for arts.
// Conflict factors halve / zero misaligned contributions per
// skill-conflict.ts. Pass `{ excludeEquipment: true }` to skip the gear
// bonuses (used by learn-skill gates).
export function combinedStats(
  build: CharacterBuild,
  conflict?: ConflictFactors,
  opts?: CombinedStatsOpts,
): StatBlock {
  const breakdown = statBreakdown(build, conflict);
  const out: StatBlock = { ...breakdown.base };
  for (const k of STAT_KEYS) {
    out[k] += breakdown.fromArts[k] + breakdown.fromSkills[k];
    if (!opts?.excludeEquipment) out[k] += breakdown.fromEquipment[k];
  }
  return out;
}

// Full derived stats including art HP/MP-per-level and equipment overlays.
export function deriveAll(build: CharacterBuild): Derived {
  const factors = computeConflictFactors(build, { getSkill, getArt });
  const d = derive(combinedStats(build, factors));

  // Active art HP/MP gain — scaled by conflict.
  const activeArt = getArt(build.artId);
  if (activeArt.id !== "none") {
    const f = getStatusFactor(activeArt, factors);
    d.HP += Math.floor(activeArt.hL * build.artLevel * f);
    d.MP += Math.floor(activeArt.mL * build.artLevel * f);
  }
  // Learned arts also chip in HP / MP — same scaling, with conflict.
  for (const aid of build.learnedArtIds ?? []) {
    if (aid === build.artId) continue;
    const art = getArt(aid);
    if (!art || art.id === "none") continue;
    const lv = build.artLevels?.[aid] ?? 1;
    const f = getStatusFactor(art, factors);
    d.HP += Math.floor(art.hL * lv * f);
    d.MP += Math.floor(art.mL * lv * f);
  }

  const eb = getEquipBonus(build.equipment);
  d.Atk += eb.atk;
  d.PD += eb.pd;
  d.ID += eb.id_;
  d.HP += eb.hp;
  d.MP += eb.mp;
  d.Cri += eb.cri;
  d.Eva += eb.eva;
  return d;
}

export type MasteryMap = Partial<Record<WeaponFamily, number>>;

// Weapon mastery: each equipped skill grants `mg` toward its weapon family,
// scaled by the skill's current level (lv1 = 1×, lv10 = 2×) AND by any
// conflict factor on the skill's type tags. Cap is 200 per family.
// Mastery contributes ×(1 + mastery/200 * 0.5) damage.
export function getMasteryMap(
  skillIds: (string | null)[],
  skillLevels?: Record<string, number>,
  conflict?: ConflictFactors,
): MasteryMap {
  const out: MasteryMap = {};
  for (const sid of skillIds) {
    const sk = getSkill(sid);
    if (!sk || !sid) continue;
    const lv = skillLevels?.[sid];
    const factor = conflict ? getStatusFactor(sk, conflict) : 1;
    if (factor <= 0) continue;
    const mg = effectiveMg(sk, typeof lv === "number" ? lv : 1) * factor;
    out[sk.w] = Math.min(200, (out[sk.w] ?? 0) + mg);
  }
  return out;
}

export function getWeaponMastery(
  skillIds: (string | null)[],
  weapon: WeaponFamily,
  skillLevels?: Record<string, number>,
  conflict?: ConflictFactors,
): number {
  return getMasteryMap(skillIds, skillLevels, conflict)[weapon] ?? 0;
}

export function totalStatPoints(stats: StatBlock): number {
  return STAT_KEYS.reduce((t, k) => t + stats[k], 0);
}
