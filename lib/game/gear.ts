// Gear options (ออฟชั่นเสริม). Every piece the hero owns carries random options
// rolled by its tier when it is gained, and re-rolled at a craft shop. A piece
// is a key — its equipment id, then its options:
//
//   "eq_t1_w_sword~pa:6,fam_dmg:sword:15"
//
// A bare id is a piece with none. The key is the whole truth: the bag
// (`inventoryEquipment`), the loadout and the battle build all hold keys, so
// the options travel wherever the piece goes, and `parseGear` clamps every
// value to its range and the count to the tier's, so a hand-edited key can
// never be stronger than a lucky roll.
import type { EquipLoadout, Equipment, StatKey, WeaponFamily } from "./types";
import { STAT_KEYS, WEAPON_FAMILY_KEYS } from "./types";
import { EQUIPMENT_BY_ID, gearBaseId } from "./data/equipment";

export type GearAffixKind =
  | "stat" // a base stat (STR…INT) +1–10
  | "pd" | "id" | "pa" | "ia" // flat physical / internal defence and attack
  | "pd_pct" | "id_pct" | "pa_pct" | "ia_pct" // the same, in %
  | "acc_pct" | "eva_pct" // accuracy / evasion %
  | "cri" | "res" // crit and crit resistance (flat)
  | "crit_dmg" // crit damage %
  | "wexp" // ประสบการณ์ยุทธ gained %
  | "fam_dmg" // damage dealt by moves of one weapon family %
  | "fam_red"; // damage taken from moves of one weapon family −%

export interface GearAffix {
  k: GearAffixKind;
  v: number;
  /** Which base stat (`stat`). */
  stat?: StatKey;
  /** Which weapon family (`fam_dmg` / `fam_red`). */
  fam?: WeaponFamily;
}

/** Each option's range (whole numbers, both ends included). */
export const GEAR_AFFIX_RANGE: Readonly<Record<GearAffixKind, readonly [number, number]>> = {
  stat: [1, 10],
  pd: [5, 15], id: [5, 15], pa: [5, 15], ia: [5, 15],
  pd_pct: [1, 10], id_pct: [1, 10], pa_pct: [1, 10], ia_pct: [1, 10],
  acc_pct: [1, 15], eva_pct: [1, 15],
  cri: [5, 15], res: [5, 15],
  crit_dmg: [1, 10],
  wexp: [5, 15],
  fam_dmg: [5, 25], fam_red: [5, 25],
};

/** Every option kind; each is equally likely, and a piece never rolls one kind twice. */
export const GEAR_AFFIX_KINDS = Object.keys(GEAR_AFFIX_RANGE) as GearAffixKind[];

/** How many options a piece of each tier rolls: [min, max]. */
export const GEAR_AFFIX_COUNT: Readonly<Record<number, readonly [number, number]>> = {
  0: [0, 1],
  1: [1, 2],
  2: [1, 3],
  3: [2, 3],
  4: [3, 4],
};

/** Damage taken from one weapon family can be cut by gear options at most this far (%). */
export const GEAR_FAMILY_REDUCE_CAP = 60;

export function affixCountRange(ti: number): readonly [number, number] {
  return GEAR_AFFIX_COUNT[Math.max(0, Math.min(4, Math.floor(ti)))] ?? [0, 0];
}

const isStat = (s: string | undefined): s is StatKey => !!s && (STAT_KEYS as readonly string[]).includes(s);
const isFamily = (s: string | undefined): s is WeaponFamily => !!s && (WEAPON_FAMILY_KEYS as readonly string[]).includes(s);
const isKind = (s: string | undefined): s is GearAffixKind => !!s && s in GEAR_AFFIX_RANGE;

function clampValue(k: GearAffixKind, v: number): number {
  const [min, max] = GEAR_AFFIX_RANGE[k];
  return Math.max(min, Math.min(max, Math.round(v)));
}

function encodeAffix(a: GearAffix): string {
  if (a.k === "stat") return `stat:${a.stat}:${a.v}`;
  if (a.k === "fam_dmg" || a.k === "fam_red") return `${a.k}:${a.fam}:${a.v}`;
  return `${a.k}:${a.v}`;
}

function decodeAffix(token: string): GearAffix | null {
  const parts = token.split(":");
  const k = parts[0];
  if (!isKind(k)) return null;
  if (k === "stat") {
    const v = Number(parts[2]);
    return isStat(parts[1]) && Number.isFinite(v) ? { k, stat: parts[1], v: clampValue(k, v) } : null;
  }
  if (k === "fam_dmg" || k === "fam_red") {
    const v = Number(parts[2]);
    return isFamily(parts[1]) && Number.isFinite(v) ? { k, fam: parts[1], v: clampValue(k, v) } : null;
  }
  const v = Number(parts[1]);
  return parts.length === 2 && Number.isFinite(v) ? { k, v: clampValue(k, v) } : null;
}

export interface OwnedGear {
  /** The piece's key, canonical (what the bag and loadout should hold). */
  key: string;
  def: Equipment;
  affixes: GearAffix[];
  /** Enhancement (เสริมพลัง) level, 0–ENHANCE_MAX. */
  enhance: number;
}

/** The highest enhancement (เสริมพลัง) a piece can reach. */
export const ENHANCE_MAX = 10;

const clampEnhance = (v: number) => Math.max(0, Math.min(ENHANCE_MAX, Math.floor(Number.isFinite(v) ? v : 0)));

/**
 * The key for a piece, its enhancement and its options (a bare id when it has
 * neither): `eq_t1_w_sword~en:7,pa:6,cri:9`.
 */
export function gearKey(baseId: string, affixes: readonly GearAffix[], enhance = 0): string {
  const tokens = [...(clampEnhance(enhance) > 0 ? [`en:${clampEnhance(enhance)}`] : []), ...affixes.map(encodeAffix)];
  return tokens.length ? `${baseId}~${tokens.join(",")}` : baseId;
}

/**
 * Read a piece's key: its definition and its options, each clamped to its
 * range, one per kind, no more than the tier allows. Null for an unknown id.
 */
export function parseGear(key: string | null | undefined): OwnedGear | null {
  if (!key) return null;
  const baseId = gearBaseId(key);
  const def = EQUIPMENT_BY_ID.get(baseId);
  if (!def) return null;
  const cut = key.indexOf("~");
  const affixes: GearAffix[] = [];
  let enhance = 0;
  if (cut >= 0) {
    const max = affixCountRange(def.ti)[1];
    const seen = new Set<GearAffixKind>();
    for (const token of key.slice(cut + 1).split(",")) {
      if (token.startsWith("en:")) {
        enhance = clampEnhance(Number(token.slice(3)));
        continue;
      }
      const a = decodeAffix(token);
      if (!a || seen.has(a.k) || affixes.length >= max) continue;
      seen.add(a.k);
      affixes.push(a);
    }
  }
  return { key: gearKey(baseId, affixes, enhance), def, affixes, enhance };
}

/** A piece's enhancement level (0 for a bare id or an unknown key). */
export function gearEnhance(key: string | null | undefined): number {
  return parseGear(key)?.enhance ?? 0;
}

// ─── Enhancement (เสริมพลัง) ──────────────────────────────────────────
// What each level adds, by the kind of piece; levels add up (+7 on a weapon
// = five × 10 + two × 15 Atk). Bands: +1–5, +6–8, +9–10.

export type EnhanceKind = "weapon" | "armor" | "charm" | "ring";

export function enhanceKind(ty: Equipment["ty"]): EnhanceKind {
  return ty === "W" ? "weapon" : ty === "C" ? "charm" : ty === "R" ? "ring" : "armor";
}

/** The band a level falls in: 0 for +1–5, 1 for +6–8, 2 for +9–10. */
export function enhanceBand(level: number): 0 | 1 | 2 {
  return level <= 5 ? 0 : level <= 8 ? 1 : 2;
}

/** What one level in each band adds. */
export const ENHANCE_STEP: Readonly<Record<EnhanceKind, readonly Readonly<Partial<Record<"atk" | "def" | "hp" | "mp" | "pa_ia" | "final_dmg", number>>>[]>> = {
  weapon: [{ atk: 10 }, { atk: 15, final_dmg: 1 }, { atk: 20, final_dmg: 4 }],
  armor: [{ def: 10, hp: 50 }, { def: 15, hp: 100 }, { def: 20, hp: 150 }],
  charm: [{ hp: 50, mp: 50 }, { hp: 100, mp: 100 }, { hp: 150, mp: 150 }],
  ring: [{ pa_ia: 5 }, { pa_ia: 10 }, { pa_ia: 15 }],
};

export interface EnhanceBonus { atk: number; pd: number; id: number; hp: number; mp: number; pa: number; ia: number; final_dmg: number }

/** Everything a piece of this slot at this enhancement adds, summed over its levels. */
export function enhanceBonus(ty: Equipment["ty"], level: number): EnhanceBonus {
  const out: EnhanceBonus = { atk: 0, pd: 0, id: 0, hp: 0, mp: 0, pa: 0, ia: 0, final_dmg: 0 };
  const steps = ENHANCE_STEP[enhanceKind(ty)];
  for (let l = 1; l <= clampEnhance(level); l++) {
    const s = steps[enhanceBand(l)]!;
    out.atk += s.atk ?? 0;
    out.pd += s.def ?? 0;
    out.id += s.def ?? 0;
    out.hp += s.hp ?? 0;
    out.mp += s.mp ?? 0;
    out.pa += s.pa_ia ?? 0;
    out.ia += s.pa_ia ?? 0;
    out.final_dmg += s.final_dmg ?? 0;
  }
  return out;
}

/** A piece's options (none for a bare id or an unknown key). */
export function gearAffixes(key: string | null | undefined): GearAffix[] {
  return parseGear(key)?.affixes ?? [];
}

/**
 * How good an option's roll is, 0–5, by where its value sits in its range:
 * the bottom fifth 0 … the top fifth 4, the very top 5 (the same ranks as the
 * rarity colours, lib/ui/rarity.ts).
 */
export function affixQuality(a: Pick<GearAffix, "k" | "v">): number {
  const [min, max] = GEAR_AFFIX_RANGE[a.k];
  if (a.v >= max) return 5;
  if (max <= min) return 0;
  return Math.max(0, Math.min(4, Math.floor(((a.v - min) / (max - min)) * 5)));
}

const pick = <T,>(list: readonly T[], rand: () => number): T => list[Math.min(list.length - 1, Math.floor(rand() * list.length))]!;
const between = (min: number, max: number, rand: () => number) => min + Math.min(max - min, Math.floor(rand() * (max - min + 1)));

/** Roll a fresh set of options for a piece of tier `ti`. */
export function rollGearAffixes(ti: number, rand: () => number = Math.random): GearAffix[] {
  const [lo, hi] = affixCountRange(ti);
  const count = between(lo, hi, rand);
  const pool = [...GEAR_AFFIX_KINDS];
  const out: GearAffix[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const k = pool.splice(Math.min(pool.length - 1, Math.floor(rand() * pool.length)), 1)[0]!;
    const [min, max] = GEAR_AFFIX_RANGE[k];
    const a: GearAffix = { k, v: between(min, max, rand) };
    if (k === "stat") a.stat = pick(STAT_KEYS, rand);
    if (k === "fam_dmg" || k === "fam_red") a.fam = pick(WEAPON_FAMILY_KEYS, rand);
    out.push(a);
  }
  return out;
}

/** A newly gained piece: its id with freshly rolled options. Unknown ids come back as they are. */
export function rollGearKey(baseId: string, rand: () => number = Math.random): string {
  const def = EQUIPMENT_BY_ID.get(gearBaseId(baseId));
  if (!def) return baseId;
  return gearKey(def.id, rollGearAffixes(def.ti, rand));
}

/** Every worn piece's key (empty slots left out). */
export function loadoutKeys(loadout: EquipLoadout): string[] {
  return [loadout.W, loadout.A, loadout.H, loadout.B, ...loadout.BR, ...loadout.R, ...loadout.C].filter(
    (k): k is string => typeof k === "string" && k.length > 0,
  );
}

/** Every option on the worn pieces. */
export function loadoutAffixes(loadout: EquipLoadout): GearAffix[] {
  return loadoutKeys(loadout).flatMap(gearAffixes);
}

export interface GearFamilyMods {
  /** % more damage dealt by moves of the family. */
  dmg: Partial<Record<WeaponFamily, number>>;
  /** % less damage taken from moves of the family (capped at GEAR_FAMILY_REDUCE_CAP). */
  red: Partial<Record<WeaponFamily, number>>;
}

/** The worn options that change damage by the move's weapon family. */
export function gearFamilyMods(loadout: EquipLoadout): GearFamilyMods {
  const out: GearFamilyMods = { dmg: {}, red: {} };
  for (const a of loadoutAffixes(loadout)) {
    if (!a.fam) continue;
    if (a.k === "fam_dmg") out.dmg[a.fam] = (out.dmg[a.fam] ?? 0) + a.v;
    if (a.k === "fam_red") out.red[a.fam] = Math.min(GEAR_FAMILY_REDUCE_CAP, (out.red[a.fam] ?? 0) + a.v);
  }
  return out;
}

/** The damage multiplier of a move of family `fam` from the attacker's and defender's gear options. */
export function familyDamageMod(attacker: GearFamilyMods | undefined, defender: GearFamilyMods | undefined, fam: WeaponFamily | undefined): number {
  if (!fam) return 1;
  const up = attacker?.dmg[fam] ?? 0;
  const down = Math.min(GEAR_FAMILY_REDUCE_CAP, defender?.red[fam] ?? 0);
  return (1 + up / 100) * (1 - down / 100);
}
