// Where the six cloth outfits (ชุด…, data/outfits.ts `unlock: { t: "item" }`)
// come from: no shop sells them. Each is a bundled outfit item `outfit_<id>`
// (reading it adds the outfit to the wardrobe) that a quest hands over, a foe
// drops, or a tailor crafts from a recipe (สูตรตัด…, recipe_outfit_<id>) that
// foes drop. Every outfit has at least one repeatable source (test:appearance).
import type { RecipeDef } from "../types";
import { getOutfit } from "./outfits";

export interface OutfitSource {
  /** What the bundled outfit fetches when sold (no shop sells it). */
  value: number;
  /** Quests whose reward includes the outfit item. */
  questRewards?: readonly string[];
  /** Foes that may drop the outfit item on a win (chance 0–1). */
  loot?: readonly { opponentId: string; chance: number }[];
  /** A tailoring recipe for it: the mastery it needs, what it takes, and the foes that drop its recipe item. */
  craft?: {
    mastery: 1 | 2 | 3 | 4 | 5;
    inputs: RecipeDef["inputs"];
    recipeLoot: readonly { opponentId: string; chance: number }[];
  };
}

export const OUTFIT_SOURCES: Readonly<Record<string, OutfitSource>> = {
  tailor_indigo: {
    value: 300,
    questRewards: ["qw_fuwei_escort_run"],
    loot: [{ opponentId: "river_pirate", chance: 0.03 }],
    craft: { mastery: 2, inputs: [{ itemId: "thread", count: 4 }, { itemId: "silk", count: 1 }], recipeLoot: [{ opponentId: "road_bandit", chance: 0.03 }] },
  },
  tailor_mourning: {
    value: 300,
    questRewards: ["qw_home_chengkun_mend_robe"],
    craft: { mastery: 2, inputs: [{ itemId: "thread", count: 3 }, { itemId: "silk", count: 1 }], recipeLoot: [{ opponentId: "bandit", chance: 0.03 }] },
  },
  tailor_ink: {
    value: 500,
    questRewards: ["qc_city_lingxiao_poem_ink"],
    loot: [{ opponentId: "night_blade", chance: 0.04 }, { opponentId: "elite_villain_ying", chance: 0.15 }],
  },
  tailor_silk_red: {
    value: 600,
    questRewards: ["qc_suzhou_silk_shipment"],
    craft: { mastery: 3, inputs: [{ itemId: "silk", count: 3 }, { itemId: "thread", count: 2 }], recipeLoot: [{ opponentId: "wandering_swordsman", chance: 0.03 }] },
  },
  tailor_jade: {
    value: 800,
    loot: [{ opponentId: "elite_phoenix_empress", chance: 0.1 }],
    craft: { mastery: 4, inputs: [{ itemId: "silk", count: 4 }, { itemId: "jade", count: 1 }], recipeLoot: [{ opponentId: "demon_cult_zealot", chance: 0.03 }] },
  },
  tailor_noble_gold: {
    value: 3000,
    questRewards: ["qe_capital_assassinate_official"],
    loot: [{ opponentId: "elite_cult_elder", chance: 0.1 }],
    craft: { mastery: 4, inputs: [{ itemId: "silk", count: 5 }, { itemId: "gold_ore", count: 2 }, { itemId: "jade", count: 1 }], recipeLoot: [{ opponentId: "bandit_chief", chance: 0.03 }] },
  },
};

/** The bundled outfit item that adds an outfit to the wardrobe. */
export const outfitItemId = (outfitId: string) => `outfit_${outfitId}`;
/** The tailoring recipe that makes it. */
export const outfitRecipeId = (outfitId: string) => `outfit_${outfitId}`;
/** The recipe's item (สูตรตัด…), dropped by foes. */
export const outfitRecipeItemId = (outfitId: string) => `recipe_${outfitRecipeId(outfitId)}`;

export const OUTFIT_RECIPES: readonly RecipeDef[] = Object.entries(OUTFIT_SOURCES).flatMap(([outfitId, src]): RecipeDef[] => {
  if (!src.craft) return [];
  const outfit = getOutfit(outfitId);
  if (!outfit) throw new Error(`outfit source: unknown outfit ${outfitId}`);
  return [{
    id: outfitRecipeId(outfitId),
    name: `ตัด${outfit.name}`,
    skill: "tailoring",
    inputs: src.craft.inputs,
    output: { itemId: outfitItemId(outfitId), count: 1 },
    requiredMastery: src.craft.mastery,
    description: `${outfit.name} ไม่มีร้านใดขาย — ตัดเองได้ด้วยสูตรที่ได้จากศัตรู`,
  }];
});

/** Outfit and recipe items a foe may drop, with their chance (0–1). */
export function outfitLootFor(opponentId: string): { itemId: string; chance: number }[] {
  const out: { itemId: string; chance: number }[] = [];
  for (const [outfitId, src] of Object.entries(OUTFIT_SOURCES)) {
    for (const l of src.loot ?? []) if (l.opponentId === opponentId) out.push({ itemId: outfitItemId(outfitId), chance: l.chance });
    for (const l of src.craft?.recipeLoot ?? []) if (l.opponentId === opponentId) out.push({ itemId: outfitRecipeItemId(outfitId), chance: l.chance });
  }
  return out;
}

/** Roll a won fight's outfit drops (each on its own). */
export function rollOutfitLoot(opponentId: string, rand: () => number = Math.random): string[] {
  return outfitLootFor(opponentId).filter((l) => rand() < l.chance).map((l) => l.itemId);
}

/** Outfit items a quest hands over as an extra reward. */
export function outfitItemsForQuest(questId: string): string[] {
  return Object.entries(OUTFIT_SOURCES).filter(([, src]) => src.questRewards?.includes(questId)).map(([id]) => outfitItemId(id));
}
