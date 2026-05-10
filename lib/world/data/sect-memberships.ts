import type { Condition, SectId } from "../types";

// ─── Sect membership definitions ─────────────────────────────────────
// Per-sect rank table + reward unlock pools. Indexed by SectId (currently
// only "shaolin" — extend as more sects open membership).
//
// Rank semantics:
//   - lower number = higher prestige
//   - `startRank` is what the player gets seeded with on `joinSect`
//   - `topRank` is the highest tier (rank-up cannot exceed it)
//   - `rankUpCost(targetRank)` returns the sect-point cost to upgrade FROM
//     the rank just below `targetRank` TO `targetRank`. e.g. for Shaolin
//     rankUpCost(8) = points needed to go from rank 9 → rank 8.
//
// Reward pools:
//   - `skillsByRank[rank]` — skill ids the player may pick ONE of when they
//     reach this rank. Empty array = no skill reward at this rank.
//   - `artsByRank[rank]` — art ids, same rule.
//   - The player picks at most one skill + one art per rank, tracked in
//     `SectMembership.rewardPicks`.

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
  // Per-rank reward pools (player picks one of each per qualifying rank).
  skillsByRank: Record<number, readonly string[]>;
  artsByRank: Record<number, readonly string[]>;
  // Days between sect-quest re-offers. Used by sect-quest gating in the NPC
  // popup (offer hidden when day - lastQuestDay[questId] < cooldownDays).
  questCooldownDays: number;
}

// Shaolin disciple ranks. Climbing from rank 9 (entry, novice) to rank 1
// (abbot's right hand). Rewards mirror saolin.md spec:
//   rank 9 → choose one T1 move skill + receive T0 art
//   rank 8 → choose one T2 move skill
//   rank 7 → receive T1 art
//   rank 6 → receive T2 art
//   rank 5 → choose one T3 move skill
//   rank 4 → receive T3 art
//   rank 3 → choose one T4 move skill
//   rank 2 → choose one T4 art
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
  skillsByRank: {
    // T1 — pick one of the staff/fist intermediate options
    9: ["nd5", "sl_staff_dharma", "sl_staff_shaolin"],
    // T2 — pick one of the fist/sword intermediate options
    8: ["ne1", "ne2", "sl_zen_sword"],
    // T3 — pick one of the master moves
    5: ["sl_bodhi_palm", "sl_petal_finger", "sl_rock_punch"],
    // T4 — pick one of the capstone signatures
    3: ["sl_thousand_arms", "sl_truth_staff"],
  },
  artsByRank: {
    // T0 — gifted on registration
    9: ["t0_lohan"],
    // T1 — given when reaching rank 7
    7: ["t1_goldenbell"],
    // T2 — given when reaching rank 6
    6: ["t2_dharma"],
    // T3 — given when reaching rank 4
    4: ["t3_onefinger"],
    // T4 — pick one of the three legendary breaths
    2: ["tendon", "diamond", "t4_demonsubduer"],
  },
  questCooldownDays: 30,
};

// Wudang disciple ranks. Same 9→1 climb as Shaolin, but no gender gate
// (men and women alike train under Master Qingxu) and a balance / soft /
// internal reward pool. The Wudang line emphasises sword + fist taiji
// styles paired with meditation arts; the rank rewards mirror that:
//   rank 9 → choose one T1 sword/soft (gifted T0 art)
//   rank 8 → choose one T2 sword/soft
//   rank 7 → receive T1 art (balance)
//   rank 6 → receive T2 art (balance)
//   rank 5 → choose one T3 cloud-style move
//   rank 4 → receive T3 art (balance / yinyang)
//   rank 3 → choose one T4 capstone (sword above heaven OR taiji fist song)
//   rank 2 → choose one T4 art — taiji vs zixia (the two iconic Wudang breaths)
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
  skillsByRank: {
    // T1 — pick one of the disciple-line sword OR existing wind-step / reflect
    9: ["wd_taiji_sword", "rf", "cs"],
    // T2 — pick one of the intermediate sword or yin-yang palm
    8: ["wd_yinyang_sword", "yy"],
    // T3 — pick one of the cloud-style master moves
    5: ["wd_cloud_palm", "wd_cloud_sword"],
    // T4 — capstone signature
    3: ["wd_heaven_sword", "wd_taiji_fist"],
  },
  artsByRank: {
    // T0 — gifted on registration
    9: ["t0_meditation"],
    // T1 — given when reaching rank 7
    7: ["t1_naturalqi"],
    // T2 — given when reaching rank 6
    6: ["t2_mindbody"],
    // T3 — given when reaching rank 4
    4: ["t3_yinyang"],
    // T4 — choose ONE of the two iconic Wudang breaths
    2: ["taiji", "zixia"],
  },
  questCooldownDays: 30,
};

// Huashan disciple ranks. T3 sect — smaller, sword-only school whose
// leadership caps at T3 power. Compressed 5-rank ladder (5 → 1) since the
// climb is shorter than the legendary T4 sects (Shaolin / Wudang / etc).
// Open to anyone who can pay the entry fee — no gender gate, no trait
// gate beyond a not-evil floor.
//
// Reward layout (T0/T1/T2/T3 + T4 art capstone):
//   rank 5 → T0 sword + T0 art (gifted on registration)
//   rank 4 → T1 sword + T1 art (auto)
//   rank 3 → T2 art (auto — sect's only T2 entry)
//   rank 2 → T3 sword (auto)
//   rank 1 → choose ONE of two T4 arts — the disciple-line "purple cloud"
//            OR the older balanced "huashan-shengong" capstone.
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
  skillsByRank: {
    5: ["hs_basic_sword"],     // T0 sword — auto-grant on join
    4: ["hs_floating_cloud"],  // T1 sword — auto on rank-up
    2: ["hs_purple_cloud"],    // T3 sword — auto on rank-up
  },
  artsByRank: {
    5: ["t0_huashan_qi"],      // T0 art — auto on join
    4: ["t1_huashan_light"],   // T1 art — auto
    3: ["t2_huashan_cloud"],   // T2 art — auto
    1: ["t4_huashan_purple", "huashan"], // T4 capstone — pick one
  },
  questCooldownDays: 30,
};

// Songshan disciple ranks. T3 sect — central peak iron-sword. Compressed
// 5-rank ladder. Reward layout:
//   rank 5 → T0 sword + T0 art (auto on join)
//   rank 4 → T1 sword + T1 art (auto)
//   rank 3 → T2 sword + T2 art (auto)
//   rank 2 → T3 sword (auto)
//   rank 1 → T3 art capstone (auto, paired with art quest early-grant)
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
  skillsByRank: {
    5: ["ssh_basic_sword"],
    4: ["ssh_iron_strike"],
    3: ["ssh_central_blade"],
    2: ["ssh_song_pillar"],
  },
  artsByRank: {
    5: ["t0_ssh_qi"],
    4: ["t1_ssh_iron"],
    3: ["t2_ssh_root"],
    1: ["t3_ssh_pillar"],
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
  skillsByRank: {
    5: ["tsh_basic_sword"],
    4: ["tsh_dawn_strike"],
    3: ["tsh_east_blade"],
    2: ["tsh_sun_pierce"],
  },
  artsByRank: {
    5: ["t0_tsh_qi"],
    4: ["t1_tsh_dawn"],
    3: ["t2_tsh_peak"],
    1: ["t3_tsh_sun"],
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
  skillsByRank: {
    5: ["hgs_basic_sword"],
    4: ["hgs_dancing_step"],
    3: ["hgs_five_peaks"],
    2: ["hgs_swift_blade"],
  },
  artsByRank: {
    5: ["t0_hgs_breath"],
    4: ["t1_hgs_step"],
    3: ["t2_hgs_cloud"],
    1: ["t3_hgs_swift"],
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
  skillsByRank: {
    5: ["hgn_basic_sword"],
    4: ["hgn_dharma_guard"],
    3: ["hgn_iron_robe"],
    2: ["hgn_mirror_blade"],
  },
  artsByRank: {
    5: ["t0_hgn_zen"],
    4: ["t1_hgn_shield"],
    3: ["t2_hgn_bell"],
    1: ["t3_hgn_mirror"],
  },
  questCooldownDays: 30,
};

// Quanzhen disciple ranks. Like Huashan, leadership caps at T3 — strong
// but not on the legendary Shaolin/Wudang tier. Open to anyone (no
// gender gate, no money) — Quanzhen Daoists are ascetics: the only fee
// is sincere effort. Rank rewards mix new yang/hard sword + fist line
// with the existing T2 entries (qzjf / qz_punch / qzzq).
//
// Reward layout:
//   rank 9 → T0 sword + T0 art (gifted on registration)
//   rank 8 → T1 sword (auto)
//   rank 7 → T1 art (auto)
//   rank 6 → T2 art `qzzq` (auto — uses existing breath)
//   rank 5 → choose T3 weapon — sun fist OR sun sword
//   rank 2 → choose T3 art — sun power OR ocean-of-yang dragon-slayer
//            (Quanzhen tops out at T3 — no T4 capstone art)
const QUANZHEN: SectMembershipDef = {
  id: "quanzhen",
  name: "ฉวนเจิน",
  hallLocationId: "sect_quanzhen",
  registrarNpcId: "sect_quanzhen_master_chongyang",
  joinRequirements: { t: "trait", trait: "evil", max: 10 },
  // T3 sect — compressed 5-rank ladder. Reward layout:
  //   rank 5 → T0 sword + T0 art (auto on join)
  //   rank 4 → T1 sword + T1 art (auto)
  //   rank 3 → T2 art qzzq (auto — sect's only T2 entry)
  //   rank 2 → choose T3 weapon (sun fist OR sun sword)
  //   rank 1 → choose T3 art (sun power OR ocean-yang dragon-slayer)
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
  skillsByRank: {
    5: ["qz_heavy_sword"],     // T0 — auto on join
    4: ["qz_hot_sword"],       // T1 — auto on rank-up
    2: ["qz_sun_fist", "qz_sun_sword"], // T3 — choice
  },
  artsByRank: {
    5: ["t0_qz_speed"],        // T0 — auto on join
    4: ["t1_qz_horse"],        // T1 — auto
    3: ["qzzq"],               // T2 — auto (existing breath)
    1: ["t3_qz_sun", "t3_qz_dragon"], // T3 — choice (Quanzhen has no T4 art)
  },
  questCooldownDays: 30,
};

// Emei disciple ranks. Big Buddhist nun sect — leadership tier matches
// Shaolin / Wudang (T4 master). Women only — the abbess turns away men
// at the gate. Yin / internal sword + fist combat identity, with the
// bodhisattva-line palm + sword as the T4 capstones and a healing-art
// focus throughout (heart / lotus / ice breath).
//
// Reward layout:
//   rank 9 → T0 sword + T0 art (gifted on registration)
//   rank 8 → T1 sword (auto)
//   rank 7 → T1 art (auto)
//   rank 6 → T2 art (auto)
//   rank 5 → choose T3 sword (Buddha-method vs plum-blossom)
//   rank 4 → choose T3 art (heart vs grace vs ice breath)
//   rank 3 → choose T4 weapon (bodhi palm vs bodhi-guardian sword)
//   rank 2 → choose T4 art — ascetic bodhisattva OR the older shengong
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
  skillsByRank: {
    9: ["em_graceful_sword"],   // T0 sword — auto on join
    8: ["em_blossom_sword"],    // T1 sword — auto
    5: ["em_buddha_sword", "em_plum_sword"], // T3 sword — choice
    3: ["em_bodhi_palm", "em_bodhi_sword"],  // T4 capstone — choice
  },
  artsByRank: {
    9: ["t0_em_meditation"],    // T0 art — auto on join
    7: ["t1_em_lotus"],         // T1 art — auto
    6: ["t2_em_garland"],       // T2 art — auto
    4: ["t3_em_heart", "t3_em_grace", "t3_em_ice"], // T3 — choice
    2: ["t4_em_bodhi", "emei"], // T4 capstone — choice (ascetic vs older)
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
//
// Reward layout:
//   rank 3 → ynxj T3 art (gifted on registration — the entry breath)
//   rank 2 → t4_gm_iceweave T4 art (auto on rank-up)
//   rank 1 → choose T4 capstone — winterstep art OR ansh skill
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
  // Only 3 ranks total. Steeper costs since the climb is short and the
  // rewards are all T3-T4 disciple-line.
  rankUpCost: (targetRank) => {
    const table: Record<number, number> = {
      2: 400,
      1: 1200,
    };
    return table[targetRank] ?? Infinity;
  },
  skillsByRank: {
    1: ["ansh"], // T4 ansh as alternate top reward
  },
  artsByRank: {
    3: ["ynxj"],            // T3 — gifted on registration (entry breath)
    2: ["t4_gm_iceweave"],  // T4 — auto on rank-up
    1: ["t4_gm_winterstep"], // T4 — auto on rank 1 (paired with ansh skill pick)
  },
  questCooldownDays: 30,
};

// Beggars sect (พรรคยาจก / 丐帮). Big sect — leadership tier matches
// Shaolin / Wudang / Emei (T4 chief). The chief Hongtian is one of the
// strongest in the world. Open to anyone, no money — but the player
// must have learned the begging life skill to lv 2 first (proves they
// understand the way of the road). Combat identity: fist + staff,
// external / hard. The "wanderer / dragon palm" arts cap the line.
//
// Reward layout:
//   rank 9 → T0 fist nc1 + T0 art (gifted on registration)
//   rank 8 → choose T1 weapon (snake fist OR snake staff)
//   rank 7 → T1 art (sun-shadow, auto)
//   rank 6 → T2 art (nine-shadow, auto)
//   rank 5 → choose T2 weapon (drift staff OR drift fist)
//   rank 4 → T3 art (sun-renew, auto)
//   rank 3 → choose T3 weapon (wander staff OR existing ng3 dragon palm)
//   rank 2 → choose T4 art (thousand-crowd OR existing wanderer breath)
//          + the rank itself unlocks T4 weapon picks via the art quest.
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
  skillsByRank: {
    9: ["nc1"],                                  // T0 fist auto
    8: ["bg_snake_fist", "bg_snake_staff"],     // T1 — choice
    5: ["bg_drift_staff", "bg_drift_fist"],     // T2 — choice
    3: ["bg_wander_staff", "ng3"],              // T3 — choice (new staff vs old palm)
  },
  artsByRank: {
    9: ["t0_bg_survival"],                       // T0 art auto
    7: ["t1_bg_sunshadow"],                      // T1 art auto
    6: ["t2_bg_nineshadow"],                     // T2 art auto
    4: ["t3_bg_sunrenew"],                       // T3 art auto
    2: ["t4_bg_thousandcrowd", "wanderer"],     // T4 art — choice
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
//
// Reward layout (rich pool — sect already had a full T0-T3 disciple
// line authored, plus a T4 art `jy_a4_brocadelord`. New T4 skills +
// arts slot in at the top):
//   rank 9 → T0 chain skill jy_chain + T0 art jy_a0_brocade (auto)
//   rank 8 → T1 blade jy_blade auto
//   rank 7 → T1 art jy_a1_silktread auto
//   rank 6 → T2 art jy_a2_goldarmor auto
//   rank 5 → choose T2 fist (jy_eagleclaw vs jy_grapple)
//   rank 4 → choose T3 art (jy_a3_thunderstride vs new t3_jy_shadow)
//   rank 3 → choose T3 weapon (jy_sword vs jy_chainmaster vs jy_blade_king)
//   rank 2 → choose T4 art (jy_a4_brocadelord vs new t4_jy_godslayer)
//          + choose T4 weapon (sword vs blade vs chain)
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
  skillsByRank: {
    9: ["jy_chain"],     // T0 chain auto on join
    8: ["jy_blade"],     // T1 blade auto
    5: ["jy_eagleclaw", "jy_grapple"], // T2 fist — choice
    3: ["jy_sword", "jy_chainmaster", "jy_blade_king"], // T3 — 3-way choice
    2: ["jy_execution_sword", "jy_execution_blade", "jy_chain_assassin"], // T4 — 3-way choice
  },
  artsByRank: {
    9: ["jy_a0_brocade"],       // T0 art auto on join
    7: ["jy_a1_silktread"],     // T1 art auto
    6: ["jy_a2_goldarmor"],     // T2 art auto
    4: ["jy_a3_thunderstride", "t3_jy_shadow"], // T3 art — choice
    2: ["jy_a4_brocadelord", "t4_jy_godslayer"], // T4 art — choice
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
//
// Reward layout (8 new arts + existing qiankun + yxhd + mi_firepalm
// fist skill):
//   rank 9 → mi_firepalm fist + T0 art (auto)
//   rank 8 → choose T1 art (sun OR moon)
//   rank 7 → choose T2 art (sun-body OR moon-body)
//   rank 6 → no reward (art-line takes a breath)
//   rank 5 → T3 art (sun-script auto — yin/external defensive)
//   rank 4 → choose T3 art (dual-fusion vs sun-moon)
//   rank 3 → no reward (rank up only)
//   rank 2 → choose T4 capstone art (qiankun OR yxhd)
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
  skillsByRank: {
    9: ["mi_firepalm"], // T3 fist auto on join — sect's only move skill
  },
  artsByRank: {
    9: ["t0_sm_dual"],                            // T0 auto on join
    8: ["t1_sm_sunfire", "t1_sm_moonweave"],     // T1 — choice
    7: ["t2_sm_sunbody", "t2_sm_moonbody"],      // T2 — choice
    5: ["t3_sm_sunscript"],                       // T3 defensive auto
    4: ["t3_sm_dualfusion", "t3_sm_sunmoon"],    // T3 offensive — choice
    2: ["qiankun", "yxhd"],                       // T4 capstone — choice
  },
  questCooldownDays: 30,
};

// Tang sect (สำนักสุลถัง / 唐门). Big Sichuan family — known throughout
// the world but rarely seen in public, focused on hidden weapons +
// poisons. Leadership tier matches Shaolin/Wudang. Combat identity:
// yin / external — short blades + thrown knives + venom-coated darts.
//
// Disciple intro: gather poisons + herbs. Trial proves the recruit
// can navigate the venomous corners of the world (where Tang gets
// their materials). Hint dialog points players at specific gather
// locations.
//
// Reward layout (8 skills + 7 arts in the sect line):
//   rank 9 → T0 knife + T0 art (auto on join)
//   rank 8 → T1 knife (auto)
//   rank 7 → T1 art auto
//   rank 6 → T2 art auto
//   rank 5 → choose T2 hidden vs T3 short (sect leans on knives)
//   rank 4 → choose T3 art (viper-power vs chase-step)
//   rank 3 → choose T3 short blade (viper vs gold-snake)
//   rank 2 → choose T4 art (10000-poisons vs sky-cleaver)
//          + choose T4 weapon (rain-of-stars vs heart-piercer)
const TANG: SectMembershipDef = {
  id: "tang",
  name: "สำนักสุลถัง",
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
  skillsByRank: {
    9: ["tang_basic_knife"],                                 // T0 hidden auto
    8: ["tang_poison_knife"],                                // T1 hidden auto
    5: ["tang_starscatter"],                                 // T2 hidden auto
    3: ["tang_meteorpierce", "tang_viperblade", "tang_goldsnake"], // T3 — choice
    2: ["tang_starrain", "tang_heartpierce"],                // T4 — choice
  },
  artsByRank: {
    9: ["t0_tang_sharp"],                                    // T0 art auto
    7: ["t1_tang_venombody"],                                // T1 auto
    6: ["t2_tang_wavewind"],                                 // T2 auto
    4: ["t3_tang_viperpower", "t3_tang_chase"],              // T3 art — choice
    2: ["t4_tang_tenkpoisons", "t4_tang_skycleaver"],        // T4 art — choice
  },
  questCooldownDays: 30,
};

// Xiaoyao sect (พรรคสราญรมย์ / 逍遥派). Big sect — yin / internal art-
// heavy line with sword + blade + fist split. Leadership tier matches
// Shaolin / Wudang / etc (T4 master). Disciple intro mirrors the
// herb-gathering pattern of other public sects.
//
// Reward layout:
//   rank 9 → T0 blade + T0 art (auto)
//   rank 8 → T1 sword (auto)
//   rank 7 → T1 art (auto)
//   rank 6 → T2 art "formless greater" (auto)
//   rank 5 → choose T2 weapon (lesser-demon fist OR demon-wind sword
//            OR root-poison fist)
//   rank 4 → choose T3 art (root-poison qi vs see-power)
//   rank 3 → choose T3 weapon (xy_punch vs yxjf)
//   rank 2 → choose T4 capstone art (bmzq vs bmsg) + xy_palm T4 fist auto
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
  skillsByRank: {
    9: ["xy_lesserdemon_blade"],                                  // T0 blade auto
    8: ["xy_pathless_sword"],                                     // T1 sword auto
    5: ["xy_lesserdemon_fist", "xy_demon_wind_sword", "xy_root_poison_fist"], // T2 — choice
    3: ["xy_punch", "yxjf"],                                      // T3 — choice
    2: ["xy_palm"],                                               // T4 fist auto
  },
  artsByRank: {
    9: ["t0_xy_plum"],                                            // T0 auto
    7: ["t1_xy_formless_lesser"],                                 // T1 auto
    6: ["t2_xy_formless_greater"],                                // T2 auto
    4: ["t3_xy_root_poison_qi", "t3_xy_seepower"],                // T3 — choice
    2: ["bmzq", "bmsg"],                                          // T4 — choice
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

// Helper: rewards (skill + art ids) the player is *eligible* to pick at a
// given rank but hasn't claimed yet. Returns the full pools when the rank
// hasn't been visited; empty arrays when already claimed.
export function pendingRewardsAtRank(
  def: SectMembershipDef,
  rank: number,
  claimed: Record<string, string>,
): { skills: readonly string[]; arts: readonly string[] } {
  const skillKey = `${rank}-skill`;
  const artKey = `${rank}-art`;
  return {
    skills: claimed[skillKey] ? [] : (def.skillsByRank[rank] ?? []),
    arts: claimed[artKey] ? [] : (def.artsByRank[rank] ?? []),
  };
}

// Yield `{ rank, kind, id }` for every reward pool the player is eligible
// for (rank ≥ currentRank, since lower number = higher prestige) that has
// exactly one option AND hasn't been claimed yet. The store consumes
// these to auto-claim sect rewards on join / rank-up so the player
// doesn't have to click through one-option pickers.
//
// IMPORTANT iteration direction: the player has *reached* every rank in
// [currentRank, startRank] (inclusive) — startRank is the entry tier,
// currentRank decreases as they climb. So iterate UPWARD from currentRank
// to startRank. Going below currentRank (toward topRank) would grant
// rewards from ranks the player hasn't earned yet.
export function autoGrantableRewards(
  def: SectMembershipDef,
  currentRank: number,
  claimed: Record<string, string>,
): { rank: number; kind: "skill" | "art"; id: string }[] {
  const out: { rank: number; kind: "skill" | "art"; id: string }[] = [];
  for (let r = currentRank; r <= def.startRank; r++) {
    const skills = def.skillsByRank[r] ?? [];
    if (skills.length === 1 && !claimed[`${r}-skill`]) {
      out.push({ rank: r, kind: "skill", id: skills[0]! });
    }
    const arts = def.artsByRank[r] ?? [];
    if (arts.length === 1 && !claimed[`${r}-art`]) {
      out.push({ rank: r, kind: "art", id: arts[0]! });
    }
  }
  return out;
}
