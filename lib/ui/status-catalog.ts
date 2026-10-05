// Battle statuses: one look per BuffRecord / DebuffRecord kind — a Thai name,
// a colour, a pictogram and how the aura behaves. Shared by the battle stage
// (lib/stage/status-vfx.ts) and the battle UI (unit card chips). Pure data.
//
// Keyed by string so a kind the engine adds later still draws (STATUS_FALLBACK)
// before it gets its own entry here.

import type { MeridianElement } from "@/lib/game/meridian-types";

/** Pictograms drawn by status-vfx (canvas paths, no fonts). */
export type StatusIcon =
  | "sword" | "shield" | "swirl" | "chevrons" | "star" | "drop" | "flame" | "bolt" | "rock"
  | "mirror" | "riposte" | "qi" | "bubble" | "rune" | "skull" | "spiral" | "eye" | "fist" | "plus";

/** How the aura around the unit moves. */
export type StatusAura = "rise" | "fall" | "orbit" | "drip" | "none";

export interface StatusStyle {
  /** Short Thai name (chips, floating labels). */
  label: string;
  kind: "buff" | "debuff";
  /** 0xRRGGBB. */
  color: number;
  icon: StatusIcon;
  /** Small ▲ / ▼ in the icon's corner (stat raised / lowered). */
  arrow?: "up" | "down";
  aura: StatusAura;
}

const S = (label: string, kind: "buff" | "debuff", color: number, icon: StatusIcon, aura: StatusAura, arrow?: "up" | "down"): StatusStyle =>
  ({ label, kind, color, icon, aura, arrow });

export const STATUS_STYLES: Readonly<Record<string, StatusStyle>> = {
  // Skill / art / stance buffs
  buff_def: S("แข็งแกร่ง", "buff", 0xd7a85a, "shield", "rise", "up"),
  buff_eva: S("พริ้วไหว", "buff", 0x9fe6d4, "swirl", "rise", "up"),
  buff_reduce: S("ทรงพลัง", "buff", 0xe8c770, "shield", "rise"),
  buff_reflect: S("สะท้อนพลัง", "buff", 0xc7b6ff, "mirror", "orbit"),
  buff_riposte: S("พร้อมสวนกลับ", "buff", 0xffb36b, "riposte", "none"),
  buff_spd: S("ว่องไว", "buff", 0x8fe3ff, "chevrons", "rise", "up"),
  buff_cri: S("วงคริต", "buff", 0xffe066, "star", "rise", "up"),
  buff_iatk: S("ลมปราณอุดร", "buff", 0x8ab8ff, "qi", "rise", "up"),
  heal_pct: S("ฟื้นพลัง", "buff", 0x8ef0a8, "plus", "rise"),
  heal_buff: S("ฟื้นพลังต่อเนื่อง", "buff", 0x8ef0a8, "plus", "rise"),
  stack_atk: S("สะสมพลังโจมตี", "buff", 0xff8a5a, "fist", "none", "up"),
  buff_iatk_reduce: S("กร้าวแกร่ง", "buff", 0x8ab8ff, "qi", "rise"),
  buff_reflect_eva: S("ยืมหอกสนองคืน", "buff", 0xc7b6ff, "mirror", "orbit"),
  // Meridian battle effects (the opening's % buffs and the elemental rages share these)
  buff_atk_pct: S("พลังโจมตีพุ่ง", "buff", 0xff7a4a, "sword", "rise", "up"),
  buff_regen: S("ฟื้นชีพจร", "buff", 0x6fd8ff, "drop", "rise"),
  buff_spd_pct: S("ความเร็วพุ่ง", "buff", 0xa8f0d8, "chevrons", "rise", "up"),
  buff_def_pct: S("พลังป้องกันพุ่ง", "buff", 0xd8a35a, "rock", "rise", "up"),
  buff_cri_rate: S("คริติคอลพุ่ง", "buff", 0xffe066, "bolt", "rise", "up"),
  buff_acc_pct: S("แม่นยำพุ่ง", "buff", 0xf0e6a0, "eye", "rise", "up"),
  shield: S("โล่ชีพจร", "buff", 0x7fd8ff, "bubble", "none"),
  ward: S("ผนึกชีพจร", "buff", 0xf3d27a, "rune", "orbit"),
  // Debuffs
  debuff_def: S("เกราะแตก", "debuff", 0xd08a5a, "shield", "fall", "down"),
  debuff_eva: S("ติดขัด", "debuff", 0x9aa7b5, "swirl", "fall", "down"),
  debuff_acc: S("ตาพร่า", "debuff", 0xb3a3c9, "eye", "fall", "down"),
  debuff_atk: S("อ่อนพลัง", "debuff", 0xe0705a, "sword", "fall", "down"),
  debuff_spd: S("เชื่องช้า", "debuff", 0x8fa6c9, "chevrons", "fall", "down"),
  debuff_poison: S("พิษ", "debuff", 0x7fdc5a, "skull", "drip"),
  burn_hp_mp: S("เผาไหม้", "debuff", 0xff6a3a, "flame", "rise"),
  stun: S("มึนงง", "debuff", 0xfff27a, "spiral", "none"),
};

export const STATUS_FALLBACK_BUFF = S("เสริมพลัง", "buff", 0xf3e2b0, "plus", "rise", "up");
export const STATUS_FALLBACK_DEBUFF = S("ถูกกด", "debuff", 0xc9a0a0, "chevrons", "fall", "down");

/** Elemental rages (เพลิงพิโรธ…): colour and pictogram by element. */
export const RAGE_STYLES: Readonly<Record<MeridianElement, { color: number; icon: StatusIcon }>> = {
  fire: { color: 0xff5a2a, icon: "flame" },
  water: { color: 0x4fc6ff, icon: "drop" },
  wind: { color: 0x9df0c8, icon: "swirl" },
  earth: { color: 0xc99a52, icon: "rock" },
  thunder: { color: 0xb68cff, icon: "bolt" },
};

export interface StatusLike { t: string; n?: string; el?: string; v?: number }

/** The look of one status record (rages by element, then by kind). */
export function statusStyle(record: StatusLike, kind: "buff" | "debuff"): StatusStyle {
  const base = STATUS_STYLES[record.t] ?? (kind === "buff" ? STATUS_FALLBACK_BUFF : STATUS_FALLBACK_DEBUFF);
  const rage = record.el ? RAGE_STYLES[record.el as MeridianElement] : undefined;
  if (rage) return { ...base, label: record.n || base.label, color: rage.color, icon: rage.icon, aura: "rise" };
  return base;
}

/** A stable key for grouping (rage stacks of one element are one group). */
export const statusKey = (record: StatusLike) => (record.el ? `${record.t}:${record.el}` : record.t);

export const hexColor = (color: number) => `#${color.toString(16).padStart(6, "0")}`;
