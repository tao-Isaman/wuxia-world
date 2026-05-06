import type { ItemCategory } from "../types";

// ─── Shop / inn registry ──────────────────────────────────────────────
// Each entry attaches a buy/sell shop to one location id. Shops inherit
// item prices from `lib/world/data/items.ts`; sell-back is a multiplier
// (typical: 0.5 → 50 % of buy price). `acceptsCategories` restricts what
// the player can sell — empty means everything.

export interface ShopDef {
  // Internal id used for popup state.
  id: string;
  // Location this shop lives at — anywhere matching renders the panel.
  locationId: string;
  // Display label on the panel button.
  label: string;
  // What the shop has for sale.
  inventory: readonly string[];
  // Categories the shop will buy back. Empty / undefined → all categories.
  acceptsCategories?: readonly ItemCategory[];
  // Sell-back multiplier on the item's `price`.
  sellMultiplier: number;
}

// Default city-shop catalogue — wide-ranging general store. Specialised
// city shops can omit some entries or add city-flavour items via a per-
// city override array (`CITY_EXTRA`).
const COMMON_CITY_SHOP: readonly string[] = [
  "potion", "potion_mid", "potion_big",
  "rice_dish", "spicy_stew", "moon_cake", "cooked_meat",
  "iron_sword", "cloth_robe", "leather_robe",
  "silver_ring", "gold_ring",
  "book_basic", "book_inter",
  "song_basic", "image_basic", "alpha_basic",
  "paper", "ink", "thread",
  "iron_ore", "wood_soft", "iron_ingot",
];

// Inn-specific catalogue: food + simple essentials. Inns also buy back
// only food / herb / material — they're not full general stores.
const INN_SHOP: readonly string[] = [
  "rice_dish", "spicy_stew", "moon_cake", "cooked_meat",
  "potion",
];

// Village shop — small inventory, only the most basic things.
const VILLAGE_SHOP: readonly string[] = [
  "potion", "rice_dish", "moon_cake", "wood_soft",
];

// ─── Shops attached to specific locations ────────────────────────────
export const SHOPS: readonly ShopDef[] = [
  // City general stores (wide inventory, sell-back any category at 50 %).
  { id: "shop_capital",  locationId: "city_capital",  label: "🏪 ตลาดนครหลวง",      inventory: COMMON_CITY_SHOP, sellMultiplier: 0.5 },
  { id: "shop_xixia",    locationId: "city_xixia",    label: "🏪 ตลาดซีเซี่ย",       inventory: COMMON_CITY_SHOP, sellMultiplier: 0.5 },
  { id: "shop_dali",     locationId: "city_dali",     label: "🏪 ตลาดต้าหลี่",       inventory: COMMON_CITY_SHOP, sellMultiplier: 0.5 },
  { id: "shop_yangzhou", locationId: "city_yangzhou", label: "🏪 ตลาดหยางโจว",      inventory: COMMON_CITY_SHOP, sellMultiplier: 0.5 },
  { id: "shop_suzhou",   locationId: "city_suzhou",   label: "🏪 ตลาดซูโจว",         inventory: COMMON_CITY_SHOP, sellMultiplier: 0.5 },
  { id: "shop_jinling",  locationId: "city_jinling",  label: "🏪 ตลาดจินหลิง",       inventory: COMMON_CITY_SHOP, sellMultiplier: 0.5 },
  { id: "shop_changan",  locationId: "city_changan",  label: "🏪 ตลาดฉางอัน",        inventory: COMMON_CITY_SHOP, sellMultiplier: 0.5 },

  // Inn shops — food + basics only, accept food/herb/material at 40 %.
  { id: "shop_inn_yuelai",   locationId: "inn_yuelai",   label: "🍵 ของกินที่ยั่วไหล",   inventory: INN_SHOP, sellMultiplier: 0.4, acceptsCategories: ["food", "herb", "material"] },
  { id: "shop_inn_youjian",  locationId: "inn_youjian",  label: "🍵 ของกินที่มีหว่าง",   inventory: INN_SHOP, sellMultiplier: 0.4, acceptsCategories: ["food", "herb", "material"] },
  { id: "shop_inn_gaosheng", locationId: "inn_gaosheng", label: "🍵 ของกินที่เก้าอี้สูง", inventory: INN_SHOP, sellMultiplier: 0.4, acceptsCategories: ["food", "herb", "material"] },
  { id: "shop_inn_heluo",    locationId: "inn_heluo",    label: "🍵 ของกินที่ห้วอลั่ว",   inventory: INN_SHOP, sellMultiplier: 0.4, acceptsCategories: ["food", "herb", "material"] },

  // Village shops — tiny inventory, accept basics at 35 %.
  { id: "shop_village",         locationId: "village",         label: "🏪 ร้านในหมู่บ้าน", inventory: VILLAGE_SHOP, sellMultiplier: 0.35, acceptsCategories: ["food", "herb", "material"] },
  { id: "shop_village_qigu",    locationId: "village_qigu",    label: "🏪 ร้านชีกู่",        inventory: VILLAGE_SHOP, sellMultiplier: 0.35, acceptsCategories: ["food", "herb", "material"] },
  { id: "shop_village_noname",  locationId: "village_noname",  label: "🏪 ร้านไร้นาม",      inventory: VILLAGE_SHOP, sellMultiplier: 0.35, acceptsCategories: ["food", "herb", "material"] },
  { id: "shop_village_meihua",  locationId: "village_meihua",  label: "🏪 ร้านดอกเหมย",     inventory: VILLAGE_SHOP, sellMultiplier: 0.35, acceptsCategories: ["food", "herb", "material"] },
  { id: "shop_village_huashan", locationId: "village_huashan", label: "🏪 ร้านหัวซาน",      inventory: VILLAGE_SHOP, sellMultiplier: 0.35, acceptsCategories: ["food", "herb", "material"] },
  { id: "shop_village_taishan", locationId: "village_taishan", label: "🏪 ร้านไท่ซาน",      inventory: VILLAGE_SHOP, sellMultiplier: 0.35, acceptsCategories: ["food", "herb", "material"] },
  { id: "shop_village_hengshan",locationId: "village_hengshan",label: "🏪 ร้านฮิงซาน",      inventory: VILLAGE_SHOP, sellMultiplier: 0.35, acceptsCategories: ["food", "herb", "material"] },
  { id: "shop_village_wuxia",   locationId: "village_wuxia",   label: "🏪 ร้านอวู่เซี่ย",   inventory: VILLAGE_SHOP, sellMultiplier: 0.35, acceptsCategories: ["food", "herb", "material"] },
];

export const SHOPS_BY_LOCATION = new Map<string, ShopDef>(
  SHOPS.map((s) => [s.locationId, s]),
);

export function getShopAt(locationId: string): ShopDef | null {
  return SHOPS_BY_LOCATION.get(locationId) ?? null;
}
