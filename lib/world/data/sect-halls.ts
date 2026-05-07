// ─── สำนักยุทธิ์ประจำเมือง / City Sect Halls ────────────────────────
// Each city has a public martial school where the player can purchase
// tier 0–1 move skills and inner skills. **Open-world / ยุทธจักร styles
// only** — sect-affiliated lineages (เส้าหลิน, อู่ตัง, …) cannot be
// bought here; the player has to seek out the parent sect for those.
// Offerings still differ per city to make wandering the map worthwhile.
//
// Buying a skill grants it via the same path as the `learnSkill` /
// `learnArt` SceneEffect (auto-slots into the first empty slot).

export interface SectHallOffer {
  // For move skills: bare skill id ("rf", "tj"). For inner skills: art id
  // ("taiji"). The store action distinguishes by registry lookup.
  id: string;
  kind: "skill" | "art";
  // Gold cost.
  price: number;
}

export interface SectHallDef {
  locationId: string;
  label: string;
  description: string;
  offers: readonly SectHallOffer[];
}

// Skill prices by tier (move + art share the same scale; arts are heavier
// because their effect is permanent stat / HP / MP scaling).
const SKILL_TIER_PRICE = { 0: 200, 1: 800 } as const;
const ART_TIER_PRICE = { 0: 500, 1: 2000 } as const;

const skill = (id: string, tier: 0 | 1): SectHallOffer => ({
  id,
  kind: "skill",
  price: SKILL_TIER_PRICE[tier],
});
const art = (id: string, tier: 0 | 1): SectHallOffer => ({
  id,
  kind: "art",
  price: ART_TIER_PRICE[tier],
});

export const SECT_HALLS: readonly SectHallDef[] = [
  // Capital — balanced bundle, the safest starter set.
  {
    locationId: "city_capital",
    label: "🏯 สำนักยุทธิ์นครหลวง",
    description: "ศูนย์ฝึกประจำนครหลวง รวมวิชาพื้นฐานหลากหลายแขนง",
    offers: [
      skill("nc4", 0), skill("nc7", 0), skill("nc10", 0),
      skill("nm2", 1), skill("nd11", 1),
      art("t0_fiveyuan", 0), art("t1_whitehorse", 1),
    ],
  },
  // Xixia — frontier physical / harsh-climate styles.
  {
    locationId: "city_xixia",
    label: "🏯 สำนักยุทธิ์ซีเซี่ย",
    description: "สำนักประจำเมืองชายแดน เน้นวิชาทางกายและความทรหด",
    offers: [
      skill("dg", 0), skill("nc5", 0), skill("nc6", 0),
      skill("nd4", 1), skill("nd7", 1),
      art("t0_ironshirt", 0), art("t1_blackiron", 1),
    ],
  },
  // Dali — soft / poison / Duan-family flavour.
  {
    locationId: "city_dali",
    label: "🏯 สำนักยุทธิ์ต้าหลี่",
    description: "สำนักประจำเมืองต้าหลี่ ผสมวิชาภาคใต้และวิชาพิษ",
    offers: [
      skill("nc3", 0), skill("nc9", 0), skill("gn", 0),
      skill("pn", 1), skill("nd9", 1),
      art("t0_butterfly", 0), art("t1_redlotus", 1),
    ],
  },
  // Yangzhou — blade / sword merchant city.
  {
    locationId: "city_yangzhou",
    label: "🏯 สำนักยุทธิ์หยางโจว",
    description: "เมืองริมน้ำที่เลื่องลือเรื่องดาบและกระบี่",
    offers: [
      skill("ns1", 0), skill("nc7", 0), skill("qf", 0),
      skill("nd3", 1), skill("nd11", 1),
      art("t0_sevenstar", 0), art("t1_eagleclaw", 1),
    ],
  },
  // Suzhou — gentle southern style, soft / agile.
  {
    locationId: "city_suzhou",
    label: "🏯 สำนักยุทธิ์ซูโจว",
    description: "สำนักประจำเมืองสายน้ำริมทะเลสาบ เน้นวิชาอ่อนและคล่องแคล่ว",
    offers: [
      skill("nc8", 0), skill("nc9", 0), skill("ns2", 0),
      skill("nd1", 1), skill("nd8", 1), skill("nd11", 1),
      art("t0_butterfly", 0), art("t0_sevenstar", 0), art("t1_whitehorse", 1),
    ],
  },
  // Jinling — scholarly capital, leans intellectual / book-learning.
  {
    locationId: "city_jinling",
    label: "🏯 สำนักยุทธิ์จินหลิง",
    description: "เมืองโบราณราชธานีฝ่ายใต้ เน้นวิชาทางในและกระบี่บัณฑิต",
    offers: [
      skill("nc3", 0), skill("nc9", 0), skill("qf", 0),
      skill("nm1", 1), skill("nd6", 1), skill("nd2", 1),
      art("t0_butterfly", 0), art("t1_whitehorse", 1), art("t1_redlotus", 1),
    ],
  },
  // Chang'an — imperial old capital, mixes hard physical + classical.
  {
    locationId: "city_changan",
    label: "🏯 สำนักยุทธิ์ฉางอัน",
    description: "ราชธานีโบราณ รวมวิชาทหาร / กระบี่หลวง / ฝีมือราชสำนัก",
    offers: [
      skill("dg", 0), skill("nc5", 0), skill("nc6", 0), skill("nc7", 0),
      skill("ig", 1), skill("nd4", 1), skill("nd10", 1),
      art("t0_sevenstar", 0), art("t0_fiveyuan", 0), art("t1_eagleclaw", 1),
    ],
  },
];

export const SECT_HALLS_BY_LOCATION = new Map<string, SectHallDef>(
  SECT_HALLS.map((h) => [h.locationId, h]),
);

export function getSectHallAt(locationId: string): SectHallDef | null {
  return SECT_HALLS_BY_LOCATION.get(locationId) ?? null;
}
