import type { Equipment, EquipSlotType } from "../types";

// 35 equipment items across 7 slot types.
// Slot capacities (per character):
//   W:1, A:1, H:1, B:1, BR:2, R:2, C:2  → 9 total slots
// `eff` is a single special effect bound to the item; stat boosts go in `st`.
export const EQUIPMENT: readonly Equipment[] = [
  // อาวุธ W — base: ATK
  { id: "W1", n: "ดาบเหล็กสามัญ", ty: "W", atkb: 20, pdb: 0, idb: 0, hpb: 0, mpb: 0, st: {}, eff: null },
  { id: "W2", n: "ดาบทองคำ", ty: "W", atkb: 71, pdb: 0, idb: 0, hpb: 24, mpb: 0, pab: 23, iab: 7, accb: 14, crib: 8, st: {}, eff: null },
  { id: "W3", n: "ดาบเพลิง", ty: "W", atkb: 75, pdb: 10, idb: 10, hpb: 30, mpb: 120, pab: 20, iab: 20, crib: 10, st: {}, eff: { t: "pct_atk", v: 10 } },
  { id: "W4", n: "ดาบพิษ", ty: "W", atkb: 55, pdb: 0, idb: 0, hpb: 0, mpb: 0, pab: 18, iab: 18, accb: 20, crib: 8, resb: 8, st: {}, eff: { t: "on_hit", db: { t: "debuff_eva", v: -10, u: 2 } } },
  { id: "W5", n: "ดาบมังกรเทพ", ty: "W", atkb: 110, pdb: 0, idb: 0, hpb: 30, mpb: 0, pab: 24, iab: 4, spdb: 12, evab: 12, accb: 8, crib: 10, st: {}, eff: { t: "flat_cri", v: 20 } },
  // Music instruments — fight as weak weapons but tag the W slot for the
  // music life-skill so practiceMusic() works.
  { id: "W_flute", n: "ขลุ่ยไผ่", ty: "W", atkb: 22, pdb: 12, idb: 12, hpb: 0, mpb: 94, iab: 8, st: {}, eff: null, instrument: true },
  { id: "W_pipa",  n: "พิณยี่ห้อง", ty: "W", atkb: 27, pdb: 15, idb: 15, hpb: 0, mpb: 120, iab: 10, st: {}, eff: null, instrument: true },

  // เสื้อ A — base: PD+ID (สูง)
  { id: "A1", n: "เสื้อผ้าธรรมดา", ty: "A", atkb: 0, pdb: 30, idb: 20, hpb: 0, mpb: 0, st: {}, eff: null },
  { id: "A2", n: "เกราะหนัง", ty: "A", atkb: 0, pdb: 85, idb: 68, hpb: 300, mpb: 0, resb: 5, st: {}, eff: null },
  { id: "A3", n: "เกราะเหล็ก", ty: "A", atkb: 0, pdb: 122, idb: 92, hpb: 280, mpb: 0, resb: 6, st: {}, eff: { t: "pct_reduce", v: 8 } },
  { id: "A4", n: "เกราะมังกร", ty: "A", atkb: 0, pdb: 150, idb: 115, hpb: 300, mpb: 0, resb: 5, st: {}, eff: null },
  { id: "A5", n: "เกราะเทพ", ty: "A", atkb: 4, pdb: 178, idb: 138, hpb: 240, mpb: 48, iab: 8, resb: 4, st: {}, eff: { t: "pct_reduce", v: 12 } },

  // หมวก H — base: PD+ID
  { id: "H1", n: "หมวกผ้า", ty: "H", atkb: 0, pdb: 15, idb: 10, hpb: 0, mpb: 0, st: {}, eff: null },
  { id: "H2", n: "หมวกหนัง", ty: "H", atkb: 0, pdb: 46, idb: 38, hpb: 210, mpb: 0, resb: 2, st: {}, eff: null },
  { id: "H3", n: "หมวกเหล็ก", ty: "H", atkb: 0, pdb: 78, idb: 65, hpb: 300, mpb: 0, resb: 5, st: {}, eff: null },
  { id: "H4", n: "หมวกเทพ", ty: "H", atkb: 20, pdb: 108, idb: 90, hpb: 100, mpb: 40, resb: 5, st: {}, eff: { t: "pct_reduce", v: 5 } },
  { id: "H5", n: "มงกุฎมังกร", ty: "H", atkb: 8, pdb: 117, idb: 97, hpb: 240, mpb: 16, resb: 4, st: {}, eff: { t: "flat_cri", v: 12 } },

  // รองเท้า B — base: PD+ID
  { id: "B1", n: "รองเท้าผ้า", ty: "B", atkb: 0, pdb: 12, idb: 8, hpb: 0, mpb: 0, st: {}, eff: null },
  { id: "B2", n: "รองเท้าหนัง", ty: "B", atkb: 13, pdb: 22, idb: 16, hpb: 0, mpb: 0, pab: 5, iab: 5, spdb: 16, evab: 16, accb: 10, st: {}, eff: null },
  { id: "B3", n: "รองเท้าเหล็ก", ty: "B", atkb: 6, pdb: 60, idb: 50, hpb: 200, mpb: 0, spdb: 12, evab: 12, resb: 4, st: {}, eff: null },
  { id: "B4", n: "รองเท้าลม", ty: "B", atkb: 20, pdb: 28, idb: 20, hpb: 0, mpb: 0, pab: 8, iab: 8, spdb: 24, evab: 24, accb: 16, st: {}, eff: { t: "flat_eva", v: 20 } },
  { id: "B5", n: "รองเท้าเทพ", ty: "B", atkb: 16, pdb: 50, idb: 38, hpb: 0, mpb: 0, pab: 12, iab: 12, spdb: 16, evab: 16, accb: 16, crib: 4, resb: 4, st: {}, eff: { t: "flat_eva", v: 15 } },

  // ปลอกแขน BR — base: PD+ID
  { id: "BR1", n: "ปลอกแขนผ้า", ty: "BR", atkb: 0, pdb: 8, idb: 6, hpb: 0, mpb: 0, st: {}, eff: null },
  { id: "BR2", n: "ปลอกแขนหนัง", ty: "BR", atkb: 18, pdb: 23, idb: 20, hpb: 58, mpb: 0, pab: 12, crib: 6, resb: 2, st: {}, eff: null },
  { id: "BR3", n: "ปลอกแขนเหล็ก", ty: "BR", atkb: 18, pdb: 47, idb: 40, hpb: 218, mpb: 0, pab: 12, crib: 6, resb: 4, st: {}, eff: null },
  { id: "BR4", n: "ปลอกแขนมังกร", ty: "BR", atkb: 40, pdb: 38, idb: 28, hpb: 30, mpb: 0, pab: 30, iab: 10, accb: 20, crib: 10, st: {}, eff: { t: "pct_atk", v: 8 } },
  { id: "BR5", n: "ปลอกแขนเทพ", ty: "BR", atkb: 40, pdb: 50, idb: 38, hpb: 30, mpb: 0, pab: 26, iab: 6, spdb: 8, evab: 8, accb: 12, crib: 10, st: {}, eff: null },

  // แหวน R — base: HP+MP
  { id: "R1", n: "แหวนทองเปล่า", ty: "R", atkb: 0, pdb: 0, idb: 0, hpb: 100, mpb: 60, st: {}, eff: null },
  { id: "R2", n: "แหวนพลัง", ty: "R", atkb: 20, pdb: 5, idb: 5, hpb: 165, mpb: 140, pab: 10, iab: 10, crib: 5, st: {}, eff: null },
  { id: "R3", n: "แหวนชีวิต", ty: "R", atkb: 0, pdb: 8, idb: 8, hpb: 440, mpb: 80, pab: 2, iab: 2, crib: 2, resb: 2, st: {}, eff: null },
  { id: "R4", n: "แหวนปัญญา", ty: "R", atkb: 16, pdb: 16, idb: 16, hpb: 100, mpb: 272, iab: 8, st: {}, eff: { t: "hp_regen", v: 3 } },
  { id: "R5", n: "แหวนมังกร", ty: "R", atkb: 20, pdb: 5, idb: 5, hpb: 215, mpb: 210, pab: 10, iab: 10, crib: 5, st: {}, eff: { t: "flat_cri", v: 12 } },

  // ประดับ C — base: HP
  { id: "C1", n: "เหรียญโชคลาภ", ty: "C", atkb: 0, pdb: 0, idb: 0, hpb: 180, mpb: 0, st: {}, eff: null },
  { id: "C2", n: "ประดับเลือดมังกร", ty: "C", atkb: 15, pdb: 5, idb: 5, hpb: 465, mpb: 0, pab: 10, crib: 5, st: {}, eff: null },
  { id: "C3", n: "ประดับปัญญาสวรรค์", ty: "C", atkb: 15, pdb: 15, idb: 15, hpb: 250, mpb: 80, iab: 10, st: {}, eff: { t: "pct_atk", v: 6 } },
  { id: "C4", n: "ประดับชีวิตนิรันดร์", ty: "C", atkb: 0, pdb: 10, idb: 10, hpb: 700, mpb: 0, st: {}, eff: { t: "hp_regen", v: 5 } },
  { id: "C5", n: "ประดับมังกรเทพ", ty: "C", atkb: 15, pdb: 5, idb: 5, hpb: 565, mpb: 0, pab: 10, crib: 5, st: {}, eff: { t: "pct_reduce", v: 8 } },

  // ─── Artisan-shop tier 0-1 roster ──────────────────────────────────
  // Items in this block are sold by the new artisan NPCs (city / villageP
  // / sect — see lib/world/data/artisans.ts). They sit BELOW the W1–W5
  // legendary ladder above so the player can equip something from day 1
  // without finding rare drops. ID prefix: `eq_t<tier>_<slot>_<flavor>`.
  // Stat budget per slot is intentionally small — these are starter
  // gear, not late-game pieces.

  // ── tier 0 weapons (forge) — 6 weapon families
  { id: "eq_t0_w_fist",   n: "นวมไม้ฝึกหมัด",      ty: "W", atkb: 14, pdb: 0, idb: 0, hpb: 6, mpb: 0, pab: 4, crib: 2, st: {}, eff: null },
  { id: "eq_t0_w_long",   n: "ทวนไม้ฝึก",          ty: "W", atkb: 16, pdb: 1, idb: 1, hpb: 26, mpb: 0, pab: 4, crib: 2, st: {}, eff: null },
  { id: "eq_t0_w_sword",  n: "กระบี่ไม้ฝึก",        ty: "W", atkb: 12, pdb: 2, idb: 2, hpb: 0, mpb: 24, iab: 4, spdb: 2, evab: 2, st: {}, eff: null },
  { id: "eq_t0_w_blade",  n: "ดาบไม้ฝึก",          ty: "W", atkb: 20, pdb: 0, idb: 0, hpb: 9, mpb: 0, pab: 6, crib: 3, st: {}, eff: null },
  { id: "eq_t0_w_short",  n: "พัดฝึกฝีมือ",         ty: "W", atkb: 11, pdb: 4, idb: 4, hpb: 0, mpb: 38, iab: 4, st: {}, eff: null },
  { id: "eq_t0_w_hidden", n: "เข็มฝึกซ้อม",         ty: "W", atkb: 9, pdb: 0, idb: 0, hpb: 0, mpb: 0, pab: 3, iab: 3, accb: 6, st: {}, eff: null },

  // ── tier 0 armor (forge metal: iron / tailoring cloth)
  { id: "eq_t0_a_cloth",  n: "เสื้อผ้าฝ้ายเรียบ",    ty: "A", atkb: 0, pdb: 18,  idb: 12, hpb: 0, mpb: 0, st: {},                  eff: null },
  { id: "eq_t0_h_cloth",  n: "ผ้าโพกหัว",           ty: "H", atkb: 0, pdb: 8,   idb: 5,  hpb: 0, mpb: 0, st: {},                  eff: null },
  { id: "eq_t0_b_cloth",  n: "รองเท้าฟาง",          ty: "B", atkb: 2, pdb: 6, idb: 4, hpb: 0, mpb: 0, spdb: 4, evab: 4, st: {}, eff: null },
  { id: "eq_t0_br_cloth", n: "ปลอกแขนผ้าฝ้าย",     ty: "BR",atkb: 0, pdb: 5,   idb: 3,  hpb: 0, mpb: 0, st: {},                  eff: null },
  { id: "eq_t0_a_iron",   n: "เกราะแผ่นเหล็กเล็ก",  ty: "A", atkb: 0, pdb: 31, idb: 21, hpb: 30, mpb: 0, resb: 1, st: {}, eff: null },
  { id: "eq_t0_h_iron",   n: "หมวกเหล็กบาง",        ty: "H", atkb: 0, pdb: 16, idb: 11, hpb: 20, mpb: 0, resb: 1, st: {}, eff: null },
  { id: "eq_t0_b_iron",   n: "รองเท้าหุ้มเหล็ก",     ty: "B", atkb: 0, pdb: 14, idb: 10, hpb: 20, mpb: 0, resb: 1, st: {}, eff: null },
  { id: "eq_t0_br_iron",  n: "ปลอกแขนเหล็กบาง",    ty: "BR",atkb: 6, pdb: 8, idb: 5, hpb: 6, mpb: 0, pab: 4, crib: 2, st: {}, eff: null },

  // ── tier 0 accessories (jewelry / accessory)
  { id: "eq_t0_r_copper", n: "แหวนทองแดง",         ty: "R", atkb: 0, pdb: 0, idb: 0, hpb: 60,  mpb: 30, st: {},                   eff: null },
  { id: "eq_t0_c_cloth",  n: "เครื่องรางผ้าแดง",   ty: "C", atkb: 0, pdb: 0, idb: 0, hpb: 100, mpb: 0, pab: 2, iab: 2, crib: 2, resb: 2, st: {}, eff: null },

  // ── tier 1 weapons (forge)
  { id: "eq_t1_w_fist",   n: "หมัดเหล็ก",          ty: "W", atkb: 33, pdb: 2, idb: 2, hpb: 55, mpb: 0, pab: 10, crib: 5, st: {}, eff: null },
  { id: "eq_t1_w_long",   n: "ทวนเหล็ก",          ty: "W", atkb: 40, pdb: 0, idb: 0, hpb: 15, mpb: 0, pab: 10, spdb: 6, evab: 6, crib: 5, st: {}, eff: null },
  { id: "eq_t1_w_sword",  n: "กระบี่เหล็ก",        ty: "W", atkb: 28, pdb: 4, idb: 4, hpb: 0, mpb: 48, pab: 4, iab: 12, accb: 8, st: {}, eff: null },
  { id: "eq_t1_w_blade",  n: "ดาบเหล็กกล้า",      ty: "W", atkb: 42, pdb: 0, idb: 0, hpb: 18, mpb: 0, pab: 12, crib: 6, st: {}, eff: null },
  { id: "eq_t1_w_short",  n: "พัดเหล็กบาง",        ty: "W", atkb: 28, pdb: 12, idb: 12, hpb: 0, mpb: 84, iab: 8, st: {}, eff: null },
  { id: "eq_t1_w_hidden", n: "เข็มเหล็กพิษอ่อน",  ty: "W", atkb: 20, pdb: 0, idb: 0, hpb: 0, mpb: 0, pab: 9, iab: 9, accb: 12, crib: 3, resb: 3, st: {}, eff: { t: "on_hit", db: { t: "debuff_eva", v: -5, u: 1 } } },

  // ── tier 1 armor — leather/iron
  { id: "eq_t1_a_leather",  n: "เสื้อหนัง",          ty: "A", atkb: 0, pdb: 48, idb: 35, hpb: 140, mpb: 0, resb: 2, st: {}, eff: null },
  { id: "eq_t1_h_leather",  n: "หมวกหนังบุนวม",    ty: "H", atkb: 0, pdb: 20, idb: 15, hpb: 80, mpb: 0, st: {}, eff: null },
  { id: "eq_t1_b_leather",  n: "รองเท้าหนังหนา",    ty: "B", atkb: 7, pdb: 14, idb: 10, hpb: 0, mpb: 0, pab: 2, iab: 2, spdb: 10, evab: 10, accb: 4, st: {}, eff: null },
  { id: "eq_t1_br_leather", n: "ปลอกแขนหนัง",      ty: "BR",atkb: 12, pdb: 10, idb: 8, hpb: 12, mpb: 0, pab: 8, crib: 4, st: {}, eff: null },
  { id: "eq_t1_a_iron",     n: "เกราะเหล็กหนา",     ty: "A", atkb: 0, pdb: 69, idb: 53, hpb: 180, mpb: 0, resb: 4, st: {}, eff: null },
  { id: "eq_t1_h_iron",     n: "หมวกเหล็กแข็ง",     ty: "H", atkb: 0, pdb: 34, idb: 28, hpb: 60, mpb: 0, resb: 3, st: {}, eff: null },
  { id: "eq_t1_b_iron",     n: "รองเท้าเหล็กแข็ง",   ty: "B", atkb: 0, pdb: 31, idb: 26, hpb: 110, mpb: 0, resb: 2, st: {}, eff: null },
  { id: "eq_t1_br_iron",    n: "ปลอกแขนเหล็กหนา",  ty: "BR",atkb: 15, pdb: 20, idb: 16, hpb: 45, mpb: 0, pab: 10, crib: 5, resb: 1, st: {}, eff: null },

  // ── tier 1 accessories
  { id: "eq_t1_r_silver",   n: "แหวนเงิน",          ty: "R", atkb: 0, pdb: 0, idb: 0, hpb: 100, mpb: 60, pab: 3, iab: 3, crib: 3, resb: 3, st: {}, eff: null },
  { id: "eq_t1_c_wood",     n: "เครื่องรางไม้แกะสลัก", ty: "C", atkb: 0, pdb: 3, idb: 3, hpb: 240, mpb: 0, st: {}, eff: null },

  // ── city specialties — limited to specific city artisans (see
  // CITY_EQUIPMENT_SPECIALTIES in lib/world/data/artisans.ts)
  { id: "eq_xixia_w_blade",   n: "ดาบเหล็กชายแดน",    ty: "W", atkb: 51, pdb: 3, idb: 3, hpb: 81, mpb: 0, pab: 14, crib: 7, st: {}, eff: null },
  { id: "eq_yangzhou_w_blade",n: "ดาบโค้งแม่น้ำ",      ty: "W", atkb: 36, pdb: 0, idb: 0, hpb: 0, mpb: 0, pab: 4, iab: 4, spdb: 12, evab: 12, accb: 8, st: {}, eff: { t: "flat_eva", v: 8 } },
  { id: "eq_suzhou_a_silk",   n: "เสื้อผ้าไหมซูโจว",   ty: "A", atkb: 15, pdb: 43, idb: 53, hpb: 0, mpb: 110, iab: 10, st: {}, eff: null },
  { id: "eq_jinling_r_jade",  n: "แหวนหยกจินหลิง",    ty: "R", atkb: 13, pdb: 13, idb: 13, hpb: 140, mpb: 156, iab: 6, st: {}, eff: null },
  { id: "eq_dali_c_herb",     n: "เครื่องรางสมุนไพรต้าหลี่", ty: "C", atkb: 0, pdb: 4, idb: 4, hpb: 300, mpb: 0, st: {}, eff: { t: "hp_regen", v: 2 } },
  { id: "eq_changan_br_iron", n: "ปลอกแขนทหารราชสำนัก", ty: "BR",atkb: 18, pdb: 26, idb: 22, hpb: 58, mpb: 0, pab: 12, crib: 6, resb: 2, st: {}, eff: null },
  { id: "eq_capital_c_seal",  n: "ตราประทับนครหลวง",   ty: "C", atkb: 0, pdb: 0, idb: 0, hpb: 200, mpb: 60, pab: 4, iab: 4, crib: 4, resb: 4, st: {}, eff: { t: "pct_atk", v: 4 } },
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
