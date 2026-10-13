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
    case "buff_riposte": return `สวนกลับ +${b.v}%`;
    case "buff_spd": return "ว่องไว";
    case "buff_cri": return "วงคริต";
    case "heal_pct": return "ฟื้นพลัง";
    case "heal_buff": return "ฟื้นพลังต่อเนื่อง";
    case "stack_atk": return "สะสมพลังโจมตี";
    case "buff_iatk": return "สะสมพลังโจมตีภายใน";
    case "buff_iatk_reduce": return "กร้างแกร่ง";
    case "buff_reflect_eva": return "ยืมหอกสนองคืน";
    // ชีพจร (lib/game/meridian-battle.ts): rage stacks carry their element name in `n`.
    case "buff_atk_pct": return b.n ?? "พลังโจมตี↑";
    case "buff_regen": return b.n ?? "ฟื้นชีพจร";
    case "buff_spd_pct": return b.n ?? "ความเร็ว↑";
    case "buff_def_pct": return b.n ?? "พลังป้องกัน↑";
    case "buff_cri_rate": return b.n ?? "คริติคอล↑";
    case "buff_acc_pct": return b.n ?? "แม่นยำ↑";
    case "shield": return `${b.n === "กระดองตะวัน" ? "กระดองตะวัน" : "โล่ชีพจร"} ${b.v}`;
    case "ward": return `ผนึกชีพจร ×${b.v}`;
    // Boss self-effects: only "frenzy" stays as a record (molt / sun_shell leave reflect + shield).
    case "frenzy": return `คลั่ง +${b.v}%`;
    case "molt": return "ลอกคราบ";
    case "sun_shell": return "กระดองตะวัน";
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
    case "debuff_spd": return "เชื่องช้า";
    case "bleed": return `เลือดไหล ${d.pp ?? 0}%`;
    case "blind": return "ตาบอด";
    case "scorch": return "แผดเผา";
  }
}

const sign = (v: number) => (v >= 0 ? `+${v}` : `${v}`);

export function describeBuff(b: BuffRecord): BuffDescription {
  switch (b.t) {
    case "buff_def":
      return {
        title: "แข็งแกร่ง",
        detail: `ป้องกันกาย ${sign(b.v)} — รับความเสียหายทางกายน้อยลง · ซ้อนกับพลังเสริมประเภทเดียวกันได้`,
      };
    case "buff_eva":
      return {
        title: "พริ้วไหว",
        detail: `หลบหลีก ${sign(b.v)} — หลบการโจมตีของศัตรูได้ง่ายขึ้น`,
      };
    case "buff_reduce":
      return {
        title: "ทรงพลัง",
        detail: `ลดความเสียหายที่ได้รับ ${b.v}% — ทั้งทางกายและทางใน`,
      };
    case "buff_reflect":
      return {
        title: "สะท้อนพลังร้าย",
        detail: `สะท้อนความเสียหายที่ได้รับ ${b.v}% กลับไปยังผู้โจมตี · ใช้ครั้งเดียวแล้วหายไป`,
      };
    case "buff_riposte":
      return {
        title: "พร้อมสวนกลับ",
        detail: `โจมตีภายนอกครั้งถัดไปแรงขึ้น ${b.v}% · ใช้ได้ 1 ครั้ง แม้โจมตีพลาดก็เสียสิทธิ์ · ไม่หมดระหว่างตาศัตรู`,
      };
    case "buff_spd":
      return {
        title: "ว่องไว",
        detail: `ความเร็ว ${sign(b.v)} — ถึงตาเร็วขึ้น ได้ตาก่อนศัตรู`,
      };
    case "buff_cri":
      return {
        title: "วงคริต",
        detail: `คริติคอล ${sign(b.v)} — โอกาสติดคริติคอลสูงขึ้น`,
      };
    case "heal_pct":
      return {
        title: "ฟื้นพลังดีเด่น",
        detail: `ฟื้นพลังชีวิต ${b.v}% ของสูงสุด · ได้ผลทันที`,
      };
    case "heal_buff":
      return {
        title: "ฟื้นพลังต่อเนื่อง",
        detail: `ฟื้นพลังชีวิตและเพิ่มพลังป้องกันตัว`,
      };
    case "stack_atk":
      return {
        title: "สะสมพลังโจมตีภายใน",
        detail: `พลังโจมตี ${sign(b.v)}% ต่อชั้น (ซ้อนได้ตามที่ท่ากำหนด) · อยู่จนจบการต่อสู้ เว้นถูกล้างพลังเสริม`,
      };
    case "buff_iatk":
      return {
        title: "สะสมพลังโจมตีภายใน",
        detail: `พลังโจมตีภายใน ${sign(b.v)}%`,
      };
    case "buff_iatk_reduce":
      return {
        title: "กร้างแกร่ง",
        detail: `เพิ่มพลังโจมตีภายใน และลดความเสียหายที่ได้รับไปพร้อมกัน`,
      };
    case "buff_reflect_eva":
      return {
        title: "ยืมหอกสนองคืน",
        detail: `สะท้อนความเสียหาย ${b.v}% และเพิ่มหลบหลีก`,
      };
    case "buff_atk_pct":
      return { title: b.n ?? "พลังโจมตี↑", detail: `พลังโจมตี +${b.v}% (ชีพจร)` };
    case "buff_regen":
      return { title: b.n ?? "ฟื้นชีพจร", detail: `ฟื้นพลังชีวิต ${b.v}% ของสูงสุด ทุกต้นตาของตน (ชีพจร)` };
    case "buff_spd_pct":
      return { title: b.n ?? "ความเร็ว↑", detail: `ถึงตาเร็วขึ้น ${b.v}% (ชีพจร)` };
    case "buff_def_pct":
      return { title: b.n ?? "พลังป้องกัน↑", detail: `ป้องกันกายและป้องกันใน +${b.v}% (ชีพจร)` };
    case "buff_cri_rate":
      return { title: b.n ?? "คริติคอล↑", detail: `โอกาสคริติคอล +${b.v} (ชีพจร)` };
    case "buff_acc_pct":
      return { title: b.n ?? "แม่นยำ↑", detail: `แม่นยำ +${b.v}% (ชีพจร)` };
    case "shield":
      return { title: b.n === "กระดองตะวัน" ? "กระดองตะวัน" : "โล่ชีพจร", detail: `ดูดซับความเสียหายได้อีก ${b.v} ก่อนถึงพลังชีวิต` };
    case "ward":
      return { title: "ผนึกชีพจร", detail: `กันสถานะผิดปกติได้อีก ${b.v} ครั้ง` };
    case "frenzy":
      return { title: "โลหิตคลั่ง", detail: `พลังโจมตี +${b.v}% — ยิ่งเลือดน้อยยิ่งคลั่งแรง` };
    case "molt":
      return { title: "ลอกคราบ", detail: "ล้างสถานะผิดปกติทั้งหมด ฟื้นพลังชีวิต และสะท้อนความเสียหาย" };
    case "sun_shell":
      return { title: "กระดองตะวัน", detail: "โล่ดูดซับความเสียหายตามสัดส่วนพลังชีวิตสูงสุด และสะท้อนความเสียหาย" };
  }
}

export function describeDebuff(d: DebuffRecord): BuffDescription {
  switch (d.t) {
    case "debuff_acc":
      return {
        title: "ตาพร่า (แม่นยำลด)",
        detail: `แม่นยำ ${sign(d.v ?? 0)} — โจมตีพลาดง่ายขึ้น · ซ้อนได้เมื่อโดนซ้ำ`,
      };
    case "debuff_eva":
      return {
        title: "ติดขัด (หลบหลีกลด)",
        detail: `หลบหลีก ${sign(d.v ?? 0)} — หลบยากขึ้น · ซ้อนได้เมื่อโดนซ้ำ`,
      };
    case "debuff_def":
      return {
        title: "เกราะแตก (ป้องกันกายลด)",
        detail: `ป้องกันกาย ${sign(d.v ?? 0)} — รับความเสียหายทางกายมากขึ้น · ซ้อนได้เมื่อโดนซ้ำ`,
      };
    case "debuff_atk":
      return {
        title: "อ่อนแรง (พลังโจมตีลด)",
        detail: `พลังโจมตี ${sign(d.v ?? 0)}% — โจมตีเบาลง · ซ้อนได้เมื่อโดนซ้ำ`,
      };
    case "debuff_poison":
      return {
        title: "พิษ",
        detail: `เสียพลังชีวิต ${d.pp ?? 0}% ทุกตา · ตายจากพิษได้`,
      };
    case "burn_hp_mp":
      return {
        title: "เผาไหม้",
        detail: `เสียพลังชีวิต ${d.pp ?? 0}% และปราณ ${d.mpp ?? 0}% ทุกตา`,
      };
    case "stun":
      return {
        title: "สตัน",
        detail: `ข้ามตา — โจมตีหรือใช้กระบวนท่าไม่ได้`,
      };
    case "debuff_spd":
      return { title: "เชื่องช้า (ความเร็วลด)", detail: `ถึงตาช้าลง ${Math.abs(d.v ?? 0)}% (ถูกสกัดชีพจร)` };
    case "bleed":
      return { title: "เลือดไหล", detail: `เสียพลังชีวิต ${d.pp ?? 0}% ทุกตา และแผลเปิดกว้างขึ้น +${d.inc ?? 0}% ทุกตา` };
    case "blind":
      return { title: "ตาบอด", detail: `ท่าถัดไปมีโอกาส ${d.ch ?? 0}% พลาดเป้าทั้งท่า (ใช้แล้วหายไป)` };
    case "scorch":
      return { title: "แผดเผา", detail: `เสียพลังชีวิต ${d.pp ?? 0}% ทุกตา · ฟื้นพลังชีวิตไม่ได้ทุกทาง` };
  }
}
