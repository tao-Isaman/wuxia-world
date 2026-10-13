// Gear options in the world (the engine is lib/game/gear.ts): every piece
// gained rolls its options; a craft shop of the piece's own line re-rolls them
// for one magic material, once the hero's own skill in that craft is at least
// level 3; the materials drop from tier-3-and-up foes; and the ประสบการณ์ยุทธ
// option raises what fights and quests pay.
import {
  ENHANCE_MAX,
  affixCountRange,
  getBuildBonus,
  getEquip,
  gearKey,
  parseGear,
  rollGearAffixes,
  rollGearKey,
  type CharacterBuild,
  type Equipment,
  type EquipLoadout,
  type EquipSlotType,
} from "../game";
import { seededRng } from "../game/rng";
import type { RecipeDef, WorldStateData } from "./types";
import { getItem } from "./data/items";
import { equipmentListPrice, equipmentProfession, getArtisansAt, type CraftProfession } from "./data/artisans";
import { masteryLevel } from "./data/life-skills";
import { GEAR_RECIPES, recipeItemId } from "./data/gear-recipes";

/** หินศิลาวิเศษ: re-rolls a weapon's, a ring's or a charm's options. */
export const SPIRIT_STONE = "spirit_stone";
/** ด้ายศิลาวิเศษ: re-rolls a robe's, a hat's, boots' or bracers' options. */
export const SPIRIT_THREAD = "spirit_thread";

/** The hero's own level in the piece's craft needed to re-roll it. */
export const REFORGE_MIN_LEVEL = 3;

/** The material a piece of this slot is re-rolled with. */
export function reforgeMaterial(ty: EquipSlotType): string {
  return ty === "W" || ty === "R" || ty === "C" ? SPIRIT_STONE : SPIRIT_THREAD;
}

/** The craft whose shop re-rolls this piece (and whose level the hero needs). */
export function gearProfession(def: Equipment): CraftProfession {
  return equipmentProfession(def);
}

export type ReforgeRefusal = "unknown" | "wrong-shop" | "low-skill" | "no-material" | "not-owned";

export interface ReforgeCheck {
  ok: boolean;
  reason?: ReforgeRefusal;
  def?: Equipment;
  profession?: CraftProfession;
  material?: string;
  /** The hero's level in the craft (1–5). */
  level?: number;
}

/** Can this artisan's craft re-roll the piece now (shop, skill, material)? */
export function reforgeCheck(
  s: Pick<WorldStateData, "lifeSkillXp" | "inventory">,
  artisanProfession: string,
  key: string,
): ReforgeCheck {
  const def = getEquip(key);
  if (!def) return { ok: false, reason: "unknown" };
  const profession = gearProfession(def);
  const material = reforgeMaterial(def.ty);
  const level = masteryLevel(s.lifeSkillXp?.[profession] ?? 0);
  const base = { def, profession, material, level };
  if (artisanProfession !== profession) return { ok: false, reason: "wrong-shop", ...base };
  if (level < REFORGE_MIN_LEVEL) return { ok: false, reason: "low-skill", ...base };
  if ((s.inventory[material] ?? 0) < 1) return { ok: false, reason: "no-material", ...base };
  return { ok: true, ...base };
}

/** Whether an artisan of that craft stands here (the shop the re-roll needs). */
export function reforgeShopHere(locationId: string, profession: string): boolean {
  return getArtisansAt(locationId).some((a) => a.profession === profession);
}

/** Every piece the hero owns that a shop of this craft re-rolls: worn ones first, then the bag. */
export function reforgeablePieces(
  s: Pick<WorldStateData, "inventoryEquipment" | "playerBuild">,
  profession: string,
): { key: string; worn?: { ty: EquipSlotType; idx: 0 | 1 } }[] {
  const out: { key: string; worn?: { ty: EquipSlotType; idx: 0 | 1 } }[] = [];
  const eq = s.playerBuild?.equipment;
  if (eq) {
    for (const ty of ["W", "A", "H", "B"] as const) {
      const key = eq[ty];
      if (key && getEquip(key) && gearProfession(getEquip(key)!) === profession) out.push({ key, worn: { ty, idx: 0 } });
    }
    for (const ty of ["BR", "R", "C"] as const) {
      eq[ty].forEach((key, idx) => {
        if (key && getEquip(key) && gearProfession(getEquip(key)!) === profession) out.push({ key, worn: { ty, idx: idx as 0 | 1 } });
      });
    }
  }
  for (const [key, n] of Object.entries(s.inventoryEquipment ?? {})) {
    const def = getEquip(key);
    if (n > 0 && def && gearProfession(def) === profession) out.push({ key });
  }
  return out;
}

/** The same piece with a fresh set of options. */
export function rerollGear(key: string, rand: () => number = Math.random): string {
  const g = parseGear(key);
  return g ? gearKey(g.def.id, rollGearAffixes(g.def.ti, rand), g.enhance) : key;
}

/** Put one gained piece in the bag, its options rolled (returns its key). */
export function gainGear(s: Pick<WorldStateData, "inventoryEquipment">, equipId: string, rand: () => number = Math.random): string {
  const key = equipId.includes("~") ? (parseGear(equipId)?.key ?? equipId) : rollGearKey(equipId, rand);
  s.inventoryEquipment = { ...s.inventoryEquipment, [key]: (s.inventoryEquipment[key] ?? 0) + 1 };
  return key;
}

// ─── Selling gear ────────────────────────────────────────────────────

/** What a piece no artisan sells is worth, by tier (crafted and dropped pieces). */
export const GEAR_TIER_VALUE: readonly number[] = [80, 260, 700, 1800, 4500];

/**
 * What a piece is worth to a market: its artisan price (else its tier's value),
 * +10 % per option and +10 % per enhancement level.
 */
export function gearValue(key: string): number {
  const g = parseGear(key);
  if (!g) return 0;
  const base = equipmentListPrice(g.def.id) ?? GEAR_TIER_VALUE[Math.max(0, Math.min(GEAR_TIER_VALUE.length - 1, g.def.ti))]!;
  return Math.round(base * (1 + 0.1 * g.affixes.length + 0.1 * g.enhance));
}

/** What a market pays for a piece at its sell-back rate. */
export const gearSellPrice = (key: string, sellMultiplier: number) => Math.floor(gearValue(key) * sellMultiplier);

// ─── Materials from the strong ───────────────────────────────────────

/** Odds per won fight that a foe of this tier carries each material, and how many. */
export const SPIRIT_DROP: Readonly<Record<number, { chance: number; count: readonly [number, number] }>> = {
  3: { chance: 0.2, count: [1, 1] },
  4: { chance: 0.3, count: [1, 2] },
  5: { chance: 0.4, count: [1, 2] },
};
/** A legendary beast always leaves both, this many of each. */
export const SPIRIT_DROP_BOSS: readonly [number, number] = [2, 3];

/** The magic materials a beaten foe leaves (tier 3 and up; none from spars, the law or bouts — the caller decides). */
export function rollSpiritMaterials(opp: { ti?: number; boss?: boolean } | null | undefined): { itemId: string; count: number }[] {
  if (!opp) return [];
  const between = ([lo, hi]: readonly [number, number]) => lo + Math.floor(Math.random() * (hi - lo + 1));
  if (opp.boss) return [SPIRIT_STONE, SPIRIT_THREAD].map((itemId) => ({ itemId, count: between(SPIRIT_DROP_BOSS) }));
  const drop = SPIRIT_DROP[Math.min(5, opp.ti ?? 0)];
  if (!drop) return [];
  const out: { itemId: string; count: number }[] = [];
  for (const itemId of [SPIRIT_STONE, SPIRIT_THREAD]) {
    if (Math.random() < drop.chance) out.push({ itemId, count: between(drop.count) });
  }
  return out;
}

// ─── Enhancement (เสริมพลัง +1…+10) ───────────────────────────────────
// At a city craft shop of the piece's line, with that craft at level 3+, for
// ศิลาเสริมพลัง. Success odds fall with the level aimed at; a failure aiming at
// +1–5 costs only the stones, at +6–8 drops the piece one level, at +9–10
// breaks it (it is gone).

/** ศิลาเสริมพลัง: spent on every enhancement attempt. */
export const ENHANCE_STONE = "enhance_stone";
/** The hero's own level in the piece's craft needed to enhance it. */
export const ENHANCE_MIN_LEVEL = 3;
/** Success odds by the level aimed at (index 1…10). */
export const ENHANCE_CHANCE: readonly number[] = [0, 1, 0.95, 0.9, 0.85, 0.8, 0.65, 0.55, 0.45, 0.3, 0.2];

/** Stones one attempt at `target` costs: 1 for +1–5, 2 for +6–8, 3 for +9–10. */
export function enhanceStones(target: number): number {
  return target <= 5 ? 1 : target <= 8 ? 2 : 3;
}

/** What a failed attempt at `target` does: nothing, one level down, or the piece breaks. */
export function enhanceFailure(target: number): "none" | "down" | "break" {
  return target <= 5 ? "none" : target <= 8 ? "down" : "break";
}

/** Enhancement happens only in a city (`city_…`). */
export const isEnhanceTown = (locationId: string) => locationId.startsWith("city_");

export type EnhanceRefusal = "unknown" | "wrong-shop" | "not-city" | "low-skill" | "max" | "no-stone";

export interface EnhanceCheck {
  ok: boolean;
  reason?: EnhanceRefusal;
  /** The level the attempt aims at, its odds, stones and what a failure does. */
  target?: number;
  chance?: number;
  stones?: number;
  failure?: "none" | "down" | "break";
  level?: number;
}

/** Can this shop enhance the piece now (city, craft line, level, stones)? */
export function enhanceCheck(
  s: Pick<WorldStateData, "lifeSkillXp" | "inventory">,
  artisanProfession: string,
  locationId: string,
  key: string,
): EnhanceCheck {
  const g = parseGear(key);
  if (!g) return { ok: false, reason: "unknown" };
  const target = g.enhance + 1;
  const level = masteryLevel(s.lifeSkillXp?.[gearProfession(g.def)] ?? 0);
  const base = { target, chance: ENHANCE_CHANCE[Math.min(ENHANCE_MAX, target)] ?? 0, stones: enhanceStones(target), failure: enhanceFailure(target), level };
  if (g.enhance >= ENHANCE_MAX) return { ok: false, reason: "max", ...base };
  if (artisanProfession !== gearProfession(g.def)) return { ok: false, reason: "wrong-shop", ...base };
  if (!isEnhanceTown(locationId)) return { ok: false, reason: "not-city", ...base };
  if (level < ENHANCE_MIN_LEVEL) return { ok: false, reason: "low-skill", ...base };
  if ((s.inventory[ENHANCE_STONE] ?? 0) < base.stones) return { ok: false, reason: "no-stone", ...base };
  return { ok: true, ...base };
}

/**
 * One enhancement attempt's outcome: the new key (null when it broke).
 * `success` raises it one level; a failure follows `enhanceFailure`.
 */
export function rollEnhance(key: string, rand: () => number = Math.random): { outcome: "success" | "kept" | "down" | "broken"; key: string | null } {
  const g = parseGear(key);
  if (!g || g.enhance >= ENHANCE_MAX) return { outcome: "kept", key };
  const target = g.enhance + 1;
  if (rand() < (ENHANCE_CHANCE[target] ?? 0)) return { outcome: "success", key: gearKey(g.def.id, g.affixes, target) };
  const failure = enhanceFailure(target);
  if (failure === "break") return { outcome: "broken", key: null };
  if (failure === "down") return { outcome: "down", key: gearKey(g.def.id, g.affixes, Math.max(0, g.enhance - 1)) };
  return { outcome: "kept", key };
}

/** Enhancement stones a beaten foe leaves: tier 1 and up, more from the strong; a legendary beast 2–4. */
export const ENHANCE_STONE_DROP: Readonly<Record<number, { chance: number; count: readonly [number, number] }>> = {
  1: { chance: 0.1, count: [1, 1] },
  2: { chance: 0.15, count: [1, 1] },
  3: { chance: 0.2, count: [1, 2] },
  4: { chance: 0.25, count: [1, 2] },
  5: { chance: 0.3, count: [1, 3] },
};

export function rollEnhanceStones(opp: { ti?: number; boss?: boolean } | null | undefined): number {
  if (!opp) return 0;
  const between = ([lo, hi]: readonly [number, number]) => lo + Math.floor(Math.random() * (hi - lo + 1));
  if (opp.boss) return between([2, 4]);
  const drop = ENHANCE_STONE_DROP[Math.min(5, opp.ti ?? 0)];
  return drop && Math.random() < drop.chance ? between(drop.count) : 0;
}

// ─── Recipes for craft-only gear ─────────────────────────────────────

/** Odds per won fight that a foe carries a gear recipe (สูตร…); a legendary beast more often. */
export const RECIPE_DROP_CHANCE = 0.05;
export const RECIPE_DROP_CHANCE_BOSS = 0.25;

/** Which tiers of craft-only piece a foe of this tier carries the recipe of. */
export function recipeTiersFor(foeTier: number): readonly number[] {
  return foeTier <= 0 ? [0] : foeTier === 1 ? [0, 1] : foeTier === 2 ? [1, 2] : foeTier === 3 ? [2, 3] : [3];
}

/**
 * A recipe a beaten foe leaves (or none): a craft-only piece's สูตร of a tier
 * that fits the foe, one the hero neither knows nor carries when there is one.
 */
export function rollRecipeDrop(
  opp: { ti?: number; boss?: boolean } | null | undefined,
  s: Pick<WorldStateData, "learnedRecipeIds" | "inventory">,
): string | null {
  if (!opp || Math.random() >= (opp.boss ? RECIPE_DROP_CHANCE_BOSS : RECIPE_DROP_CHANCE)) return null;
  const tiers = recipeTiersFor(opp.ti ?? 0);
  const fits = GEAR_RECIPES.filter((r) => r.output.equipId !== undefined && tiers.includes(Math.min(3, getEquip(r.output.equipId)?.ti ?? 0)));
  const fresh = fits.filter((r) => !s.learnedRecipeIds?.includes(r.id) && !(s.inventory?.[recipeItemId(r.id)] > 0));
  const pool = fresh.length ? fresh : fits;
  if (!pool.length) return null;
  return recipeItemId(pool[Math.min(pool.length - 1, Math.floor(Math.random() * pool.length))]!.id);
}

/** What a recipe makes, in Thai: the item's name, or the piece's ("ดาบเพลิง (อุปกรณ์)"). */
export function recipeOutputName(r: Pick<RecipeDef, "output">): string {
  const out = r.output;
  if (out.equipId !== undefined) return `${getEquip(out.equipId)?.n ?? out.equipId} (อุปกรณ์)`;
  return getItem(out.itemId)?.name ?? out.itemId;
}

// ─── The ประสบการณ์ยุทธ option ─────────────────────────────────────────

/** ประสบการณ์ยุทธ raised by the worn pieces' option (fights and quests pay this). */
export function wExpWithGear(build: Pick<CharacterBuild, "equipment" | "meridians"> | null | undefined, amount: number): number {
  if (!build || amount <= 0) return amount;
  const pct = getBuildBonus(build).wexp;
  return pct > 0 ? Math.round(amount * (1 + pct / 100)) : amount;
}

// ─── Repair ──────────────────────────────────────────────────────────

function hashKey(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * A piece's key as it should be saved: canonical options, and a piece from
 * before options (fewer than its tier's least) given its share — seeded by the
 * key and its place, so the browser and the server repair it alike.
 */
export function repairGearKey(key: string, salt: number): string | null {
  const g = parseGear(key);
  if (!g) return null;
  if (g.affixes.length >= affixCountRange(g.def.ti)[0]) return g.key;
  return gearKey(g.def.id, rollGearAffixes(g.def.ti, seededRng(hashKey(g.key), salt)), g.enhance);
}

/** Repair the bag and the loadout's keys (unknown pieces dropped). */
export function repairGear(state: Pick<WorldStateData, "inventoryEquipment" | "playerBuild">): void {
  const bag: Record<string, number> = {};
  let n = 0;
  for (const [key, count] of Object.entries(state.inventoryEquipment ?? {})) {
    if (typeof count !== "number" || !Number.isFinite(count) || count < 1) continue;
    const g = parseGear(key);
    if (!g) {
      console.warn(`[world] dropping unknown equipment id "${key}"`);
      continue;
    }
    // Each copy of a piece from before options rolls its own.
    const whole = g.affixes.length >= affixCountRange(g.def.ti)[0];
    for (let i = 0; i < (whole ? 1 : Math.floor(count)); i++) {
      const fixed = whole ? g.key : repairGearKey(g.key, n++)!;
      bag[fixed] = (bag[fixed] ?? 0) + (whole ? Math.floor(count) : 1);
    }
  }
  state.inventoryEquipment = bag;
  const eq = state.playerBuild?.equipment;
  if (!eq || !state.playerBuild) return;
  const fix = (key: string | null): string | null => (key ? repairGearKey(key, n++) : null);
  const next: EquipLoadout = {
    W: fix(eq.W), A: fix(eq.A), H: fix(eq.H), B: fix(eq.B),
    BR: [fix(eq.BR?.[0] ?? null), fix(eq.BR?.[1] ?? null)],
    R: [fix(eq.R?.[0] ?? null), fix(eq.R?.[1] ?? null)],
    C: [fix(eq.C?.[0] ?? null), fix(eq.C?.[1] ?? null)],
  };
  // A piece in the wrong slot type (hand-edited saves) is taken off.
  for (const ty of ["W", "A", "H", "B"] as const) if (next[ty] && getEquip(next[ty])?.ty !== ty) next[ty] = null;
  for (const ty of ["BR", "R", "C"] as const) next[ty] = next[ty].map((k) => (k && getEquip(k)?.ty === ty ? k : null)) as [string | null, string | null];
  state.playerBuild = { ...state.playerBuild, equipment: next };
}
