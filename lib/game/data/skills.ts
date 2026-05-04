import type { Skill } from "../types";

// 80 skills across 5 tiers. Ported 1:1 from the original demo.
// Field shorthand kept identical so tuning changes can be cross-referenced.
//   ti  = tier index (0..4)
//   w   = weapon family (mastery key)
//   mg  = mastery gain on equip (cap 200 per weapon)
//   bp  = base power, p = % boost on bp, f = flat add, dm = dmg mult
//   dr  = drain % of damage dealt → caster HP
//   se  = effect on self,  ee = effect on enemy
export const SKILLS: readonly Skill[] = [
  // Starter skill — given to fresh world-mode characters. Intentionally weak
  // so progression has somewhere to go.
  { id: "basic_punch", n: "หมัดตรง", ti: 0, w: "กำปั้น", mg: 10, st: { STR: 2 }, at: "phy", bp: 25, p: 0, f: 0, dm: 1, se: null, ee: null, d: "หมัดเริ่มต้นสำหรับมือใหม่" },
  { id: "tj", n: "ไทจี้เจี้ยน", ti: 0, w: "กระบี่", mg: 20, st: { POW: 5, DEX: 5 }, at: "int", bp: 45, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Int พื้นฐาน" },
  { id: "qf", n: "ชิงเฟิงเจี้ยน", ti: 0, w: "กระบี่", mg: 20, st: { STR: 5, AGI: 5 }, at: "phy", bp: 40, p: 20, f: 0, dm: 1, se: null, ee: null, d: "Phy+20%" },
  { id: "dg", n: "ดามอกุน", ti: 0, w: "พลอง", mg: 20, st: { STR: 6, VIT: 4 }, at: "phy", bp: 55, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Phy พลองหนัก" },
  { id: "sf", n: "หมัดเส้าหลิน", ti: 0, w: "กำปั้น", mg: 20, st: { STR: 5, VIT: 5 }, at: "phy", bp: 42, p: 0, f: 20, dm: 1, se: null, ee: null, d: "Phy+flat20" },
  { id: "gn", n: "เข็มทอง", ti: 0, w: "เข็ม", mg: 20, st: { DEX: 7, LUK: 3 }, at: "phy", bp: 30, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Phy ระยะไกล" },
  { id: "rf", n: "สะท้อนพลัง", ti: 1, w: "กำปั้น", mg: 40, st: { POW: 7, AGI: 5 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: { t: "buff_reflect", v: 50, u: 1 }, ee: null, d: "สะท้อน 50% dmg (1 ตา)" },
  { id: "cs", n: "ก้าวเมฆหมอก", ti: 1, w: "ตัวเบา", mg: 40, st: { AGI: 8, DEX: 5 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: { t: "buff_eva", v: 30, u: 2 }, ee: null, d: "Eva+30 (2 ตา)" },
  { id: "ig", n: "เกราะเพชร", ti: 1, w: "กำปั้น", mg: 40, st: { VIT: 7, DEF: 6 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: { t: "buff_reduce", v: 30, u: 2 }, ee: null, d: "ลด dmg 30% (2 ตา)" },
  { id: "dp", n: "ฝ่ามือมังกร", ti: 1, w: "กำปั้น", mg: 40, st: { STR: 7, DEX: 6 }, at: "phy", bp: 50, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -12, u: 2 }, d: "Phy + Eva-12 (2 ตา)" },
  { id: "pn", n: "เข็มพิษ", ti: 1, w: "เข็ม", mg: 40, st: { DEX: 7, LUK: 6 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_poison", pp: 4, u: 3, ev: -8 }, d: "พิษ 4%HP/ตา + Eva-8 (3 ตา)" },
  { id: "ws", n: "สองดาบล่องลม", ti: 2, w: "ดาบโค้ง", mg: 60, st: { STR: 8, AGI: 7 }, at: "phy", bp: 60, p: 0, f: 0, dm: 1, se: { t: "stack_atk", v: 5, mx: 4 }, ee: null, d: "Phy + สะสม ATK+5% (≤4 ซ้อน)" },
  { id: "sa", n: "คีตาอาคม", ti: 2, w: "ขลุ่ย", mg: 60, st: { POW: 8, INT: 7 }, at: "int", bp: 30, p: 0, f: 0, dm: 0.7, se: null, ee: { t: "debuff_acc", v: -18, u: 3 }, d: "Int×0.7 + Acc-18 (3 ตา)" },
  { id: "fs", n: "กระบองเพลิง", ti: 2, w: "พลอง", mg: 60, st: { STR: 9, POW: 6 }, at: "phy", bp: 65, p: 20, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -15, u: 2 }, d: "Phy+20% + PDef-15 (2 ตา)" },
  { id: "yy", n: "หยิน-หยางฝ่า", ti: 2, w: "กำปั้น", mg: 60, st: { POW: 8, VIT: 7 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: { t: "heal_buff", hp: 20, bt: "buff_def", bv: 15, bu: 2 }, ee: null, d: "ฟื้น 20%HP + DEF+15 (2 ตา)" },
  { id: "ch", n: "โซ่เกี่ยวสังหาร", ti: 2, w: "ขอเกี่ยว", mg: 60, st: { STR: 8, DEX: 7 }, at: "phy", bp: 55, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -20, u: 2 }, d: "Phy + Eva-20 (2 ตา)" },
  { id: "ep", n: "18 ฝ่ามือมังกร", ti: 3, w: "กำปั้น", mg: 80, st: { STR: 8, POW: 6, VIT: 4 }, at: "phy", bp: 90, p: 30, f: 0, dm: 1, se: null, ee: null, d: "Phy×130% หนักมาก" },
  { id: "bs", n: "ดาบอสุรี", ti: 3, w: "ดาบโค้ง", mg: 80, st: { STR: 10, AGI: 8 }, at: "phy", bp: 80, p: 0, f: 0, dm: 1, dr: 30, se: null, ee: null, d: "Phy + ดูด 30% dmg → HP" },
  { id: "zs", n: "กู่ฉินสะท้านจิต", ti: 3, w: "ขลุ่ย", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 50, p: 0, f: 0, dm: 1, se: null, ee: { t: "multi_debuff", av: -15, ev: -15, u: 3 }, d: "Int + Acc-15 Eva-15 (3 ตา)" },
  { id: "ft", n: "ขลุ่ยสะท้านฟ้า", ti: 4, w: "ขลุ่ย", mg: 100, st: { POW: 8, INT: 7, AGI: 5 }, at: "int", bp: 75, p: 30, f: 0, dm: 1, se: { t: "buff_reduce", v: 20, u: 2 }, ee: null, d: "Int×130% + ลด dmg 20% (2 ตา)" },
  { id: "np", n: "เบญจพิษรวมกาย", ti: 4, w: "เข็ม", mg: 100, st: { DEX: 8, LUK: 7, POW: 5 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: null, ee: { t: "heavy_poison", pp: 8, u: 4, av: -15, ev: -10 }, d: "พิษ 8%HP/ตา + Acc-15 Eva-10 (4 ตา)" },

  // ─── พื้นฐาน เพิ่ม ───
  { id: "ns1", n: "กระบี่เบื้องต้น", ti: 0, w: "ดาบโค้ง", mg: 20, st: { STR: 5, AGI: 5 }, at: "phy", bp: 38, p: 0, f: 10, dm: 1, se: null, ee: null, d: "Phy ดาบโค้งพื้นฐาน" },
  { id: "ns2", n: "ขอเกี่ยวเบื้องต้น", ti: 0, w: "ขอเกี่ยว", mg: 20, st: { STR: 5, DEX: 5 }, at: "phy", bp: 35, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Phy ขอเกี่ยวพื้นฐาน" },

  // ─── ขั้นกลาง เพิ่ม ───
  { id: "nm1", n: "ดาบน้ำค้าง", ti: 1, w: "ดาบโค้ง", mg: 40, st: { POW: 6, INT: 6 }, at: "int", bp: 42, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -12, u: 2 }, d: "Int + PDef-12 (2 ตา)" },
  { id: "nm2", n: "ฝ่ามือเกราะ", ti: 1, w: "กำปั้น", mg: 40, st: { STR: 6, DEF: 6 }, at: "phy", bp: 46, p: 0, f: 0, dm: 1, se: { t: "buff_def", v: 15, u: 2 }, ee: null, d: "Phy + บัฟตัวเอง DEF+15 (2 ตา)" },

  // ─── ขั้นสูง เพิ่ม ───
  { id: "na1", n: "กระบี่ดาวเหนือ", ti: 2, w: "กระบี่", mg: 60, st: { POW: 8, INT: 7 }, at: "int", bp: 60, p: 0, f: 0, dm: 1.1, se: null, ee: { t: "debuff_eva", v: -15, u: 2 }, d: "Int×1.1 + Eva-15 (2 ตา)" },
  { id: "na2", n: "หมัดมวยจีน", ti: 2, w: "กำปั้น", mg: 60, st: { STR: 8, VIT: 7 }, at: "phy", bp: 58, p: 0, f: 0, dm: 1, se: { t: "heal_pct", v: 8 }, ee: null, d: "Phy + ฟื้น 8% HP" },

  // ─── ลับ เพิ่ม ───
  { id: "nh1", n: "พลองเทวดา", ti: 3, w: "พลอง", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 65, p: 20, f: 0, dm: 1, se: null, ee: { t: "multi_debuff", av: -12, ev: -12, u: 3 }, d: "Int+20% + Acc-12 Eva-12 (3 ตา)" },
  { id: "nh2", n: "กระบี่วิเศษ", ti: 3, w: "กระบี่", mg: 80, st: { STR: 9, AGI: 9 }, at: "phy", bp: 80, p: 0, f: 0, dm: 1, dr: 25, se: null, ee: null, d: "Phy + ดูด 25% dmg → HP" },

  // ─── เฉพาะ เพิ่ม ───
  { id: "nu1", n: "มังกรฟ้า", ti: 4, w: "ดาบโค้ง", mg: 100, st: { POW: 10, INT: 7, AGI: 3 }, at: "int", bp: 90, p: 30, f: 0, dm: 1, se: { t: "stack_atk", v: 8, mx: 3 }, ee: null, d: "Int×130% + ATK+8% (≤3 ซ้อน)" },
  { id: "nu2", n: "หมัดสะท้านจักรวาล", ti: 4, w: "กำปั้น", mg: 100, st: { STR: 10, VIT: 6, POW: 4 }, at: "phy", bp: 95, p: 30, f: 0, dm: 1, se: null, ee: { t: "multi_debuff", av: -20, ev: -20, u: 3 }, d: "Phy×130% + Acc-20 Eva-20 (3 ตา)" },

  // ─── พื้นฐาน เพิ่ม (10) ───
  { id: "nc1", n: "ประกาศิตพรรคยาจก", ti: 0, w: "กำปั้น", mg: 20, st: { STR: 5, VIT: 5 }, at: "phy", bp: 40, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Phy ฝ่ามือพรรคยาจก" },
  { id: "nc2", n: "ไม้เท้าตีสุนัข", ti: 0, w: "พลอง", mg: 20, st: { STR: 5, AGI: 5 }, at: "phy", bp: 50, p: 0, f: 5, dm: 1, se: null, ee: null, d: "Phy ไม้เท้าพรรคยาจก" },
  { id: "nc3", n: "กระบี่น้ำ", ti: 0, w: "กระบี่", mg: 20, st: { POW: 5, INT: 5 }, at: "int", bp: 35, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Int กระบี่สายน้ำ" },
  { id: "nc4", n: "ฝ่ามือเมฆ", ti: 0, w: "กำปั้น", mg: 20, st: { STR: 5, POW: 5 }, at: "phy", bp: 40, p: 0, f: 10, dm: 1, se: null, ee: null, d: "Phy ฝ่ามือธรรมดา" },
  { id: "nc5", n: "ทวนเบื้องต้น", ti: 0, w: "ทวน", mg: 20, st: { STR: 6, VIT: 4 }, at: "phy", bp: 52, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Phy ทวนพื้นฐาน" },
  { id: "nc6", n: "กระบองสั้น", ti: 0, w: "กระบอง", mg: 20, st: { STR: 5, DEF: 5 }, at: "phy", bp: 48, p: 0, f: 5, dm: 1, se: null, ee: null, d: "Phy กระบองสั้น" },
  { id: "nc7", n: "ดาบยาวพื้นฐาน", ti: 0, w: "ดาบยาว", mg: 20, st: { STR: 7, VIT: 3 }, at: "phy", bp: 58, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Phy ดาบยาวสองมือ" },
  { id: "nc8", n: "แส้เบื้องต้น", ti: 0, w: "แส้", mg: 20, st: { AGI: 5, DEX: 5 }, at: "phy", bp: 32, p: 0, f: 8, dm: 1, se: null, ee: null, d: "Phy แส้พื้นฐาน" },
  { id: "nc9", n: "พัดพื้นฐาน", ti: 0, w: "พัด", mg: 20, st: { POW: 5, INT: 5 }, at: "int", bp: 30, p: 0, f: 0, dm: 1, se: null, ee: null, d: "Int พัดสายใน" },
  { id: "nc10", n: "ขอเกี่ยวพื้นฐาน", ti: 0, w: "ขอเกี่ยว", mg: 20, st: { STR: 5, DEX: 5 }, at: "phy", bp: 35, p: 0, f: 5, dm: 1, se: null, ee: null, d: "Phy ขอเกี่ยวพื้นฐาน" },

  // ─── ขั้นกลาง เพิ่ม (12) ───
  { id: "nd1", n: "แส้แปดทิศ", ti: 1, w: "แส้", mg: 40, st: { AGI: 7, DEX: 6 }, at: "phy", bp: 48, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -12, u: 2 }, d: "Phy Eva-12 (2 ตา)" },
  { id: "nd2", n: "พัดนกยูง", ti: 1, w: "พัด", mg: 40, st: { POW: 7, INT: 6 }, at: "int", bp: 40, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_acc", v: -12, u: 2 }, d: "Int Acc-12 (2 ตา)" },
  { id: "nd3", n: "ดาบดาวเหนือ", ti: 1, w: "กระบี่", mg: 40, st: { STR: 7, DEX: 6 }, at: "phy", bp: 52, p: 15, f: 0, dm: 1, se: null, ee: null, d: "Phy+15%" },
  { id: "nd4", n: "ทวนลม", ti: 1, w: "ทวน", mg: 40, st: { STR: 8, AGI: 5 }, at: "phy", bp: 58, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -10, u: 2 }, d: "Phy Eva-10 (2 ตา)" },
  { id: "nd5", n: "อรหันต์พันมือ", ti: 1, w: "กำปั้น", mg: 40, st: { POW: 6, INT: 7 }, at: "int", bp: 42, p: 0, f: 0, dm: 0.9, se: null, ee: { t: "multi_debuff", av: -8, ev: -8, u: 2 }, d: "Int×0.9 + Acc-8 Eva-8" },
  { id: "nd6", n: "กระบี่หยาง", ti: 1, w: "กระบี่", mg: 40, st: { POW: 7, INT: 6 }, at: "int", bp: 44, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -12, u: 2 }, d: "Int PDef-12 (2 ตา)" },
  { id: "nd7", n: "ฝ่ามือเสือ", ti: 1, w: "กำปั้น", mg: 40, st: { STR: 8, VIT: 5 }, at: "phy", bp: 52, p: 0, f: 0, dm: 1, se: { t: "buff_reduce", v: 20, u: 2 }, ee: null, d: "Phy + ลดdmg20% (2 ตา)" },
  { id: "nd8", n: "แส้เหล็กดูดชีพ", ti: 1, w: "แส้", mg: 40, st: { DEX: 7, AGI: 6 }, at: "phy", bp: 44, p: 0, f: 0, dm: 1, dr: 20, se: null, ee: null, d: "Phy + ดูด 20% HP" },
  { id: "nd9", n: "เข็มตีจุด", ti: 1, w: "เข็ม", mg: 40, st: { DEX: 8, LUK: 5 }, at: "phy", bp: 35, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_acc", v: -15, u: 2 }, d: "Phy Acc-15 (2 ตา)" },
  { id: "nd10", n: "กรงเล็บเพลิง", ti: 1, w: "กำปั้น", mg: 40, st: { STR: 7, POW: 6 }, at: "phy", bp: 50, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -12, u: 2 }, d: "Phy PDef-12 (2 ตา)" },
  { id: "nd11", n: "กระบี่ลม", ti: 1, w: "กระบี่", mg: 40, st: { AGI: 8, STR: 5 }, at: "phy", bp: 45, p: 0, f: 0, dm: 1, se: { t: "buff_eva", v: 20, u: 2 }, ee: null, d: "Phy + Eva+20 (2 ตา)" },
  { id: "nd12", n: "ฝ่ามือเกราะ-2", ti: 1, w: "กำปั้น", mg: 40, st: { STR: 6, DEF: 6 }, at: "phy", bp: 46, p: 0, f: 0, dm: 1, se: { t: "buff_def", v: 15, u: 2 }, ee: null, d: "Phy + DEF+15 (2 ตา)" },

  // ─── ขั้นสูง เพิ่ม (13) ───
  { id: "ne1", n: "สิบแปดฝ่ามือมังกร", ti: 2, w: "กำปั้น", mg: 60, st: { STR: 8, VIT: 7 }, at: "phy", bp: 75, p: 25, f: 0, dm: 1, se: null, ee: null, d: "Phy×125% หนักมาก" },
  { id: "ne2", n: "ดาบอรหันต์เส้าหลิน", ti: 2, w: "กระบี่", mg: 60, st: { STR: 8, DEF: 7 }, at: "phy", bp: 68, p: 0, f: 0, dm: 1, se: { t: "buff_def", v: 20, u: 2 }, ee: null, d: "Phy + DEF+20 (2 ตา)" },
  { id: "ne3", n: "ทวนหมุนฟ้า", ti: 2, w: "ทวน", mg: 60, st: { STR: 9, AGI: 6 }, at: "phy", bp: 70, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -18, u: 2 }, d: "Phy Eva-18 (2 ตา)" },
  { id: "ne4", n: "ดอกบัวนพรัตน์", ti: 2, w: "พัด", mg: 60, st: { POW: 8, INT: 7 }, at: "int", bp: 55, p: 0, f: 0, dm: 1.1, se: { t: "heal_pct", v: 15 }, ee: null, d: "Int×1.1 + ฟื้น 15% HP" },
  { id: "ne5", n: "กระบี่วิ่งบนน้ำ", ti: 2, w: "กระบี่", mg: 60, st: { POW: 9, AGI: 6 }, at: "int", bp: 62, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -18, u: 2 }, d: "Int Eva-18 (2 ตา)" },
  { id: "ne6", n: "แส้ทะลุปราการ", ti: 2, w: "แส้", mg: 60, st: { STR: 8, DEX: 7 }, at: "phy", bp: 65, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -18, u: 2 }, d: "Phy PDef-18 (2 ตา)" },
  { id: "ne7", n: "ฝ่ามือน้ำแข็ง", ti: 2, w: "กำปั้น", mg: 60, st: { POW: 8, INT: 7 }, at: "int", bp: 58, p: 0, f: 0, dm: 1.1, se: null, ee: { t: "debuff_acc", v: -15, u: 2 }, d: "Int×1.1 Acc-15 (2 ตา)" },
  { id: "ne8", n: "หมัดเมา", ti: 2, w: "กำปั้น", mg: 60, st: { STR: 7, AGI: 8 }, at: "phy", bp: 62, p: 0, f: 0, dm: 1, dr: 20, se: null, ee: { t: "debuff_eva", v: -12, u: 2 }, d: "Phy ดูด20% + Eva-12" },
  { id: "ne9", n: "ดาบยาวมังกร", ti: 2, w: "ดาบยาว", mg: 60, st: { STR: 9, VIT: 6 }, at: "phy", bp: 80, p: 25, f: 0, dm: 1, se: null, ee: null, d: "Phy×125% ดาบยาวหนัก" },
  { id: "ne10", n: "พลองลม", ti: 2, w: "พลอง", mg: 60, st: { POW: 9, INT: 6 }, at: "int", bp: 60, p: 0, f: 0, dm: 0.8, se: null, ee: { t: "multi_debuff", av: -15, ev: -12, u: 2 }, d: "Int×0.8 + สองดีบัฟ" },
  { id: "ne11", n: "กรงเล็บสิงห์", ti: 2, w: "กำปั้น", mg: 60, st: { STR: 8, DEX: 7 }, at: "phy", bp: 65, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -15, u: 2 }, d: "Phy PDef-15 (2 ตา)" },
  { id: "ne12", n: "กระบี่เก้าฟ้า", ti: 2, w: "กระบี่", mg: 60, st: { POW: 8, INT: 7 }, at: "int", bp: 65, p: 15, f: 0, dm: 1, se: { t: "stack_atk", v: 6, mx: 3 }, ee: null, d: "Int+15% + สะสม ATK+6%" },
  { id: "ne13", n: "ทวนหยินหยาง", ti: 2, w: "ทวน", mg: 60, st: { STR: 8, POW: 7 }, at: "phy", bp: 68, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_acc", v: -15, u: 2 }, d: "Phy Acc-15 (2 ตา)" },

  // ─── ลับ เพิ่ม (8) ───
  { id: "nf1", n: "กู่ฉินสังหาร", ti: 3, w: "ขลุ่ย", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 72, p: 0, f: 0, dm: 1.1, se: null, ee: { t: "multi_debuff", av: -18, ev: -18, u: 3 }, d: "Int×1.1 + Acc-18 Eva-18 (3 ตา)" },
  { id: "nf2", n: "ดาบโดดเดี่ยว", ti: 3, w: "กระบี่", mg: 80, st: { POW: 10, INT: 8 }, at: "int", bp: 75, p: 0, f: 0, dm: 1.1, dr: 25, se: null, ee: null, d: "Int×1.1 + ดูด 25% HP" },
  { id: "nf3", n: "ทวนประทับมังกร", ti: 3, w: "ทวน", mg: 80, st: { STR: 10, VIT: 8 }, at: "phy", bp: 88, p: 25, f: 0, dm: 1, se: null, ee: null, d: "Phy×125% ทวนสังหาร" },
  { id: "nf4", n: "ฝ่ามือยมฑูต", ti: 3, w: "กำปั้น", mg: 80, st: { STR: 9, POW: 9 }, at: "phy", bp: 82, p: 0, f: 0, dm: 1, se: null, ee: { t: "debuff_poison", pp: 6, u: 3, ev: -12 }, d: "Phy + พิษ 6%HP/ตา Eva-12 (3 ตา)" },
  { id: "nf5", n: "หมัดเพลิง", ti: 3, w: "กำปั้น", mg: 80, st: { STR: 10, AGI: 8 }, at: "phy", bp: 85, p: 30, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -20, u: 2 }, d: "Phy×130% + PDef-20 (2 ตา)" },
  { id: "nf6", n: "ดาบยาวสีเลือด", ti: 3, w: "ดาบยาว", mg: 80, st: { STR: 10, DEX: 8 }, at: "phy", bp: 90, p: 0, f: 0, dm: 1, dr: 35, se: null, ee: null, d: "Phy + ดูด 35% HP" },
  { id: "nf7", n: "แส้เก้าหัว", ti: 3, w: "แส้", mg: 80, st: { DEX: 10, AGI: 8 }, at: "phy", bp: 75, p: 0, f: 0, dm: 1, se: null, ee: { t: "multi_debuff", av: -18, ev: -18, u: 3 }, d: "Phy + Acc-18 Eva-18 (3 ตา)" },
  { id: "nf8", n: "พัดเพลิงสวรรค์", ti: 3, w: "พัด", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 70, p: 0, f: 0, dm: 1.1, se: null, ee: { t: "debuff_acc", v: -20, u: 2 }, d: "Int×1.1 + Acc-20 (2 ตา)" },

  // ─── เฉพาะ เพิ่ม (7) ───
  { id: "ng1", n: "เก้าฟ้าหนึ่งกระบี่", ti: 4, w: "กระบี่", mg: 100, st: { POW: 9, INT: 8, AGI: 3 }, at: "int", bp: 88, p: 30, f: 0, dm: 1, se: { t: "buff_reduce", v: 25, u: 2 }, ee: null, d: "Int×130% + ลดdmg 25% (2 ตา)" },
  { id: "ng2", n: "ทวนประจักษ์พยาน", ti: 4, w: "ทวน", mg: 100, st: { STR: 9, VIT: 7, AGI: 4 }, at: "phy", bp: 98, p: 30, f: 0, dm: 1, se: null, ee: { t: "debuff_eva", v: -25, u: 3 }, d: "Phy×130% + Eva-25 (3 ตา)" },
  { id: "ng3", n: "ฝ่ามือมังกรเทพ", ti: 4, w: "กำปั้น", mg: 100, st: { STR: 10, VIT: 6, POW: 4 }, at: "phy", bp: 95, p: 30, f: 0, dm: 1, dr: 25, se: null, ee: null, d: "Phy×130% + ดูด 25% HP" },
  { id: "ng4", n: "หมัดพระอินทร์", ti: 4, w: "กำปั้น", mg: 100, st: { POW: 10, INT: 7, LUK: 3 }, at: "int", bp: 85, p: 0, f: 0, dm: 1.2, se: null, ee: { t: "multi_debuff", av: -25, ev: -25, u: 3 }, d: "Int×120% + Acc-25 Eva-25 (3 ตา)" },
  { id: "ng5", n: "ดาบยาวเทพสังหาร", ti: 4, w: "ดาบยาว", mg: 100, st: { STR: 10, DEX: 6, AGI: 4 }, at: "phy", bp: 100, p: 30, f: 0, dm: 1, se: null, ee: { t: "debuff_def", v: -25, u: 3 }, d: "Phy×130% + PDef-25 (3 ตา)" },
  { id: "ng6", n: "ขลุ่ยพลิกโลก", ti: 4, w: "ขลุ่ย", mg: 100, st: { POW: 9, INT: 8, DEX: 3 }, at: "int", bp: 82, p: 25, f: 0, dm: 1, se: null, ee: { t: "heavy_poison", pp: 10, u: 4, av: -18, ev: -15 }, d: "Int×125% + พิษ 10%HP/ตา Acc-18 Eva-15" },
  { id: "ng7", n: "นพเก้าฟ้าคืนดาว", ti: 4, w: "กำปั้น", mg: 100, st: { POW: 8, INT: 8, AGI: 4 }, at: "int", bp: 90, p: 0, f: 0, dm: 1.2, dr: 40, se: { t: "stack_atk", v: 10, mx: 3 }, ee: null, d: "Int×120% + ดูด 40% + ATK+10% (≤3 ซ้อน)" },

  // ─── วิชาจักรวาลกิมย้ง (7 วิชา) ───
  { id: "yyz", n: "ดัชนีเอกสุริยัน", ti: 3, w: "นิ้วมือ", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 55, p: 0, f: 0, dm: 1.1, se: null, ee: { t: "debuff_acc", v: -22, u: 3 }, d: "Int×1.1 จี้สกัดจุด Acc-22 (3 ตา) — 一阳指" },
  { id: "lmsj", n: "กระบี่ 6 ชีพจร", ti: 4, w: "นิ้วมือ", mg: 100, st: { POW: 9, INT: 8, DEX: 3 }, at: "int", bp: 100, p: 40, f: 0, dm: 1.2, se: { t: "stack_atk", v: 10, mx: 2 }, ee: null, d: "Int×120% bp×140% + ATK+10% (≤2 ซ้อน) — 六脉神剑 ต้องการพลังมหาศาล" },
  { id: "bmsg", n: "มหาเวทดูดดาว", ti: 4, w: "กำปั้น", mg: 100, st: { POW: 9, INT: 9, AGI: 2 }, at: "int", bp: 70, p: 0, f: 0, dm: 1.3, dr: 45, se: null, ee: { t: "drain_mp", v: 30 }, d: "Int×1.3 + ดูด 45%HP + ดูด MP 30% — 北冥神功" },
  { id: "bmzq", n: "ลมปราณภูติอุดร", ti: 3, w: "กำปั้น", mg: 80, st: { POW: 10, INT: 10 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: { t: "buff_iatk_reduce", iv: 20, rv: 15, u: 3 }, ee: null, d: "IAtk+20% + ลดรับ 15% (3 ตา) — 北冥真气" },
  { id: "yxjf", n: "กระบี่ขลุ่ยหยก", ti: 3, w: "กระบี่", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 65, p: 0, f: 0, dm: 1.1, se: { t: "heal_pct", v: 10 }, ee: { t: "debuff_eva", v: -20, u: 2 }, d: "Int×1.1 + ฟื้น 10%HP + Eva-20 (2 ตา) — 玉箫剑法" },
  { id: "hgdf", n: "วิชาสลายพลัง", ti: 3, w: "กำปั้น", mg: 80, st: { POW: 10, INT: 8, DEX: 2 }, at: "int", bp: 45, p: 0, f: 0, dm: 0.8, se: null, ee: { t: "dispel", acc: -15, u: 2 }, d: "Int×0.8 + สลาย buff 1 ชั้น + Acc-15 (2 ตา) — 化功大法" },
  { id: "yxhd", n: "ดาวเคลื่อนดาราคล้อย", ti: 4, w: "ตัวเบา", mg: 100, st: { AGI: 10, DEX: 7, LUK: 3 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: { t: "buff_reflect_eva", rv: 60, ev: 30, u: 2 }, ee: null, d: "สะท้อน 60% + Eva+30 (2 ตา) เบี่ยงทิศโจมตี — 移星换斗" },

  // ─── วิชาไอคอนิกกิมย้ง เพิ่มเติม (7 วิชา) ───
  { id: "ansh", n: "ฝ่ามือกำสรดวิญญาณสลาย", ti: 4, w: "กำปั้น", mg: 100, st: { STR: 8, POW: 8, INT: 4 }, at: "int", bp: 85, p: 0, f: 0, dm: 1.2, se: { t: "stack_atk", v: 12, mx: 2 }, ee: { t: "debuff_acc", v: -18, u: 2 }, d: "Int×1.2 + ATK+12%(≤2ซ้อน) + Acc-18(2ตา) — 黯然销魂掌 ยิ่งเศร้ายิ่งแกร่ง" },
  { id: "dgjj", n: "เก้ากระบี่เดียวดาย", ti: 4, w: "กระบี่", mg: 100, st: { STR: 6, AGI: 8, DEX: 6 }, at: "phy", bp: 90, p: 30, f: 0, dm: 1.2, se: { t: "buff_reflect", v: 50, u: 1 }, ee: { t: "debuff_eva", v: -20, u: 2 }, d: "Phy×130% + สะท้อน 50%(1ตา) + Eva-20(2ตา) — 独孤九剑 ทะลุทุกวิชา" },
  { id: "khbt", n: "คัมภีร์ทานตะวัน", ti: 4, w: "กระบี่", mg: 100, st: { AGI: 10, DEX: 6, INT: 4 }, at: "int", bp: 92, p: 25, f: 0, dm: 1.2, se: { t: "buff_eva", v: 35, u: 2 }, ee: null, d: "Int×120% bp×125% + Eva+35(2ตา) — 葵花宝典 เร็วเกินมนุษย์" },
  { id: "ynxj", n: "คัมภีร์สาวหยก", ti: 3, w: "กระบี่", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 58, p: 0, f: 0, dm: 1.1, se: { t: "heal_pct", v: 15 }, ee: { t: "debuff_acc", v: -15, u: 2 }, d: "Int×1.1 + ฟื้น 15%HP + Acc-15(2ตา) — 玉女心经 ลี้ลับไร้รูปแบบ" },
  { id: "ynss", n: "เพลงกระบี่สุรางคนางค์ใจพิสุทธิ์", ti: 3, w: "กระบี่", mg: 80, st: { POW: 9, INT: 9 }, at: "int", bp: 72, p: 0, f: 0, dm: 1.1, se: null, ee: { t: "multi_debuff", av: -15, ev: -15, u: 2 }, d: "Int×1.1 + Acc-15 Eva-15(2ตา) — 玉女素心剑 กระบี่คู่สุรางคนาง" },
  { id: "qzjf", n: "กระบี่ชวนจินก่า", ti: 2, w: "กระบี่", mg: 60, st: { POW: 8, INT: 7, DEX: 5 }, at: "int", bp: 60, p: 0, f: 0, dm: 1.1, se: { t: "buff_reflect", v: 35, u: 1 }, ee: { t: "debuff_acc", v: -14, u: 2 }, d: "Int×1.1 + สะท้อน 35%(1ตา) + Acc-14(2ตา) — 全真剑法 หนึ่งกระบี่สามทิศ" },
  { id: "qzzq", n: "ลมปราณชวนจินก่า", ti: 2, w: "กำปั้น", mg: 60, st: { POW: 8, INT: 7, DEF: 5 }, at: null, bp: 0, p: 0, f: 0, dm: 1, se: { t: "buff_iatk_reduce", iv: 15, rv: 20, u: 3 }, ee: null, d: "IAtk+15% + ลดรับ 20%(3ตา) — 全真真气 หยางบริสุทธิ์" },
];

export const SKILLS_BY_ID: Map<string, Skill> = new Map(SKILLS.map((s) => [s.id, s]));

export function getSkill(id: string | null | undefined): Skill | null {
  if (!id) return null;
  return SKILLS_BY_ID.get(id) ?? null;
}
