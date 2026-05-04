import type {
  StatBlock,
  Derived,
  CharacterBuild,
  EquipLoadout,
  PartialStats,
} from "./types";
import { STAT_KEYS } from "./types";
import { getSkill, getArt, getEquip } from "./data";
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

// Combine base stats + art-scaled stats + skill stat bonuses + equipment bonuses.
export function combinedStats(build: CharacterBuild): StatBlock {
  const out: StatBlock = { ...build.stats };
  const art = getArt(build.artId);
  if (art.id !== "none") {
    const f = build.artLevel / 10;
    for (const k of STAT_KEYS) {
      const v = art.stats[k];
      if (v) out[k] += Math.floor(v * f);
    }
  }
  for (const sid of build.skillIds) {
    const sk = getSkill(sid);
    if (sk) addPartialStats(out, sk.st);
  }
  addPartialStats(out, getEquipStatBonus(build.equipment));
  return out;
}

// Full derived stats including art HP/MP-per-level and equipment overlays.
export function deriveAll(build: CharacterBuild): Derived {
  const d = derive(combinedStats(build));
  const art = getArt(build.artId);
  if (art.id !== "none") {
    d.HP += art.hL * build.artLevel;
    d.MP += art.mL * build.artLevel;
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

// Weapon mastery: each equipped skill grants `mg` toward its weapon family.
// Cap is 200 per weapon. Mastery contributes ×(1 + mastery/200 * 0.5) damage.
export function getMasteryMap(skillIds: (string | null)[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const sid of skillIds) {
    const sk = getSkill(sid);
    if (!sk) continue;
    out[sk.w] = Math.min(200, (out[sk.w] ?? 0) + sk.mg);
  }
  return out;
}

export function getWeaponMastery(skillIds: (string | null)[], weapon: string): number {
  return getMasteryMap(skillIds)[weapon] ?? 0;
}

export function totalStatPoints(stats: StatBlock): number {
  return STAT_KEYS.reduce((t, k) => t + stats[k], 0);
}
