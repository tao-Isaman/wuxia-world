// Thai names for the derived combat stats and equipment bonuses. Everything the
// player reads is Thai: the tables keep short keys (HP, Atk, PD…), the UI
// shows these words instead.

import type { Equipment, StatKey } from "./types";
import type { EquipBonus } from "./derive";
import { STAT_LABEL } from "./data/stats";
import { WEAPON_FAMILY_LABEL } from "./data/weapons";
import { enhanceBonus, gearAffixes, parseGear, type GearAffix, type GearAffixKind } from "./gear";
import type { EquipSlotType } from "./types";

/** The derived stats (`deriveAll`'s keys) in Thai. */
export const DERIVED_LABEL = {
  HP: "พลังชีวิต",
  MP: "ปราณ",
  Atk: "พลังโจมตี",
  PA: "โจมตีภายนอก",
  IA: "โจมตีภายใน",
  PD: "ป้องกันภายนอก",
  ID: "ป้องกันภายใน",
  Spd: "ความเร็ว",
  Eva: "หลบหลีก",
  Acc: "แม่นยำ",
  Cri: "คริติคอล",
  Res: "ต้านทาน",
} as const;

const ON_HIT_LABEL: Record<string, string> = {
  debuff_eva: DERIVED_LABEL.Eva,
  debuff_acc: DERIVED_LABEL.Acc,
  debuff_def: "ป้องกัน",
};

const signed = (v: number) => (v >= 0 ? `+${v}` : `−${Math.abs(v)}`);

/** One equipment piece's bonuses: "พลังโจมตี +12 · ป้องกันภายนอก +4 · ทุกครั้งที่ตีโดน หลบหลีกศัตรู −5 (1 ตา)". */
export function equipStatParts(e: Equipment): string[] {
  const out: string[] = [];
  const add = (label: string, value: number | undefined) => { if (value) out.push(`${label} ${signed(value)}`); };
  add(DERIVED_LABEL.Atk, e.atkb); add(DERIVED_LABEL.PA, e.pab); add(DERIVED_LABEL.IA, e.iab);
  add(DERIVED_LABEL.PD, e.pdb); add(DERIVED_LABEL.ID, e.idb);
  // A flat crit / evasion effect is the same stat: one line, summed.
  const eff = e.eff;
  const flatCri = eff?.t === "flat_cri" ? eff.v : 0;
  const flatEva = eff?.t === "flat_eva" ? eff.v : 0;
  add(DERIVED_LABEL.HP, e.hpb); add(DERIVED_LABEL.MP, e.mpb); add(DERIVED_LABEL.Spd, e.spdb);
  add(DERIVED_LABEL.Eva, (e.evab ?? 0) + flatEva); add(DERIVED_LABEL.Acc, e.accb); add(DERIVED_LABEL.Cri, (e.crib ?? 0) + flatCri); add(DERIVED_LABEL.Res, e.resb);
  for (const [k, v] of Object.entries(e.st)) add(STAT_LABEL[k as StatKey] ?? k, v);
  if (eff) {
    if (eff.t === "pct_atk") out.push(`${DERIVED_LABEL.Atk} +${eff.v}%`);
    else if (eff.t === "pct_reduce") out.push(`ลดความเสียหายที่ได้รับ ${eff.v}%`);
    else if (eff.t === "hp_regen") out.push(`ฟื้นพลังชีวิต ${eff.v}% ทุกตา`);
    else if (eff.t === "on_hit") out.push(`ตีโดนแล้ว${ON_HIT_LABEL[eff.db.t] ?? ""}ศัตรู ${signed(eff.db.v)} (${eff.db.u} ตา)`);
  }
  return out;
}

/** Everything worn, summed: the same words as `equipStatParts`. */
export function equipBonusParts(eb: EquipBonus, stats: Partial<Record<StatKey, number>> = {}): string[] {
  const out: string[] = [];
  const add = (label: string, value: number) => { if (value) out.push(`${label} ${signed(value)}`); };
  add(DERIVED_LABEL.Atk, eb.atk); add(DERIVED_LABEL.PA, eb.pa); add(DERIVED_LABEL.IA, eb.ia);
  add(DERIVED_LABEL.PD, eb.pd); add(DERIVED_LABEL.ID, eb.id_);
  add(DERIVED_LABEL.HP, eb.hp); add(DERIVED_LABEL.MP, eb.mp); add(DERIVED_LABEL.Spd, eb.spd);
  add(DERIVED_LABEL.Eva, eb.eva); add(DERIVED_LABEL.Acc, eb.acc); add(DERIVED_LABEL.Cri, eb.cri); add(DERIVED_LABEL.Res, eb.res);
  if (eb.pct_atk) out.push(`${DERIVED_LABEL.Atk} +${eb.pct_atk}%`);
  if (eb.pd_pct) out.push(`${DERIVED_LABEL.PD} +${eb.pd_pct}%`);
  if (eb.id_pct) out.push(`${DERIVED_LABEL.ID} +${eb.id_pct}%`);
  if (eb.pa_pct) out.push(`${DERIVED_LABEL.PA} +${eb.pa_pct}%`);
  if (eb.ia_pct) out.push(`${DERIVED_LABEL.IA} +${eb.ia_pct}%`);
  if (eb.acc_pct) out.push(`${DERIVED_LABEL.Acc} +${eb.acc_pct}%`);
  if (eb.eva_pct) out.push(`${DERIVED_LABEL.Eva} +${eb.eva_pct}%`);
  if (eb.crit_dmg) out.push(`ความเสียหายคริติคอล +${eb.crit_dmg}%`);
  if (eb.wexp) out.push(`ประสบการณ์ยุทธที่ได้รับ +${eb.wexp}%`);
  if (eb.final_dmg) out.push(`ความเสียหายสุดท้าย +${eb.final_dmg}%`);
  if (eb.pct_red) out.push(`ลดความเสียหายที่ได้รับ ${eb.pct_red}%`);
  if (eb.hp_regen) out.push(`ฟื้นพลังชีวิต ${eb.hp_regen}% ทุกตา`);
  for (const [k, v] of Object.entries(stats)) if (v) add(STAT_LABEL[k as StatKey] ?? k, v);
  return out;
}

/** What each gear option kind is called (ออฟชั่นเสริม, lib/game/gear.ts). */
export const AFFIX_LABEL: Record<GearAffixKind, string> = {
  stat: "ค่าสถานะพื้นฐาน",
  pd: DERIVED_LABEL.PD,
  id: DERIVED_LABEL.ID,
  pa: DERIVED_LABEL.PA,
  ia: DERIVED_LABEL.IA,
  pd_pct: `${DERIVED_LABEL.PD} %`,
  id_pct: `${DERIVED_LABEL.ID} %`,
  pa_pct: `${DERIVED_LABEL.PA} %`,
  ia_pct: `${DERIVED_LABEL.IA} %`,
  acc_pct: `${DERIVED_LABEL.Acc} %`,
  eva_pct: `${DERIVED_LABEL.Eva} %`,
  cri: DERIVED_LABEL.Cri,
  res: "ต้านทานคริติคอล",
  crit_dmg: "ความเสียหายคริติคอล",
  wexp: "ประสบการณ์ยุทธที่ได้รับ",
  fam_dmg: "ความเสียหายของกระบวนท่า",
  fam_red: "ลดความเสียหายจากกระบวนท่า",
};

/** One option in words: "ป้องกันภายนอก +12", "แม่นยำ +6%", "กระบวนท่าสายกระบี่ แรงขึ้น 15%". */
export function affixText(a: GearAffix): string {
  switch (a.k) {
    case "stat": return `${a.stat ? STAT_LABEL[a.stat] : "ค่าสถานะ"} +${a.v}`;
    case "pd": case "id": case "pa": case "ia": case "cri": case "res": return `${AFFIX_LABEL[a.k]} +${a.v}`;
    case "pd_pct": return `${DERIVED_LABEL.PD} +${a.v}%`;
    case "id_pct": return `${DERIVED_LABEL.ID} +${a.v}%`;
    case "pa_pct": return `${DERIVED_LABEL.PA} +${a.v}%`;
    case "ia_pct": return `${DERIVED_LABEL.IA} +${a.v}%`;
    case "acc_pct": return `${DERIVED_LABEL.Acc} +${a.v}%`;
    case "eva_pct": return `${DERIVED_LABEL.Eva} +${a.v}%`;
    case "crit_dmg": return `ความเสียหายคริติคอล +${a.v}%`;
    case "wexp": return `ประสบการณ์ยุทธที่ได้รับ +${a.v}%`;
    case "fam_dmg": return `กระบวนท่าสาย${a.fam ? WEAPON_FAMILY_LABEL[a.fam] : ""} แรงขึ้น ${a.v}%`;
    case "fam_red": return `รับกระบวนท่าสาย${a.fam ? WEAPON_FAMILY_LABEL[a.fam] : ""} เบาลง ${a.v}%`;
  }
}

/** A piece's options in words (a key, or the options themselves). */
export function affixParts(keyOrAffixes: string | null | undefined | readonly GearAffix[]): string[] {
  const list = typeof keyOrAffixes === "string" || keyOrAffixes == null ? gearAffixes(keyOrAffixes) : keyOrAffixes;
  return list.map(affixText);
}

/** A piece's tier in words (ชั้น…), 0–4. */
export const GEAR_TIER_LABEL = ["ธรรมดา", "ดี", "ชั้นเลิศ", "หายาก", "ในตำนาน"] as const;
export function gearTierLabel(ti: number): string {
  return GEAR_TIER_LABEL[Math.max(0, Math.min(4, Math.floor(ti)))]!;
}

/** What an enhancement level adds to a piece of this slot, in words. */
export function enhanceParts(ty: EquipSlotType, level: number): string[] {
  const e = enhanceBonus(ty, level);
  const out: string[] = [];
  if (e.atk) out.push(`${DERIVED_LABEL.Atk} +${e.atk}`);
  if (e.pd) out.push(`${DERIVED_LABEL.PD} +${e.pd}`);
  if (e.id) out.push(`${DERIVED_LABEL.ID} +${e.id}`);
  if (e.pa) out.push(`${DERIVED_LABEL.PA} +${e.pa}`);
  if (e.ia) out.push(`${DERIVED_LABEL.IA} +${e.ia}`);
  if (e.hp) out.push(`${DERIVED_LABEL.HP}สูงสุด +${e.hp}`);
  if (e.mp) out.push(`${DERIVED_LABEL.MP}สูงสุด +${e.mp}`);
  if (e.final_dmg) out.push(`ความเสียหายสุดท้าย +${e.final_dmg}%`);
  return out;
}

/** A piece's name with its enhancement: "+7 กระบี่เหล็ก" (plain name at +0). */
export function gearName(key: string | null | undefined): string {
  const g = parseGear(key);
  if (!g) return key ?? "";
  return g.enhance > 0 ? `+${g.enhance} ${g.def.n}` : g.def.n;
}
