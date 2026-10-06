import type { Condition, SectId } from "../types";

// ─── Sect membership definitions ─────────────────────────────────────
// Per-sect rank table. Indexed by SectId — 15 joinable
// sects, ladders 9 → 1 (8 sects), 5 → 1 (6 sects) or 3 → 1 (gumu).
//
// Rank semantics:
//   - lower number = higher prestige
//   - `startRank` is what the player gets seeded with on `joinSect`
//   - `topRank` is the highest tier (rank-up cannot exceed it)
//   - `rankUpCost(targetRank)` returns the sect-point cost to upgrade FROM
//     the rank just below `targetRank` TO `targetRank`. e.g. for Shaolin
//     rankUpCost(8) = points needed to go from rank 9 → rank 8.
//
// Martial arts are not rank rewards: every sect skill and art is taught by
// exactly one quest — a lineage quest (T0–T3) or a story saga (T4), see
// lib/world/story/ and docs/story-quests.md. Rank gates those quests, and
// each rank-up pays `rankUpGold` in gold. `SectMembership.rewardPicks`
// survives in older saves only (skills picked under the old pools).

export interface SectMembershipDef {
  id: SectId;
  // Display name (Thai).
  name: string;
  // Where to register (location id of the sect HQ).
  hallLocationId: string;
  // NPC who handles registration + rank-ups.
  registrarNpcId: string;
  // Conditions that must hold for the player to be admitted. Evaluated by
  // the registration scene's `visibleIf` / accept-button gating.
  joinRequirements: Condition;
  // Ranks: [startRank, topRank].
  startRank: number;
  topRank: number;
  // Cost (sect points) to upgrade INTO this rank from the rank just below.
  rankUpCost: (targetRank: number) => number;
  // Days between sect-quest re-offers. Used by sect-quest gating in the NPC
  // popup (offer hidden when day - lastQuestDay[questId] < cooldownDays).
  questCooldownDays: number;
}

// Shaolin disciple ranks. Climbing from rank 9 (entry, novice) to rank 1
// (abbot's right hand).
const SHAOLIN: SectMembershipDef = {
  id: "shaolin",
  name: "เส้าหลิน",
  hallLocationId: "sect_shaolin",
  registrarNpcId: "sect_shaolin_abbot_huiyuan",
  // Must be male AND not too evil. The abbot turns away the wicked.
  joinRequirements: {
    t: "and",
    all: [
      { t: "gender", equals: "male" },
      { t: "trait", trait: "evil", max: 10 },
    ],
  },
  startRank: 9,
  topRank: 1,
  // Climbing curve: 100 → 200 → 350 → 500 → 700 → 1000 → 1400 → 2000 sect
  // points (cumulative ~6250 to reach the top).
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      8: 100,
      7: 200,
      6: 350,
      5: 500,
      4: 700,
      3: 1000,
      2: 1400,
      1: 2000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// Wudang disciple ranks. Same 9→1 climb as Shaolin, but no gender gate
// (men and women alike train under Master Qingxu) and a balance / soft /
// internal martial line built on sword + fist taiji styles paired with
// meditation arts.
const WUDANG: SectMembershipDef = {
  id: "wudang",
  name: "อู่ตัง",
  hallLocationId: "sect_wudang",
  registrarNpcId: "sect_wudang_master_qingxu",
  // Open to anyone, regardless of gender — only the truly wicked are
  // turned away (master Qingxu reads the heart, not the body).
  joinRequirements: { t: "trait", trait: "evil", max: 10 },
  startRank: 9,
  topRank: 1,
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      8: 100,
      7: 200,
      6: 350,
      5: 500,
      4: 700,
      3: 1000,
      2: 1400,
      1: 2000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// Huashan disciple ranks. T3 sect — smaller, sword-only school whose
// leadership caps at T3 power. Compressed 5-rank ladder (5 → 1) since the
// climb is shorter than the legendary T4 sects (Shaolin / Wudang / etc).
// Open to anyone who can pay the entry fee — no gender gate, no trait
// gate beyond a not-evil floor.
const HUASHAN: SectMembershipDef = {
  id: "huashan",
  name: "หัวซาน",
  hallLocationId: "sect_huashan",
  registrarNpcId: "sect_huashan_master_yiqing",
  joinRequirements: { t: "trait", trait: "evil", max: 10 },
  startRank: 5,
  topRank: 1,
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      4: 100,
      3: 250,
      2: 500,
      1: 1000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// Songshan disciple ranks. T3 sect — central peak iron-sword. Compressed
// 5-rank ladder.
const SONGSHAN: SectMembershipDef = {
  id: "songshan",
  name: "ซงซาน",
  hallLocationId: "sect_songshan",
  registrarNpcId: "sect_songshan_master_zuolengchan",
  joinRequirements: { t: "trait", trait: "evil", max: 10 },
  startRank: 5,
  topRank: 1,
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      4: 100, 3: 250, 2: 500, 1: 1000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// Taishan disciple ranks. T3 sect — eastern peak Daoist, yang/external
// sword styled around dawn-sun precision. Compressed 5-rank ladder.
const TAISHAN: SectMembershipDef = {
  id: "taishan",
  name: "ไท่ซาน",
  hallLocationId: "sect_taishan",
  registrarNpcId: "sect_taishan_master_tianmen",
  joinRequirements: { t: "trait", trait: "evil", max: 10 },
  startRank: 5,
  topRank: 1,
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      4: 100, 3: 250, 2: 500, 1: 1000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// Hengshan South disciple ranks (เฮิงซาน — five-peaks sword sect). T3 sect
// — yin/soft speed-themed sword line. Compressed 5-rank ladder.
const HENGSHAN_SOUTH: SectMembershipDef = {
  id: "hengshan_south",
  name: "เฮิงซาน",
  hallLocationId: "sect_hengshan_south",
  registrarNpcId: "sect_hengshan_south_master_modaxiansheng",
  joinRequirements: { t: "trait", trait: "evil", max: 10 },
  startRank: 5,
  topRank: 1,
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      4: 100, 3: 250, 2: 500, 1: 1000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// Hengshan North disciple ranks (เหิงซาน — Buddhist nun's order). T3 sect
// — soft/external defense + reflect themed sword line. Compressed 5-rank.
const HENGSHAN_NORTH: SectMembershipDef = {
  id: "hengshan_north",
  name: "เหิงซาน",
  hallLocationId: "sect_hengshan_north",
  registrarNpcId: "sect_hengshan_north_abbess_dingyi",
  joinRequirements: { t: "trait", trait: "evil", max: 10 },
  startRank: 5,
  topRank: 1,
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      4: 100, 3: 250, 2: 500, 1: 1000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// Quanzhen disciple ranks. Like Huashan, leadership caps at T3 — strong
// but not on the legendary Shaolin/Wudang tier. Open to anyone (no
// gender gate, no money) — Quanzhen Daoists are ascetics: the only fee
// is sincere effort.
const QUANZHEN: SectMembershipDef = {
  id: "quanzhen",
  name: "ฉวนเจิน",
  hallLocationId: "sect_quanzhen",
  registrarNpcId: "sect_quanzhen_master_chongyang",
  joinRequirements: { t: "trait", trait: "evil", max: 10 },
  // T3 sect — compressed 5-rank ladder.
  startRank: 5,
  topRank: 1,
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      4: 100,
      3: 250,
      2: 500,
      1: 1000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// Emei disciple ranks. Big Buddhist nun sect — leadership tier matches
// Shaolin / Wudang (T4 master). Women only — the abbess turns away men
// at the gate. Yin / internal sword + fist combat identity, with the
// bodhisattva-line palm + sword as the T4 capstones and a healing-art
// focus throughout (heart / lotus / ice breath).
const EMEI: SectMembershipDef = {
  id: "emei",
  name: "ง้อไบ๊",
  hallLocationId: "sect_emei",
  registrarNpcId: "sect_emei_abbess_jingchan",
  // Women only — the convent admits no men. Trait gate matches the
  // other sects (no truly wicked admitted).
  joinRequirements: {
    t: "and",
    all: [
      { t: "gender", equals: "female" },
      { t: "trait", trait: "evil", max: 10 },
    ],
  },
  startRank: 9,
  topRank: 1,
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      8: 100,
      7: 200,
      6: 350,
      5: 500,
      4: 700,
      3: 1000,
      2: 1400,
      1: 2000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// Ancient Tomb sect (สุสานโบราณ / 古墓派). The secret sixth sect — only
// 3 ranks (3 → 1) and a sole mystery-woman registrar. The intro quest
// gates on prior Quanzhen membership + having learned t3_qz_sun (the
// player must absorb the Quanzhen sun art first), and the registration
// reward chain SWAPS the player's sect: leaveSect quanzhen → joinSect
// gumu. So Gumu disciples are ex-Quanzhen by canon.
//
// `joinRequirements` here only matter for the membership-check helper
// (e.g. /sect popups). The real gate lives in the intro quest's prereq.
const GUMU: SectMembershipDef = {
  id: "gumu",
  name: "กู่มู่",
  hallLocationId: "sect_gumu",
  registrarNpcId: "sect_gumu_mystery_woman",
  // Same trait gate as the others — even the ancient tomb won't take
  // the truly wicked. The real lore-gate (Quanzhen membership + sun
  // art learned) lives in the intro quest's prereqs.
  joinRequirements: { t: "trait", trait: "evil", max: 10 },
  startRank: 3,
  topRank: 1,
  // Only 3 ranks total. Steeper costs since the climb is short.
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      2: 400,
      1: 1200,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// Beggars sect (พรรคยาจก / 丐帮). Big sect — leadership tier matches
// Shaolin / Wudang / Emei (T4 chief). The chief Hongtian is one of the
// strongest in the world. Open to anyone, no money — but the player
// must have learned the begging life skill to lv 2 first (proves they
// understand the way of the road). Combat identity: fist + staff,
// external / hard. The "wanderer / dragon palm" arts cap the line.
const BEGGARS: SectMembershipDef = {
  id: "beggars",
  name: "พรรคยาจก",
  hallLocationId: "sect_beggars",
  registrarNpcId: "sect_beggars_chief_hongtian",
  joinRequirements: {
    t: "and",
    all: [
      { t: "trait", trait: "evil", max: 10 },
      // Must have learned begging — proves the player has walked the
      // road. Same value the intro quest checks against.
      { t: "lifeSkillLevel", skill: "begging", min: 2 },
    ],
  },
  startRank: 9,
  topRank: 1,
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      8: 100,
      7: 200,
      6: 350,
      5: 500,
      4: 700,
      3: 1000,
      2: 1400,
      1: 2000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// Jinyiwei sect (องครักษ์เสื้อแพร / 锦衣卫). Imperial guard sect — backed
// by the throne, well-funded, and politically powerful. Leadership tier
// matches Shaolin / Wudang / Emei / Beggars (T4 commander). Combat
// identity: yang / external — fist + sword + blade + chain (hidden).
// The disciple intro is a kidnap mission, mirroring the sect's role as
// the emperor's interrogation arm — recruits earn membership by proving
// they can apprehend a person of interest cleanly.
const JINYIWEI: SectMembershipDef = {
  id: "jinyiwei",
  name: "องครักษ์เสื้อแพร",
  hallLocationId: "sect_jinyiwei",
  registrarNpcId: "sect_jinyiwei_leader_zhao",
  // Trait gate same as the rest. The kidnap intro inherently nudges
  // the player's `evil` trait up via the bad-action mechanic, so the
  // gate isn't redundant — it stops a player who's already too evil
  // from joining (the commander wants disciplined agents, not maniacs).
  joinRequirements: { t: "trait", trait: "evil", max: 30 },
  startRank: 9,
  topRank: 1,
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      8: 100,
      7: 200,
      6: 350,
      5: 500,
      4: 700,
      3: 1000,
      2: 1400,
      1: 2000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// พรรคตะวันจันทรา (Sun-Moon sect / 日月神教). Big art-focused sect — the
// disciple line is almost entirely inner arts (only mi_firepalm exists
// as a fist move skill). Sun (yang) / moon (yin) duality runs through
// the line, with balance arts capping at T3 and the iconic qiankun +
// yxhd at T4. Leadership tier matches Shaolin/Wudang/Emei/Beggars.
//
// Disciple intro is an assassination mission — the sect tests recruits
// by ordering them to eliminate a hostile imperial guard. Trait gate is
// looser than other sects (evil ≤ 30) since the bad-action mechanic
// nudges the player's evil score up.
const SUNMOON: SectMembershipDef = {
  id: "sunmoon",
  name: "พรรคตะวันจันทรา",
  hallLocationId: "sect_ming",
  registrarNpcId: "sect_sunmoon_chief_dongfang",
  joinRequirements: { t: "trait", trait: "evil", max: 30 },
  startRank: 9,
  topRank: 1,
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      8: 100,
      7: 200,
      6: 350,
      5: 500,
      4: 700,
      3: 1000,
      2: 1400,
      1: 2000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// Tang sect (สำนักสกุลถัง / 唐门). Big Sichuan family — known throughout
// the world but rarely seen in public, focused on hidden weapons +
// poisons. Leadership tier matches Shaolin/Wudang. Combat identity:
// yin / external — short blades + thrown knives + venom-coated darts.
//
// Disciple intro: gather poisons + herbs. Trial proves the recruit
// can navigate the venomous corners of the world (where Tang gets
// their materials). Hint dialog points players at specific gather
// locations.
const TANG: SectMembershipDef = {
  id: "tang",
  name: "สำนักสกุลถัง",
  hallLocationId: "sect_tang",
  registrarNpcId: "sect_tang_chief_tangmen",
  joinRequirements: { t: "trait", trait: "evil", max: 30 },
  startRank: 9,
  topRank: 1,
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      8: 100,
      7: 200,
      6: 350,
      5: 500,
      4: 700,
      3: 1000,
      2: 1400,
      1: 2000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

// Xiaoyao sect (พรรคสราญรมย์ / 逍遥派). Big sect — yin / internal art-
// heavy line with sword + blade + fist split. Leadership tier matches
// Shaolin / Wudang / etc (T4 master). Disciple intro mirrors the
// herb-gathering pattern of other public sects.
const XIAOYAO: SectMembershipDef = {
  id: "xiaoyao",
  name: "พรรคสราญรมย์",
  hallLocationId: "sect_xiaoyao",
  registrarNpcId: "sect_xiaoyao_master_yunxiao",
  joinRequirements: { t: "trait", trait: "evil", max: 15 },
  startRank: 9,
  topRank: 1,
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      8: 100,
      7: 200,
      6: 350,
      5: 500,
      4: 700,
      3: 1000,
      2: 1400,
      1: 2000,
    };
    return table[targetRank] ?? Infinity;
  },
  questCooldownDays: 30,
};

export const SECT_MEMBERSHIPS: Record<SectId, SectMembershipDef> = {
  shaolin: SHAOLIN,
  wudang: WUDANG,
  huashan: HUASHAN,
  songshan: SONGSHAN,
  taishan: TAISHAN,
  hengshan_south: HENGSHAN_SOUTH,
  hengshan_north: HENGSHAN_NORTH,
  quanzhen: QUANZHEN,
  emei: EMEI,
  gumu: GUMU,
  beggars: BEGGARS,
  jinyiwei: JINYIWEI,
  sunmoon: SUNMOON,
  tang: TANG,
  xiaoyao: XIAOYAO,
};

// Gold paid on reaching `targetRank` — half the sect points the step costs.
export function rankUpGold(def: SectMembershipDef, targetRank: number): number {
  const cost = def.rankUpCost(targetRank);
  return Number.isFinite(cost) ? Math.round(cost / 2) : 0;
}

/** The sect whose grounds `locationId` are, if the hero is an active disciple there (they may sleep there free). */
export function ownSectAt(
  sectMembership: Readonly<Record<string, { status?: string } | undefined>>,
  locationId: string,
): SectMembershipDef | null {
  for (const def of Object.values(SECT_MEMBERSHIPS)) {
    if (def.hallLocationId === locationId && sectMembership[def.id]?.status === "active") return def;
  }
  return null;
}
