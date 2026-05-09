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

// Huashan disciple ranks. Same 9→1 climb as the bigger sects (Shaolin /
// Wudang) but Huashan is a smaller, sword-only school — its leadership
// caps at T3 power (master + vice are formidable but not legendary like
// Shaolin's abbot or Wudang's grandmaster). Open to anyone who can pay
// the entry fee — no gender gate, no trait gate beyond a not-evil floor.
//
// Reward layout:
//   rank 9 → T0 sword + T0 art (gifted on registration)
//   rank 8 → T1 sword (auto)
//   rank 7 → T1 art (auto)
//   rank 6 → T2 art (auto)
//   rank 5 → T3 sword (auto)
//   rank 2 → choose ONE of two T4 arts — the disciple-line "purple cloud"
//            OR the older balanced "huashan-shengong" capstone.
const HUASHAN: SectMembershipDef = {
  id: "huashan",
  name: "หัวซาน",
  hallLocationId: "sect_huashan",
  registrarNpcId: "sect_huashan_master_yiqing",
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
    9: ["hs_basic_sword"],     // T0 sword — auto-grant on join
    8: ["hs_floating_cloud"],  // T1 sword — auto on rank-up
    5: ["hs_purple_cloud"],    // T3 sword — auto on rank-up
  },
  artsByRank: {
    9: ["t0_huashan_qi"],      // T0 art — auto on join
    7: ["t1_huashan_light"],   // T1 art — auto
    6: ["t2_huashan_cloud"],   // T2 art — auto
    2: ["t4_huashan_purple", "huashan"], // T4 — pick one of the two breaths
  },
  questCooldownDays: 30,
};

export const SECT_MEMBERSHIPS: Record<SectId, SectMembershipDef> = {
  shaolin: SHAOLIN,
  wudang: WUDANG,
  huashan: HUASHAN,
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
