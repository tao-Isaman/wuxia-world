// The world store's shape: its state (WorldStateData) plus every action, and
// the result types the actions hand back to the UI.
import type { StoreApi } from "zustand";
import type { EquipSlotType, StatKey } from "@/lib/game";
import type { LifeSkill, WorldStateData } from "@/lib/world";
import type { ObjectiveResult } from "@/lib/world/quest-objectives";
import type { GiftReaction } from "@/lib/world/gifts";

// Result of a gather attempt — surfaced so the UI can show a small banner.
// On a fresh successful non-combat gather: type "yield". On hunting: type
// "battle" (the spoils land via acknowledgeBattleResult once the fight ends).
//
// `dropCheck` distinguishes a clean failure ("passed", but the weighted
// picks happened to land on nothing) from the explicit mastery-vs-level
// drop-check failure ("failed", the player wasn't skilled enough this round).
export type GatherResult =
  | { ok: false; reason: "stamina" | "no-build" | "missing" | "unknown" }
  | {
      ok: true;
      type: "yield";
      resourceId: string;
      items: { itemId: string; count: number }[];
      xpGained: number;
      skill: LifeSkill;
      dropCheck: "passed" | "failed";
      successChance: number;
    }
  | { ok: true; type: "battle"; resourceId: string; opponentId: string };

export type CraftResult =
  | { ok: false; reason: "missing-input" | "missing-mastery" | "not-learned" | "no-artisan" | "unknown" }
  | {
      ok: true;
      recipeId: string;
      outputItemId: string;
      outputCount: number;
      xpGained: number;
      dropCheck: "passed" | "failed" | "none";
    };

// Result of buying a recipe at an artisan. `already-learned` means the
// recipe is already in learnedRecipeIds; `no-gold` is self-explanatory.
export type BuyRecipeResult =
  | { ok: false; reason: "unknown" | "already-learned" | "no-gold" }
  | { ok: true; recipeId: string; spent: number };

// Result of buying a piece of equipment at an artisan. The bought
// equipment lands in `inventoryEquipment`, NOT directly in a slot.
export type BuyEquipResult =
  | { ok: false; reason: "unknown" | "no-gold" }
  | { ok: true; equipId: string; spent: number };

// Result of equipping a bag item into a slot. `swapped` (when present)
// is the id of the item that got pushed back into the bag.
export type EquipResult =
  | { ok: false; reason: "unknown" | "missing" | "no-build" }
  | {
      ok: true;
      equipId: string;
      slotType: EquipSlotType;
      slotIdx: number;
      swapped: string | null;
    };

// Result of moving an equipped item back into the bag.
export type UnequipResult =
  | { ok: false; reason: "empty" | "unknown" | "no-build" }
  | { ok: true; equipId: string; slotType: EquipSlotType; slotIdx: number };

// Result of using a consumable item (book, song book, image, potion, …).
// Discriminated on `kind` so the UI can render different feedback per use.
//
// Manual-use failure modes are item-preserving: `stat-too-low` and
// `already-learned` both refuse the use without consuming the item, so
// the player isn't punished for guessing. The popup shows a toast.
export type UseItemResult =
  | { ok: false; reason: "unknown" | "missing" | "no-effect" | "no-build" | "full" }
  | { ok: false; reason: "stat-too-low"; stat: StatKey; needed: number; current: number }
  | { ok: false; reason: "already-learned"; itemId: string }
  // แผนภาพชีพจร the hero can't read yet: `message` is the Thai reason
  // (the missing skills / arts). The item is kept.
  | { ok: false; reason: "meridian-locked"; itemId: string; message: string }
  | { ok: true; kind: "trainSkill"; itemId: string; skill: LifeSkill; xpGained: number }
  | {
      ok: true;
      kind: "heal";
      itemId: string;
      hpHealed: number;
      mpHealed: number;
    }
  | { ok: true; kind: "manualLearnSkill"; itemId: string; skillId: string }
  | { ok: true; kind: "manualLearnArt"; itemId: string; artId: string; level: number }
  | { ok: true; kind: "learnMeridian"; itemId: string; chartId: string };

// Result of opening / upgrading a meridian point (openMeridianNode).
export type OpenMeridianNodeResult = { ok: true; rank: number } | { ok: false; reason: string };

// Result of clicking the "เล่นเพลง" practice button.
export type PracticeMusicResult =
  | { ok: false; reason: "no-instrument" | "no-build" }
  | { ok: true; xpGained: number };

// Result of attempting to level up a move skill via either xp source.
export type LevelUpSkillResult =
  | { ok: false; reason: "unknown" | "maxed" | "insufficient" }
  | { ok: true; skillId: string; level: number; cost: number };

// Result of attempting to level up an inner art via w-exp.
export type LevelUpArtResult =
  | { ok: false; reason: "unknown" | "maxed" | "insufficient" }
  | { ok: true; artId: string; level: number; cost: number };

// Result of attempting to forget a learned skill / art. Forgetting
// removes the id from `learnedSkillIds` / `learnedArtIds`, unslots it
// from `skillIds` if equipped, and clears its xp + level. The player
// can re-buy / re-learn it later through normal channels.
//
// Why this exists: the conflict system counts every entry in
// `learnedSkillIds` / `learnedArtIds`, not just slotted ones — so
// unequipping doesn't help if the player wants to clear a type
// imbalance. This is the actual escape hatch.
export type ForgetSkillResult =
  | { ok: false; reason: "unknown" | "not-learned" | "no-build" }
  | { ok: true; skillId: string };

export type ForgetArtResult =
  | { ok: false; reason: "unknown" | "not-learned" | "no-build" }
  | { ok: true; artId: string };

// Result of attempting "ฝึกฝน" on a learned skill / art at a location.
export type PracticeResult =
  | { ok: false; reason: "no-build" | "stamina" | "unknown" | "not-allowed" }
  | {
      ok: true;
      kind: "skill" | "art";
      id: string;
      xpGained: number;
      /** The place suits the skill's types (the larger practice rule). */
      matched: boolean;
      leveledUp: boolean;
      newLevel: number;
    };

// ─── Shop / sect-hall result types ────────────────────────────────────
export type BuyResult =
  | { ok: false; reason: "unknown" | "not-for-sale" | "no-gold" }
  | { ok: true; itemId: string; count: number; spent: number };

export type SellResult =
  | { ok: false; reason: "unknown" | "missing" | "not-accepted" | "unsellable" }
  | { ok: true; itemId: string; count: number; gained: number };

export type BuyOfferResult =
  | { ok: false; reason: "unknown" | "no-gold" | "already-learned" }
  | { ok: true; id: string; spent: number };

// Result of attempting to start a sparring match with a registered NPC.
// `unsupported` means the NPC has no `sparOpponentId` configured; `pending`
// means the player already has a battle queued.
export type SparResult =
  | { ok: false; reason: "unknown" | "unsupported" | "pending" | "absent" | "secluded" }
  | { ok: true; npcId: string; opponentId: string };

// Result of attempting to accept / abandon a quest from the NPC popup.
export type QuestActionResult =
  | { ok: false; reason: "unknown" | "already-active" | "already-done" | "prereq" | "keep" }
  | { ok: true; questId: string };

// Result of a bad-action attempt (ขโมย / ลอบทำร้าย / ลักพาตัว). All three
// share the same shape: pre-flight failures (no build, NPC missing) return
// `{ ok: false, ... }`. Once the action is committed, the result is either
// "passed" (effects already applied — items / quest progress / trait deltas)
// or "failed" (a battle has been queued; the popup should close so the
// battle bridge can take over).
export type BadActionResult =
  | { ok: false; reason: "unknown" | "no-build" | "pending" | "not-stealable" | "already-done" }
  | { ok: true; outcome: "passed"; chance: number; items?: { itemId: string; count: number }[] }
  | { ok: true; outcome: "failed"; chance: number };

/** A won fight's spoils, shown on the result panel before the player goes on. */
export interface VictorySpoils {
  gold: number;
  wExp: number;
  items: { itemId: string; count: number }[];
  /** Battle xp per move skill / inner art used (frozen sect moves left out). */
  moves: { id: string; kind: "skill" | "art"; xp: number }[];
  /** A hunt's carcass roll (null when the fight was no hunt). */
  hunt: { items: { itemId: string; count: number }[]; passed: boolean } | null;
  /** Equipment ids won (a legendary beast's rare drop); they go to the gear bag. */
  gear?: string[];
}

// Rest tiers: one's own bed (or one's own sect's grounds, as an active disciple) (home_player), an inn, a temple, the roadside.
export type RestKind = "home" | "sect" | "inn" | "temple" | "route";

export type RestResult =
  | { ok: false; reason: "gold" | "place" }
  | { ok: false; reason: "cooldown"; readyIn: number }
  | { ok: true; kind: RestKind; cost: number; restored: number };

export interface WorldStore extends WorldStateData {
  // Actions
  /**
   * Bring the world up to the world clock (lib/world/clock.ts): time,
   * regeneration, the day's events. Returns the whole days that passed (a
   * return after a day or more away).
   */
  syncClock: () => number;
  startNewGame: (opts?: {
    name?: string;
    gender?: import("@/lib/world").Gender;
    bodyId?: string;
    /**
     * A new world too: fresh people, rumors and beasts. Tests and local
     * play only — by default a new hero joins the shared world as it is.
     */
    newWorld?: boolean;
  }) => void;
  // Sect membership actions
  joinSect: (sectId: import("@/lib/world").SectId) => { ok: boolean; reason?: string };
  // Spend points to upgrade rank (one rank at a time).
  upgradeSectRank: (sectId: import("@/lib/world").SectId) => { ok: boolean; reason?: string };
  // Accept a sect quest (records lastQuestDay so the cooldown gate works).
  acceptSectQuest: (sectId: import("@/lib/world").SectId, questId: string) => { ok: boolean; reason?: string };
  // Leave a sect — formal resignation. Membership stays as a tombstone
  // for skill-XP freeze tracking. Player keeps current skill levels but
  // can no longer level rewards earned from this sect.
  resignSect: (sectId: import("@/lib/world").SectId) => { ok: boolean; reason?: string };
  // Leave a sect — defection. Skills stay learnable but the sect's
  // hunter NPC may ambush in random events. Cleared by the redemption
  // quest (qst_<sectId>_redemption).
  betraySect: (sectId: import("@/lib/world").SectId) => { ok: boolean; reason?: string };
  makeChoice: (idx: number) => void;
  gotoScene: (sceneId: string) => void;
  /** Resolve a visible route destination atomically through the world engine. */
  travelRoute: (locationId: string) => void;
  // Used by the "ปิด" button on terminal dialogs and by the route-screen
  // back button. No-op if lastLocationId is null (very early in a fresh game).
  exitToLocation: () => void;
  // True when navigating to `targetSceneId` either won't cost stamina
  // (story warps) or the player can pay the overworld travel cost. UI uses
  // this to disable destination / route buttons preemptively.
  canTravelTo: (targetSceneId: string) => boolean;
  clearPendingBattle: () => void;
  // After a battle finishes (state.winner set), the world UI calls this when
  // the user clicks "ดำเนินเรื่อง". It routes to onWin/onLose, clears
  // pendingBattle, and resets the battle store. If a hunt was in flight,
  // the spoils are dropped here on win.
  acknowledgeBattleResult: () => void;
  // What a won fight pays (rolled once, the first time it is asked for, and
  // used by acknowledgeBattleResult); null while there is no won world battle.
  victorySpoils: () => VictorySpoils | null;
  /** Open a letter: mark it read and take its gift. */
  openLetter: (letterId: string) => { ok: boolean; gift?: string };
  /** Throw letters away; a gift not yet taken goes to the bag first. */
  deleteLetters: (letterIds: string[]) => { ok: boolean; deleted: number; gifts: string[] };
  /** Ride from this place's horse station to a visited station place. */
  stationTravel: (to: string) => { ok: boolean; reason?: "no-station" | "unknown" | "gold" };
  /** Pay the fee and register for this year's sword tournament. */
  registerTournament: () => boolean;
  /** Start the tournament (on its day) or the hero's next bout: queues the battle. */
  fightTournamentBout: () => boolean;
  /** The champion hero takes one move or art from the entrants'. */
  pickTournamentPrize: (slotId: string) => boolean;
  resetGame: () => void;

  // Activity actions
  gatherResource: (resourceId: string) => GatherResult;
  craftRecipe: (recipeId: string) => CraftResult;
  useItem: (itemId: string) => UseItemResult;
  // ชีพจร: spend meridian points to raise point `index` of a learned chart
  // one rank (costs meridianRankCost(chart.ti, rank); node i needs node i−1
  // at rank ≥ 1). Fails with a Thai reason.
  openMeridianNode: (chartId: string, index: number) => OpenMeridianNodeResult;
  practiceMusic: () => PracticeMusicResult;
  rest: (kind: RestKind) => RestResult;

  // Spend w-exp to skip the per-skill xp grind and level a move skill by
  // one tier. The skill's own xp bar auto-levels on overflow without any
  // user action — no separate "level up via skill xp" button is needed.
  levelUpSkillFromWExp: (skillId: string) => LevelUpSkillResult;
  // Mirror of levelUpSkillFromWExp for inner arts. Cost = xpToNextArtLevel
  // (2× the equivalent skill cost). Auto-leveling on artExp overflow is
  // handled by applyArtLevelUps post-battle.
  levelUpArtFromWExp: (artId: string) => LevelUpArtResult;
  // Remove a skill / art from learnedSkillIds / learnedArtIds entirely.
  // Also unslots it (so an empty slot is left) and wipes its xp + level
  // entries. Used by the player to clear type-conflict imbalances —
  // since the conflict system counts every learned entry regardless of
  // whether it's slotted, the only way to escape a bad imbalance is
  // forgetting. Destructive: not refundable.
  forgetSkill: (skillId: string) => ForgetSkillResult;
  forgetArt: (artId: string) => ForgetArtResult;
  // "ฝึกฝน" — train a single skill / art at the current location. `rawId`
  // accepts the slot-encoded form ("art:xxx" for inner arts, bare id for
  // move skills). Costs PRACTICE_STAMINA_COST + PRACTICE_HOURS; xp scales
  // with the location's category-type bonus.
  practiceSkill: (rawId: string) => PracticeResult;

  // Shop / sect-hall purchases. All return a discriminated result so the
  // popups can show the right toast on success / failure.
  buyItem: (itemId: string, count: number) => BuyResult;
  sellItem: (itemId: string, count: number, sellMultiplier: number) => SellResult;
  buyMoveSkill: (skillId: string, price: number) => BuyOfferResult;
  buyInnerSkill: (artId: string, price: number) => BuyOfferResult;
  // Buy a recipe at an artisan — adds the id to learnedRecipeIds. The
  // popup filters out already-learned recipes so this should rarely
  // hit the `already-learned` rejection in practice.
  buyRecipe: (recipeId: string, price: number) => BuyRecipeResult;
  // Buy a piece of equipment at an artisan — drops gold, adds the id
  // to inventoryEquipment. Equip via `equipFromBag` afterwards.
  buyEquipment: (equipId: string, price: number) => BuyEquipResult;
  // Move an equipment id from inventoryEquipment into the matching
  // slot on playerBuild.equipment. Picks the first empty slot for the
  // multi-slot types (BR / R / C); on a full slot it swaps with index
  // 0 and pushes the displaced id back into the bag.
  equipFromBag: (equipId: string) => EquipResult;
  // Move a currently-equipped id back into the bag. `slotIdx` is
  // required for multi-slot types (BR / R / C) and ignored for the
  // single-slot ones (W / A / H / B).
  unequipFromSlot: (slotType: EquipSlotType, slotIdx?: 0 | 1) => UnequipResult;

  // Equip a learned skill or art into a specific slot. `rawId` follows
  // the slot encoding from `lib/game/slots.ts` — bare skill id or
  // "art:<artId>". Pass null to clear the slot. Idempotent: assigning the
  // same id to a slot it already occupies is a no-op; assigning to a new
  // slot moves it (the old slot is cleared).
  equipSlot: (slotIdx: number, rawId: string | null) => void;

  // NPC interactions. The popup calls these on click — they keep all the
  // state-mutation logic in the store so adding more interaction kinds
  // (gifting, hiring, training) later means adding one method here, not
  // pushing logic into the component.
  meetNpc: (npcId: string) => void;
  startSparWith: (npcId: string) => SparResult;
  /**
   * ⚔ สังหาร: an open fight to the death with anyone. Winning kills them for
   * good (their quests pass to an heir or fail) and the hero is at once wanted
   * at once (KILL_MARKS more marks); a failed attempt adds two.
   */
  startKillDuel: (npcId: string) => SparResult;

  // Bad-action attempts. Each runs a stat check; on pass, applies the
  // outcome (items / quest counter / trait delta) inline. On fail, queues
  // a triggerBattle vs the tier-mapped opponent — popup should close so
  // the battle bridge can pick up. Steal-fights are non-fatal; the other
  // two are real combat. See lib/world/bad-actions.ts for the formulas.
  attemptSteal: (npcId: string) => BadActionResult;
  /** Give an NPC an item or gold, once per GIFT_COOLDOWN_DAYS; raises (or lowers) the relationship. */
  giveGift: (npcId: string, gift: { itemId: string } | { gold: number }) =>
    { ok: true; reaction: GiftReaction; points: number } | { ok: false; reason: "unknown" | "absent" | "cooldown" | "not-giftable" | "missing"; message: string };
  attemptAssassinate: (npcId: string) => BadActionResult;
  attemptKidnap: (npcId: string) => BadActionResult;

  // Quest actions. `acceptQuest` is the lightweight version of dispatching
  // `startQuest` from a dialog choice — useful when the NPC popup wants to
  // start a quest directly without routing through a scripted scene.
  acceptQuest: (questId: string) => QuestActionResult;
  // Marks the quest as failed (and clears progress). Side quests do not
  // re-offer after failure — once failed, the NPC popup hides them.
  abandonQuest: (questId: string) => QuestActionResult;
  // Engine-side turn-in. Used by the NPC popup when a quest has no
  // `qs_<id>_complete` dialog scene to route to — without this fallback,
  // such quests would never grant rewards. Equivalent to a dialog choice
  // that emits `finishQuest({ success: true })`.
  finishQuestNow: (questId: string) => QuestActionResult;

  // Random-encounter resolution. `acceptEncounter` promotes a pending
  // fight-or-flee offer to an actual battle; `fleeEncounter` clears the
  // offer and stays put.
  acceptEncounter: () => void;
  // One walk tick (the map runtime calls this every WALK_TICK_UNITS walked).
  // `pickSpot` gives a free, reachable spot (map percentages) for a foe to
  // appear at; without it no foe spawns.
  walkTick: (pickSpot?: () => { x: number; y: number } | null) => void;
  // Foes waiting on the map (lib/world/data/random-events.ts FOE_SPAWN): not
  // saved, so a reload clears them. Touching one opens its encounter.
  roamingFoes: RoamingFoe[];
  engageFoe: (foeId: string) => void;
  /** Walk into a legendary beast in its lair (data/bosses.ts): the fight-or-flee screen. */
  engageBoss: (bossId: string) => void;
  // The last death's price (lib/world/death.ts), shown once on waking at home;
  // not saved (the action log keeps it).
  lastDeath: { lines: string[] } | null;
  dismissDeath: () => void;
  /**
   * มอบตัว: a wanted hero gives themselves up and is taken straight to the
   * jail — half the sentence and fine, no seizure, one less crippled move
   * (lib/world/law.ts arrestPenalty). The arrest report shows next.
   */
  surrender: () => { ok: boolean; reason?: "not-wanted" | "busy" };
  // Map activities (see lib/world/data/activities.ts) — the jail's labour,
  // dice, meditation, gate and escape. Returns a message for the toast.
  doActivity: (id: string) => ActivityResult;
  // Sit out the rest of a jail sentence at once and walk free.
  serveSentence: () => boolean;
  // Use a hands-on quest objective spot here (see lib/world/quest-objectives.ts).
  doQuestObjective: (questId: string, spotIndex: number) => ObjectiveResult;
  fleeEncounter: () => void;

  // Liveness Layer — record that the player has heard a specific rumor.
  // Pushes onto rumorSeenLog so future `selectRumorsForScene` calls
  // de-prioritise it. Caps the log at 50 entries (FIFO eviction).
  // Idempotent: re-recording the same rumorId is a no-op.
  recordRumorHeard: (rumorId: string) => void;

  // Debug helpers (dev-only consumers).
  _setFlag: (flag: string, value: boolean | number | string) => void;
  _giveGold: (amount: number) => void;
}

export type ActivityResult =
  | { ok: true; message: string }
  | { ok: false; reason: "unknown" | "not-here" | "stamina" | "gold" | "locked" | "cooldown"; message: string; hoursLeft?: number };

/** A foe standing on a map (percentages of the map), waiting for the hero. */
export interface RoamingFoe { id: string; opponentId: string; locationId: string; x: number; y: number }

export type WorldSet = StoreApi<WorldStore>["setState"];
export type WorldGet = StoreApi<WorldStore>["getState"];
