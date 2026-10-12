// Thai names for the derived combat stats and equipment bonuses. Everything the
// player reads is Thai: the tables keep short keys (HP, Atk, PD…), the UI
// shows these words instead.

import type { Equipment, StatKey } from "./types";
import type { EquipBonus } from "./derive";
import { STAT_LABEL } from "./data/stats";

/** The derived stats (`deriveAll`'s keys) in Thai. */
export const DERIVED_LABEL = {
  HP: "พลังชีวิต",
  MP: "ปราณ",
  Atk: "พลังโจมตี",
  PA: "โจมตีกาย",
  IA: "โจมตีใน",
  PD: "ป้องกันกาย",
  ID: "ป้องกันใน",
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

/** One equipment piece's bonuses: "พลังโจมตี +12 · ป้องกันกาย +4 · ทุกครั้งที่ตีโดน หลบหลีกศัตรู −5 (1 ตา)". */
export function equipStatParts(e: Equipment): string[] {
  const out: string[] = [];
  const add = (label: string, value: number | undefined) => { if (value) out.push(`${label} ${signed(value)}`); };
  add(DERIVED_LABEL.Atk, e.atkb); add(DERIVED_LABEL.PA, e.pab); add(DERIVED_LABEL.IA, e.iab);
  add(DERIVED_LABEL.PD, e.pdb); add(DERIVED_LABEL.ID, e.idb);
  add(DERIVED_LABEL.HP, e.hpb); add(DERIVED_LABEL.MP, e.mpb); add(DERIVED_LABEL.Spd, e.spdb);
  add(DERIVED_LABEL.Eva, e.evab); add(DERIVED_LABEL.Acc, e.accb); add(DERIVED_LABEL.Cri, e.crib); add(DERIVED_LABEL.Res, e.resb);
  for (const [k, v] of Object.entries(e.st)) add(STAT_LABEL[k as StatKey] ?? k, v);
  const eff = e.eff;
  if (eff) {
    if (eff.t === "pct_atk") out.push(`${DERIVED_LABEL.Atk} +${eff.v}%`);
    else if (eff.t === "flat_cri") out.push(`${DERIVED_LABEL.Cri} +${eff.v}`);
    else if (eff.t === "flat_eva") out.push(`${DERIVED_LABEL.Eva} +${eff.v}`);
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
  if (eb.pct_red) out.push(`ลดความเสียหายที่ได้รับ ${eb.pct_red}%`);
  if (eb.hp_regen) out.push(`ฟื้นพลังชีวิต ${eb.hp_regen}% ทุกตา`);
  for (const [k, v] of Object.entries(stats)) if (v) add(STAT_LABEL[k as StatKey] ?? k, v);
  return out;
}
