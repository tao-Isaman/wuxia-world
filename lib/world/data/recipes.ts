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

  // ─── Forge ───────────────────────────────────────────────────────────
  {
    id: "forge_iron_blade",
    name: "ตีใบมีดเหล็ก",
    skill: "forge",
    requiredMastery: 1,
    inputs: [{ itemId: "iron_ingot", count: 2 }],
    output: { itemId: "iron_blade", count: 1 },
    description: "ตีเหล็กแท่งให้เป็นใบมีดที่พร้อมขึ้นรูป",
  },
  {
    id: "forge_iron_sword",
    name: "ตีดาบเหล็ก",
    skill: "forge",
    requiredMastery: 2,
    inputs: [
      { itemId: "iron_blade", count: 1 },
      { itemId: "wood_hard",  count: 1 },
    ],
    output: { itemId: "iron_sword", count: 1 },
    description: "ประกอบใบมีดเข้ากับด้ามไม้เป็นดาบ",
  },
  {
    id: "forge_steel_sword",
    name: "ตีดาบเหล็กกล้า",
    skill: "forge",
    requiredMastery: 3,
    inputs: [
      { itemId: "iron_ingot", count: 4 },
      { itemId: "wood_sacred", count: 1 },
    ],
    output: { itemId: "steel_sword", count: 1 },
    description: "ตีเหล็กกล้าซ้ำหลายครั้งจนเป็นดาบคุณภาพสูง",
  },

  // ─── Tailoring ──────────────────────────────────────────────────────
  {
    id: "tailor_cloth",
    name: "ตัดเสื้อผ้าฝ้าย",
    skill: "tailoring",
    requiredMastery: 1,
    inputs: [{ itemId: "thread", count: 2 }],
    output: { itemId: "cloth_robe", count: 1 },
    description: "ตัดเสื้อผ้าใส่สบายจากด้ายฝ้าย",
  },
  {
    id: "tailor_leather",
    name: "เย็บเสื้อหนัง",
    skill: "tailoring",
    requiredMastery: 2,
    inputs: [
      { itemId: "leather", count: 2 },
      { itemId: "thread",  count: 1 },
    ],
    output: { itemId: "leather_robe", count: 1 },
    description: "เย็บหนังฟอกเป็นเสื้อหนังป้องกันการโจมตี",
  },
  {
    id: "tailor_silk",
    name: "เย็บเสื้อผ้าไหม",
    skill: "tailoring",
    requiredMastery: 4,
    inputs: [
      { itemId: "silk",   count: 3 },
      { itemId: "thread", count: 2 },
    ],
    output: { itemId: "silk_robe", count: 1 },
    description: "เย็บเสื้อจากผ้าไหมเนื้อดี",
  },

  // ─── Jewelry ────────────────────────────────────────────────────────
  {
    id: "jewel_silver_ring",
    name: "หล่อแหวนเงิน",
    skill: "jewelry",
    requiredMastery: 1,
    inputs: [{ itemId: "silver_ore", count: 3 }],
    output: { itemId: "silver_ring", count: 1 },
    description: "หล่อแร่เงินเป็นแหวนรูปทรงเรียบง่าย",
  },
  {
    id: "jewel_gold_ring",
    name: "หล่อแหวนทอง",
    skill: "jewelry",
    requiredMastery: 3,
    inputs: [{ itemId: "gold_ore", count: 3 }],
    output: { itemId: "gold_ring", count: 1 },
    description: "หล่อแร่ทองเป็นแหวนสวยงาม",
  },
  {
    id: "jewel_jade_amulet",
    name: "ทำเครื่องรางหยก",
    skill: "jewelry",
    requiredMastery: 4,
    inputs: [
      { itemId: "jade",   count: 1 },
      { itemId: "thread", count: 1 },
    ],
    output: { itemId: "jade_amulet", count: 1 },
    description: "เจียระไนหยกและร้อยเข้ากับเชือก",
  },

  // ─── Alchemy ────────────────────────────────────────────────────────
  {
    id: "alchemy_potion_mid",
    name: "ปรุงยาเลือดกลาง",
    skill: "alchemy",
    requiredMastery: 2,
    inputs: [
      { itemId: "ginseng", count: 2 },
      { itemId: "herb",    count: 1 },
    ],
    output: { itemId: "potion_mid", count: 1 },
    description: "ผสมโสมและสมุนไพรหายากเป็นยาเลือดกลาง",
  },
  {
    id: "alchemy_potion_big",
    name: "ปรุงยาเลือดใหญ่",
    skill: "alchemy",
    requiredMastery: 4,
    inputs: [
      { itemId: "snow_lotus", count: 1 },
      { itemId: "ginseng",    count: 2 },
      { itemId: "herb",       count: 2 },
    ],
    output: { itemId: "potion_big", count: 1 },
    description: "ใช้บัวหิมะปรุงยาฟื้นพลังชีวิตสูงสุด",
  },
  {
    id: "alchemy_poison",
    name: "ปรุงพิษเข้มข้น",
    skill: "alchemy",
    requiredMastery: 3,
    inputs: [
      { itemId: "viper_venom",    count: 2 },
      { itemId: "scorpion_venom", count: 1 },
    ],
    output: { itemId: "poison_vial", count: 1 },
    description: "กลั่นพิษหลายชนิดให้เข้มข้นและพร้อมใช้",
  },

  // ─── Chef ───────────────────────────────────────────────────────────
  {
    id: "chef_rice",
    name: "ทำข้าวหมูแดง",
    skill: "chef",
    requiredMastery: 1,
    inputs: [
      { itemId: "cooked_meat", count: 1 },
      { itemId: "wood_soft",   count: 1 },
    ],
    output: { itemId: "rice_dish", count: 1 },
    description: "ปรุงเนื้อสุกกับข้าวเป็นจานเดียว",
  },
  {
    id: "chef_stew",
    name: "ต้มยำสมุนไพร",
    skill: "chef",
    requiredMastery: 2,
    inputs: [
      { itemId: "fish_eel",  count: 1 },
      { itemId: "herb",      count: 2 },
    ],
    output: { itemId: "spicy_stew", count: 1 },
    description: "ต้มยำเข้มข้นเพิ่มแรงเดินทางทันที",
  },
  {
    id: "chef_moon_cake",
    name: "ทำขนมไหว้พระจันทร์",
    skill: "chef",
    requiredMastery: 3,
    inputs: [
      { itemId: "lotus_seed", count: 2 },
      { itemId: "wood_soft",  count: 1 },
    ],
    output: { itemId: "moon_cake", count: 1 },
    description: "ขนมหวานหอมประจำเทศกาล",
  },

  // ─── Drawing (uses drop-check — fail consumes ink/paper) ────────────
  {
    id: "draw_basic",
    name: "วาดภาพเบื้องต้น",
    skill: "drawing",
    requiredMastery: 1,
    usesDropCheck: true,
    inputs: [
      { itemId: "paper", count: 1 },
      { itemId: "ink",   count: 1 },
    ],
    output: { itemId: "image_basic", count: 1 },
    description: "ฝึกวาดภาพ — ฝีมือต่ำอาจล้มเหลวและเสียหมึก",
  },
  {
    id: "draw_master",
    name: "วาดภาพชั้นสูง",
    skill: "drawing",
    requiredMastery: 3,
    usesDropCheck: true,
    inputs: [
      { itemId: "paper", count: 2 },
      { itemId: "ink",   count: 2 },
    ],
    output: { itemId: "image_master", count: 1 },
    description: "ผลงานชั้นสูง ต้องการฝีมือพอประมาณ",
  },

  // ─── Writing (calligraphy — same drop-check pattern) ────────────────
  {
    id: "write_basic",
    name: "เขียนอักษรพื้นฐาน",
    skill: "writing",
    requiredMastery: 1,
    usesDropCheck: true,
    inputs: [
      { itemId: "paper", count: 1 },
      { itemId: "ink",   count: 1 },
    ],
    output: { itemId: "alpha_basic", count: 1 },
    description: "ฝึกอักษรเบื้องต้น — พลาดได้ง่ายในระยะแรก",
  },
  {
    id: "write_master",
    name: "เขียนอักษรชั้นเทพ",
    skill: "writing",
    requiredMastery: 3,
    usesDropCheck: true,
    inputs: [
      { itemId: "paper", count: 2 },
      { itemId: "ink",   count: 2 },
    ],
    output: { itemId: "alpha_master", count: 1 },
    description: "อักษรงดงามที่ต้องอาศัยมือฝึกแล้ว",
  },
];

export const RECIPES_BY_ID = new Map<string, RecipeDef>(
  RECIPES.map((r) => [r.id, r]),
);

export function getRecipe(id: string | null | undefined): RecipeDef | null {
  if (!id) return null;
  return RECIPES_BY_ID.get(id) ?? null;
}
