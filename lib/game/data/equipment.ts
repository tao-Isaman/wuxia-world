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
