// Plain Thai for the skills window and skill cards. The data tables keep
// demo.html's shorthand ("Phy×115%×1.1 · Eva-15 (5ตา) CD3"); players read
// this instead: what kind of attack it is, how many strikes, what it does to
// the hero and the foe, in whole words.

import type { ArtPassiveTrigger, EnemyEffect, SelfEffect, Skill, StatKey } from "./types";
import { STAT_LABEL } from "./data/stats";

/** โจมตีภายนอก (body, PA vs PD) / โจมตีภายใน (inner force, IA vs ID). */
export const ATTACK_KIND_LABEL: Record<string, string> = {
  phy: "โจมตีภายนอก",
  int: "โจมตีภายใน",
};

export const statName = (key: string) => STAT_LABEL[key as StatKey] ?? key;

/** "เฉียบคม +5 · ความเร็ว +4" */
export function statLine(stats: Partial<Record<string, number>>, scale = 1): string {
  return Object.entries(stats)
    .map(([k, v]) => `${statName(k)} +${Math.floor((v ?? 0) * scale)}`)
    .join(" · ");
}

const turns = (u: number) => `${u} ตา`;
const signed = (v: number) => (v >= 0 ? `+${v}` : `−${Math.abs(v)}`);

/** One self or enemy effect in words: "หลบหลีก −15 นาน 5 ตา". */
export function describeEffectThai(eff: SelfEffect | EnemyEffect): string {
  switch (eff.t) {
    case "buff_def": return `ป้องกัน ${signed(eff.v)} นาน ${turns(eff.u)}`;
    case "buff_eva": return `หลบหลีก ${signed(eff.v)} นาน ${turns(eff.u)}`;
    case "buff_reduce": return `ลดความเสียหายที่ได้รับ ${eff.v}% นาน ${turns(eff.u)}`;
    case "buff_reflect": return `สะท้อนความเสียหาย ${eff.v}% กลับคืน นาน ${turns(eff.u)}`;
    case "buff_spd": return `ความเร็ว ${signed(eff.v)} นาน ${turns(eff.u)}`;
    case "buff_cri": return `โอกาสคริติคอล ${signed(eff.v)} นาน ${turns(eff.u)}`;
    case "heal_pct": return `ฟื้นพลังชีวิต ${eff.v}% ของสูงสุด`;
    case "heal_buff": {
      const what = eff.bt === "buff_def" ? "ป้องกัน" : eff.bt === "buff_eva" ? "หลบหลีก" : "ลดความเสียหายที่ได้รับ";
      return `ฟื้นพลังชีวิต ${eff.hp}% และ${what} +${eff.bv}${eff.bt === "buff_reduce" ? "%" : ""} นาน ${turns(eff.bu)}`;
    }
    case "stack_atk": return `พลังโจมตีเพิ่ม ${eff.v}% ทุกครั้งที่ใช้ ซ้อนได้ ${eff.mx} ชั้น`;
    case "buff_iatk_reduce": return `พลังโจมตีภายใน +${eff.iv}% และลดความเสียหายที่ได้รับ ${eff.rv}% นาน ${turns(eff.u)}`;
    case "buff_reflect_eva": return `สะท้อนความเสียหาย ${eff.rv}% และหลบหลีก +${eff.ev} นาน ${turns(eff.u)}`;
    case "debuff_eva": return `หลบหลีก ${signed(eff.v)} นาน ${turns(eff.u)}`;
    case "debuff_acc": return `แม่นยำ ${signed(eff.v)} นาน ${turns(eff.u)}`;
    case "debuff_def": return `ป้องกันภายนอก ${signed(eff.v)} นาน ${turns(eff.u)}`;
    case "debuff_atk": return `พลังโจมตี ${signed(eff.v)}% นาน ${turns(eff.u)}`;
    case "debuff_poison": return `ติดพิษ เสียพลังชีวิต ${eff.pp}% ทุกตา และหลบหลีก ${signed(eff.ev)} นาน ${turns(eff.u)}`;
    case "multi_debuff": return `แม่นยำ ${signed(eff.av)} และหลบหลีก ${signed(eff.ev)} นาน ${turns(eff.u)}`;
    case "debuff_def_eva": return `ป้องกันภายนอก ${signed(eff.dv)} และหลบหลีก ${signed(eff.ev)} นาน ${turns(eff.u)}`;
    case "heavy_poison": return `พิษร้าย เสียพลังชีวิต ${eff.pp}% ทุกตา แม่นยำ ${signed(eff.av)} หลบหลีก ${signed(eff.ev)} นาน ${turns(eff.u)}`;
    case "drain_mp": return `ดูดปราณ ${eff.v}`;
    case "dispel": return `ล้างพลังเสริมทั้งหมด และแม่นยำ ${signed(eff.acc)} นาน ${turns(eff.u)}`;
    case "burn_hp_mp": return `เผาไหม้ เสียพลังชีวิต ${eff.dmg}% และปราณ ${eff.mp}% ทุกตา นาน ${turns(eff.u)}`;
    case "poison_dmg": return `ติดพิษ เสียพลังชีวิต ${eff.pp}% ทุกตา นาน ${turns(eff.u)}`;
    case "stun": return `โอกาส ${eff.ch}% ทำให้มึนงง ข้ามตา ${turns(eff.u)}`;
    default: return (eff as { t: string }).t;
  }
}

/** The flavour line an author wrote after "—" in a skill's shorthand, if any. */
export function skillFlavour(sk: Pick<Skill, "d">): string | null {
  const at = sk.d.indexOf("—");
  if (at >= 0) return sk.d.slice(at + 1).trim() || null;
  // A description with no shorthand at all is already words.
  return /[A-Za-z]{2,}|×/.test(sk.d) ? null : sk.d.trim() || null;
}

/** "โจมตีภายนอก 5 ครั้งในตาเดียว" and what it does to self and foe, line by line. */
export function skillSummaryLines(sk: Skill): string[] {
  const lines: string[] = [];
  const kind = (sk.at && ATTACK_KIND_LABEL[sk.at]) || "ท่าเสริม";
  lines.push((sk.hits ?? 1) > 1 ? `${kind} ${sk.hits} ครั้งในตาเดียว` : kind);
  if (sk.vitScale) lines.push(`แรงขึ้นตามค่าร่างกาย (+${sk.vitScale} ต่อร่างกาย 1 แต้ม)`);
  if (sk.dr) lines.push(`ดูดพลังชีวิตคืน ${sk.dr}% ของความเสียหายที่ทำได้`);
  if (sk.se) lines.push(`ตัวเอง: ${describeEffectThai(sk.se)}`);
  if (sk.ee) lines.push(`ศัตรู: ${describeEffectThai(sk.ee)}`);
  return lines;
}

/** What `dm` reads as: "ความแรงรวม +10%" (or −). */
export function damageMultiplierText(dm: number): string | null {
  if (dm === 1) return null;
  const pct = Math.round((dm - 1) * 100);
  return `ความแรงรวม ${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`;
}

// ─── Inner arts' passive line ──────────────────────────────────────────

/** When an art's passive fires (`pas.tr`), in plain Thai. */
export const PASSIVE_TRIGGER_LABEL: Record<ArtPassiveTrigger, string> = {
  hit_recv: "เมื่อถูกโจมตี",
  on_crit: "เมื่อโจมตีติดคริติคอล",
  use_int: "เมื่อใช้กระบวนท่าโจมตีภายใน",
  use_act: "เมื่อใช้ท่าออกพลังของลมปราณนี้",
};

/**
 * "เมื่อ… (มีโอกาส N%) จะได้ …" — the trigger and chance come from the data
 * (`tr`, `ch`), never from the authored shorthand, whose "ใช้ IA" (this art's
 * own active) was once misread as an internal attack. Only the effect after
 * "→" is taken from `d`.
 */
export function passiveLine(pas: { tr: ArtPassiveTrigger; ch: number; d: string }): string {
  const effect = plainThai(pas.d.includes("→") ? pas.d.slice(pas.d.indexOf("→") + 1).trim() : pas.d);
  const chance = pas.ch < 100 ? ` มีโอกาส ${pas.ch}% ที่จะได้` : " จะได้";
  return `${PASSIVE_TRIGGER_LABEL[pas.tr]}${chance} ${effect}`;
}

// ─── Shorthand in inner arts' active / passive lines ──────────────────

const SHORTHAND: [RegExp, string | ((...m: string[]) => string)][] = [
  // Passive triggers first: "ถูกโจมตี 25% → …" is a 25 % chance when hit.
  [/ถูกโจมตี (\d+)% →/g, "เมื่อถูกโจมตี มีโอกาส $1% ที่จะได้"],
  [/Int skill (\d+)% →/g, "เมื่อใช้กระบวนท่าโจมตีภายใน มีโอกาส $1% ที่จะได้"],
  [/Int skill →/g, "เมื่อใช้กระบวนท่าโจมตีภายใน จะได้"],
  [/ใช้ IA →/g, "เมื่อใช้ท่าออกพลังของลมปราณนี้ จะได้"],
  [/\bCrit →/g, "เมื่อติดคริติคอล จะได้"],
  [/^Int →/g, "เมื่อโจมตีภายใน จะได้"],
  [/^Phy →/g, "เมื่อโจมตีภายนอก จะได้"],
  [/ฟื้น (\d+)% ?HP/g, "ฟื้นพลังชีวิต $1%"],
  [/ฟื้น (\d+)% ?MP/g, "ฟื้นปราณ $1%"],
  [/ลด dmg/g, "ลดความเสียหายที่ได้รับ"],
  [/สะท้อน (\d+)%/g, "สะท้อนความเสียหาย $1%"],
  [/\b(Phy|Int)×(\d+)%×([\d.]+)/g, (_, k, a, b) => `${k === "Phy" ? "โจมตีภายนอก" : "โจมตีภายใน"} แรง ${Math.round(Number(a) * Number(b))}%`],
  [/\b(Phy|Int)×([\d.]+)(?!%)/g, (_, k, a) => `${k === "Phy" ? "โจมตีภายนอก" : "โจมตีภายใน"} แรง ${Math.round(Number(a) * 100)}%`],
  [/\b(Phy|Int)×(\d+)%/g, (_, k, a) => `${k === "Phy" ? "โจมตีภายนอก" : "โจมตีภายใน"} แรง ${a}%`],
  [/\bbp×(\d+)%/g, "พลังโจมตีพื้นฐาน $1%"],
  [/ทางกาย×([\d.]+)(?!%)/g, (_, a) => `โจมตีภายนอก แรง ${Math.round(Number(a) * 100)}%`],
  [/ทางใน×([\d.]+)(?!%)/g, (_, a) => `โจมตีภายใน แรง ${Math.round(Number(a) * 100)}%`],
  [/ทางกาย/g, "โจมตีภายนอก"],
  [/ทางใน/g, "โจมตีภายใน"],
  [/\(CD\s?(\d+)\)|\bCD\s?(\d+)/g, (_, a, b) => `· พักใช้ ${a ?? b} ตา`],
  [/\(≤\s?(\d+)\s*ซ้อน\)/g, "(ซ้อนได้ $1 ชั้น)"],
  [/\(สะสม\s?(\d+)ตา\)/g, "(สะสมได้ $1 ตา)"],
  [/(\d+)ตา/g, "$1 ตา"],
  [/VIT scaling \(×([\d.]+)\/VIT\)/g, "แรงขึ้นตามค่าร่างกาย (+$1 ต่อแต้ม)"],
  [/\bInt skill\b/g, "ใช้กระบวนท่าโจมตีภายใน"],
  [/ใช้ IA\b/g, "ใช้ท่าออกพลังของลมปราณนี้"],
  [/ทุก hit/g, "ทุกครั้งที่ตีโดน"],
  [/\bpure damage\b/g, "ความเสียหายไม่หักป้องกัน"],
  [/\bflat\s?(\d+)/g, "+$1"],
  [/\breach\b/g, "ระยะไกล"],
  [/\bexternal\b/g, "ภายนอก"],
  [/ลบ debuff/g, "ล้างสถานะผิดปกติ"],
  [/\bdebuff\b/g, "สถานะผิดปกติ"],
  [/\bdmg\b/g, "ความเสียหาย"],
  [/\bPDef(?=[+\-\s]|$)/g, "ป้องกันภายนอก"],
  [/\bIDef(?=[+\-\s]|$)/g, "ป้องกันภายใน"],
  [/\bIAtk(?=[+\-\s%]|$)/g, "พลังโจมตีภายใน"],
  [/\bIA\b/g, "ท่าออกพลังของลมปราณ"],
  [/\bATK(?=[+\-\s%]|$)/g, "พลังโจมตี"],
  [/\bDEF(?=[+\-\s]|$)/g, "ป้องกัน"],
  [/\bEva(?=[+\-\s]|$)/g, "หลบหลีก"],
  [/\bAcc(?=[+\-\s]|$)/g, "แม่นยำ"],
  [/\bSPD(?=[+\-\s]|$)/g, "ความเร็ว"],
  [/\bCrit?\b/g, "ติดคริติคอล"],
  [/\bVIT\b/g, "ร่างกาย"],
  [/\bHP\b/g, "พลังชีวิต"],
  [/\bMP\b/g, "ปราณ"],
  [/\bPhy\b/g, "โจมตีภายนอก"],
  [/\bInt\b/g, "โจมตีภายใน"],
  [/ทะลุ /g, "ทะลวง"],
  [/(\S)\+(\d)/g, "$1 +$2"],
  [/(\S)-(\d)/g, "$1 −$2"],
  [/→/g, ":"],
  [/\s{2,}/g, " "],
];

/** Turn a table's shorthand ("ฟื้น 10% HP CD3", "ถูกโจมตี 25% → DEF+10 (5ตา)") into plain Thai. */
export function plainThai(text: string | null | undefined): string {
  if (!text) return "";
  let out = text;
  for (const [re, to] of SHORTHAND) out = out.replace(re, to as never);
  return out.trim();
}
