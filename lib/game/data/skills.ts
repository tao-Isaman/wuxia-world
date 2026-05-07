import type { Skill } from "../types";

// ─── Move skills (วิชาฝีมือ) ─────────────────────────────────────────
//
// 80+ skills across 5 tiers, organised by sect first, then by tier.
// Sects mirror lib/world/data/world-map.ts; unaffiliated / generic
// techniques live under "ยุทธจักร" (JIANGHU_SECT) at the bottom.
//
// Field shorthand (kept identical to demo.html for cross-referencing):
//   sc  = sect of origin
//   ti  = tier index (0..4)
//   w   = weapon family (mastery key)
//   mg  = mastery gain on equip (cap 200 per weapon)
//   bp  = base power, p = % boost on bp, f = flat add, dm = dmg mult
//   dr  = drain % of damage dealt → caster HP
//   se  = effect on self,  ee = effect on enemy
//   types = philosophical tags (yin / yang / hard / soft / internal /
//           external / balance) feeding lib/game/skill-conflict.ts
export const SKILLS: readonly Skill[] = [
  // ─── เส้าหลิน ──────────────────────────────────────────────────────
  { id: "sf", n: "หมัดเส้าหลิน", sc: "เส้าหลิน", ti: 0, w: "fist", mg: 20, st: { STR: 5, VIT: 5 }, at: "phy", bp: 42, p: 0, f: 20, dm: 1, se: null, ee: null, d: "Phy+flat20", types: ["external", "hard"] },
  { id: "nd5", n: "อรหันต์พันมือ", sc: "เส้าหลิน", ti: 1, w: "fist", mg: 40, st: { POW: 6, INT: 7 }, at: "int", bp: 42, p: 0, f: 0, dm: 0.9, se: null, ee: { t: "multi_debuff", av: -8, ev: -8, u: 2 }, d: "Int×0.9 + Acc-8 Eva-8", types: ["internal"] },
  { id: "ne1", n: "วิชากรงเล็บมังกร", sc: "เส้าหลิน", ti: 2, w: "fist", mg: 60, st: { STR: 8, VIT: 7 }, at: "phy", bp: 75, p: 25, f: 0, dm: 1, se: null, ee: null, d: "Phy×125% หนักมาก", types: ["yang", "hard"] },
  { id: "ne2", n: "ดาบอรหันต์เส้าหลิน", sc: "เส้าหลิน", ti: 2, w: "sword", mg: 60, st: { STR: 8, DEF: 7 }, at: "phy", bp: 68, p: 0, f: 0, dm: 1, se: { t: "buff_def", v: 20, u: 2 }, ee: null, d: "Phy + DEF+20 (2 ตา)", types: ["external", "hard"] },

  // ─── อู่ตัง ───────────────────────────────────────────────────────
  { id: "tj", n: "ไทจี้เจี้ยน", sc: "อู่ตัง", ti: 0, w: "sword", mg: 20, st: { POW: 5, DEX: 5 }, at: "int", bp: 45, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Int พื้นฐาน", types: ["soft", "internal"] },
  { id: "rf", n: "สะท้อนพลัง", sc: "อู่ตัง", ti: 1, w: "fist", mg: 40, st: { POW: 7, AGI: 5 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: { t: "buff_reflect", v: 50, u: 1 }, ee: null, d: "สะท้อน 50% dmg (1 ตา)", types: ["soft"] },
  { id: "cs", n: "ก้าวเมฆหมอก", sc: "อู่ตัง", ti: 1, w: "fist", mg: 40, st: { AGI: 8, DEX: 5 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: { t: "buff_eva", v: 30, u: 2 }, ee: null, d: "Eva+30 (2 ตา)", types: ["soft"] },
  { id: "yy", n: "หยิน-หยางฝ่า", sc: "อู่ตัง", ti: 2, w: "fist", mg: 60, st: { POW: 8, VIT: 7 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: { t: "heal_buff", hp: 20, bt: "buff_def", bv: 15, bu: 2 }, ee: null, d: "ฟื้น 20%HP + DEF+15 (2 ตา)", types: [] },

  // ─── หัวซาน ───────────────────────────────────────────────────────
  { id: "dgjj", n: "เก้ากระบี่เดียวดาย", sc: "หัวซาน", ti: 4, w: "sword", mg: 100, st: { STR: 6, AGI: 8, DEX: 6 }, at: "phy", bp: 90, p: 30, f: 0, dm: 1.2, se: { t: "buff_spd", v: 60, u: 2 }, ee: { t: "debuff_eva", v: -20, u: 2 }, d: "Phy×130% + SPD+60(2ตา) + Eva-20(2ตา) — 独孤九剑 ทะลุทุกวิชา", types: ["yang"] },

  // ─── ฉวนเจิน ──────────────────────────────────────────────────────
  { id: "qzjf", n: "กระบี่ชวนจินก่า", sc: "ฉวนเจิน", ti: 2, w: "sword", mg: 60, st: { POW: 8, INT: 7, DEX: 5 }, at: "int", bp: 60, p: 0, f: 0, dm: 1.1, se: { t: "buff_reflect", v: 35, u: 1 }, ee: { t: "debuff_acc", v: -14, u: 2 }, d: "Int×1.1 + สะท้อน 35%(1ตา) + Acc-14(2ตา) — 全真剑法 หนึ่งกระบี่สามทิศ", types: ["yang", "internal"] },
  { id: "qz_punch", n: "หมัดชวนจินก่า", sc: "ฉวนเจิน", ti: 2, w: "fist", mg: 60, st: { POW: 7, INT: 6, DEX: 5 }, at: "int", bp: 58, p: 15, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -12, u: 2 }, d: "Int+15% + PDef-12 (2 ตา) — หมัดชวนจินก่า", types: ["yang", "internal"] },

  // ─── กู่มู่ (โบราณสุสาน) ─────────────────────────────────────────
  { id: "gm_sword", n: "กระบี่สุสานโบราณ", sc: "กู่มู่", ti: 3, w: "sword", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 65, p: 0, f: 0, dm: 1.1, se: { t: "buff_eva", v: 18, u: 2 }, ee: { t: "debuff_acc", v: -12, u: 2 }, d: "Int×1.1 + Eva+18(2ตา) + Acc-12(2ตา) — กระบี่สุสานโบราณ", types: ["yin", "internal"] },
  { id: "ynss", n: "เพลงกระบี่สุรางคนางค์ใจพิสุทธิ์", sc: "กู่มู่", ti: 3, w: "sword", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 72, p: 0, f: 0, dm: 1.1, se: null, ee: { t: "multi_debuff", av: -15, ev: -15, u: 2 }, d: "Int×1.1 + Acc-15 Eva-15(2ตา) — 玉女素心剑 กระบี่คู่สุรางคนาง", types: ["yin", "internal"] },
  { id: "ansh", n: "ฝ่ามือกำสรดวิญญาณสลาย", sc: "กู่มู่", ti: 4, w: "fist", mg: 100, st: { STR: 8, POW: 8, INT: 4 }, at: "int", bp: 85, p: 0, f: 0, dm: 1.2, se: { t: "stack_atk", v: 12, mx: 2 }, ee: { t: "debuff_acc", v: -18, u: 2 }, d: "Int×1.2 + ATK+12%(≤2ซ้อน) + Acc-18(2ตา) — 黯然销魂掌 ยิ่งเศร้ายิ่งแกร่ง", types: ["yin", "internal"] },

  // ─── พรรคยาจก ─────────────────────────────────────────────────────
  { id: "nc1", n: "ประกาศิตพรรคยาจก", sc: "พรรคยาจก", ti: 0, w: "fist", mg: 20, st: { STR: 5, VIT: 5 }, at: "phy", bp: 40, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Phy ฝ่ามือพรรคยาจก", types: ["external"] },
  { id: "nc2", n: "ไม้เท้าตีสุนัข", sc: "พรรคยาจก", ti: 0, w: "long", mg: 20, st: { STR: 5, AGI: 5 }, at: "phy", bp: 50, p: 0, f: 5, dm: 1, se: null, ee: null, d: "Phy ไม้เท้าพรรคยาจก", types: ["external"] },
  { id: "ne8", n: "หมัดเมา", sc: "พรรคยาจก", ti: 2, w: "fist", mg: 60, st: { STR: 7, AGI: 8 }, at: "phy", bp: 62, p: 0, f: 0, dm: 1, dr: 20, se: null, ee: { t: "debuff_eva", v: -12, u: 2 }, d: "Phy ดูด20% + Eva-12", types: ["soft"] },
  { id: "ep", n: "18 ฝ่ามือมังกร", sc: "พรรคยาจก", ti: 4, w: "fist", mg: 100, st: { STR: 8, POW: 6, VIT: 4 }, at: "phy", bp: 90, p: 30, f: 0, dm: 1, se: null, ee: null, d: "Phy×130% หนักมาก", types: ["yang", "hard", "external"] },
  { id: "ng3", n: "ฝ่ามือจับมังกร", sc: "พรรคยาจก", ti: 3, w: "fist", mg: 80, st: { STR: 10, VIT: 6, POW: 4 }, at: "phy", bp: 95, p: 30, f: 0, dm: 1, dr: 25, se: null, ee: null, d: "Phy×80% + ดูด 25% HP", types: ["yang", "hard"] },

  // ─── พรรคสว่างมืด (มิ่งเจี้ยว) ───────────────────────────────────
  { id: "mi_firepalm", n: "ฝ่ามือเพลิง", sc: "พรรคสว่างมืด", ti: 4, w: "fist", mg: 100, st: { STR: 8, POW: 8, AGI: 4 }, at: "phy", bp: 85, p: 30, f: 0, dm: 1.2, se: null, ee: { t: "debuff_def", v: -22, u: 3 }, d: "Phy×130%×1.2 + PDef-22 (3ตา) — ฝ่ามือเพลิง", types: ["yang", "hard"] },

  // ─── พรรคสราญรมย์ (เซียวหยาว) ────────────────────────────────────
  { id: "xy_punch", n: "เพลงหมัดสราญรมย์", sc: "พรรคสราญรมย์", ti: 3, w: "fist", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 65, p: 20, f: 0, dm: 1.1, se: { t: "stack_atk", v: 6, mx: 3 }, ee: null, d: "Int+20%×1.1 + ATK+6%(≤3ซ้อน) — เพลงหมัดสราญรมย์", types: ["yin", "internal"] },
  { id: "yxjf", n: "กระบี่ขลุ่ยหยก", sc: "พรรคสราญรมย์", ti: 3, w: "sword", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 65, p: 0, f: 0, dm: 1.1, se: { t: "heal_pct", v: 10 }, ee: { t: "debuff_eva", v: -20, u: 2 }, d: "Int×1.1 + ฟื้น 10%HP + Eva-20 (2 ตา) — 玉箫剑法", types: ["yin", "internal"] },
  { id: "lmsj", n: "กระบี่ 6 ชีพจร", sc: "พรรคสราญรมย์", ti: 4, w: "fist", mg: 100, st: { POW: 9, INT: 8, DEX: 3 }, at: "int", bp: 100, p: 40, f: 0, dm: 1.2, se: { t: "stack_atk", v: 10, mx: 2 }, ee: null, d: "Int×120% bp×140% + ATK+10% (≤2 ซ้อน) — 六脉神剑 ต้องการพลังมหาศาล", types: ["yang", "internal"] },
  { id: "xy_palm", n: "ฝ่ามือสราญรมย์", sc: "พรรคสราญรมย์", ti: 4, w: "fist", mg: 100, st: { POW: 10, INT: 8, AGI: 2 }, at: "int", bp: 90, p: 25, f: 0, dm: 1.2, dr: 30, se: null, ee: { t: "debuff_acc", v: -22, u: 3 }, d: "Int×120%×1.25 + ดูด 30%HP + Acc-22(3ตา) — ฝ่ามือสราญรมย์", types: ["yin", "internal"] },

  // ─── สำนักดาวดึงส์ (เห็งซัว / Xingxiu) ───────────────────────────
  { id: "xx_palm", n: "ฝ่ามือพิษสลายพลัง", sc: "สำนักดาวดึงส์", ti: 3, w: "fist", mg: 80, st: { POW: 8, INT: 8, DEX: 4 }, at: "int", bp: 65, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_poison", pp: 5, u: 3, ev: -10 }, d: "Int + พิษ 5%HP/ตา + Eva-10 (3ตา) — ฝ่ามือพิษสลายพลัง", types: ["yin", "internal"] },

  // ─── พรรคเบญจพิษ ─────────────────────────────────────────────────
  { id: "wd_palm", n: "ฝ่ามือพิษห้าธาตุ", sc: "พรรคเบญจพิษ", ti: 4, w: "fist", mg: 100, st: { DEX: 8, LUK: 7, POW: 5 }, at: "phy", bp: 80, p: 25, f: 0, dm: 1, se: null, ee: { t: "heavy_poison", pp: 7, u: 4, av: -12, ev: -10 }, d: "Phy×125% + พิษหนัก 7%HP/ตา + Acc-12 Eva-10 (4ตา) — ฝ่ามือพิษห้าธาตุ", types: ["yin", "soft"] },

  // ─── สำนักดาบโลหิต ───────────────────────────────────────────────
  { id: "bs", n: "ดาบอสุรี", sc: "สำนักดาบโลหิต", ti: 3, w: "blade", mg: 80, st: { STR: 10, AGI: 8 }, at: "phy", bp: 80, p: 0, f: 0, dm: 1, dr: 30, se: null, ee: null, d: "Phy + ดูด 30% dmg → HP", types: ["yang", "hard"] },
  { id: "nf6", n: "ดาบยาวสีเลือด", sc: "สำนักดาบโลหิต", ti: 3, w: "blade", mg: 80, st: { STR: 10, DEX: 8 }, at: "phy", bp: 90, p: 0, f: 0, dm: 1, dr: 35, se: null, ee: null, d: "Phy + ดูด 35% HP", types: ["yang", "hard"] },

  // ─── ยุทธจักร (Jianghu — generic / unaffiliated) ─────────────────
  // ─── tier 0 ────────
  { id: "basic_punch", n: "หมัดตรง", sc: "ยุทธจักร", ti: 0, w: "fist", mg: 10, st: { STR: 2 }, at: "phy", bp: 25, p: 0, f: 0, dm: 1, se: null, ee: null, d: "หมัดเริ่มต้นสำหรับมือใหม่", types: ["external"] },
  { id: "qf", n: "ชิงเฟิงเจี้ยน", sc: "ยุทธจักร", ti: 0, w: "sword", mg: 20, st: { STR: 5, AGI: 5 }, at: "phy", bp: 40, p: 20, f: 0, dm: 1, se: null, ee: null, d: "Phy+20%", types: ["external"] },
  { id: "dg", n: "ดามอกุน", sc: "ยุทธจักร", ti: 0, w: "long", mg: 20, st: { STR: 6, VIT: 4 }, at: "phy", bp: 55, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Phy พลองหนัก", types: ["external", "hard"] },
  { id: "gn", n: "เข็มทอง", sc: "ยุทธจักร", ti: 0, w: "hidden", mg: 20, st: { DEX: 7, LUK: 3 }, at: "phy", bp: 30, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Phy ระยะไกล", types: ["external"] },
  { id: "ns1", n: "กระบี่เบื้องต้น", sc: "ยุทธจักร", ti: 0, w: "sword", mg: 20, st: { STR: 5, AGI: 5 }, at: "phy", bp: 38, p: 0, f: 10, dm: 1, se: null, ee: null, d: "Phy กระบี่พื้นฐาน", types: ["external"] },
  { id: "ns2", n: "ขอเกี่ยวเบื้องต้น", sc: "ยุทธจักร", ti: 0, w: "hidden", mg: 20, st: { STR: 5, DEX: 5 }, at: "phy", bp: 35, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Phy ขอเกี่ยวพื้นฐาน", types: ["external"] },
  { id: "nc3", n: "กระบี่น้ำ", sc: "ยุทธจักร", ti: 0, w: "sword", mg: 20, st: { POW: 5, INT: 5 }, at: "int", bp: 35, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Int กระบี่สายน้ำ", types: ["internal"] },
  { id: "nc4", n: "ฝ่ามือเมฆ", sc: "ยุทธจักร", ti: 0, w: "fist", mg: 20, st: { STR: 5, POW: 5 }, at: "phy", bp: 40, p: 0, f: 10, dm: 1, se: null, ee: null, d: "Phy ฝ่ามือธรรมดา", types: ["external"] },
  { id: "nc5", n: "ทวนเบื้องต้น", sc: "ยุทธจักร", ti: 0, w: "long", mg: 20, st: { STR: 6, VIT: 4 }, at: "phy", bp: 52, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Phy ทวนพื้นฐาน", types: ["external"] },
  { id: "nc6", n: "กระบองสั้น", sc: "ยุทธจักร", ti: 0, w: "long", mg: 20, st: { STR: 5, DEF: 5 }, at: "phy", bp: 48, p: 0, f: 5, dm: 1, se: null, ee: null, d: "Phy กระบองสั้น", types: ["external"] },
  { id: "nc7", n: "ดาบยาวพื้นฐาน", sc: "ยุทธจักร", ti: 0, w: "blade", mg: 20, st: { STR: 7, VIT: 3 }, at: "phy", bp: 58, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Phy ดาบยาวสองมือ", types: ["external"] },
  { id: "nc8", n: "แส้เบื้องต้น", sc: "ยุทธจักร", ti: 0, w: "hidden", mg: 20, st: { AGI: 5, DEX: 5 }, at: "phy", bp: 32, p: 0, f: 8, dm: 1, se: null, ee: null, d: "Phy แส้พื้นฐาน", types: ["external", "soft"] },
  { id: "nc9", n: "พัดพื้นฐาน", sc: "ยุทธจักร", ti: 0, w: "short", mg: 20, st: { POW: 5, INT: 5 }, at: "int", bp: 30, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Int พัดสายใน", types: ["internal"] },
  { id: "nc10", n: "ขอเกี่ยวพื้นฐาน", sc: "ยุทธจักร", ti: 0, w: "hidden", mg: 20, st: { STR: 5, DEX: 5 }, at: "phy", bp: 35, p: 0, f: 5, dm: 1, se: null, ee: null, d: "Phy ขอเกี่ยวพื้นฐาน", types: ["external"] },

  // ─── tier 0 — beast moves (สัตว์ป่า) ─────────────
  // Used by hunting-zone beasts. Intentionally weaker bp than the human
  // tier 0 skills above — random-event beasts of the same tier should
  // hit harder than these.
  { id: "bst_bite", n: "เขี้ยวงับ", sc: "ยุทธจักร", ti: 0, w: "fist", mg: 10, st: { STR: 3 }, at: "phy", bp: 24, p: 0, f: 0, dm: 1, se: null, ee: null, d: "เขี้ยวงับ — กัดด้วยกำลังกาย", types: ["external"] },
  { id: "bst_claw", n: "กรงเล็บฉีก", sc: "ยุทธจักร", ti: 0, w: "fist", mg: 10, st: { STR: 2, AGI: 2 }, at: "phy", bp: 28, p: 0, f: 0, dm: 1, se: null, ee: null, d: "ฟันด้วยกรงเล็บคม", types: ["external"] },
  { id: "bst_charge", n: "พุ่งเข้าชน", sc: "ยุทธจักร", ti: 0, w: "fist", mg: 10, st: { STR: 3, VIT: 2 }, at: "phy", bp: 30, p: 0, f: 0, dm: 1, se: null, ee: null, d: "วิ่งพุ่งชนด้วยน้ำหนักตัว", types: ["external", "hard"] },

  // ─── tier 1 ────────
  { id: "ig", n: "หมัดเกราะเพชร", sc: "ยุทธจักร", ti: 1, w: "fist", mg: 40, st: { VIT: 7, DEF: 6 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: { t: "buff_reduce", v: 30, u: 2 }, ee: null, d: "ลด dmg 30% (2 ตา)", types: ["hard"] },
  { id: "dp", n: "ฝ่ามือมังกร", sc: "ยุทธจักร", ti: 1, w: "fist", mg: 40, st: { STR: 7, DEX: 6 }, at: "phy", bp: 50, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -12, u: 2 }, d: "Phy + Eva-12 (2 ตา)", types: ["yang"] },
  { id: "pn", n: "เข็มพิษ", sc: "ยุทธจักร", ti: 1, w: "hidden", mg: 40, st: { DEX: 7, LUK: 6 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_poison", pp: 4, u: 3, ev: -8 }, d: "พิษ 4%HP/ตา + Eva-8 (3 ตา)", types: ["yin", "soft"] },
  { id: "nm1", n: "ดาบน้ำค้าง", sc: "ยุทธจักร", ti: 1, w: "blade", mg: 40, st: { POW: 6, INT: 6 }, at: "int", bp: 42, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -12, u: 2 }, d: "Int + PDef-12 (2 ตา)", types: ["internal"] },
  { id: "nm2", n: "ฝ่ามือเกราะ", sc: "ยุทธจักร", ti: 1, w: "fist", mg: 40, st: { STR: 6, DEF: 6 }, at: "phy", bp: 46, p: 0, f: 0, dm: 1, se: { t: "buff_def", v: 15, u: 2 }, ee: null, d: "Phy + บัฟตัวเอง DEF+15 (2 ตา)", types: ["external", "hard"] },
  { id: "nd1", n: "แส้แปดทิศ", sc: "ยุทธจักร", ti: 1, w: "hidden", mg: 40, st: { AGI: 7, DEX: 6 }, at: "phy", bp: 48, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -12, u: 2 }, d: "Phy Eva-12 (2 ตา)", types: ["soft"] },
  { id: "nd2", n: "พัดนกยูง", sc: "ยุทธจักร", ti: 1, w: "short", mg: 40, st: { POW: 7, INT: 6 }, at: "int", bp: 40, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_acc", v: -12, u: 2 }, d: "Int Acc-12 (2 ตา)", types: ["internal"] },
  { id: "nd3", n: "ดาบดาวเหนือ", sc: "ยุทธจักร", ti: 1, w: "sword", mg: 40, st: { STR: 7, DEX: 6 }, at: "phy", bp: 52, p: 15, f: 0, dm: 1, se: null, ee: null, d: "Phy+15%", types: ["external"] },
  { id: "nd4", n: "ทวนลม", sc: "ยุทธจักร", ti: 1, w: "long", mg: 40, st: { STR: 8, AGI: 5 }, at: "phy", bp: 58, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -10, u: 2 }, d: "Phy Eva-10 (2 ตา)", types: ["external"] },
  { id: "nd6", n: "กระบี่หยาง", sc: "ยุทธจักร", ti: 1, w: "sword", mg: 40, st: { POW: 7, INT: 6 }, at: "int", bp: 44, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -12, u: 2 }, d: "Int PDef-12 (2 ตา)", types: ["yang", "internal"] },
  { id: "nd7", n: "ฝ่ามือเสือ", sc: "ยุทธจักร", ti: 1, w: "fist", mg: 40, st: { STR: 8, VIT: 5 }, at: "phy", bp: 52, p: 0, f: 0, dm: 1, se: { t: "buff_reduce", v: 20, u: 2 }, ee: null, d: "Phy + ลดdmg20% (2 ตา)", types: ["external", "hard"] },
  { id: "nd8", n: "แส้เหล็กดูดชีพ", sc: "ยุทธจักร", ti: 1, w: "hidden", mg: 40, st: { DEX: 7, AGI: 6 }, at: "phy", bp: 44, p: 0, f: 0, dm: 1, dr: 20, se: null, ee: null, d: "Phy + ดูด 20% HP", types: ["yin"] },
  { id: "nd9", n: "เข็มตีจุด", sc: "ยุทธจักร", ti: 1, w: "hidden", mg: 40, st: { DEX: 8, LUK: 5 }, at: "phy", bp: 35, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_acc", v: -15, u: 2 }, d: "Phy Acc-15 (2 ตา)", types: ["soft"] },
  { id: "nd10", n: "กรงเล็บเพลิง", sc: "ยุทธจักร", ti: 1, w: "fist", mg: 40, st: { STR: 7, POW: 6 }, at: "phy", bp: 50, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -12, u: 2 }, d: "Phy PDef-12 (2 ตา)", types: ["yang"] },
  { id: "nd11", n: "กระบี่ลม", sc: "ยุทธจักร", ti: 1, w: "sword", mg: 40, st: { AGI: 8, STR: 5 }, at: "phy", bp: 45, p: 0, f: 0, dm: 1, se: { t: "buff_eva", v: 20, u: 2 }, ee: null, d: "Phy + Eva+20 (2 ตา)", types: ["soft"] },
  { id: "nd12", n: "ฝ่ามือสร้างกำแพง", sc: "ยุทธจักร", ti: 1, w: "fist", mg: 40, st: { STR: 6, DEF: 6 }, at: "phy", bp: 46, p: 0, f: 0, dm: 1, se: { t: "buff_def", v: 15, u: 2 }, ee: null, d: "Phy + DEF+15 (2 ตา)", types: ["hard"] },

  // ─── tier 1 — beast moves (สัตว์ป่า) ─────────────
  // Mid-strength predator attacks. Lower bp than the tier 1 human skills
  // above; small flat / debuff effects keep them threatening but not on
  // par with random-event tier 1 styles.
  { id: "bst_pounce", n: "ตะปบโหม", sc: "ยุทธจักร", ti: 1, w: "fist", mg: 25, st: { STR: 5, AGI: 4 }, at: "phy", bp: 38, p: 0, f: 0, dm: 1, se: null, ee: null, d: "พุ่งตะปบใส่ศัตรู", types: ["external"] },
  { id: "bst_fang", n: "เขี้ยวพิษอ่อน", sc: "ยุทธจักร", ti: 1, w: "hidden", mg: 25, st: { DEX: 5, LUK: 3 }, at: "phy", bp: 30, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_poison", pp: 2, u: 2, ev: -5 }, d: "เขี้ยวมีพิษเล็กน้อย — พิษ 2%HP/ตา + Eva-5 (2 ตา)", types: ["yin"] },
  { id: "bst_roar", n: "คำรามขู่", sc: "ยุทธจักร", ti: 1, w: "fist", mg: 25, st: { STR: 4, VIT: 4 }, at: "phy", bp: 35, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_acc", v: -8, u: 2 }, d: "เสียงคำรามทำให้ศัตรูพะวง — Acc-8 (2 ตา)", types: [] },

  // ─── tier 2 ────────
  { id: "ws", n: "สองดาบล่องลม", sc: "ยุทธจักร", ti: 2, w: "blade", mg: 60, st: { STR: 8, AGI: 7 }, at: "phy", bp: 60, p: 0, f: 0, dm: 1, se: { t: "stack_atk", v: 5, mx: 4 }, ee: null, d: "Phy + สะสม ATK+5% (≤4 ซ้อน)", types: ["external"] },
  { id: "sa", n: "คีตาอาคม", sc: "ยุทธจักร", ti: 2, w: "music", mg: 60, st: { POW: 8, INT: 7 }, at: "int", bp: 30, p: 0, f: 0, dm: 0.7, se: null, ee: { t: "debuff_acc", v: -18, u: 3 }, d: "Int×0.7 + Acc-18 (3 ตา)", types: ["yin", "internal"] },
  { id: "fs", n: "กระบองเพลิง", sc: "ยุทธจักร", ti: 2, w: "long", mg: 60, st: { STR: 9, POW: 6 }, at: "phy", bp: 65, p: 20, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -15, u: 2 }, d: "Phy+20% + PDef-15 (2 ตา)", types: ["yang"] },
  { id: "ch", n: "โซ่เกี่ยวสังหาร", sc: "ยุทธจักร", ti: 2, w: "hidden", mg: 60, st: { STR: 8, DEX: 7 }, at: "phy", bp: 55, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -20, u: 2 }, d: "Phy + Eva-20 (2 ตา)", types: ["external"] },
  { id: "na1", n: "กระบี่ดาวเหนือ", sc: "ยุทธจักร", ti: 2, w: "sword", mg: 60, st: { POW: 8, INT: 7 }, at: "int", bp: 60, p: 0, f: 0, dm: 1.1, se: null, ee: { t: "debuff_eva", v: -15, u: 2 }, d: "Int×1.1 + Eva-15 (2 ตา)", types: ["internal"] },
  { id: "na2", n: "หมัดมวยจีน", sc: "ยุทธจักร", ti: 2, w: "fist", mg: 60, st: { STR: 8, VIT: 7 }, at: "phy", bp: 58, p: 0, f: 0, dm: 1, se: { t: "heal_pct", v: 8 }, ee: null, d: "Phy + ฟื้น 8% HP", types: ["external"] },
  { id: "ne3", n: "ทวนหมุนฟ้า", sc: "ยุทธจักร", ti: 2, w: "long", mg: 60, st: { STR: 9, AGI: 6 }, at: "phy", bp: 70, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -18, u: 2 }, d: "Phy Eva-18 (2 ตา)", types: ["yang"] },
  { id: "ne4", n: "ดอกบัวนพรัตน์", sc: "ยุทธจักร", ti: 2, w: "short", mg: 60, st: { POW: 8, INT: 7 }, at: "int", bp: 55, p: 0, f: 0, dm: 1.1, se: { t: "heal_pct", v: 15 }, ee: null, d: "Int×1.1 + ฟื้น 15% HP", types: ["yin"] },
  { id: "ne5", n: "กระบี่วิ่งบนน้ำ", sc: "ยุทธจักร", ti: 2, w: "sword", mg: 60, st: { POW: 9, AGI: 6 }, at: "int", bp: 62, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -18, u: 2 }, d: "Int Eva-18 (2 ตา)", types: ["soft", "internal"] },
  { id: "ne6", n: "แส้ทะลุปราการ", sc: "ยุทธจักร", ti: 2, w: "hidden", mg: 60, st: { STR: 8, DEX: 7 }, at: "phy", bp: 65, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -18, u: 2 }, d: "Phy PDef-18 (2 ตา)", types: ["external"] },
  { id: "ne7", n: "ฝ่ามือน้ำแข็ง", sc: "ยุทธจักร", ti: 2, w: "fist", mg: 60, st: { POW: 8, INT: 7 }, at: "int", bp: 58, p: 0, f: 0, dm: 1.1, se: null, ee: { t: "debuff_acc", v: -15, u: 2 }, d: "Int×1.1 Acc-15 (2 ตา)", types: ["yin", "internal"] },
  { id: "ne9", n: "ดาบยาวมังกร", sc: "ยุทธจักร", ti: 2, w: "blade", mg: 60, st: { STR: 9, VIT: 6 }, at: "phy", bp: 80, p: 25, f: 0, dm: 1, se: null, ee: null, d: "Phy×125% ดาบยาวหนัก", types: ["yang", "hard"] },
  { id: "ne10", n: "พลองลม", sc: "ยุทธจักร", ti: 2, w: "long", mg: 60, st: { POW: 9, INT: 6 }, at: "int", bp: 60, p: 0, f: 0, dm: 0.8, se: null, ee: { t: "multi_debuff", av: -15, ev: -12, u: 2 }, d: "Int×0.8 + สองดีบัฟ", types: ["soft", "internal"] },
  { id: "ne11", n: "กรงเล็บสิงห์", sc: "ยุทธจักร", ti: 2, w: "fist", mg: 60, st: { STR: 8, DEX: 7 }, at: "phy", bp: 65, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -15, u: 2 }, d: "Phy PDef-15 (2 ตา)", types: ["yang"] },
  { id: "ne12", n: "กระบี่เก้าฟ้า", sc: "ยุทธจักร", ti: 2, w: "sword", mg: 60, st: { POW: 8, INT: 7 }, at: "int", bp: 65, p: 15, f: 0, dm: 1, se: { t: "stack_atk", v: 6, mx: 3 }, ee: null, d: "Int+15% + สะสม ATK+6%", types: ["internal"] },
  { id: "ne13", n: "ทวนหยินหยาง", sc: "ยุทธจักร", ti: 2, w: "long", mg: 60, st: { STR: 8, POW: 7 }, at: "phy", bp: 68, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_acc", v: -15, u: 2 }, d: "Phy Acc-15 (2 ตา)", types: [] },

  // ─── tier 2 — beast moves (สัตว์ป่า) ─────────────
  // Apex predators. Capped well below ne9 (bp 80) and ne11 (bp 65) so
  // hunt_legendary remains a stamina + drop-rate grind, not a tuning
  // wall.
  { id: "bst_maul", n: "ฉีกตะปบ", sc: "ยุทธจักร", ti: 2, w: "fist", mg: 40, st: { STR: 7, AGI: 5 }, at: "phy", bp: 55, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -10, u: 2 }, d: "ฉีกร่างศัตรูเปิดแผล — PDef-10 (2 ตา)", types: ["external"] },
  { id: "bst_venom", n: "เขี้ยวพิษแรง", sc: "ยุทธจักร", ti: 2, w: "hidden", mg: 40, st: { DEX: 7, LUK: 5 }, at: "phy", bp: 45, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_poison", pp: 4, u: 3, ev: -8 }, d: "พิษเข้มข้น 4%HP/ตา + Eva-8 (3 ตา)", types: ["yin"] },
  { id: "bst_constrict", n: "บีบรัด", sc: "ยุทธจักร", ti: 2, w: "fist", mg: 40, st: { DEX: 6, STR: 6 }, at: "phy", bp: 50, p: 0, f: 0, dm: 1, se: null, ee: { t: "multi_debuff", av: -10, ev: -10, u: 2 }, d: "บีบรัดร่างให้แน่น — Acc-10 Eva-10 (2 ตา)", types: ["external"] },

  // ─── tier 3 ────────
  { id: "zs", n: "กู่ฉินสะท้านจิต", sc: "ยุทธจักร", ti: 3, w: "music", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 50, p: 0, f: 0, dm: 1, se: null, ee: { t: "multi_debuff", av: -15, ev: -15, u: 3 }, d: "Int + Acc-15 Eva-15 (3 ตา)", types: ["yin", "internal"] },
  { id: "nh1", n: "พลองเทวดา", sc: "ยุทธจักร", ti: 3, w: "long", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 65, p: 20, f: 0, dm: 1, se: null, ee: { t: "multi_debuff", av: -12, ev: -12, u: 3 }, d: "Int+20% + Acc-12 Eva-12 (3 ตา)", types: ["internal"] },
  { id: "nh2", n: "กระบี่วิเศษ", sc: "ยุทธจักร", ti: 3, w: "sword", mg: 80, st: { STR: 9, AGI: 9 }, at: "phy", bp: 80, p: 0, f: 0, dm: 1, dr: 25, se: null, ee: null, d: "Phy + ดูด 25% HP", types: ["external"] },
  { id: "yyz", n: "ดัชนีเอกสุริยัน", sc: "ยุทธจักร", ti: 3, w: "fist", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 55, p: 0, f: 0, dm: 1.1, se: null, ee: { t: "debuff_acc", v: -22, u: 3 }, d: "Int×1.1 จี้สกัดจุด Acc-22 (3 ตา) — 一阳指", types: ["yang", "internal"] },
  { id: "nf1", n: "กู่ฉินสังหาร", sc: "ยุทธจักร", ti: 3, w: "music", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 72, p: 0, f: 0, dm: 1.1, se: null, ee: { t: "multi_debuff", av: -18, ev: -18, u: 3 }, d: "Int×1.1 + Acc-18 Eva-18 (3 ตา)", types: ["yin", "internal"] },
  { id: "nf2", n: "ดาบโดดเดี่ยว", sc: "ยุทธจักร", ti: 3, w: "sword", mg: 80, st: { POW: 10, INT: 8 }, at: "int", bp: 75, p: 0, f: 0, dm: 1.1, dr: 25, se: null, ee: null, d: "Int×1.1 + ดูด 25% HP", types: ["yin", "internal"] },
  { id: "nf3", n: "ทวนประทับมังกร", sc: "ยุทธจักร", ti: 3, w: "long", mg: 80, st: { STR: 10, VIT: 8 }, at: "phy", bp: 88, p: 25, f: 0, dm: 1, se: null, ee: null, d: "Phy×125% ทวนสังหาร", types: ["yang", "hard"] },
  { id: "nf4", n: "ฝ่ามือยมฑูต", sc: "ยุทธจักร", ti: 3, w: "fist", mg: 80, st: { STR: 9, POW: 9 }, at: "phy", bp: 82, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_poison", pp: 6, u: 3, ev: -12 }, d: "Phy + พิษ 6%HP/ตา Eva-12 (3 ตา)", types: ["yin"] },
  { id: "nf5", n: "หมัดเพลิง", sc: "ยุทธจักร", ti: 3, w: "fist", mg: 80, st: { STR: 10, AGI: 8 }, at: "phy", bp: 85, p: 30, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -20, u: 2 }, d: "Phy×130% + PDef-20 (2 ตา)", types: ["yang"] },
  { id: "nf7", n: "แส้เก้าหัว", sc: "ยุทธจักร", ti: 3, w: "hidden", mg: 80, st: { DEX: 10, AGI: 8 }, at: "phy", bp: 75, p: 0, f: 0, dm: 1, se: null, ee: { t: "multi_debuff", av: -18, ev: -18, u: 3 }, d: "Phy + Acc-18 Eva-18 (3 ตา)", types: ["soft"] },
  { id: "nf8", n: "พัดเพลิงสวรรค์", sc: "ยุทธจักร", ti: 3, w: "short", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 70, p: 0, f: 0, dm: 1.1, se: null, ee: { t: "debuff_acc", v: -20, u: 2 }, d: "Int×1.1 + Acc-20 (2 ตา)", types: ["yang", "internal"] },

  // ─── tier 4 ────────
  { id: "ft", n: "ขลุ่ยสะท้านฟ้า", sc: "ยุทธจักร", ti: 4, w: "music", mg: 100, st: { POW: 8, INT: 7, AGI: 5 }, at: "int", bp: 75, p: 30, f: 0, dm: 1, se: { t: "buff_reduce", v: 20, u: 2 }, ee: null, d: "Int×130% + ลด dmg 20% (2 ตา)", types: ["yin", "internal"] },
  { id: "nu1", n: "มังกรฟ้า", sc: "ยุทธจักร", ti: 4, w: "blade", mg: 100, st: { POW: 10, INT: 7, AGI: 3 }, at: "int", bp: 90, p: 30, f: 0, dm: 1, se: { t: "stack_atk", v: 8, mx: 3 }, ee: null, d: "Int×130% + ATK+8% (≤3 ซ้อน)", types: ["yang", "internal"] },
  { id: "nu2", n: "หมัดสะท้านจักรวาล", sc: "ยุทธจักร", ti: 4, w: "fist", mg: 100, st: { STR: 10, VIT: 6, POW: 4 }, at: "phy", bp: 95, p: 30, f: 0, dm: 1, se: null, ee: { t: "multi_debuff", av: -20, ev: -20, u: 3 }, d: "Phy×130% + Acc-20 Eva-20 (3 ตา)", types: ["yang", "external"] },
  { id: "ng1", n: "เก้าฟ้าหนึ่งกระบี่", sc: "ยุทธจักร", ti: 4, w: "sword", mg: 100, st: { POW: 9, INT: 8, AGI: 3 }, at: "int", bp: 88, p: 30, f: 0, dm: 1, se: { t: "buff_reduce", v: 25, u: 2 }, ee: null, d: "Int×130% + ลดdmg 25% (2 ตา)", types: ["yang", "internal"] },
  { id: "ng2", n: "ทวนประจักษ์พยาน", sc: "ยุทธจักร", ti: 4, w: "long", mg: 100, st: { STR: 9, VIT: 7, AGI: 4 }, at: "phy", bp: 98, p: 30, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -25, u: 3 }, d: "Phy×130% + Eva-25 (3 ตา)", types: ["yang", "hard"] },
  { id: "ng4", n: "หมัดพระอินทร์", sc: "ยุทธจักร", ti: 4, w: "fist", mg: 100, st: { POW: 10, INT: 7, LUK: 3 }, at: "int", bp: 85, p: 0, f: 0, dm: 1.2, se: null, ee: { t: "multi_debuff", av: -25, ev: -25, u: 3 }, d: "Int×120% + Acc-25 Eva-25 (3 ตา)", types: ["yang", "internal"] },
  { id: "ng5", n: "ดาบยาวเทพสังหาร", sc: "ยุทธจักร", ti: 4, w: "blade", mg: 100, st: { STR: 10, DEX: 6, AGI: 4 }, at: "phy", bp: 100, p: 30, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -25, u: 3 }, d: "Phy×130% + PDef-25 (3 ตา)", types: ["yang", "hard"] },
  { id: "ng6", n: "ขลุ่ยพลิกโลก", sc: "ยุทธจักร", ti: 4, w: "music", mg: 100, st: { POW: 9, INT: 8, DEX: 3 }, at: "int", bp: 82, p: 25, f: 0, dm: 1, se: null, ee: { t: "heavy_poison", pp: 10, u: 4, av: -18, ev: -15 }, d: "Int×125% + พิษ 10%HP/ตา Acc-18 Eva-15", types: ["yin", "internal"] },
];

export const SKILLS_BY_ID: Map<string, Skill> = new Map(SKILLS.map((s) => [s.id, s]));

export function getSkill(id: string | null | undefined): Skill | null {
  if (!id) return null;
  return SKILLS_BY_ID.get(id) ?? null;
}
