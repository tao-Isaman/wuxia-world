import { getEquip } from "../../game/data/equipment";
import type { LifeSkill, RecipeDef } from "../types";

// Craft-only gear (ของคราฟเท่านั้น): pieces nobody sells and no foe drops.
// The hero forges them at the craft shop of their line from a recipe; the
// recipe itself (สูตร…, an item `recipe_<recipeId>`) is what foes drop
// (rollRecipeDrop, lib/world/gear.ts). A crafted piece rolls its options
// like any other (gainGear).

/** Mastery of the craft each tier of piece needs (and its recipe's price). */
const MASTERY_BY_TIER = [1, 2, 3, 4] as const;
export const GEAR_RECIPE_PRICE = [150, 400, 900, 2000] as const;

/** The pieces and what each takes, by tier: 0 ธรรมดา · 1 ดี · 2 ชั้นเลิศ · 3 หายาก (a beast's trophy in each). */
// `skill` is the craft line (the same one equipmentProfession in artisans.ts
// gives the piece; test:gear checks they agree).
const SPECS: readonly { equipId: string; skill: LifeSkill; inputs: RecipeDef["inputs"] }[] = [
  // ── forge: weapons and iron
  { equipId: "W1", skill: "forge", inputs: [{ itemId: "iron_ingot", count: 2 }, { itemId: "wood_soft", count: 1 }] },
  { equipId: "W2", skill: "forge", inputs: [{ itemId: "iron_ingot", count: 3 }, { itemId: "gold_ore", count: 2 }] },
  { equipId: "W3", skill: "forge", inputs: [{ itemId: "iron_ingot", count: 5 }, { itemId: "wood_hard", count: 2 }, { itemId: "silver_ore", count: 1 }] },
  { equipId: "A3", skill: "forge", inputs: [{ itemId: "iron_ingot", count: 6 }, { itemId: "leather", count: 2 }] },
  { equipId: "H3", skill: "forge", inputs: [{ itemId: "iron_ingot", count: 4 }, { itemId: "leather", count: 1 }] },
  { equipId: "B3", skill: "forge", inputs: [{ itemId: "iron_ingot", count: 4 }, { itemId: "leather", count: 1 }] },
  { equipId: "BR3", skill: "forge", inputs: [{ itemId: "iron_ingot", count: 3 }, { itemId: "leather", count: 1 }] },
  // ── tailoring: cloth and leather
  { equipId: "A1", skill: "tailoring", inputs: [{ itemId: "thread", count: 3 }] },
  { equipId: "H1", skill: "tailoring", inputs: [{ itemId: "thread", count: 2 }] },
  { equipId: "B1", skill: "tailoring", inputs: [{ itemId: "thread", count: 2 }] },
  { equipId: "BR1", skill: "tailoring", inputs: [{ itemId: "thread", count: 1 }] },
  { equipId: "A2", skill: "tailoring", inputs: [{ itemId: "leather", count: 4 }, { itemId: "thread", count: 2 }] },
  { equipId: "H2", skill: "tailoring", inputs: [{ itemId: "leather", count: 2 }, { itemId: "thread", count: 1 }] },
  { equipId: "B2", skill: "tailoring", inputs: [{ itemId: "leather", count: 2 }, { itemId: "thread", count: 1 }] },
  { equipId: "BR2", skill: "tailoring", inputs: [{ itemId: "leather", count: 2 }, { itemId: "fur_pelt", count: 1 }] },
  // ── jewelry: rings
  { equipId: "R1", skill: "jewelry", inputs: [{ itemId: "gold_ore", count: 1 }] },
  { equipId: "R2", skill: "jewelry", inputs: [{ itemId: "silver_ore", count: 2 }, { itemId: "gold_ore", count: 1 }] },
  { equipId: "R3", skill: "jewelry", inputs: [{ itemId: "gold_ore", count: 2 }, { itemId: "jade", count: 1 }] },
  // ── accessory: charms
  { equipId: "C1", skill: "accessory", inputs: [{ itemId: "copper_ore", count: 2 }, { itemId: "thread", count: 1 }] },
  { equipId: "C2", skill: "accessory", inputs: [{ itemId: "tiger_claw", count: 1 }, { itemId: "silver_ore", count: 1 }, { itemId: "thread", count: 2 }] },
  { equipId: "C3", skill: "accessory", inputs: [{ itemId: "jade", count: 1 }, { itemId: "silk", count: 2 }, { itemId: "ancient_coin", count: 1 }] },
  // ── tier 3 (หายาก): no longer beast drops — forged from a legendary beast's trophy
  { equipId: "W4", skill: "forge", inputs: [{ itemId: "iron_ingot", count: 6 }, { itemId: "snake_skin", count: 3 }, { itemId: "poison_vial", count: 2 }, { itemId: "trophy_golden_serpent", count: 1 }] },
  { equipId: "A4", skill: "forge", inputs: [{ itemId: "iron_ingot", count: 8 }, { itemId: "leather", count: 4 }, { itemId: "trophy_golden_serpent", count: 1 }] },
  { equipId: "H4", skill: "forge", inputs: [{ itemId: "iron_ingot", count: 5 }, { itemId: "jade", count: 1 }, { itemId: "trophy_sun_turtle", count: 1 }] },
  { equipId: "B4", skill: "forge", inputs: [{ itemId: "leather", count: 3 }, { itemId: "iron_ingot", count: 2 }, { itemId: "trophy_sword_eagle", count: 1 }] },
  { equipId: "BR4", skill: "forge", inputs: [{ itemId: "iron_ingot", count: 5 }, { itemId: "gold_ore", count: 2 }, { itemId: "trophy_blood_tiger", count: 1 }] },
  { equipId: "R4", skill: "jewelry", inputs: [{ itemId: "gold_ore", count: 3 }, { itemId: "jade", count: 2 }, { itemId: "trophy_blade_crab", count: 1 }] },
  { equipId: "C4", skill: "accessory", inputs: [{ itemId: "jade", count: 2 }, { itemId: "ginseng", count: 3 }, { itemId: "trophy_flame_bull", count: 1 }] },
];

/** The recipe id that forges a piece. */
export const gearRecipeId = (equipId: string) => `gear_${equipId.toLowerCase()}`;
/** The item that teaches a recipe (dropped by foes). */
export const recipeItemId = (recipeId: string) => `recipe_${recipeId}`;

export const GEAR_RECIPES: readonly RecipeDef[] = SPECS.map(({ equipId, skill, inputs }): RecipeDef => {
  const def = getEquip(equipId);
  if (!def) throw new Error(`gear recipe: unknown equipment ${equipId}`);
  const ti = Math.min(3, def.ti) as 0 | 1 | 2 | 3;
  return {
    id: gearRecipeId(equipId),
    name: `สร้าง${def.n}`,
    skill,
    inputs,
    output: { equipId, count: 1 },
    requiredMastery: MASTERY_BY_TIER[ti],
    description: `${def.n} ทำได้ด้วยมือช่างเท่านั้น ไม่มีร้านใดขาย — สูตรนี้ได้จากศัตรู`,
  };
});

/** Every piece that can only be crafted. */
export const CRAFT_ONLY_GEAR: ReadonlySet<string> = new Set(SPECS.map((s) => s.equipId));
