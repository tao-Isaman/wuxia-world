import type { Equipment, EquipSlotType } from "../types";

// 35 equipment items across 7 slot types.
// Slot capacities (per character):
//   W:1, A:1, H:1, B:1, BR:2, R:2, C:2  → 9 total slots
// `eff` is a single special effect bound to the item; stat boosts go in `st`.
export const EQUIPMENT: readonly Equipment[] = [
  // อาวุธ W — base: ATK
  { id: "W1", n: "ดาบเหล็กสามัญ", ty: "W", atkb: 20, pdb: 0, idb: 0, hpb: 0, mpb: 0, st: {}, eff: null },
  { id: "W2", n: "ดาบทองคำ", ty: "W", atkb: 40, pdb: 0, idb: 0, hpb: 0, mpb: 0, st: { STR: 8, DEX: 7 }, eff: null },
  { id: "W3", n: "ดาบเพลิง", ty: "W", atkb: 35, pdb: 0, idb: 0, hpb: 0, mpb: 0, st: { STR: 10, POW: 10 }, eff: { t: "pct_atk", v: 10 } },
  { id: "W4", n: "ดาบพิษ", ty: "W", atkb: 45, pdb: 0, idb: 0, hpb: 0, mpb: 0, st: { DEX: 10, LUK: 8 }, eff: { t: "on_hit", db: { t: "debuff_eva", v: -10, u: 2 } } },
  { id: "W5", n: "ดาบมังกรเทพ", ty: "W", atkb: 70, pdb: 0, idb: 0, hpb: 0, mpb: 0, st: { STR: 10, AGI: 6, DEX: 4 }, eff: { t: "flat_cri", v: 20 } },
  // Music instruments — fight as weak weapons but tag the W slot for the
  // music life-skill so practiceMusic() works.
  { id: "W_flute", n: "ขลุ่ยไผ่", ty: "W", atkb: 10, pdb: 0, idb: 0, hpb: 0, mpb: 30, st: { POW: 4, INT: 4 }, eff: null, instrument: true },
  { id: "W_pipa",  n: "พิณยี่ห้อง", ty: "W", atkb: 12, pdb: 0, idb: 0, hpb: 0, mpb: 40, st: { POW: 5, INT: 5 }, eff: null, instrument: true },

  // เสื้อ A — base: PD+ID (สูง)
  { id: "A1", n: "เสื้อผ้าธรรมดา", ty: "A", atkb: 0, pdb: 30, idb: 20, hpb: 0, mpb: 0, st: {}, eff: null },
  { id: "A2", n: "เกราะหนัง", ty: "A", atkb: 0, pdb: 55, idb: 38, hpb: 0, mpb: 0, st: { VIT: 10, DEF: 10 }, eff: null },
  { id: "A3", n: "เกราะเหล็ก", ty: "A", atkb: 0, pdb: 90, idb: 60, hpb: 0, mpb: 0, st: { DEF: 12, VIT: 8 }, eff: { t: "pct_reduce", v: 8 } },
  { id: "A4", n: "เกราะมังกร", ty: "A", atkb: 0, pdb: 120, idb: 85, hpb: 0, mpb: 0, st: { DEF: 10, VIT: 10 }, eff: null },
  { id: "A5", n: "เกราะเทพ", ty: "A", atkb: 0, pdb: 150, idb: 110, hpb: 0, mpb: 0, st: { DEF: 8, VIT: 8, POW: 4 }, eff: { t: "pct_reduce", v: 12 } },

  // หมวก H — base: PD+ID
  { id: "H1", n: "หมวกผ้า", ty: "H", atkb: 0, pdb: 15, idb: 10, hpb: 0, mpb: 0, st: {}, eff: null },
  { id: "H2", n: "หมวกหนัง", ty: "H", atkb: 0, pdb: 28, idb: 20, hpb: 0, mpb: 0, st: { VIT: 8, DEF: 5 }, eff: null },
  { id: "H3", n: "หมวกเหล็ก", ty: "H", atkb: 0, pdb: 48, idb: 35, hpb: 0, mpb: 0, st: { DEF: 10, VIT: 10 }, eff: null },
  { id: "H4", n: "หมวกเทพ", ty: "H", atkb: 0, pdb: 68, idb: 50, hpb: 0, mpb: 0, st: { DEF: 10, INT: 10 }, eff: { t: "pct_reduce", v: 5 } },
  { id: "H5", n: "มงกุฎมังกร", ty: "H", atkb: 0, pdb: 85, idb: 65, hpb: 0, mpb: 0, st: { DEF: 8, VIT: 8, INT: 4 }, eff: { t: "flat_cri", v: 12 } },

  // รองเท้า B — base: PD+ID
  { id: "B1", n: "รองเท้าผ้า", ty: "B", atkb: 0, pdb: 12, idb: 8, hpb: 0, mpb: 0, st: {}, eff: null },
  { id: "B2", n: "รองเท้าหนัง", ty: "B", atkb: 0, pdb: 22, idb: 16, hpb: 0, mpb: 0, st: { AGI: 8, DEX: 5 }, eff: null },
  { id: "B3", n: "รองเท้าเหล็ก", ty: "B", atkb: 0, pdb: 38, idb: 28, hpb: 0, mpb: 0, st: { DEF: 8, VIT: 6, AGI: 6 }, eff: null },
  { id: "B4", n: "รองเท้าลม", ty: "B", atkb: 0, pdb: 28, idb: 20, hpb: 0, mpb: 0, st: { AGI: 12, DEX: 8 }, eff: { t: "flat_eva", v: 20 } },
  { id: "B5", n: "รองเท้าเทพ", ty: "B", atkb: 0, pdb: 50, idb: 38, hpb: 0, mpb: 0, st: { AGI: 8, DEX: 8, LUK: 4 }, eff: { t: "flat_eva", v: 15 } },

  // ปลอกแขน BR — base: PD+ID
  { id: "BR1", n: "ปลอกแขนผ้า", ty: "BR", atkb: 0, pdb: 8, idb: 6, hpb: 0, mpb: 0, st: {}, eff: null },
  { id: "BR2", n: "ปลอกแขนหนัง", ty: "BR", atkb: 0, pdb: 15, idb: 12, hpb: 0, mpb: 0, st: { STR: 6, DEF: 4 }, eff: null },
  { id: "BR3", n: "ปลอกแขนเหล็ก", ty: "BR", atkb: 0, pdb: 25, idb: 18, hpb: 0, mpb: 0, st: { DEF: 8, STR: 6, VIT: 6 }, eff: null },
  { id: "BR4", n: "ปลอกแขนมังกร", ty: "BR", atkb: 0, pdb: 38, idb: 28, hpb: 0, mpb: 0, st: { STR: 10, DEX: 10 }, eff: { t: "pct_atk", v: 8 } },
  { id: "BR5", n: "ปลอกแขนเทพ", ty: "BR", atkb: 0, pdb: 50, idb: 38, hpb: 0, mpb: 0, st: { STR: 10, DEX: 6, AGI: 4 }, eff: null },

  // แหวน R — base: HP+MP
  { id: "R1", n: "แหวนทองเปล่า", ty: "R", atkb: 0, pdb: 0, idb: 0, hpb: 100, mpb: 60, st: {}, eff: null },
  { id: "R2", n: "แหวนพลัง", ty: "R", atkb: 0, pdb: 0, idb: 0, hpb: 150, mpb: 80, st: { STR: 5, POW: 5 }, eff: null },
  { id: "R3", n: "แหวนชีวิต", ty: "R", atkb: 0, pdb: 0, idb: 0, hpb: 280, mpb: 80, st: { VIT: 8, LUK: 2 }, eff: null },
  { id: "R4", n: "แหวนปัญญา", ty: "R", atkb: 0, pdb: 0, idb: 0, hpb: 100, mpb: 200, st: { INT: 6, POW: 4 }, eff: { t: "hp_regen", v: 3 } },
  { id: "R5", n: "แหวนมังกร", ty: "R", atkb: 0, pdb: 0, idb: 0, hpb: 200, mpb: 150, st: { STR: 5, POW: 5 }, eff: { t: "flat_cri", v: 12 } },

  // ประดับ C — base: HP
  { id: "C1", n: "เหรียญโชคลาภ", ty: "C", atkb: 0, pdb: 0, idb: 0, hpb: 180, mpb: 0, st: {}, eff: null },
  { id: "C2", n: "ประดับเลือดมังกร", ty: "C", atkb: 0, pdb: 0, idb: 0, hpb: 350, mpb: 0, st: { STR: 5, VIT: 5 }, eff: null },
  { id: "C3", n: "ประดับปัญญาสวรรค์", ty: "C", atkb: 0, pdb: 0, idb: 0, hpb: 250, mpb: 0, st: { INT: 5, POW: 5 }, eff: { t: "pct_atk", v: 6 } },
  { id: "C4", n: "ประดับชีวิตนิรันดร์", ty: "C", atkb: 0, pdb: 0, idb: 0, hpb: 500, mpb: 0, st: { VIT: 10 }, eff: { t: "hp_regen", v: 5 } },
  { id: "C5", n: "ประดับมังกรเทพ", ty: "C", atkb: 0, pdb: 0, idb: 0, hpb: 450, mpb: 0, st: { STR: 5, VIT: 5 }, eff: { t: "pct_reduce", v: 8 } },

  // ─── Artisan-shop tier 0-1 roster ──────────────────────────────────
  // Items in this block are sold by the new artisan NPCs (city / villageP
  // / sect — see lib/world/data/artisans.ts). They sit BELOW the W1–W5
  // legendary ladder above so the player can equip something from day 1
  // without finding rare drops. ID prefix: `eq_t<tier>_<slot>_<flavor>`.
  // Stat budget per slot is intentionally small — these are starter
  // gear, not late-game pieces.

  // ── tier 0 weapons (forge) — 6 weapon families
  { id: "eq_t0_w_fist",   n: "นวมไม้ฝึกหมัด",      ty: "W", atkb: 8,  pdb: 0, idb: 0, hpb: 0, mpb: 0, st: { STR: 2 },              eff: null },
  { id: "eq_t0_w_long",   n: "ทวนไม้ฝึก",          ty: "W", atkb: 10, pdb: 0, idb: 0, hpb: 0, mpb: 0, st: { STR: 2, VIT: 1 },      eff: null },
  { id: "eq_t0_w_sword",  n: "กระบี่ไม้ฝึก",        ty: "W", atkb: 9,  pdb: 0, idb: 0, hpb: 0, mpb: 0, st: { POW: 2, AGI: 1 },      eff: null },
  { id: "eq_t0_w_blade",  n: "ดาบไม้ฝึก",          ty: "W", atkb: 11, pdb: 0, idb: 0, hpb: 0, mpb: 0, st: { STR: 3 },              eff: null },
  { id: "eq_t0_w_short",  n: "พัดฝึกฝีมือ",         ty: "W", atkb: 7,  pdb: 0, idb: 0, hpb: 0, mpb: 10, st: { POW: 2, INT: 1 },     eff: null },
  { id: "eq_t0_w_hidden", n: "เข็มฝึกซ้อม",         ty: "W", atkb: 6,  pdb: 0, idb: 0, hpb: 0, mpb: 0, st: { DEX: 3 },              eff: null },

  // ── tier 0 armor (forge metal: iron / tailoring cloth)
  { id: "eq_t0_a_cloth",  n: "เสื้อผ้าฝ้ายเรียบ",    ty: "A", atkb: 0, pdb: 18,  idb: 12, hpb: 0, mpb: 0, st: {},                  eff: null },
  { id: "eq_t0_h_cloth",  n: "ผ้าโพกหัว",           ty: "H", atkb: 0, pdb: 8,   idb: 5,  hpb: 0, mpb: 0, st: {},                  eff: null },
  { id: "eq_t0_b_cloth",  n: "รองเท้าฟาง",          ty: "B", atkb: 0, pdb: 6,   idb: 4,  hpb: 0, mpb: 0, st: { AGI: 2 },          eff: null },
  { id: "eq_t0_br_cloth", n: "ปลอกแขนผ้าฝ้าย",     ty: "BR",atkb: 0, pdb: 5,   idb: 3,  hpb: 0, mpb: 0, st: {},                  eff: null },
  { id: "eq_t0_a_iron",   n: "เกราะแผ่นเหล็กเล็ก",  ty: "A", atkb: 0, pdb: 25,  idb: 15, hpb: 0, mpb: 0, st: { DEF: 3 },          eff: null },
  { id: "eq_t0_h_iron",   n: "หมวกเหล็กบาง",        ty: "H", atkb: 0, pdb: 12,  idb: 7,  hpb: 0, mpb: 0, st: { DEF: 2 },          eff: null },
  { id: "eq_t0_b_iron",   n: "รองเท้าหุ้มเหล็ก",     ty: "B", atkb: 0, pdb: 10,  idb: 6,  hpb: 0, mpb: 0, st: { DEF: 2 },          eff: null },
  { id: "eq_t0_br_iron",  n: "ปลอกแขนเหล็กบาง",    ty: "BR",atkb: 0, pdb: 8,   idb: 5,  hpb: 0, mpb: 0, st: { STR: 2 },          eff: null },

  // ── tier 0 accessories (jewelry / accessory)
  { id: "eq_t0_r_copper", n: "แหวนทองแดง",         ty: "R", atkb: 0, pdb: 0, idb: 0, hpb: 60,  mpb: 30, st: {},                   eff: null },
  { id: "eq_t0_c_cloth",  n: "เครื่องรางผ้าแดง",   ty: "C", atkb: 0, pdb: 0, idb: 0, hpb: 100, mpb: 0,  st: { LUK: 2 },          eff: null },

  // ── tier 1 weapons (forge)
  { id: "eq_t1_w_fist",   n: "หมัดเหล็ก",          ty: "W", atkb: 18, pdb: 0, idb: 0, hpb: 0, mpb: 0,  st: { STR: 5, VIT: 2 },   eff: null },
  { id: "eq_t1_w_long",   n: "ทวนเหล็ก",          ty: "W", atkb: 22, pdb: 0, idb: 0, hpb: 0, mpb: 0,  st: { STR: 5, AGI: 3 },   eff: null },
  { id: "eq_t1_w_sword",  n: "กระบี่เหล็ก",        ty: "W", atkb: 20, pdb: 0, idb: 0, hpb: 0, mpb: 0,  st: { POW: 4, DEX: 4 },   eff: null },
  { id: "eq_t1_w_blade",  n: "ดาบเหล็กกล้า",      ty: "W", atkb: 24, pdb: 0, idb: 0, hpb: 0, mpb: 0,  st: { STR: 6 },           eff: null },
  { id: "eq_t1_w_short",  n: "พัดเหล็กบาง",        ty: "W", atkb: 16, pdb: 0, idb: 0, hpb: 0, mpb: 20, st: { POW: 4, INT: 4 },   eff: null },
  { id: "eq_t1_w_hidden", n: "เข็มเหล็กพิษอ่อน",  ty: "W", atkb: 14, pdb: 0, idb: 0, hpb: 0, mpb: 0,  st: { DEX: 6, LUK: 3 },   eff: { t: "on_hit", db: { t: "debuff_eva", v: -5, u: 1 } } },

  // ── tier 1 armor — leather/iron
  { id: "eq_t1_a_leather",  n: "เสื้อหนัง",          ty: "A", atkb: 0, pdb: 35, idb: 22, hpb: 0, mpb: 0, st: { VIT: 5, DEF: 4 },  eff: null },
  { id: "eq_t1_h_leather",  n: "หมวกหนังบุนวม",    ty: "H", atkb: 0, pdb: 16, idb: 11, hpb: 0, mpb: 0, st: { VIT: 4 },          eff: null },
  { id: "eq_t1_b_leather",  n: "รองเท้าหนังหนา",    ty: "B", atkb: 0, pdb: 14, idb: 10, hpb: 0, mpb: 0, st: { AGI: 5, DEX: 2 }, eff: null },
  { id: "eq_t1_br_leather", n: "ปลอกแขนหนัง",      ty: "BR",atkb: 0, pdb: 10, idb: 8,  hpb: 0, mpb: 0, st: { STR: 4 },          eff: null },
  { id: "eq_t1_a_iron",     n: "เกราะเหล็กหนา",     ty: "A", atkb: 0, pdb: 48, idb: 32, hpb: 0, mpb: 0, st: { DEF: 8, VIT: 5 }, eff: null },
  { id: "eq_t1_h_iron",     n: "หมวกเหล็กแข็ง",     ty: "H", atkb: 0, pdb: 22, idb: 16, hpb: 0, mpb: 0, st: { DEF: 6 },          eff: null },
  { id: "eq_t1_b_iron",     n: "รองเท้าเหล็กแข็ง",   ty: "B", atkb: 0, pdb: 18, idb: 13, hpb: 0, mpb: 0, st: { DEF: 5, VIT: 3 }, eff: null },
  { id: "eq_t1_br_iron",    n: "ปลอกแขนเหล็กหนา",  ty: "BR",atkb: 0, pdb: 14, idb: 10, hpb: 0, mpb: 0, st: { STR: 5, DEF: 3 }, eff: null },

  // ── tier 1 accessories
  { id: "eq_t1_r_silver",   n: "แหวนเงิน",          ty: "R", atkb: 0, pdb: 0, idb: 0, hpb: 100, mpb: 60, st: { LUK: 3 },           eff: null },
  { id: "eq_t1_c_wood",     n: "เครื่องรางไม้แกะสลัก", ty: "C", atkb: 0, pdb: 0, idb: 0, hpb: 180, mpb: 0,  st: { VIT: 3 },          eff: null },

  // ── city specialties — limited to specific city artisans (see
  // CITY_EQUIPMENT_SPECIALTIES in lib/world/data/artisans.ts)
  { id: "eq_xixia_w_blade",   n: "ดาบเหล็กชายแดน",    ty: "W", atkb: 30, pdb: 0, idb: 0, hpb: 0, mpb: 0,  st: { STR: 7, VIT: 3 },   eff: null },
  { id: "eq_yangzhou_w_blade",n: "ดาบโค้งแม่น้ำ",      ty: "W", atkb: 26, pdb: 0, idb: 0, hpb: 0, mpb: 0,  st: { AGI: 6, DEX: 4 },   eff: { t: "flat_eva", v: 8 } },
  { id: "eq_suzhou_a_silk",   n: "เสื้อผ้าไหมซูโจว",   ty: "A", atkb: 0,  pdb: 28, idb: 38, hpb: 0, mpb: 30, st: { POW: 5, INT: 5 }, eff: null },
  { id: "eq_jinling_r_jade",  n: "แหวนหยกจินหลิง",    ty: "R", atkb: 0,  pdb: 0,  idb: 0,  hpb: 140, mpb: 100, st: { INT: 5, POW: 3 }, eff: null },
  { id: "eq_dali_c_herb",     n: "เครื่องรางสมุนไพรต้าหลี่", ty: "C", atkb: 0, pdb: 0, idb: 0, hpb: 220, mpb: 0, st: { VIT: 4 }, eff: { t: "hp_regen", v: 2 } },
  { id: "eq_changan_br_iron", n: "ปลอกแขนทหารราชสำนัก", ty: "BR",atkb: 0, pdb: 18, idb: 14, hpb: 0, mpb: 0, st: { STR: 6, DEF: 4 }, eff: null },
  { id: "eq_capital_c_seal",  n: "ตราประทับนครหลวง",   ty: "C", atkb: 0,  pdb: 0,  idb: 0,  hpb: 200, mpb: 60, st: { LUK: 4 }, eff: { t: "pct_atk", v: 4 } },
];

export const EQUIPMENT_BY_ID: Map<string, Equipment> = new Map(EQUIPMENT.map((e) => [e.id, e]));

export function getEquip(id: string | null | undefined): Equipment | null {
  if (!id) return null;
  return EQUIPMENT_BY_ID.get(id) ?? null;
}

export const SLOT_LABELS: Record<EquipSlotType, string> = {
  W: "อาวุธ",
  A: "เสื้อ",
  H: "หมวก",
  B: "รองเท้า",
  BR: "ปลอกแขน",
  R: "แหวน",
  C: "ประดับ",
};
