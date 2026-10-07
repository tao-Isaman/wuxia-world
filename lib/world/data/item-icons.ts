import { ARTS, EQUIPMENT, MERIDIAN_CHARTS, SKILLS } from "@/lib/game";
import { getItem } from "./items";

// Item and equipment icons — every bag item and gear piece shows a painted
// 40 px icon from the asset library (public/assets/icon/, category "icon",
// ids `ico_<group>_<kind>_NN`). The table is static, so the bag needs no
// manifest fetch; `test:assets` checks every id resolves to an approved icon.
// The library has no exact icon for some things (paper, ink, a letter): they
// take the nearest look. Ids missing here fall back to the category glyph.

/** Regular items (scrolls are derived from the move's tier below). */
export const ITEM_ICONS: Readonly<Record<string, string>> = {
  // ── quest / story
  old_key: "ico_quest_key_token_01",
  qst_capital_spice: "ico_potion_pills_07",
  qst_capital_silk: "ico_material_cloth_10",
  qst_capital_silk_receipt: "ico_book_scroll_02",
  qst_amnesty_letter: "ico_book_scroll_09",
  qst_amnesty_receipt: "ico_book_scroll_07",
  qst_dali_book_pages: "ico_book_book_05",
  qst_dali_encrypted: "ico_book_scroll_03",
  qst_dali_decoded: "ico_book_scroll_13",
  qst_kunlun_evidence: "ico_book_scroll_01",
  qst_kunlun_snow_ginseng: "ico_herb_herb_11",
  qst_jinshe_golden_snake: "ico_material_animal_part_07",
  qst_motian_ancient_sword: "ico_weapon_jian_sword_14",
  qst_lin_formula: "ico_book_book_05",
  // ── valuables, potions
  jade: "ico_valuable_valuable_08",
  ancient_coin: "ico_valuable_valuable_01",
  potion: "ico_potion_potion_05",
  potion_mid: "ico_potion_potion_10",
  potion_big: "ico_potion_potion_07",
  poison_vial: "ico_venom_venom_05",
  potion_qi: "ico_potion_potion_02",
  poison_powder: "ico_venom_venom_09",
  poison_needle: "ico_weapon_hidden_weapons_04",
  poison_black_centipede: "ico_venom_venom_14",
  throw_dart: "ico_weapon_hidden_weapons_01",
  throw_knife: "ico_weapon_hidden_weapons_06",
  throw_star: "ico_weapon_hidden_weapons_08",
  // ── gathered materials
  rock: "ico_material_ore_10",
  iron_ore: "ico_material_ore_13",
  copper_ore: "ico_material_ore_02",
  silver_ore: "ico_material_ore_04",
  gold_ore: "ico_material_ore_01",
  mithril_ore: "ico_material_ore_09",
  wood_soft: "ico_material_wood_06",
  wood_hard: "ico_material_wood_02",
  wood_sacred: "ico_material_wood_10",
  raw_meat: "ico_material_animal_part_10",
  fur_pelt: "ico_material_animal_part_04",
  tiger_claw: "ico_material_animal_part_06",
  bear_claw: "ico_material_animal_part_03",
  snake_skin: "ico_material_animal_part_13",
  // ── legendary beast trophies
  trophy_golden_serpent: "ico_material_animal_part_07",
  trophy_blood_tiger: "ico_material_animal_part_06",
  trophy_sword_eagle: "ico_material_animal_part_11",
  trophy_sun_turtle: "ico_material_animal_part_08",
  trophy_blade_crab: "ico_material_animal_part_12",
  trophy_flame_bull: "ico_material_animal_part_05",
  fish_carp: "ico_food_fish_01",
  fish_eel: "ico_food_fish_03",
  fish_dragon: "ico_food_fish_07",
  herb: "ico_herb_herb_06",
  ginseng: "ico_herb_herb_03",
  lotus_seed: "ico_herb_herb_09",
  snow_lotus: "ico_herb_herb_07",
  viper_venom: "ico_venom_venom_04",
  scorpion_venom: "ico_venom_venom_07",
  centipede_venom: "ico_venom_venom_12",
  // ── refined materials
  iron_ingot: "ico_material_ingot_12",
  leather: "ico_material_animal_part_09",
  paper: "ico_material_cloth_09",
  ink: "ico_potion_pills_05",
  silk: "ico_material_cloth_07",
  thread: "ico_material_cloth_02",
  // ── books (life-skill texts)
  book_basic: "ico_book_book_01",
  book_inter: "ico_book_book_14",
  book_advanced: "ico_book_book_09",
  book_legendary: "ico_book_book_12",
  song_basic: "ico_book_book_13",
  song_inter: "ico_book_book_06",
  song_advanced: "ico_book_book_10",
  image_basic: "ico_book_scroll_06",
  image_inter: "ico_book_scroll_11",
  image_master: "ico_book_scroll_08",
  alpha_basic: "ico_book_book_07",
  alpha_inter: "ico_book_book_04",
  alpha_master: "ico_book_book_03",
  // ── crafted goods
  iron_blade: "ico_weapon_dao_sabre_01",
  iron_sword: "ico_weapon_jian_sword_01",
  steel_sword: "ico_weapon_jian_sword_13",
  cloth_robe: "ico_armor_robe_armor_03",
  leather_robe: "ico_armor_robe_armor_09",
  silk_robe: "ico_armor_robe_armor_06",
  silver_ring: "ico_accessory_ring_08",
  gold_ring: "ico_accessory_ring_13",
  jade_amulet: "ico_accessory_amulet_09",
  silk_fan: "ico_weapon_fan_weapon_13",
  warrior_belt: "ico_armor_bracers_belt_05",
  jade_pendant: "ico_accessory_amulet_05",
  fortune_charm: "ico_valuable_valuable_13",
  // ── food
  cooked_meat: "ico_food_dish_06",
  rice_dish: "ico_food_dish_08",
  spicy_stew: "ico_food_dish_10",
  moon_cake: "ico_food_dish_12",
};

/** Equipment by id: weapons by family, the rest by slot and grade. */
export const EQUIPMENT_ICONS: Readonly<Record<string, string>> = {
  W1: "ico_weapon_dao_sabre_04", W2: "ico_weapon_dao_sabre_07", W3: "ico_weapon_dao_sabre_13",
  W4: "ico_weapon_dao_sabre_10", W5: "ico_weapon_jian_sword_11",
  W_flute: "ico_tool_instrument_11", W_pipa: "ico_tool_instrument_06",
  A1: "ico_armor_robe_armor_01", A2: "ico_armor_robe_armor_04", A3: "ico_armor_robe_armor_10",
  A4: "ico_armor_robe_armor_05", A5: "ico_armor_robe_armor_12",
  H1: "ico_armor_helmet_hat_12", H2: "ico_armor_helmet_hat_14", H3: "ico_armor_helmet_hat_01",
  H4: "ico_armor_helmet_hat_09", H5: "ico_armor_helmet_hat_08",
  B1: "ico_armor_boots_07", B2: "ico_armor_boots_01", B3: "ico_armor_boots_06",
  B4: "ico_armor_boots_04", B5: "ico_armor_boots_14",
  BR1: "ico_armor_bracers_belt_03", BR2: "ico_armor_bracers_belt_13", BR3: "ico_armor_bracers_belt_07",
  BR4: "ico_armor_bracers_belt_12", BR5: "ico_armor_bracers_belt_02",
  R1: "ico_accessory_ring_13", R2: "ico_accessory_ring_03", R3: "ico_accessory_ring_02",
  R4: "ico_accessory_ring_05", R5: "ico_accessory_ring_11",
  C1: "ico_valuable_valuable_14", C2: "ico_accessory_amulet_04", C3: "ico_accessory_amulet_07",
  C4: "ico_accessory_amulet_14", C5: "ico_accessory_amulet_13",
  eq_t0_w_fist: "ico_armor_bracers_belt_04", eq_t0_w_long: "ico_weapon_staff_07",
  eq_t0_w_sword: "ico_weapon_jian_sword_06", eq_t0_w_blade: "ico_weapon_dao_sabre_08",
  eq_t0_w_short: "ico_weapon_fan_weapon_02", eq_t0_w_hidden: "ico_weapon_hidden_weapons_10",
  eq_t0_a_cloth: "ico_armor_robe_armor_02", eq_t0_h_cloth: "ico_armor_helmet_hat_02",
  eq_t0_b_cloth: "ico_armor_boots_09", eq_t0_br_cloth: "ico_armor_bracers_belt_08",
  eq_t0_a_iron: "ico_armor_robe_armor_08", eq_t0_h_iron: "ico_armor_helmet_hat_13",
  eq_t0_b_iron: "ico_armor_boots_11", eq_t0_br_iron: "ico_armor_bracers_belt_07",
  eq_t0_r_copper: "ico_accessory_ring_07", eq_t0_c_cloth: "ico_accessory_amulet_02",
  eq_t1_w_fist: "ico_weapon_whip_chain_14", eq_t1_w_long: "ico_weapon_spear_05",
  eq_t1_w_sword: "ico_weapon_jian_sword_03", eq_t1_w_blade: "ico_weapon_dao_sabre_11",
  eq_t1_w_short: "ico_weapon_fan_weapon_09", eq_t1_w_hidden: "ico_weapon_hidden_weapons_13",
  eq_t1_a_leather: "ico_armor_robe_armor_07", eq_t1_h_leather: "ico_armor_helmet_hat_05",
  eq_t1_b_leather: "ico_armor_boots_08", eq_t1_br_leather: "ico_armor_bracers_belt_03",
  eq_t1_a_iron: "ico_armor_robe_armor_11", eq_t1_h_iron: "ico_armor_helmet_hat_06",
  eq_t1_b_iron: "ico_armor_boots_10", eq_t1_br_iron: "ico_armor_bracers_belt_12",
  eq_t1_r_silver: "ico_accessory_ring_10", eq_t1_c_wood: "ico_accessory_amulet_11",
  eq_xixia_w_blade: "ico_weapon_dao_sabre_12", eq_yangzhou_w_blade: "ico_weapon_dao_sabre_02",
  eq_suzhou_a_silk: "ico_armor_robe_armor_06", eq_jinling_r_jade: "ico_accessory_ring_06",
  eq_dali_c_herb: "ico_accessory_amulet_08", eq_capital_c_seal: "ico_quest_key_token_09",
  eq_changan_br_iron: "ico_armor_bracers_belt_02",
};

// Scrolls and manuals look like their move's grade: move skills are rolled
// scrolls, inner arts bound books, one look per tier (T0…T5).
const SKILL_SCROLL_BY_TIER = ["06", "10", "02", "05", "03", "09"];
const ART_BOOK_BY_TIER = ["01", "14", "04", "06", "12", "09"];
// Meridian charts (แผนภาพชีพจร) are scrolls of their own, one per tier.
const CHART_SCROLL_BY_TIER = ["07", "08", "11", "12", "13", "14"];
const CHART_TIER = new Map(MERIDIAN_CHARTS.map((c) => [c.id, c.ti]));
const SKILL_TIER = new Map(SKILLS.map((s) => [s.id, s.ti]));
const ART_TIER = new Map(ARTS.map((a) => [a.id, a.ti]));
const pick = (list: string[], ti: number) => list[Math.max(0, Math.min(list.length - 1, ti))];

/** The icon asset id for an item (scrolls and manuals included), else null. */
export function itemIconId(itemId: string): string | null {
  const own = ITEM_ICONS[itemId];
  if (own) return own;
  const use = getItem(itemId)?.use;
  if (use?.t === "manualLearnSkill") return `ico_book_scroll_${pick(SKILL_SCROLL_BY_TIER, SKILL_TIER.get(use.skillId) ?? 0)}`;
  if (use?.t === "manualLearnArt") return `ico_book_book_${pick(ART_BOOK_BY_TIER, ART_TIER.get(use.artId) ?? 0)}`;
  if (use?.t === "learnMeridian") return `ico_book_scroll_${pick(CHART_SCROLL_BY_TIER, CHART_TIER.get(use.chartId) ?? 0)}`;
  return null;
}

/** The icon asset id for an equipment piece, else null. */
export function equipmentIconId(equipId: string): string | null {
  return EQUIPMENT_ICONS[equipId] ?? null;
}

/** Public URL of an icon asset (`ico_<group>_…` lives in public/assets/icon/<group>/). */
export function iconUrl(iconId: string | null | undefined): string | undefined {
  if (!iconId) return undefined;
  return `/assets/icon/${iconId.split("_")[1]}/${iconId}.png`;
}

export const itemIconUrl = (itemId: string | null | undefined) => (itemId ? iconUrl(itemIconId(itemId)) : undefined);
export const equipmentIconUrl = (equipId: string | null | undefined) => (equipId ? iconUrl(equipmentIconId(equipId)) : undefined);

/** Gold (letter gifts): a pile of gold ingots. */
export const GOLD_ICON_URL = iconUrl("ico_valuable_valuable_12")!;

/** Every equipment id the table must cover (for tests). */
export const EQUIPMENT_IDS: readonly string[] = EQUIPMENT.map((e) => e.id);
