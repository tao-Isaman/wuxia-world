// ชีพจร — the battle effects of filled points, in Thai, for the meridian screen.
import { MERIDIAN_ELEMENT_LABEL, type MeridianEffect } from "@/lib/game/meridian-types";
import { MERIDIAN_STAT_LABEL } from "@/lib/game/meridian-battle";
import { RAGE_STYLES, STATUS_STYLES, hexColor } from "@/lib/ui/status-catalog";

const RAGE_GAIN: Record<string, (v: number) => string> = {
  fire: (v) => `พลังโจมตี +${v}%`,
  water: (v) => `ฟื้น HP ${v}% ทุกต้นตา`,
  wind: (v) => `ความเร็ว +${v}%`,
  earth: (v) => `พลังป้องกัน +${v}%`,
  thunder: (v) => `โอกาสคริติคอล +${v}`,
};

const OPENING_STATUS: Record<string, string> = {
  atk: "buff_atk_pct", def: "buff_def_pct", spd: "buff_spd_pct", cri: "buff_cri_rate", eva: "buff_eva", acc: "buff_acc_pct", reduce: "buff_reduce",
};
const SAP_STATUS: Record<string, string> = { atk: "debuff_atk", def: "debuff_def", spd: "debuff_spd", eva: "debuff_eva", acc: "debuff_acc" };

export interface EffectView {
  /** Short Thai name (เปิดศึก, คืนชีพ, เพลิงพิโรธ…). */
  name: string;
  /** What it does, one Thai line. */
  text: string;
  /** CSS colour of its status. */
  color: string;
}

export function meridianEffectView(e: MeridianEffect): EffectView {
  const color = (t: string, fallback = 0xf3d27a) => hexColor(STATUS_STYLES[t]?.color ?? fallback);
  switch (e.t) {
    case "opening":
      return { name: "เปิดศึก", color: color(OPENING_STATUS[e.stat] ?? "buff_atk_pct"),
        text: `เข้าศึก: ${MERIDIAN_STAT_LABEL[e.stat]} +${e.v}% ${e.turns} ตาแรก` };
    case "revive":
      return { name: "คืนชีพ", color: "#ffd36a", text: `ล้มลงครั้งแรกลุกขึ้นใหม่ด้วย HP ${e.hpPct}% (ครั้งเดียวต่อศึก)` };
    case "rage":
      return { name: MERIDIAN_ELEMENT_LABEL[e.element], color: hexColor(RAGE_STYLES[e.element].color),
        text: `ถูกโจมตี: โอกาส ${e.chance}% ได้${RAGE_GAIN[e.element](e.v)} ${e.turns} ตา · ซ้อนได้ ${e.maxStacks} ชั้น` };
    case "shield":
      return { name: "โล่ชีพจร", color: color("shield"), text: `เข้าศึก: โล่ปราณ ${e.pct}% ของ HP สูงสุด ดูดซับความเสียหายก่อน` };
    case "ward":
      return { name: "ผนึกชีพจร", color: color("ward"), text: `เข้าศึก: กันดีบัฟได้ ${e.count} ครั้ง` };
    case "sap":
      return { name: "สกัดชีพจร", color: color(SAP_STATUS[e.stat] ?? "debuff_atk"),
        text: `โจมตีโดน: โอกาส ${e.chance}% ลด${MERIDIAN_STAT_LABEL[e.stat]}เป้าหมาย ${e.v}% ${e.turns} ตา` };
  }
}
