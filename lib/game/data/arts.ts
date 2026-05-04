import type { Art } from "../types";

// 25 internal-energy arts ("กำลังภายใน").
// Each art scales stats by `level/10`, contributes `hL` HP and `mL` MP per level,
// and grants one MP-gated active (`act`) plus one trigger-based passive (`pas`).
export const ARTS: readonly Art[] = [
  { id: "none", n: "— ไม่มี —", sc: "", tp: "", stats: {}, hL: 0, mL: 0, act: null, pas: null },

  { id: "tendon", n: "พลังเปลี่ยนเส้นเอ็น", sc: "เส้าหลิน", tp: "หยาง·แข็ง",
    stats: { STR: 20, VIT: 20, DEF: 10 }, hL: 55, mL: 15,
    act: { n: "อุ้มแผ่นดิน", c: 25, cd: 3, t: "heal", h: 22, d: "ฟื้น 22% HP (CD3)" },
    pas: { tr: "hit_recv", ch: 25, d: "ถูกโจมตี 25% → DEF+20 (2ตา)", e: { t: "buff_def", n: "เกราะ", v: 20, u: 2 } } },

  { id: "diamond", n: "จินกังชี่", sc: "เส้าหลิน", tp: "หยาง·แข็ง",
    stats: { VIT: 25, DEF: 15, STR: 10 }, hL: 55, mL: 15,
    act: { n: "เกราะเพชร", c: 20, cd: 3, t: "buff_reduce", v: 30, u: 3, d: "ลด dmg 30% (3ตา) CD3" },
    pas: { tr: "hit_recv", ch: 20, d: "ถูกโจมตี 20% → ฟื้น 8% HP", e: { t: "heal_pct", v: 8 } } },

  { id: "wanderer", n: "เจียงหูชี่", sc: "ยาจก", tp: "แข็ง·ภายนอก",
    stats: { STR: 15, VIT: 20, AGI: 15 }, hL: 45, mL: 25,
    act: { n: "ฝ่ามือมังกร", c: 25, cd: 4, t: "atk_phy_pen", m: 1.4, pen: 30, d: "ทางกาย×1.4 ทะลุ DEF 30% CD4" },
    pas: { tr: "hit_recv", ch: 30, d: "ถูกโจมตี 30% → Eva+15 (1ตา)", e: { t: "buff_eva", n: "ว่องไว", v: 15, u: 1 } } },

  { id: "military", n: "จวินเจิ้นชี่", sc: "องครักษ์", tp: "หยาง·ภายนอก",
    stats: { STR: 20, DEX: 15, AGI: 15 }, hL: 40, mL: 30,
    act: { n: "สามก้าวสังหาร", c: 30, cd: 4, t: "atk_phy_pen", m: 1.3, pen: 50, d: "ทางกาย×1.3 ทะลุ DEF 50% CD4" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ศัตรู Eva-8 (2ตา)", e: { t: "debuff_eva", n: "ตาพร่า", v: -8, u: 2 } } },

  { id: "taiji", n: "ไทจี้เจิ้นชี่", sc: "อู่ตัง", tp: "สมดุล·อ่อน",
    stats: { POW: 20, AGI: 15, INT: 15 }, hL: 35, mL: 35,
    act: { n: "สะท้อนพลัง", c: 30, cd: 3, t: "buff_reflect", v: 50, u: 1, d: "สะท้อน 50% (1ตา) CD3" },
    pas: { tr: "use_int", ch: 100, d: "Int skill → IAtk+12%", e: { t: "mult_iatk" } } },

  { id: "lotus", n: "เหลียนฮวาชี่", sc: "บัวขาว", tp: "สมดุล·อ่อน",
    stats: { POW: 15, INT: 15, LUK: 20 }, hL: 35, mL: 35,
    act: { n: "นิพพานบัว", c: 30, cd: 3, t: "heal_cleanse", h: 18, d: "ฟื้น 18%HP + ลบ debuff CD3" },
    pas: { tr: "hit_recv", ch: 20, d: "ถูกโจมตี 20% → ฟื้น 5% HP", e: { t: "heal_pct", v: 5 } } },

  { id: "scholar", n: "เหวินชี่", sc: "หมู่ตึกบรรณฑิต", tp: "สมดุล·ภายใน",
    stats: { INT: 20, POW: 15, DEX: 15 }, hL: 25, mL: 45,
    act: { n: "คีตาอาคม", c: 30, cd: 3, t: "debuff_acc_dmg", ad: -20, u: 2, dm: 0.6, d: "Acc-20 + Int×0.6 CD3" },
    pas: { tr: "use_int", ch: 100, d: "Int skill → ATK+10%", e: { t: "mult_atk" } } },

  { id: "poison", n: "อินตู๋ชี่", sc: "ถังเหมิน", tp: "หยิน·อ่อน",
    stats: { DEX: 20, LUK: 20, POW: 10 }, hL: 15, mL: 55,
    act: { n: "พิษสะสม", c: 35, cd: 3, t: "debuff_poison", pp: 5, u: 3, ev: -10, d: "พิษ 5%HP/ตา + Eva-10 CD3" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ศัตรู Acc-8 (2ตา)", e: { t: "debuff_acc", n: "ตาพร่า", v: -8, u: 2 } } },

  { id: "heaven", n: "เฉียนคุนต้าฝ่า", sc: "ลัทธิฟ้าดิน", tp: "สมดุล·ภายใน",
    stats: { POW: 30, INT: 20 }, hL: 15, mL: 55,
    act: { n: "กลืนฟ้าดิน", c: 40, cd: 4, t: "drain", m: 1.2, h: 40, d: "Int×1.2 + ดูด 40% dmg CD4" },
    pas: { tr: "use_act", ch: 100, d: "ใช้ IA → ATK+3% (≤+15%)", e: { t: "stack_atk", v: 3, mx: 5 } } },

  { id: "blood", n: "โลหิตอสุรา", sc: "สำนักดาบโลหิต", tp: "หยาง·แข็ง",
    stats: { STR: 25, AGI: 15, LUK: 10 }, hL: 45, mL: 25,
    act: { n: "เลือดสาด", c: 30, cd: 4, t: "drain_phy", m: 1.4, h: 35, d: "ทางกาย×1.4 + ดูด 35% CD4" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ฟื้น 6% HP", e: { t: "heal_pct", v: 6 } } },

  { id: "snow", n: "กำแพงหิมะ", sc: "สำนักน้ำแข็ง", tp: "หยิน·แข็ง",
    stats: { DEF: 25, VIT: 15, INT: 10 }, hL: 50, mL: 20,
    act: { n: "กำแพงน้ำแข็ง", c: 20, cd: 3, t: "buff_reduce", v: 50, u: 1, d: "ลด dmg 50% (1ตา) CD3" },
    pas: { tr: "hit_recv", ch: 25, d: "ถูกโจมตี 25% → ศัตรู Acc-12 (2ตา)", e: { t: "debuff_acc", n: "สับสน", v: -12, u: 2 } } },

  { id: "fire", n: "เพลิงสวรรค์", sc: "สำนักเพลิง", tp: "หยาง·ภายใน",
    stats: { POW: 25, INT: 15, STR: 10 }, hL: 30, mL: 40,
    act: { n: "เพลิงฟ้า", c: 35, cd: 4, t: "atk_int_pen", m: 1.4, pen: 30, d: "Int×1.4 ทะลุ IDef 30% CD4" },
    pas: { tr: "use_int", ch: 50, d: "Int skill 50% → ศัตรู PDef-12 (2ตา)", e: { t: "debuff_def", n: "ไฟไหม้", v: -12, u: 2 } } },

  { id: "sand", n: "พายุทราย", sc: "สำนักพายุ", tp: "สมดุล·ภายนอก",
    stats: { AGI: 25, DEX: 15, LUK: 10 }, hL: 35, mL: 35,
    act: { n: "พายุทราย", c: 25, cd: 3, t: "buff_eva_debuff_eva", selfV: 20, eneV: -15, u: 2, d: "Eva+20 / ศัตรู Eva-15 (2ตา) CD3" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ศัตรู Acc-12 (2ตา)", e: { t: "debuff_acc", n: "ทราย", v: -12, u: 2 } } },

  { id: "shadow", n: "เงาสังหาร", sc: "สำนักเงา", tp: "หยิน·ภายนอก",
    stats: { DEX: 20, LUK: 20, INT: 10 }, hL: 20, mL: 50,
    act: { n: "ตีจุดมรณะ", c: 35, cd: 4, t: "drain_acc", m: 1.2, h: 40, adv: -15, d: "Int×1.2 + ดูด 40% + Acc-15 CD4" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ศัตรู PDef-15 (2ตา)", e: { t: "debuff_def", n: "บาดแผล", v: -15, u: 2 } } },

  // ─── กำลังภายใน จากจักรวาลกิมย้ง / 9Yin ───
  { id: "jiuyin", n: "เก้าหยินจิงชี่", sc: "คัมภีร์เก้าหยิน", tp: "หยิน·ภายใน",
    stats: { POW: 20, INT: 20, DEX: 10 }, hL: 10, mL: 60,
    act: { n: "เก้าหยินขาวกระดูก", c: 40, cd: 4, t: "atk_int_pen", m: 1.5, pen: 40, d: "Int×1.5 ทะลุ IDef 40% CD4" },
    pas: { tr: "use_int", ch: 100, d: "Int skill → ศัตรู PDef-10 (2ตา)", e: { t: "debuff_def", n: "กระดูกร้าว", v: -10, u: 2 } } },

  { id: "jiuyang", n: "เก้าหยางเซินกง", sc: "คัมภีร์เก้าหยาง", tp: "หยาง·แข็ง",
    stats: { STR: 15, VIT: 20, DEF: 15 }, hL: 60, mL: 10,
    act: { n: "เพลิงบริสุทธิ์", c: 25, cd: 3, t: "atk_phy_pen", m: 1.5, pen: 25, d: "ทางกาย×1.5 ทะลุ DEF 25% CD3" },
    pas: { tr: "hit_recv", ch: 30, d: "ถูกโจมตี 30% → ฟื้น 10% HP", e: { t: "heal_pct", v: 10 } } },

  { id: "qiankun", n: "เฉียนคุนต้าหนัวอี", sc: "ลัทธิหมิง", tp: "สมดุล·ภายใน",
    stats: { POW: 20, AGI: 15, INT: 15 }, hL: 20, mL: 50,
    act: { n: "โอนถ่ายพลัง", c: 35, cd: 3, t: "buff_reflect", v: 70, u: 1, d: "สะท้อน 70% ตาถัดไป CD3" },
    pas: { tr: "use_int", ch: 100, d: "Int skill → IAtk+15%", e: { t: "mult_iatk" } } },

  { id: "zixia", n: "จื่อเสียเซินกง", sc: "อู่ตัง", tp: "สมดุล·อ่อน",
    stats: { POW: 20, INT: 15, AGI: 15 }, hL: 30, mL: 40,
    act: { n: "หมอกม่วง", c: 30, cd: 3, t: "heal_cleanse", h: 25, d: "ฟื้น 25%HP + ลบ debuff CD3" },
    pas: { tr: "use_int", ch: 50, d: "Int skill 50% → Eva+10 (2ตา)", e: { t: "buff_eva", n: "หมอก", v: 10, u: 2 } } },

  { id: "emei", n: "ง้อไบ๊เซินกง", sc: "ง้อไบ๊", tp: "สมดุล·ภายใน",
    stats: { POW: 15, INT: 15, VIT: 20 }, hL: 35, mL: 35,
    act: { n: "วิสุทธิ์บัวหยก", c: 30, cd: 3, t: "heal_cleanse", h: 20, d: "ฟื้น 20%HP + ลบ debuff CD3" },
    pas: { tr: "hit_recv", ch: 25, d: "ถูกโจมตี 25% → ฟื้น 6% HP", e: { t: "heal_pct", v: 6 } } },

  { id: "shenzhao", n: "เซินจ้าวจิง", sc: "พรรคบู๊ลิ้ม", tp: "สมดุล·ภายใน",
    stats: { INT: 25, POW: 15, DEX: 10 }, hL: 20, mL: 50,
    act: { n: "ดวงตาจิต", c: 30, cd: 3, t: "debuff_acc_dmg", ad: -25, u: 3, dm: 0.7, d: "Acc-25 + Int×0.7 CD3" },
    pas: { tr: "use_int", ch: 100, d: "Int skill → ATK+12%", e: { t: "mult_atk" } } },

  { id: "taiyin", n: "ไต้อินเจิ้นชี่", sc: "สำนักมาร", tp: "หยิน·อ่อน",
    stats: { DEX: 20, LUK: 20, POW: 10 }, hL: 10, mL: 60,
    act: { n: "มรณะเย็น", c: 40, cd: 4, t: "debuff_poison", pp: 6, u: 4, ev: -15, d: "พิษ 6%HP/ตา + Eva-15 CD4" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ศัตรู Acc-10 (3ตา)", e: { t: "debuff_acc", n: "มรณะ", v: -10, u: 3 } } },

  { id: "huoxue", n: "ฮั่วเสวียสินฝ่า", sc: "หมอยุทธ", tp: "สมดุล·ภายใน",
    stats: { VIT: 25, POW: 15, DEF: 10 }, hL: 50, mL: 20,
    act: { n: "โลหิตรักษา", c: 25, cd: 3, t: "heal", h: 30, d: "ฟื้น 30% HP CD3" },
    pas: { tr: "hit_recv", ch: 20, d: "ถูกโจมตี 20% → ฟื้น 8% HP", e: { t: "heal_pct", v: 8 } } },

  { id: "huashan", n: "หัวซานเซินกง", sc: "หัวซาน", tp: "สมดุล·แข็ง",
    stats: { STR: 20, DEX: 15, POW: 15 }, hL: 35, mL: 35,
    act: { n: "กระบี่หนึ่งในฟ้า", c: 35, cd: 4, t: "atk_phy_pen", m: 1.4, pen: 35, d: "ทางกาย×1.4 ทะลุ DEF 35% CD4" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → สะสม ATK+5%", e: { t: "stack_atk", v: 5, mx: 5 } } },

  { id: "dongxuan", n: "ตงซวนเซินกง", sc: "สำนักมืด", tp: "หยิน·ภายใน",
    stats: { INT: 20, POW: 20, LUK: 10 }, hL: 15, mL: 55,
    act: { n: "กลืนชีพ", c: 40, cd: 4, t: "drain", m: 1.3, h: 50, d: "Int×1.3 + ดูด 50% dmg CD4" },
    pas: { tr: "use_act", ch: 100, d: "ใช้ IA → ATK+4% (≤+20%)", e: { t: "stack_atk", v: 4, mx: 5 } } },
];

export const ARTS_BY_ID: Map<string, Art> = new Map(ARTS.map((a) => [a.id, a]));

export function getArt(id: string | null | undefined): Art {
  if (!id) return ARTS[0];
  return ARTS_BY_ID.get(id) ?? ARTS[0];
}
