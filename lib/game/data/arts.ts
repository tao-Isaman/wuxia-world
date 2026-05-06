import type { Art } from "../types";

// Inner skills ("วิชาในกาย" / กำลังภายใน) registry.
// Each art scales stats by `level/10`, contributes `hL` HP and `mL` MP per level,
// and grants one MP-gated active (`act`) plus one trigger-based passive (`pas`).
//
// Tier budgets (rough — total HP+MP per level / total stat sum):
//   ti 0  →  30 / 10
//   ti 1  →  40 / 20
//   ti 2  →  50 / 30
//   ti 3  →  60 / 40
//   ti 4  →  70 / 50  (the iconic wuxia / 9yin / JY arts)
//
// New inner skills appended at the bottom (tier 0–3) — these are the
// "researchable" entries from the 9yin / JY-Online theme bank. Authors can
// teach them to the player via `{ t: "learnArt", artId, level }` SceneEffect.
export const ARTS: readonly Art[] = [
  { id: "none", n: "— ไม่มี —", sc: "", tp: "", ti: 0, stats: {}, hL: 0, mL: 0, act: null, pas: null },

  { id: "tendon", n: "พลังเปลี่ยนเส้นเอ็น", sc: "เส้าหลิน", tp: "หยาง·แข็ง", types: ["yang", "hard"], ti: 4,
    stats: { STR: 20, VIT: 20, DEF: 10 }, hL: 55, mL: 15,
    act: { n: "อุ้มแผ่นดิน", c: 25, cd: 3, t: "heal", h: 22, d: "ฟื้น 22% HP (CD3)" },
    pas: { tr: "hit_recv", ch: 25, d: "ถูกโจมตี 25% → DEF+20 (2ตา)", e: { t: "buff_def", n: "เกราะ", v: 20, u: 2 } } },

  { id: "diamond", n: "จินกังชี่", sc: "เส้าหลิน", tp: "หยาง·แข็ง", types: ["yang", "hard"], ti: 4,
    stats: { VIT: 25, DEF: 15, STR: 10 }, hL: 55, mL: 15,
    act: { n: "เกราะเพชร", c: 20, cd: 3, t: "buff_reduce", v: 30, u: 3, d: "ลด dmg 30% (3ตา) CD3" },
    pas: { tr: "hit_recv", ch: 20, d: "ถูกโจมตี 20% → ฟื้น 8% HP", e: { t: "heal_pct", v: 8 } } },

  { id: "wanderer", n: "เจียงหูชี่", sc: "ยาจก", tp: "แข็ง·ภายนอก", types: ["hard", "external"], ti: 4,
    stats: { STR: 15, VIT: 20, AGI: 15 }, hL: 45, mL: 25,
    act: { n: "ฝ่ามือมังกร", c: 25, cd: 4, t: "atk_phy_pen", m: 1.4, pen: 30, d: "ทางกาย×1.4 ทะลุ DEF 30% CD4" },
    pas: { tr: "hit_recv", ch: 30, d: "ถูกโจมตี 30% → Eva+15 (1ตา)", e: { t: "buff_eva", n: "ว่องไว", v: 15, u: 1 } } },

  { id: "military", n: "จวินเจิ้นชี่", sc: "องครักษ์", tp: "หยาง·ภายนอก", types: ["yang", "external"], ti: 4,
    stats: { STR: 20, DEX: 15, AGI: 15 }, hL: 40, mL: 30,
    act: { n: "สามก้าวสังหาร", c: 30, cd: 4, t: "atk_phy_pen", m: 1.3, pen: 50, d: "ทางกาย×1.3 ทะลุ DEF 50% CD4" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ศัตรู Eva-8 (2ตา)", e: { t: "debuff_eva", n: "ตาพร่า", v: -8, u: 2 } } },

  { id: "taiji", n: "ไทจี้เจิ้นชี่", sc: "อู่ตัง", tp: "สมดุล·อ่อน", types: ["soft"], ti: 4,
    stats: { POW: 20, AGI: 15, INT: 15 }, hL: 35, mL: 35,
    act: { n: "สะท้อนพลัง", c: 30, cd: 3, t: "buff_reflect", v: 50, u: 1, d: "สะท้อน 50% (1ตา) CD3" },
    pas: { tr: "use_int", ch: 100, d: "Int skill → IAtk+12%", e: { t: "mult_iatk" } } },

  { id: "lotus", n: "เหลียนฮวาชี่", sc: "บัวขาว", tp: "สมดุล·อ่อน", types: ["soft"], ti: 4,
    stats: { POW: 15, INT: 15, LUK: 20 }, hL: 35, mL: 35,
    act: { n: "นิพพานบัว", c: 30, cd: 3, t: "heal_cleanse", h: 18, d: "ฟื้น 18%HP + ลบ debuff CD3" },
    pas: { tr: "hit_recv", ch: 20, d: "ถูกโจมตี 20% → ฟื้น 5% HP", e: { t: "heal_pct", v: 5 } } },

  { id: "scholar", n: "เหวินชี่", sc: "หมู่ตึกบรรณฑิต", tp: "สมดุล·ภายใน", types: ["internal"], ti: 4,
    stats: { INT: 20, POW: 15, DEX: 15 }, hL: 25, mL: 45,
    act: { n: "คีตาอาคม", c: 30, cd: 3, t: "debuff_acc_dmg", ad: -20, u: 2, dm: 0.6, d: "Acc-20 + Int×0.6 CD3" },
    pas: { tr: "use_int", ch: 100, d: "Int skill → ATK+10%", e: { t: "mult_atk" } } },

  { id: "poison", n: "อินตู๋ชี่", sc: "ถังเหมิน", tp: "หยิน·อ่อน", types: ["yin", "soft"], ti: 4,
    stats: { DEX: 20, LUK: 20, POW: 10 }, hL: 15, mL: 55,
    act: { n: "พิษสะสม", c: 35, cd: 3, t: "debuff_poison", pp: 5, u: 3, ev: -10, d: "พิษ 5%HP/ตา + Eva-10 CD3" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ศัตรู Acc-8 (2ตา)", e: { t: "debuff_acc", n: "ตาพร่า", v: -8, u: 2 } } },

  { id: "heaven", n: "เฉียนคุนต้าฝ่า", sc: "ลัทธิฟ้าดิน", tp: "สมดุล·ภายใน", types: ["internal"], ti: 4,
    stats: { POW: 30, INT: 20 }, hL: 15, mL: 55,
    act: { n: "กลืนฟ้าดิน", c: 40, cd: 4, t: "drain", m: 1.2, h: 40, d: "Int×1.2 + ดูด 40% dmg CD4" },
    pas: { tr: "use_act", ch: 100, d: "ใช้ IA → ATK+3% (≤+15%)", e: { t: "stack_atk", v: 3, mx: 5 } } },

  { id: "blood", n: "โลหิตอสุรา", sc: "สำนักดาบโลหิต", tp: "หยาง·แข็ง", types: ["yang", "hard"], ti: 4,
    stats: { STR: 25, AGI: 15, LUK: 10 }, hL: 45, mL: 25,
    act: { n: "เลือดสาด", c: 30, cd: 4, t: "drain_phy", m: 1.4, h: 35, d: "ทางกาย×1.4 + ดูด 35% CD4" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ฟื้น 6% HP", e: { t: "heal_pct", v: 6 } } },

  { id: "snow", n: "กำแพงหิมะ", sc: "สำนักน้ำแข็ง", tp: "หยิน·แข็ง", types: ["yin", "hard"], ti: 4,
    stats: { DEF: 25, VIT: 15, INT: 10 }, hL: 50, mL: 20,
    act: { n: "กำแพงน้ำแข็ง", c: 20, cd: 3, t: "buff_reduce", v: 50, u: 1, d: "ลด dmg 50% (1ตา) CD3" },
    pas: { tr: "hit_recv", ch: 25, d: "ถูกโจมตี 25% → ศัตรู Acc-12 (2ตา)", e: { t: "debuff_acc", n: "สับสน", v: -12, u: 2 } } },

  { id: "fire", n: "เพลิงสวรรค์", sc: "สำนักเพลิง", tp: "หยาง·ภายใน", types: ["yang", "internal"], ti: 4,
    stats: { POW: 25, INT: 15, STR: 10 }, hL: 30, mL: 40,
    act: { n: "เพลิงฟ้า", c: 35, cd: 4, t: "atk_int_pen", m: 1.4, pen: 30, d: "Int×1.4 ทะลุ IDef 30% CD4" },
    pas: { tr: "use_int", ch: 50, d: "Int skill 50% → ศัตรู PDef-12 (2ตา)", e: { t: "debuff_def", n: "ไฟไหม้", v: -12, u: 2 } } },

  { id: "sand", n: "พายุทราย", sc: "สำนักพายุ", tp: "สมดุล·ภายนอก", types: ["external"], ti: 4,
    stats: { AGI: 25, DEX: 15, LUK: 10 }, hL: 35, mL: 35,
    act: { n: "พายุทราย", c: 25, cd: 3, t: "buff_eva_debuff_eva", selfV: 20, eneV: -15, u: 2, d: "Eva+20 / ศัตรู Eva-15 (2ตา) CD3" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ศัตรู Acc-12 (2ตา)", e: { t: "debuff_acc", n: "ทราย", v: -12, u: 2 } } },

  { id: "shadow", n: "เงาสังหาร", sc: "สำนักเงา", tp: "หยิน·ภายนอก", types: ["yin", "external"], ti: 4,
    stats: { DEX: 20, LUK: 20, INT: 10 }, hL: 20, mL: 50,
    act: { n: "ตีจุดมรณะ", c: 35, cd: 4, t: "drain_acc", m: 1.2, h: 40, adv: -15, d: "Int×1.2 + ดูด 40% + Acc-15 CD4" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ศัตรู PDef-15 (2ตา)", e: { t: "debuff_def", n: "บาดแผล", v: -15, u: 2 } } },

  // ─── กำลังภายใน จากจักรวาลกิมย้ง / 9Yin ───
  { id: "jiuyin", n: "เก้าหยินจิงชี่", sc: "คัมภีร์เก้าหยิน", tp: "หยิน·ภายใน", types: ["yin", "internal"], ti: 4,
    stats: { POW: 20, INT: 20, DEX: 10 }, hL: 10, mL: 60,
    act: { n: "เก้าหยินขาวกระดูก", c: 40, cd: 4, t: "atk_int_pen", m: 1.5, pen: 40, d: "Int×1.5 ทะลุ IDef 40% CD4" },
    pas: { tr: "use_int", ch: 100, d: "Int skill → ศัตรู PDef-10 (2ตา)", e: { t: "debuff_def", n: "กระดูกร้าว", v: -10, u: 2 } } },

  { id: "jiuyang", n: "เก้าหยางเซินกง", sc: "คัมภีร์เก้าหยาง", tp: "หยาง·แข็ง", types: ["yang", "hard"], ti: 4,
    stats: { STR: 15, VIT: 20, DEF: 15 }, hL: 60, mL: 10,
    act: { n: "เพลิงบริสุทธิ์", c: 25, cd: 3, t: "atk_phy_pen", m: 1.5, pen: 25, d: "ทางกาย×1.5 ทะลุ DEF 25% CD3" },
    pas: { tr: "hit_recv", ch: 30, d: "ถูกโจมตี 30% → ฟื้น 10% HP", e: { t: "heal_pct", v: 10 } } },

  { id: "qiankun", n: "เฉียนคุนต้าหนัวอี", sc: "ลัทธิหมิง", tp: "สมดุล·ภายใน", types: ["internal"], ti: 4,
    stats: { POW: 20, AGI: 15, INT: 15 }, hL: 20, mL: 50,
    act: { n: "โอนถ่ายพลัง", c: 35, cd: 3, t: "buff_reflect", v: 70, u: 1, d: "สะท้อน 70% ตาถัดไป CD3" },
    pas: { tr: "use_int", ch: 100, d: "Int skill → IAtk+15%", e: { t: "mult_iatk" } } },

  { id: "zixia", n: "จื่อเสียเซินกง", sc: "อู่ตัง", tp: "สมดุล·อ่อน", types: ["soft"], ti: 4,
    stats: { POW: 20, INT: 15, AGI: 15 }, hL: 30, mL: 40,
    act: { n: "หมอกม่วง", c: 30, cd: 3, t: "heal_cleanse", h: 25, d: "ฟื้น 25%HP + ลบ debuff CD3" },
    pas: { tr: "use_int", ch: 50, d: "Int skill 50% → Eva+10 (2ตา)", e: { t: "buff_eva", n: "หมอก", v: 10, u: 2 } } },

  { id: "emei", n: "ง้อไบ๊เซินกง", sc: "ง้อไบ๊", tp: "สมดุล·ภายใน", types: ["internal"], ti: 4,
    stats: { POW: 15, INT: 15, VIT: 20 }, hL: 35, mL: 35,
    act: { n: "วิสุทธิ์บัวหยก", c: 30, cd: 3, t: "heal_cleanse", h: 20, d: "ฟื้น 20%HP + ลบ debuff CD3" },
    pas: { tr: "hit_recv", ch: 25, d: "ถูกโจมตี 25% → ฟื้น 6% HP", e: { t: "heal_pct", v: 6 } } },

  { id: "shenzhao", n: "เซินจ้าวจิง", sc: "พรรคบู๊ลิ้ม", tp: "สมดุล·ภายใน", types: ["internal"], ti: 4,
    stats: { INT: 25, POW: 15, DEX: 10 }, hL: 20, mL: 50,
    act: { n: "ดวงตาจิต", c: 30, cd: 3, t: "debuff_acc_dmg", ad: -25, u: 3, dm: 0.7, d: "Acc-25 + Int×0.7 CD3" },
    pas: { tr: "use_int", ch: 100, d: "Int skill → ATK+12%", e: { t: "mult_atk" } } },

  { id: "taiyin", n: "ไต้อินเจิ้นชี่", sc: "สำนักมาร", tp: "หยิน·อ่อน", types: ["yin", "soft"], ti: 4,
    stats: { DEX: 20, LUK: 20, POW: 10 }, hL: 10, mL: 60,
    act: { n: "มรณะเย็น", c: 40, cd: 4, t: "debuff_poison", pp: 6, u: 4, ev: -15, d: "พิษ 6%HP/ตา + Eva-15 CD4" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ศัตรู Acc-10 (3ตา)", e: { t: "debuff_acc", n: "มรณะ", v: -10, u: 3 } } },

  { id: "huoxue", n: "ฮั่วเสวียสินฝ่า", sc: "หมอยุทธ", tp: "สมดุล·ภายใน", types: ["internal"], ti: 4,
    stats: { VIT: 25, POW: 15, DEF: 10 }, hL: 50, mL: 20,
    act: { n: "โลหิตรักษา", c: 25, cd: 3, t: "heal", h: 30, d: "ฟื้น 30% HP CD3" },
    pas: { tr: "hit_recv", ch: 20, d: "ถูกโจมตี 20% → ฟื้น 8% HP", e: { t: "heal_pct", v: 8 } } },

  { id: "huashan", n: "หัวซานเซินกง", sc: "หัวซาน", tp: "สมดุล·แข็ง", types: ["hard"], ti: 4,
    stats: { STR: 20, DEX: 15, POW: 15 }, hL: 35, mL: 35,
    act: { n: "กระบี่หนึ่งในฟ้า", c: 35, cd: 4, t: "atk_phy_pen", m: 1.4, pen: 35, d: "ทางกาย×1.4 ทะลุ DEF 35% CD4" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → สะสม ATK+5%", e: { t: "stack_atk", v: 5, mx: 5 } } },

  { id: "dongxuan", n: "ตงซวนเซินกง", sc: "สำนักมืด", tp: "หยิน·ภายใน", types: ["yin", "internal"], ti: 4,
    stats: { INT: 20, POW: 20, LUK: 10 }, hL: 15, mL: 55,
    act: { n: "กลืนชีพ", c: 40, cd: 4, t: "drain", m: 1.3, h: 50, d: "Int×1.3 + ดูด 50% dmg CD4" },
    pas: { tr: "use_act", ch: 100, d: "ใช้ IA → ATK+4% (≤+20%)", e: { t: "stack_atk", v: 4, mx: 5 } } },

  // ─── Tier 0 — พื้นฐาน (5 arts) ──────────────────────────────────────
  // Foundational chi-conditioning taught by entry-level masters.
  // Budget: hL+mL = 30 / level, total stats = 10.
  { id: "t0_lohan", n: "ลมปราณอรหันต์", sc: "เส้าหลิน (ขั้นต้น)", tp: "หยาง·แข็ง", types: ["yang", "hard"], ti: 0,
    stats: { STR: 6, VIT: 4 }, hL: 20, mL: 10,
    act: { n: "หมัดอรหันต์", c: 15, cd: 3, t: "heal", h: 10, d: "ฟื้น 10% HP CD3" },
    pas: { tr: "hit_recv", ch: 25, d: "ถูกโจมตี 25% → DEF+10 (1ตา)", e: { t: "buff_def", n: "เกราะ", v: 10, u: 1 } } },

  { id: "t0_ironshirt", n: "เกราะผ้าเหล็กพื้น", sc: "ปรมาจารย์เร่ร่อน", tp: "แข็ง·ภายนอก", types: ["hard", "external"], ti: 0,
    stats: { VIT: 6, DEF: 4 }, hL: 25, mL: 5,
    act: { n: "ปิดประตูร่างกาย", c: 15, cd: 3, t: "buff_reduce", v: 15, u: 2, d: "ลด dmg 15% (2ตา) CD3" },
    pas: { tr: "hit_recv", ch: 20, d: "ถูกโจมตี 20% → ฟื้น 5% HP", e: { t: "heal_pct", v: 5 } } },

  { id: "t0_sevenstar", n: "เจ็ดดาวเหนือ", sc: "สำนักดาวเหนือ", tp: "สมดุล·อ่อน", types: ["soft"], ti: 0,
    stats: { AGI: 5, DEX: 5 }, hL: 15, mL: 15,
    act: { n: "ดาวลอย", c: 15, cd: 3, t: "buff_eva_debuff_eva", selfV: 10, eneV: -8, u: 2, d: "Eva+10 / ศัตรู Eva-8 (2ตา) CD3" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → Eva+8 (1ตา)", e: { t: "buff_eva", n: "ดาว", v: 8, u: 1 } } },

  { id: "t0_fiveyuan", n: "ห้าธาตุพื้นฐาน", sc: "หมู่ดอยจ้าวซาน", tp: "สมดุล·ภายนอก", types: ["external"], ti: 0,
    stats: { STR: 3, AGI: 4, DEX: 3 }, hL: 18, mL: 12,
    act: { n: "ธาตุประสาน", c: 20, cd: 3, t: "atk_phy_pen", m: 1.2, pen: 15, d: "ทางกาย×1.2 ทะลุ DEF 15% CD3" },
    pas: { tr: "use_act", ch: 100, d: "ใช้ IA → ATK+3% (≤+9%)", e: { t: "stack_atk", v: 3, mx: 3 } } },

  { id: "t0_butterfly", n: "ลมปราณผีเสื้อ", sc: "หุบเขาผีเสื้อ", tp: "หยิน·อ่อน", types: ["yin", "soft"], ti: 0,
    stats: { POW: 5, INT: 5 }, hL: 10, mL: 20,
    act: { n: "บินเหลือร่อง", c: 18, cd: 3, t: "heal_cleanse", h: 10, d: "ฟื้น 10%HP + ลบ debuff CD3" },
    pas: { tr: "hit_recv", ch: 20, d: "ถูกโจมตี 20% → Eva+10 (1ตา)", e: { t: "buff_eva", n: "ผีเสื้อ", v: 10, u: 1 } } },

  // ─── Tier 1 — ขั้นกลาง (5 arts) ─────────────────────────────────────
  // Mid-rank schools' standard chi exercises. Budget: hL+mL = 40, stats = 20.
  { id: "t1_eagleclaw", n: "ลมปราณกรงเล็บอินทรี", sc: "สำนักเงาอินทรี", tp: "หยาง·ภายนอก", types: ["yang", "external"], ti: 1,
    stats: { STR: 8, DEX: 6, AGI: 6 }, hL: 25, mL: 15,
    act: { n: "เกาะร่างมรณะ", c: 25, cd: 3, t: "atk_phy_pen", m: 1.3, pen: 25, d: "ทางกาย×1.3 ทะลุ DEF 25% CD3" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ศัตรู PDef-8 (2ตา)", e: { t: "debuff_def", n: "บาดแผล", v: -8, u: 2 } } },

  { id: "t1_whitehorse", n: "ลมปราณม้าขาว", sc: "สำนักทุ่งหญ้า", tp: "สมดุล", types: [], ti: 1,
    stats: { POW: 8, INT: 6, LUK: 6 }, hL: 20, mL: 20,
    act: { n: "ฟื้นพลังม้า", c: 22, cd: 3, t: "heal_cleanse", h: 18, d: "ฟื้น 18%HP + ลบ debuff CD3" },
    pas: { tr: "hit_recv", ch: 20, d: "ถูกโจมตี 20% → ฟื้น 7% HP", e: { t: "heal_pct", v: 7 } } },

  { id: "t1_goldenbell", n: "กระดิ่งทองพื้นฐาน", sc: "เส้าหลิน (ขั้นกลาง)", tp: "แข็ง·ภายนอก", types: ["hard", "external"], ti: 1,
    stats: { VIT: 10, DEF: 6, STR: 4 }, hL: 30, mL: 10,
    act: { n: "เปลี่ยนตัวเป็นโลหะ", c: 18, cd: 3, t: "buff_reduce", v: 25, u: 2, d: "ลด dmg 25% (2ตา) CD3" },
    pas: { tr: "hit_recv", ch: 25, d: "ถูกโจมตี 25% → DEF+15 (2ตา)", e: { t: "buff_def", n: "ระฆังทอง", v: 15, u: 2 } } },

  { id: "t1_blackiron", n: "ลมปราณเหล็กดำ", sc: "หุบเขามืดเหล็ก", tp: "หยิน·ภายใน", types: ["yin", "internal"], ti: 1,
    stats: { POW: 8, VIT: 6, DEF: 6 }, hL: 22, mL: 18,
    act: { n: "เหล็กกลืนเลือด", c: 25, cd: 3, t: "drain_phy", m: 1.2, h: 25, d: "ทางกาย×1.2 + ดูด 25% CD3" },
    pas: { tr: "hit_recv", ch: 20, d: "ถูกโจมตี 20% → ศัตรู Acc-10 (2ตา)", e: { t: "debuff_acc", n: "ตาพร่า", v: -10, u: 2 } } },

  { id: "t1_redlotus", n: "บัวแดงเพลิงน้อย", sc: "สำนักเพลิงเล็ก", tp: "หยาง·ภายใน", types: ["yang", "internal"], ti: 1,
    stats: { POW: 10, INT: 6, DEX: 4 }, hL: 15, mL: 25,
    act: { n: "หมัดเพลิงแดง", c: 25, cd: 3, t: "atk_int_pen", m: 1.3, pen: 20, d: "Int×1.3 ทะลุ IDef 20% CD3" },
    pas: { tr: "use_int", ch: 50, d: "Int 50% → ศัตรู PDef-10 (2ตา)", e: { t: "debuff_def", n: "เพลิง", v: -10, u: 2 } } },

  // ─── Tier 2 — ขั้นสูง (5 arts) ──────────────────────────────────────
  // Major-school standards. Budget: hL+mL = 50, stats = 30.
  { id: "t2_eighttri", n: "แปดทิศมหาเวท", sc: "สำนักภูเขาแปดทิศ", tp: "สมดุล·อ่อน", types: ["soft"], ti: 2,
    stats: { AGI: 10, DEX: 10, INT: 10 }, hL: 25, mL: 25,
    act: { n: "เจาะแปดประตู", c: 30, cd: 4, t: "drain", m: 1.3, h: 30, d: "Int×1.3 + ดูด 30% dmg CD4" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → Eva+12 (2ตา)", e: { t: "buff_eva", n: "เกล็ดดาว", v: 12, u: 2 } } },

  { id: "t2_plumblossom", n: "ลมปราณเหมยห้ากลีบ", sc: "สำนักหิมะ", tp: "หยิน·อ่อน", types: ["yin", "soft"], ti: 2,
    stats: { POW: 10, INT: 10, DEX: 10 }, hL: 20, mL: 30,
    act: { n: "เหมยปรานี", c: 25, cd: 3, t: "heal_cleanse", h: 25, d: "ฟื้น 25%HP + ลบ debuff CD3" },
    pas: { tr: "hit_recv", ch: 25, d: "ถูกโจมตี 25% → Eva+15 (2ตา)", e: { t: "buff_eva", n: "ดอกเหมย", v: 15, u: 2 } } },

  { id: "t2_craneform", n: "กระเรียนสมาธิ", sc: "สำนักนกเทพ", tp: "สมดุล·ภายนอก", types: ["external"], ti: 2,
    stats: { AGI: 12, DEX: 10, LUK: 8 }, hL: 30, mL: 20,
    act: { n: "ปีกกระเรียน", c: 30, cd: 4, t: "drain_acc", m: 1.2, h: 35, adv: -12, d: "Int×1.2 + ดูด 35% + Acc-12 CD4" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ศัตรู Acc-10 (2ตา)", e: { t: "debuff_acc", n: "ขนนก", v: -10, u: 2 } } },

  { id: "t2_snakeform", n: "งูพิษเจ็ดสี", sc: "สำนักพิษเจ็ดสี", tp: "หยิน·อ่อน", types: ["yin", "soft"], ti: 2,
    stats: { DEX: 12, LUK: 10, POW: 8 }, hL: 18, mL: 32,
    act: { n: "เขี้ยวเจ็ดสี", c: 30, cd: 3, t: "debuff_poison", pp: 5, u: 3, ev: -12, d: "พิษ 5%HP/ตา + Eva-12 CD3" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → ศัตรู Eva-12 (2ตา)", e: { t: "debuff_eva", n: "พิษงู", v: -12, u: 2 } } },

  { id: "t2_tigerroar", n: "เสือคำราม", sc: "สำนักเสือเหลือง", tp: "หยาง·แข็ง", types: ["yang", "hard"], ti: 2,
    stats: { STR: 14, VIT: 10, AGI: 6 }, hL: 35, mL: 15,
    act: { n: "เสียงคำรามฟ้า", c: 30, cd: 4, t: "atk_phy_pen", m: 1.5, pen: 30, d: "ทางกาย×1.5 ทะลุ DEF 30% CD4" },
    pas: { tr: "use_act", ch: 100, d: "ใช้ IA → ATK+5% (≤+20%)", e: { t: "stack_atk", v: 5, mx: 4 } } },

  // ─── Tier 3 — ลับ (5 arts) ──────────────────────────────────────────
  // Hidden / secret manuals — pre-legendary tier. Budget: hL+mL = 60, stats = 40.
  { id: "t3_dragonelephant", n: "มังกร-ช้างปัญญา", sc: "สำนักทิเบต", tp: "หยาง·แข็ง", types: ["yang", "hard"], ti: 3,
    stats: { STR: 14, VIT: 14, DEF: 12 }, hL: 40, mL: 20,
    act: { n: "ช้างเหยียบจักรวาล", c: 35, cd: 4, t: "atk_phy_pen", m: 1.6, pen: 40, d: "ทางกาย×1.6 ทะลุ DEF 40% CD4" },
    pas: { tr: "hit_recv", ch: 30, d: "ถูกโจมตี 30% → ฟื้น 10% HP", e: { t: "heal_pct", v: 10 } } },

  { id: "t3_onefinger", n: "เอกนิ้วเซน", sc: "เส้าหลิน (วิชาลับ)", tp: "สมดุล·ภายใน", types: ["internal"], ti: 3,
    stats: { POW: 14, INT: 14, DEX: 12 }, hL: 25, mL: 35,
    act: { n: "นิ้วฟ้าผ่า", c: 35, cd: 4, t: "atk_int_pen", m: 1.5, pen: 35, d: "Int×1.5 ทะลุ IDef 35% CD4" },
    pas: { tr: "use_int", ch: 100, d: "Int → ศัตรู Acc-12 (3ตา)", e: { t: "debuff_acc", n: "นิ้วประสาท", v: -12, u: 3 } } },

  { id: "t3_heartmind", n: "วิชากลใจเป็นจิต", sc: "สำนักจิตวิญญาณ", tp: "สมดุล·ภายใน", types: ["internal"], ti: 3,
    stats: { INT: 16, POW: 14, LUK: 10 }, hL: 20, mL: 40,
    act: { n: "ส่องใจ", c: 30, cd: 3, t: "debuff_acc_dmg", ad: -22, u: 3, dm: 0.7, d: "Acc-22 + Int×0.7 CD3" },
    pas: { tr: "use_int", ch: 100, d: "Int → IAtk+15%", e: { t: "mult_iatk" } } },

  { id: "t3_voidstep", n: "ก้าวว่างไร้รอย", sc: "สำนักลมหิมะ", tp: "อ่อน·ภายนอก", types: ["soft", "external"], ti: 3,
    stats: { AGI: 16, DEX: 12, LUK: 12 }, hL: 30, mL: 30,
    act: { n: "พลิกฟ้าหายตัว", c: 25, cd: 3, t: "buff_eva_debuff_eva", selfV: 25, eneV: -20, u: 3, d: "Eva+25 / ศัตรู Eva-20 (3ตา) CD3" },
    pas: { tr: "on_crit", ch: 100, d: "Crit → Eva+20 (2ตา)", e: { t: "buff_eva", n: "ก้าวว่าง", v: 20, u: 2 } } },

  { id: "t3_yinyang", n: "หยินหยางสมดุล", sc: "สำนักหยินหยาง", tp: "สมดุล", types: [], ti: 3,
    stats: { POW: 14, INT: 12, VIT: 8, DEF: 6 }, hL: 35, mL: 25,
    act: { n: "ปรานสมดุล", c: 35, cd: 4, t: "heal_cleanse", h: 30, d: "ฟื้น 30%HP + ลบ debuff CD4" },
    pas: { tr: "hit_recv", ch: 25, d: "ถูกโจมตี 25% → ฟื้น 8% HP", e: { t: "heal_pct", v: 8 } } },
];

export const ARTS_BY_ID: Map<string, Art> = new Map(ARTS.map((a) => [a.id, a]));

export function getArt(id: string | null | undefined): Art {
  if (!id) return ARTS[0];
  return ARTS_BY_ID.get(id) ?? ARTS[0];
}
