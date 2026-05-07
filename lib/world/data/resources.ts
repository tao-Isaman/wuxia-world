import type { ResourceDef } from "../types";

// Gather-resource catalogue. Each entry is referenced from a leaf (or
// route) via `resources: [{ resourceId: "..." }]`. Levels run 1–5; the
// rare level-5 entries below are restricted to specific hand-curated
// spots in lib/world/data/world-map.ts.
//
// Shared yield convention:
//   • The dispatcher rolls `1 + masteryLevel(...) - resource.level` picks
//     (clamped 1..3), so higher mastery = more drops on lower-tier nodes.
//   • Hunting resources fire a battle first via `opponentIds`; the win
//     handler then rolls `yields` for the spoils. Lose → zero spoils.

export const RESOURCES: readonly ResourceDef[] = [
  // ─── Mining ─────────────────────────────────────────────────────────
  {
    id: "mine_rock",
    name: "ขุดหินทั่วไป",
    skill: "mining",
    level: 1,
    staminaCost: 8,
    yields: [
      { itemId: "rock",       weight: 6, count: [1, 3] },
      { itemId: "copper_ore", weight: 2 },
    ],
  },
  {
    id: "mine_iron",
    name: "ขุดแร่เหล็ก",
    skill: "mining",
    level: 2,
    staminaCost: 12,
    yields: [
      { itemId: "iron_ore",   weight: 5 },
      { itemId: "copper_ore", weight: 3 },
      { itemId: "rock",       weight: 4, count: [1, 2] },
    ],
  },
  {
    id: "mine_silver",
    name: "ขุดแร่เงิน",
    skill: "mining",
    level: 3,
    staminaCost: 15,
    yields: [
      { itemId: "silver_ore", weight: 5 },
      { itemId: "iron_ore",   weight: 3 },
    ],
  },
  {
    id: "mine_gold",
    name: "ขุดแร่ทองคำ",
    skill: "mining",
    level: 4,
    staminaCost: 18,
    yields: [
      { itemId: "gold_ore",   weight: 4 },
      { itemId: "silver_ore", weight: 3 },
    ],
  },
  {
    id: "mine_mithril",
    name: "ขุดแร่เทพ",
    skill: "mining",
    level: 5,
    staminaCost: 25,
    yields: [
      { itemId: "mithril_ore", weight: 3 },
      { itemId: "gold_ore",    weight: 2 },
    ],
  },

  // ─── Woodcutting ────────────────────────────────────────────────────
  {
    id: "wood_soft",
    name: "ตัดไม้เนื้ออ่อน",
    skill: "woodcutting",
    level: 1,
    staminaCost: 8,
    yields: [{ itemId: "wood_soft", weight: 1, count: [1, 3] }],
  },
  {
    id: "wood_hard",
    name: "ตัดไม้เนื้อแข็ง",
    skill: "woodcutting",
    level: 3,
    staminaCost: 14,
    yields: [
      { itemId: "wood_hard", weight: 4 },
      { itemId: "wood_soft", weight: 4, count: [1, 2] },
    ],
  },
  {
    id: "wood_sacred",
    name: "ตัดไม้ศักดิ์สิทธิ์",
    skill: "woodcutting",
    level: 5,
    staminaCost: 25,
    yields: [
      { itemId: "wood_sacred", weight: 3 },
      { itemId: "wood_hard",   weight: 3 },
    ],
  },

  // ─── Hunting (combat-gated) ─────────────────────────────────────────
  // Each tier of hunt picks from a tier-scoped beast pool defined in
  // lib/world/data/opponents.ts (the hunt_* prefix). Hunt beasts use the
  // bst_* skill family and are intentionally weaker than tier-equivalent
  // random-event beasts so hunting stays a sustainable grind.
  {
    id: "hunt_forest",
    name: "ล่าสัตว์ในป่า",
    skill: "hunting",
    level: 1,
    staminaCost: 15,
    opponentIds: ["hunt_rabbit", "hunt_pheasant", "hunt_squirrel", "hunt_wild_dog", "hunt_boar"],
    yields: [
      { itemId: "raw_meat", weight: 5, count: [1, 2] },
      { itemId: "fur_pelt", weight: 4 },
    ],
  },
  {
    id: "hunt_mountain",
    name: "ล่าเสือบนภูเขา",
    skill: "hunting",
    level: 3,
    staminaCost: 18,
    opponentIds: ["hunt_jungle_cat", "hunt_alpha_wolf", "hunt_giant_bear", "hunt_mountain_lynx"],
    yields: [
      { itemId: "raw_meat",  weight: 4, count: [1, 2] },
      { itemId: "fur_pelt",  weight: 4 },
      { itemId: "tiger_claw", weight: 2 },
      { itemId: "bear_claw",  weight: 2 },
    ],
  },
  {
    id: "hunt_legendary",
    name: "ล่าเสือพยัคฆ์ตำนาน",
    skill: "hunting",
    level: 5,
    staminaCost: 25,
    opponentIds: ["hunt_alpha_wolf", "hunt_giant_bear", "hunt_mountain_lynx", "hunt_jungle_serpent"],
    yields: [
      { itemId: "tiger_claw", weight: 3 },
      { itemId: "bear_claw",  weight: 3 },
      { itemId: "fur_pelt",   weight: 4, count: [1, 2] },
    ],
  },

  // ─── Fishing ────────────────────────────────────────────────────────
  {
    id: "fish_river",
    name: "ตกปลาในลำธาร",
    skill: "fishing",
    level: 1,
    staminaCost: 8,
    yields: [
      { itemId: "fish_carp", weight: 5, count: [1, 2] },
      { itemId: "fish_eel",  weight: 2 },
    ],
  },
  {
    id: "fish_sea",
    name: "ตกปลาในทะเล",
    skill: "fishing",
    level: 3,
    staminaCost: 12,
    yields: [
      { itemId: "fish_eel",  weight: 5 },
      { itemId: "fish_carp", weight: 3 },
    ],
  },
  {
    id: "fish_dragon",
    name: "ตามรอยปลามังกร",
    skill: "fishing",
    level: 5,
    staminaCost: 25,
    yields: [
      { itemId: "fish_dragon", weight: 3 },
      { itemId: "fish_eel",    weight: 4 },
    ],
  },

  // ─── Herbalism ──────────────────────────────────────────────────────
  {
    id: "herb_common",
    name: "เก็บสมุนไพรทั่วไป",
    skill: "herbalism",
    level: 1,
    staminaCost: 8,
    yields: [
      { itemId: "ginseng",    weight: 4 },
      { itemId: "lotus_seed", weight: 4 },
      { itemId: "herb",       weight: 3 },
    ],
  },
  {
    id: "herb_rare",
    name: "ค้นหาสมุนไพรหายาก",
    skill: "herbalism",
    level: 3,
    staminaCost: 14,
    yields: [
      { itemId: "ginseng",    weight: 3 },
      { itemId: "lotus_seed", weight: 4 },
      { itemId: "herb",       weight: 3, count: [1, 2] },
    ],
  },
  {
    id: "herb_snow_lotus",
    name: "เก็บบัวหิมะ",
    skill: "herbalism",
    level: 5,
    staminaCost: 25,
    yields: [
      { itemId: "snow_lotus", weight: 3 },
      { itemId: "lotus_seed", weight: 4 },
    ],
  },

  // ─── Venom (poisonous fauna) ────────────────────────────────────────
  {
    id: "venom_viper",
    name: "เก็บพิษงู",
    skill: "venom",
    level: 1,
    staminaCost: 10,
    yields: [{ itemId: "viper_venom", weight: 1 }],
  },
  {
    id: "venom_scorpion",
    name: "เก็บพิษแมงป่อง",
    skill: "venom",
    level: 3,
    staminaCost: 14,
    yields: [
      { itemId: "scorpion_venom", weight: 4 },
      { itemId: "viper_venom",    weight: 3 },
    ],
  },
  {
    id: "venom_centipede",
    name: "เก็บพิษตะขาบยักษ์",
    skill: "venom",
    level: 5,
    staminaCost: 25,
    yields: [
      { itemId: "centipede_venom", weight: 3 },
      { itemId: "scorpion_venom",  weight: 4 },
    ],
  },

  // ─── Chess (social mastery activity) ────────────────────────────────
  {
    id: "chess_basic",
    name: "เล่นหมากรุกกับชาวบ้าน",
    skill: "chess",
    level: 1,
    staminaCost: 5,
    yields: [
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "potion",       weight: 3 },
    ],
    goldYield: [10, 25],
    hint: "เล่นกับเซียนหมากรุกในร้านน้ำชา",
  },
  {
    id: "chess_master",
    name: "เล่นหมากรุกกับเซียนตัวจริง",
    skill: "chess",
    level: 3,
    staminaCost: 10,
    yields: [
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "jade",         weight: 1 },
    ],
    goldYield: [40, 80],
    hint: "เซียนหมากรุกที่ฝึกฝีมือมาทั้งชีวิต",
  },

  // ─── Begging (gold + 2× stamina on fail; gated by flag) ─────────────
  {
    id: "beg_street",
    name: "ขอเงินคนผ่านไปมา",
    skill: "begging",
    level: 1,
    staminaCost: 6,
    failureExtraStamina: 6,
    yields: [],
    goldYield: [10, 25],
    hint: "เข้าหาผู้ใจบุญด้วยมารยาทพรรคยาจก",
  },
  {
    id: "beg_market",
    name: "ขอเงินในตลาด",
    skill: "begging",
    level: 2,
    staminaCost: 8,
    failureExtraStamina: 8,
    yields: [{ itemId: "rice_dish", weight: 2 }],
    goldYield: [20, 50],
    hint: "ตลาดคึกคักแต่คนหวงเงินมากกว่า",
  },
];

export const RESOURCES_BY_ID = new Map<string, ResourceDef>(
  RESOURCES.map((r) => [r.id, r]),
);

export function getResource(id: string | null | undefined): ResourceDef | null {
  if (!id) return null;
  return RESOURCES_BY_ID.get(id) ?? null;
}
