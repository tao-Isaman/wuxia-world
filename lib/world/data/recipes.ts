import type { RecipeDef } from "../types";

// Crafting recipes. Inputs are consumed in order; output is added to the
// player's inventory. The store's `craftRecipe` action enforces input
// availability before mutating anything.
//
// Skill is informational for now (no gating); future iterations can require
// e.g. masteryLevel(state.lifeSkillXp.mining) >= 2 before allowing.
export const RECIPES: readonly RecipeDef[] = [
  {
    id: "smelt_iron",
    name: "ถลุงเหล็กแท่ง",
    skill: "mining",
    inputs: [
      { itemId: "iron_ore",   count: 2 },
      { itemId: "wood_soft",  count: 1 },
    ],
    output: { itemId: "iron_ingot", count: 1 },
    description: "หลอมแร่เหล็กกับฟืนให้เป็นเหล็กแท่งพร้อมขึ้นรูป",
  },
  {
    id: "tan_leather",
    name: "ฟอกหนัง",
    skill: "hunting",
    inputs: [
      { itemId: "fur_pelt", count: 2 },
      { itemId: "herb",     count: 1 },
    ],
    output: { itemId: "leather", count: 1 },
    description: "ฟอกหนังสัตว์ด้วยสมุนไพร เปลี่ยนเป็นวัสดุเย็บเสื้อ",
  },
  {
    id: "cook_meat",
    name: "ย่างเนื้อ",
    skill: "hunting",
    inputs: [
      { itemId: "raw_meat",  count: 1 },
      { itemId: "wood_soft", count: 1 },
    ],
    output: { itemId: "cooked_meat", count: 1 },
    description: "ย่างเนื้อสดบนกองไฟ ได้อาหารสำหรับการเดินทาง",
  },
  {
    id: "brew_potion",
    name: "ปรุงยาเลือดเล็ก",
    skill: "herbalism",
    inputs: [
      { itemId: "ginseng",    count: 1 },
      { itemId: "lotus_seed", count: 1 },
    ],
    output: { itemId: "potion", count: 1 },
    description: "ผสมโสมกับเม็ดบัวเพื่อทำยาฟื้นพลังชีวิตเล็ก",
  },
  {
    id: "refine_venom",
    name: "กลั่นพิษเสริมแรง",
    skill: "venom",
    inputs: [
      { itemId: "viper_venom",    count: 1 },
      { itemId: "scorpion_venom", count: 1 },
    ],
    output: { itemId: "centipede_venom", count: 1 },
    description: "กลั่นพิษสองชนิดให้กลายเป็นพิษเข้มข้นชนิดใหม่",
  },
  {
    id: "wood_handle",
    name: "เหลาด้ามไม้แข็ง",
    skill: "woodcutting",
    inputs: [{ itemId: "wood_hard", count: 2 }],
    output: { itemId: "wood_soft", count: 3 },
    description: "เหลาไม้แข็งให้เป็นแผ่นเล็ก ใช้ทำด้ามอาวุธ",
  },
  {
    id: "fish_meal",
    name: "ปรุงเนื้อปลามัน",
    skill: "fishing",
    inputs: [
      { itemId: "fish_eel",  count: 1 },
      { itemId: "wood_soft", count: 1 },
    ],
    output: { itemId: "cooked_meat", count: 1 },
    description: "ย่างปลาไหลเป็นอาหารหวานเค็ม เพิ่มแรงเดินทาง",
  },
  {
    id: "jade_polish",
    name: "ขัดหยกล้ำค่า",
    skill: "mining",
    inputs: [
      { itemId: "silver_ore", count: 2 },
      { itemId: "rock",       count: 3 },
    ],
    output: { itemId: "jade", count: 1 },
    description: "ขัดและเจียระไนหินมีค่าเป็นหยกที่งดงาม",
  },
];

export const RECIPES_BY_ID = new Map<string, RecipeDef>(
  RECIPES.map((r) => [r.id, r]),
);

export function getRecipe(id: string | null | undefined): RecipeDef | null {
  if (!id) return null;
  return RECIPES_BY_ID.get(id) ?? null;
}
