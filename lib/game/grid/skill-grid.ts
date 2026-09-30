// ─── Per-skill grid geometry ──────────────────────────────────────────
// Every move skill and every inner-art active gets a GridSkillProfile
// (range · area · target) for the tactics board (docs/grid-combat.md).
// Profiles are DERIVED from data that already exists on each entry — weapon
// family `w`, attack type `at`, tier `ti`, hit count `hits`, effects — so a
// new skill works on the grid with no extra authoring. A curated handful of
// signature moves get a special shape via SKILL_GRID_OVERRIDES.
//
// Tuned for a 10×7 board where units walk 3–6 tiles a turn, in the
// Wandering Sword mould: fists / swords / blades / daggers reach the
// adjacent tile, spears poke a line of 2–3, higher-tier swords and blades
// sweep an arc, hidden weapons are ranged, music is ranged AoE, qi (int)
// attacks reach a little further, buffs and heals are self-cast.
//
// ── Skill rule table (skillGrid) ──────────────────────────────────────
//   no damage, no enemy effect (only `se`)   → self · {0,0} · single
//   id "bst_*" (beast bites / claws / roars) → enemy · 1 · single
//   fist   phy                               → 1 · single
//   fist   int  T0–T1                        → 1 · single
//   fist   int  T2+ (palm / finger qi)       → 1–2 · single
//   sword  phy  T0–T1                        → 1 · single
//   sword  phy  T2+                          → 1 · arc (sweeping slash)
//   sword  int  T0–T1 (sword qi)             → 1–2 · single
//   sword  int  T2                           → 1–3 · single
//   sword  int  T3+                          → 1–3 · line 3 (qi beam)
//   blade  T0                                → 1 · single
//   blade  T1+                               → 1 · arc (heavy cleave)
//   long   T0–T2                             → 1–2 · line 2 (spear thrust)
//   long   T3+                               → 1–3 · line 3
//   short                                    → 1 · single
//   hidden needles / darts / knives          → 2–4 · single
//   hidden whips / chains / hooks (แส้ โซ่ ขอ) → 1–3 · single
//   hidden  hits ≥ 5 or T3+                  → same range · diamond 1
//   music  T0–T2                             → 2–4 · diamond 1
//   music  T3+                               → 2–4 · diamond 2
//   int blade / long / short                 → +1 max range (line grows with it)
//   melee family with hits ≥ 4               → single (a flurry on one foe)
//   pure debuff (at null, ee set)            → as its family, enemy
//
// ── Art-active rule table (artGrid) ───────────────────────────────────
//   heal · heal_cleanse · heal_full_cleanse · buff_reflect · buff_reduce ·
//   buff_spd · buff_eva_debuff_eva            → self · {0,0}
//     (buff_eva_debuff_eva also debuffs a foe: the engine pairs self casts
//      with the nearest enemy)
//   atk_phy_pen · drain_phy                   → 1–2 · single
//   atk_int_pen · drain · drain_acc ·
//   debuff_acc_dmg                            → 1–3 · single (T3+ diamond 1)
//   debuff_poison                             → 1–3 · diamond 1
//
// Final profiles are normalised: ranges within 0..5 with min ≤ max, line
// size 1..4 (and aim range never beyond the line), diamond / square / cross
// size 1..2, self ⇒ {0,0}, enemy ⇒ max ≥ 1.

import type { Art, ArtActiveType, Skill } from "../types";
import { parseSlotId } from "../slots";
import type { AreaShape, GridSkillProfile } from "./types";

const RANGE_CAP = 5;
const LINE_CAP = 4;
const AREA_CAP = 2;

const MELEE_FAMILIES = new Set<Skill["w"]>(["fist", "sword", "blade", "long", "short"]);
/** Whips, chains and hooks: hidden-family weapons that also work up close. */
const LASH_NAME = /แส้|โซ่|ขอ/;

const SELF: GridSkillProfile = { range: { min: 0, max: 0 }, area: { kind: "single" }, target: "self" };

function enemy(min: number, max: number, area: AreaShape = { kind: "single" }): GridSkillProfile {
  return { range: { min, max }, area, target: "enemy" };
}

/** Clamp a profile into the contract's sane bounds. */
function normalise(p: GridSkillProfile): GridSkillProfile {
  if (p.target === "self") return { range: { min: 0, max: 0 }, area: p.area, target: "self" };
  let max = Math.max(1, Math.min(RANGE_CAP, Math.round(p.range.max)));
  let min = Math.max(0, Math.min(max, Math.round(p.range.min)));
  let area: AreaShape = p.area;
  switch (area.kind) {
    case "line": {
      const size = Math.max(1, Math.min(LINE_CAP, Math.round(area.size)));
      area = { kind: "line", size };
      min = Math.max(1, min);
      max = Math.max(min, Math.min(max, size));
      break;
    }
    case "diamond":
    case "square":
    case "cross":
      area = { kind: area.kind, size: Math.max(1, Math.min(AREA_CAP, Math.round(area.size))) };
      break;
    default:
      break;
  }
  return { range: { min, max }, area, target: p.target };
}

/** The rule-table default for a move skill (before overrides). */
function deriveSkill(s: Skill): GridSkillProfile {
  if (!s.at && !s.ee) return SELF;
  const ti = s.ti;
  const hits = s.hits ?? 1;
  const int = s.at === "int";

  // Beasts bite, claw and roar at arm's length, whatever family they borrow.
  if (s.id.startsWith("bst_")) return enemy(1, 1);

  let p: GridSkillProfile;
  switch (s.w) {
    case "fist":
      p = int && ti >= 2 ? enemy(1, 2) : enemy(1, 1);
      break;
    case "sword":
      if (int) p = ti >= 3 ? enemy(1, 3, { kind: "line", size: 3 }) : ti >= 2 ? enemy(1, 3) : enemy(1, 2);
      else p = ti >= 2 ? enemy(1, 1, { kind: "arc" }) : enemy(1, 1);
      break;
    case "blade":
      p = ti >= 1 ? enemy(1, 1, { kind: "arc" }) : enemy(1, 1);
      break;
    case "long":
      p = ti >= 3 ? enemy(1, 3, { kind: "line", size: 3 }) : enemy(1, 2, { kind: "line", size: 2 });
      break;
    case "short":
      p = enemy(1, 1);
      break;
    case "hidden": {
      const [min, max] = LASH_NAME.test(s.n) ? [1, 3] : [2, 4];
      p = hits >= 5 || ti >= 3 ? enemy(min, max, { kind: "diamond", size: 1 }) : enemy(min, max);
      break;
    }
    case "music":
      p = enemy(2, 4, { kind: "diamond", size: ti >= 3 ? 2 : 1 });
      break;
  }

  // Qi-driven blades / staves / fans reach one tile further.
  if (int && (s.w === "blade" || s.w === "long" || s.w === "short")) {
    p = { ...p, range: { ...p.range, max: p.range.max + 1 } };
    if (p.area.kind === "line") p = { ...p, area: { kind: "line", size: p.area.size + 1 } };
  }

  // A melee flurry (4+ strikes) concentrates on one foe.
  if (MELEE_FAMILIES.has(s.w) && hits >= 4 && p.area.kind !== "single") {
    p = { ...p, area: { kind: "single" } };
  }
  return p;
}

/**
 * Signature moves whose name / description calls for a special shape.
 * Merged over the derived default (then normalised).
 */
export const SKILL_GRID_OVERRIDES: Record<string, Partial<GridSkillProfile>> = {
  // 18 ฝ่ามือมังกร — the dragon-palm wave rolls forward through a line.
  ep: { range: { min: 1, max: 3 }, area: { kind: "line", size: 3 } },
  // หมัดยาวพุทธธรรม — "Phy reach": the long fist lands from two tiles.
  sl_long_dharma: { range: { min: 1, max: 2 } },
  // กระบี่ 6 ชีพจร — six-meridian sword qi shot from the fingers: long-range flurry.
  lmsj: { range: { min: 1, max: 4 }, area: { kind: "single" } },
  // ดัชนีเอกสุริยัน — one-yang finger strikes from afar.
  yyz: { range: { min: 1, max: 3 } },
  // หมัดสะท้านจักรวาล — universe-shaking fist: a shockwave around the impact.
  nu2: { range: { min: 1, max: 2 }, area: { kind: "diamond", size: 1 } },
  // หมัดพระอินทร์ — Indra's fist: thunder crashes in a cross.
  ng4: { range: { min: 1, max: 3 }, area: { kind: "cross", size: 1 } },
  // เก้าฟ้าหนึ่งกระบี่ — one sword from the ninth heaven: a full-length beam.
  ng1: { range: { min: 1, max: 4 }, area: { kind: "line", size: 4 } },
  // มังกรฟ้า — heaven-dragon blade qi: a long beam.
  nu1: { range: { min: 1, max: 4 }, area: { kind: "line", size: 4 } },
  // ดาบยาวเทพสังหาร — god-slaying long blade: a cleave that fills a 3×3.
  ng5: { range: { min: 1, max: 1 }, area: { kind: "square", size: 1 } },
  // กระบี่ทะลวงสุริยัน — sun-piercing thrust: a short line.
  tsh_sun_pierce: { range: { min: 1, max: 2 }, area: { kind: "line", size: 2 } },
  // ทวนหมุนฟ้า — sky-spinning spear: a spin that sweeps an arc.
  ne3: { range: { min: 1, max: 1 }, area: { kind: "arc" } },
  // ทวนประจักษ์พยาน — the legendary spear thrust: a 4-tile line.
  ng2: { range: { min: 1, max: 4 }, area: { kind: "line", size: 4 } },
  // แส้แปดทิศ — eight-direction whip: lashes sweep an arc.
  nd1: { range: { min: 1, max: 2 }, area: { kind: "arc" } },
  // แส้เก้าหัว — nine-headed whip: a sweeping arc at whip range.
  nf7: { range: { min: 1, max: 3 }, area: { kind: "arc" } },
  // ดาวตกแหวกฟ้า — meteor splitting the sky: a piercing line of knives.
  tang_meteorpierce: { range: { min: 1, max: 4 }, area: { kind: "line", size: 4 } },
  // ดาราพิรุณโปรย — a rain of stars: a wide diamond.
  tang_starrain: { range: { min: 2, max: 4 }, area: { kind: "diamond", size: 2 } },
  // ขลุ่ยพลิกโลก — world-overturning flute: the widest, farthest song.
  ng6: { range: { min: 2, max: 5 }, area: { kind: "diamond", size: 2 } },
  // คำรามขู่ — a beast's roar shakes everyone around the tile in front.
  bst_roar: { range: { min: 1, max: 1 }, area: { kind: "diamond", size: 1 } },
};

export function skillGrid(skill: Skill): GridSkillProfile {
  const base = deriveSkill(skill);
  const ov = SKILL_GRID_OVERRIDES[skill.id];
  return normalise(ov ? { ...base, ...ov, range: { ...base.range, ...ov.range } } : base);
}

const ART_SELF: ReadonlySet<ArtActiveType> = new Set<ArtActiveType>([
  "heal", "heal_cleanse", "heal_full_cleanse", "buff_reflect", "buff_reduce", "buff_spd", "buff_eva_debuff_eva",
]);

export function artGrid(art: Art): GridSkillProfile | null {
  const act = art.act;
  if (!act) return null;
  const t = act.t;
  if (ART_SELF.has(t)) return SELF;
  switch (t) {
    case "atk_phy_pen":
    case "drain_phy":
      return normalise(enemy(1, 2));
    case "debuff_poison":
      return normalise(enemy(1, 3, { kind: "diamond", size: 1 }));
    case "atk_int_pen":
    case "drain":
    case "drain_acc":
    case "debuff_acc_dmg":
      return normalise(art.ti >= 3 ? enemy(1, 3, { kind: "diamond", size: 1 }) : enemy(1, 3));
    default: {
      // Future active types: attacks reach 1–2, everything else is self.
      const attack = /atk|drain|debuff/.test(t);
      return attack ? normalise(enemy(1, 2)) : SELF;
    }
  }
}

export function slotGrid(raw: string | null | undefined): GridSkillProfile | null {
  const info = parseSlotId(raw);
  if (!info) return null;
  return info.kind === "skill" ? skillGrid(info.skill) : artGrid(info.art);
}

/** Short Thai label for the UI, e.g. "ระยะ 1 · เป้าเดียว", "แนวตรง 3 ช่อง", "ตนเอง". */
export function describeGrid(profile: GridSkillProfile): string {
  if (profile.target === "self") return "ตนเอง";
  const { min, max } = profile.range;
  const area = profile.area;
  if (area.kind === "line") return `แนวตรง ${area.size} ช่อง`;
  const range = min === max ? `ระยะ ${max}` : `ระยะ ${min}–${max}`;
  let shape: string;
  switch (area.kind) {
    case "single": shape = "เป้าเดียว"; break;
    case "diamond": shape = `วงรัศมี ${area.size}`; break;
    case "square": shape = `พื้นที่ ${area.size * 2 + 1}×${area.size * 2 + 1}`; break;
    case "cross": shape = `กากบาท ${area.size}`; break;
    case "arc": shape = "ฟันกวาด 3 ช่อง"; break;
  }
  const who = profile.target === "ally" ? " · ฝ่ายเรา" : "";
  return `${range} · ${shape}${who}`;
}
