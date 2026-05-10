import type { BuffRecord, DebuffRecord } from "@/lib/game";

// Per-buff / debuff display copy. The runtime BuffRecord / DebuffRecord
// only carry numeric values + a short label — this lookup turns them
// into hover-friendly explanations. Centralised here so the SidePanel
// tooltip stays simple and authors can edit copy in one place.

export interface BuffDescription {
  title: string;
  detail: string;
}

// Canonical badge label per `t`. The runtime `n` field can drift
// across sources (skill ee = "DEF↓", art passive = "บาดลึก", weapon
// on_hit = "def↓") even though every variant of the same `t` is the
// SAME debuff. Forcing a single label per type prevents the player
// from thinking they have two separate stacks. The name field is now
// only used internally for log lines; the SidePanel renders this
// canonical label.
export function buffBadgeLabel(b: BuffRecord): string {
  switch (b.t) {
    case "buff_def": return "แข็งแกร่ง";
    case "buff_eva": return "พริ้วไหว";
    case "buff_reduce": return "ทรงพลัง";
    case "buff_reflect": return "สะท้อนพลัง";
    case "buff_spd": return "ว่องไว";
    case "buff_cri": return "วงคริต";
    case "heal_pct": return "ฟื้นพลัง";
    case "heal_buff": return "ฟื้นพลังต่อเนื่อง";
    case "stack_atk": return "สะสมพลังโจมตี";
    case "buff_iatk": return "สะสมพลังโจมตีภายใน";
    case "buff_iatk_reduce": return "กร้างแกร่ง";
    case "buff_reflect_eva": return "ยืมหอกสนองคืน";
  }
}

export function debuffBadgeLabel(d: DebuffRecord): string {
  switch (d.t) {
    case "debuff_def": return "เกราะแตก";
    case "debuff_eva": return "ติดขัด";
    case "debuff_acc": return "ตาพร่า";
    case "debuff_atk": return "อ่อนพลัง";
    case "debuff_poison": return "พิษ";
    case "burn_hp_mp": return "เผาไหม้";
    case "stun": return "มึนงง";
  }
}

const sign = (v: number) => (v >= 0 ? `+${v}` : `${v}`);

export function describeBuff(b: BuffRecord): BuffDescription {
  switch (b.t) {
    case "buff_def":
      return {
        title: "แข็งแกร่ง",
        detail: `เพิ่ม PDef ${sign(b.v)} — ลด damage ทางกายที่รับเข้า. สะสมจาก buff อื่นประเภทเดียวกันได้`,
      };
    case "buff_eva":
      return {
        title: "พริ้วไหว",
        detail: `เพิ่ม Eva ${sign(b.v)} — โอกาสหลบโจมตีของศัตรูสูงขึ้น`,
      };
    case "buff_reduce":
      return {
        title: "ทรงพลัง",
        detail: `ลด damage ที่ได้รับ ${b.v}% — กระทบทุกประเภท damage`,
      };
    case "buff_reflect":
      return {
        title: "สะท้อนพลังร้าย",
        detail: `สะท้อน ${b.v}% ของ damage ที่ได้รับ กลับไปยังผู้โจมตี · ใช้ครั้งเดียวแล้วหายไป`,
      };
    case "buff_spd":
      return {
        title: "ว่องไว",
        detail: `SPD ${sign(b.v)} — เกจ ATB ไหลเร็วขึ้น (ตาเร็วกว่าศัตรู)`,
      };
    case "buff_cri":
      return {
        title: "วงคริต",
        detail: `Cri ${sign(b.v)} — โอกาสคริติคอลต่อเทิร์นสูงขึ้น`,
      };
    case "heal_pct":
      return {
        title: "ฟื้นพลังดีเด่น",
        detail: `ฟื้น HP ${b.v}% ของพลังชีวิตสูงสุด · effect ทันที`,
      };
    case "heal_buff":
      return {
        title: "ฟื้นพลังต่อเนื่อง",
        detail: `ฟื้น HP + เพิ่ม buff defensively`,
      };
    case "stack_atk":
      return {
        title: "สะสมพลังโจมตีภายใน",
        detail: `ATK ${sign(b.v)} × จำนวนชั้น (สูงสุดตาม mx) · ค้างจนสุดเกม (ลบโดย dispel)`,
      };
    case "buff_iatk":
      return {
        title: "สะสมพลังโจมตีภายใน",
        detail: `IAtk ${sign(b.v)}% — เพิ่มพลังโจมตีภายใน (Int)`,
      };
    case "buff_iatk_reduce":
      return {
        title: "กร้างแกร่ง",
        detail: `IAtk + ลด damage รับเข้าพร้อมกัน (combo)`,
      };
    case "buff_reflect_eva":
      return {
        title: "ยืมหอกสนองคืน",
        detail: `สะท้อน ${b.v}% + เพิ่ม Eva (combo)`,
      };
  }
}

export function describeDebuff(d: DebuffRecord): BuffDescription {
  switch (d.t) {
    case "debuff_acc":
      return {
        title: "ตาพร่า (Acc ลด)",
        detail: `Acc ${sign(d.v ?? 0)} — โอกาสโจมตีพลาดสูงขึ้น · สะสมจาก hit ซ้ำได้`,
      };
    case "debuff_eva":
      return {
        title: "ติดขัด (Eva ลด)",
        detail: `Eva ${sign(d.v ?? 0)} — หลบยากขึ้น · สะสมจาก hit ซ้ำได้`,
      };
    case "debuff_def":
      return {
        title: "เกราะแตก (PDef ลด)",
        detail: `PDef ${sign(d.v ?? 0)} — รับ damage ทางกายมากขึ้น · สะสมจาก hit ซ้ำได้`,
      };
    case "debuff_atk":
      return {
        title: "อ่อนแรง (ATK ลด)",
        detail: `ATK ${sign(d.v ?? 0)}% — damage โจมตีออกลดลง · สะสมจาก hit ซ้ำได้`,
      };
    case "debuff_poison":
      return {
        title: "พิษ",
        detail: `รับ damage ${d.pp ?? 0}% HP ต่อเทิร์น (DoT) · ตายจากพิษได้`,
      };
    case "burn_hp_mp":
      return {
        title: "เผาไหม้",
        detail: `ลด HP ${d.pp ?? 0}% + MP ${d.mpp ?? 0}% ต่อเทิร์น · DoT คู่`,
      };
    case "stun":
      return {
        title: "สตัน",
        detail: `ข้ามตา (skip turn) — ไม่สามารถโจมตี/ใช้สกิลได้`,
      };
  }
}
