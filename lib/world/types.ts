// Type system for the world / story layer.
// Discriminator field is `t` to match the existing engine convention
// (lib/game/types.ts uses `t` on SelfEffect / EnemyEffect / ArtPassiveEffect).

import type { CharacterBuild, StatKey } from "@/lib/game";

// ─── Scenes ────────────────────────────────────────────────────────────
// Three scene kinds, discriminated on `kind`:
//   "dialog"   — narration + dialogue lines + optional choices (scripted beat)
//   "location" — persistent place: description + NPC list + outbound routes
//   "route"    — travel screen: description + destination list + back option
//
// All share `id` and an optional `onEnter` effect array. Use `goto` and the
// existing `Condition` machinery to navigate / gate items in any kind.

export type SceneLine =
  | { t: "narration"; text: string }
  | { t: "dialogue"; speaker: string; text: string };

export type Scene = DialogScene | LocationScene | RouteScene;

export interface DialogScene {
  kind: "dialog";
  id: string;
  // Lines render in order before choices/next/close appear.
  lines: SceneLine[];
  // After lines, the renderer picks one of:
  //   - `choices` (if any visible) → wait for click
  //   - `next` → auto-advance
  //   - neither → terminal dialog: render a "ปิด" button that calls
  //     `exitToLocation` (returns to the most recently visited location).
  choices?: Choice[];
  next?: string;
  onEnter?: SceneEffect[];
}

export interface LocationScene {
  kind: "location";
  id: string;
  name: string;             // location title shown at top
  description: string;      // long-form arrival narration
  npcs: NpcRef[];           // talk-to-NPC links (each opens a dialog scene)
  routes: RouteRef[];       // outbound paths (each opens a route scene)
  resources?: ResourceNodeRef[]; // gather/hunt activities at this place
  // Optional terrain / civic tags. Drives the practice XP bonus rules in
  // lib/world/location-categories.ts and gates the "ฝึกฝน" action button.
  // When omitted the helper infers a default set from the id prefix
  // (e.g. "sect_*" → ["sect", "mountain"], "cave_*" → ["cave"]) so existing
  // 80+ locations don't need to be touched. Authors can override per-leaf
  // (e.g. อู่ตั้ง explicitly tagged ["sect", "mountain"]).
  categories?: readonly LocationCategory[];
  onEnter?: SceneEffect[];
}

// ─── Location categories ─────────────────────────────────────────────
// Used for two things: (1) gating the practice action — only outdoor /
// training-friendly categories qualify; (2) granting a 30 % practice XP
// bonus when the location's terrain matches the skill's type tags. See
// lib/world/location-categories.ts for the bonus table.
export const LOCATION_CATEGORY_KEYS = [
  "city",
  "village",
  "inn",
  "home",
  "sect",
  "temple",
  "mansion",
  "isle",
  "mountain",
  "cave",
  "forest",
  "river",
  "frontier",
] as const;
export type LocationCategory = (typeof LOCATION_CATEGORY_KEYS)[number];

export const LOCATION_CATEGORY_LABEL: Record<LocationCategory, string> = {
  city: "เมือง",
  village: "หมู่บ้าน",
  inn: "โรงเตี๊ยม",
  home: "บ้านพัก",
  sect: "สำนัก",
  temple: "วัด / วัง",
  mansion: "คฤหาสน์",
  isle: "เกาะ",
  mountain: "ภูเขา",
  cave: "ถ้ำ",
  forest: "ป่า",
  river: "แม่น้ำ / ทะเล",
  frontier: "ดินแดนชายแดน",
};

export interface RouteScene {
  kind: "route";
  id: string;
  label: string;            // displayed name e.g. "ทางเหนือ"
  description?: string;     // optional travel-narration text
  destinations: RouteDestination[];
  resources?: ResourceNodeRef[]; // gather/hunt activities while travelling
  // Where the back button sends the player. Defaults to lastLocationId
  // (the location they came from). Set explicitly only if you want a
  // different fallback.
  back?: string;
  onEnter?: SceneEffect[];
}

export interface Choice {
  text: string;
  visibleIf?: Condition;
  effects?: SceneEffect[];
  next: string;             // sceneId to go to (unless triggerBattle suspends)
}

export interface NpcRef {
  id: string;               // for keys + visibility debugging
  name: string;
  hint?: string;            // short text shown next to name
  dialogSceneId: string;    // a scene with kind === "dialog"
  visibleIf?: Condition;
}

export interface RouteRef {
  routeSceneId: string;     // a scene with kind === "route"
  label: string;
  hint?: string;
  visibleIf?: Condition;
}

export interface RouteDestination {
  locationId: string;       // a scene with kind === "location"
  label: string;
  hint?: string;
  visibleIf?: Condition;
  // Effects applied when the player picks this destination (e.g., gold cost,
  // setFlag for "first visit", advanceQuest on arrival).
  effects?: SceneEffect[];
}

// ─── Effects ───────────────────────────────────────────────────────────

export type SceneEffect =
  | { t: "setFlag"; flag: string; value: boolean | number | string }
  | { t: "giveItem"; itemId: string; count?: number }
  | { t: "takeItem"; itemId: string; count?: number }
  | { t: "addGold"; amount: number }
  | { t: "startQuest"; questId: string }
  | { t: "advanceQuest"; questId: string }
  | { t: "finishQuest"; questId: string; success: boolean }
  | { t: "triggerBattle"; opponentId: string; onWin: string; onLose: string; nonFatal?: boolean }
  | { t: "goto"; sceneId: string }
  | { t: "gotoRandom"; sceneIds: string[] }
  | { t: "rollRandomEvent" }
  // Adjust a character trait (good / evil / arrogance / humility / fame).
  // Negative `amount` removes — clamped to 0 by the dispatcher.
  | { t: "addTrait"; trait: TraitKey; amount: number }
  // Adjust a single NPC's relationship value. Used by quest scenes that
  // reward/penalise the player after talking, sparring, or completing a
  // delivery for a registered NPC.
  | { t: "addNpcRelationship"; npcId: string; amount: number }
  // Add a move skill to the player's `learnedSkillIds`. Once learned, the
  // skill contributes its `st` (stat bonus) and counts toward the type-
  // conflict system. Slotting it for combat is a separate concern.
  | { t: "learnSkill"; skillId: string }
  // Add an inner art to the player's `learnedArtIds` and seed its level.
  // Defaults to level 1 when omitted; same caveats as learnSkill.
  | { t: "learnArt"; artId: string; level?: number };

// ─── Conditions ────────────────────────────────────────────────────────

export type QuestStatus = "none" | "active" | "done" | "failed";

export type Condition =
  | { t: "flag"; flag: string; equals?: boolean | number | string }
  | { t: "hasItem"; itemId: string; count?: number }
  | { t: "questStatus"; questId: string; status: QuestStatus }
  // Range check on a character trait. Both bounds inclusive; either may be
  // omitted for an open-ended bound.
  | { t: "trait"; trait: TraitKey; min?: number; max?: number }
  // Range check on a registered NPC's relationship value. Useful for gating
  // NPC-specific dialog branches behind earned trust.
  | { t: "npcRelationship"; npcId: string; min?: number; max?: number }
  // Player has defeated this opponent at least `count` times (default 1).
  // Backed by WorldStateData.defeatedCounts (incremented in
  // acknowledgeBattleResult on win).
  | { t: "defeatedOpponent"; opponentId: string; count?: number }
  // Player has visited this location at least once. Backed by
  // WorldStateData.visitedLocationIds (recorded in gotoScene/followAutoAdvance
  // when a "location" scene is entered).
  | { t: "visitedLocation"; locationId: string }
  | { t: "and"; all: Condition[] }
  | { t: "or"; any: Condition[] }
  | { t: "not"; of: Condition };

// ─── Character traits / reputation ─────────────────────────────────────
// Five passive scores tracked alongside stats. They never affect combat —
// quests, NPC dialog, and other content gate / branch on them. New traits
// can be added by appending to TRAIT_KEYS; nothing in the engine cares
// about which traits exist beyond this list.
export const TRAIT_KEYS = [
  "good",       // ความดี — earned by helping people / quest virtue choices
  "evil",       // ความเลว — earned by killing innocents / cruel choices
  "arrogance",  // ความหยิ่งยโส — earned from boastful quest decisions / wins
  "humility",   // ความถ่อมตน — earned by refusing rewards / humble choices
  "fame",       // ชื่อเสียง — earned by winning sparring matches and tournaments
] as const;
export type TraitKey = (typeof TRAIT_KEYS)[number];

export const TRAIT_LABEL: Record<TraitKey, string> = {
  good: "ความดี",
  evil: "ความเลว",
  arrogance: "ความหยิ่งยโส",
  humility: "ความถ่อมตน",
  fame: "ชื่อเสียง",
};

// ─── NPC system ────────────────────────────────────────────────────────
// NpcDef is a registry entry (static, in lib/world/data/npcs.ts). NpcStateEntry
// is per-player runtime state (in WorldStateData.npcStates). Authors add a
// new NPC by appending to the registry and listing the location ids where
// the NPC appears — LocationView merges registry NPCs with any inline NpcRef
// the scene already lists.
//
// The set of optional capabilities (talk / spar) is intentionally open: add
// a new field here, give it a default branch in NpcInteractionPopup, and
// existing NPCs just don't show that button. Same pattern works for future
// additions (gifting, hiring, training, quest-giving).
export interface NpcDef {
  id: string;
  name: string;
  description?: string;
  // Locations where this NPC is present. LocationView pulls registry NPCs
  // by checking `locationIds.includes(scene.id)`.
  locationIds: string[];
  // Optional default talk-to-NPC dialog scene id.
  dialogSceneId?: string;
  // When set, the NPC offers a "ขอประลอง" sparring action that triggers a
  // non-fatal battle against this opponent. Win awards `sparFameReward`.
  sparOpponentId?: string;
  sparFameReward?: number;
  // Optional gating — the NPC is hidden when this evaluates false. Useful
  // for "appears after quest X" or "gone after Y" plotlines.
  visibleIf?: Condition;
  // Free-form tags for future condition queries (e.g., "merchant").
  tags?: readonly string[];
  // Quests this NPC offers / turns in. The NPC popup looks up each quest
  // and renders an "Accept" or "Turn in" button as appropriate. Adding a
  // new quest is one entry in lib/world/data/quests/* plus appending its
  // id here.
  questIds?: readonly string[];
}

export interface NpcStateEntry {
  // Has the player ever opened this NPC's interaction popup?
  met?: boolean;
  // Player's standing with this NPC. Quests can move it via
  // `addNpcRelationship`. Range is open (typically -100..+100).
  relationship?: number;
  // Free-form per-NPC flags so quests / dialog can store small bits of
  // state without polluting the global flag namespace.
  flags?: Record<string, boolean | number | string>;
}

// ─── Quests ────────────────────────────────────────────────────────────

// "main" — story-driven quests (any pacing, may unlock new content).
// "side" — optional one-shot tasks. Once status is "done" or "failed",
//          a side quest never appears on offer again (the NPC popup hides
//          the offer when status !== "none"). Designed so players can fill
//          spare time without polluting the main story flow.
export type QuestType = "main" | "side";

// Per-stage optional auto-advance. When `autoAdvance` evaluates true while
// a quest is on this stage, the engine advances stage automatically — no
// dialog beat needed. Useful for "kill 3 wolves" / "gather 5 herbs" style
// objectives that resolve through gameplay rather than conversation.
export interface QuestStage {
  id: string;
  description: string;
  autoAdvance?: Condition;
}

// Reward grants applied by `finishQuest({ success: true })`. The dispatcher
// in effects.ts iterates the array in order. Negative numbers are
// rejected by the dispatcher (rewards never punish).
export type QuestReward =
  | { t: "gold"; amount: number }
  | { t: "item"; itemId: string; count?: number }
  | { t: "wExp"; amount: number }
  | { t: "skillExp"; skillId: string; amount: number }
  | { t: "trait"; trait: TraitKey; amount: number }
  | { t: "npcRelationship"; npcId: string; amount: number }
  | { t: "learnSkill"; skillId: string }
  | { t: "learnArt"; artId: string; level?: number };

export interface QuestDef {
  id: string;
  name: string;
  description: string;
  stages: QuestStage[];
  // Defaults to "main" when omitted (existing quests stay main without edits).
  type?: QuestType;
  // Short hook shown in the quest log header / NPC offer card.
  briefSummary?: string;
  // NPC who offers this quest. The NPC popup uses this to render an "Accept"
  // button when the player meets the prereqs.
  giverNpcId?: string;
  // NPC who closes out the quest. When omitted, defaults to giverNpcId.
  // Only relevant for quests whose final stage is dialog-driven.
  turnInNpcId?: string;
  // Gating for the offer to appear. Evaluated against world state when the
  // NPC popup decides whether to show the accept button.
  prereqs?: Condition;
  // Granted on `finishQuest({ success: true })` in order. May be omitted.
  rewards?: readonly QuestReward[];
}

export interface QuestState {
  id: string;
  status: "active" | "done" | "failed";
  stage: number;
}

// ─── Items ─────────────────────────────────────────────────────────────

// ─── Item categories ─────────────────────────────────────────────────
// Categorisation drives shop / inn UI sorting and which categories an inn
// will buy from the player. Adding a new bucket is one new key here plus
// a label in ITEM_CATEGORY_LABEL.
export const ITEM_CATEGORIES = [
  "material",
  "herb",
  "venom",
  "potion",
  "food",
  "book",
  "manual",
  "craft",
  "valuable",
  "quest",
  "misc",
] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const ITEM_CATEGORY_LABEL: Record<ItemCategory, string> = {
  material: "วัตถุดิบ",
  herb: "สมุนไพร",
  venom: "พิษ",
  potion: "ยาฟื้นพลัง",
  food: "อาหาร",
  book: "ตำรา / คัมภีร์",
  manual: "ตำราวิชา",
  craft: "ของช่างฝีมือ",
  valuable: "ของมีค่า",
  quest: "ของภารกิจ",
  misc: "เบ็ดเตล็ด",
};

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  // Consumable: item shows a "ใช้" action; effect runs on use, one count is
  // removed from inventory.
  use?: ItemUseEffect;
  // Shop / inventory bucket. Defaults to "misc" when omitted.
  category?: ItemCategory;
  // Base shop price in gold. Sell-back is a fraction (typically × 0.5)
  // determined by the shop. Items with price 0 / undefined are unsellable
  // (quest items).
  price?: number;
}

export type ItemUseEffect =
  | { t: "trainSkill"; skill: LifeSkill; xp: number }
  // Heal current HP and/or MP, capped at the player's deriveAll max. At
  // least one of `hp` / `mp` must be > 0.
  | { t: "heal"; hp?: number; mp?: number }
  // ตำราวิชา — single-use manual that teaches a move skill. Refuses (does
  // not consume the item) if the player's *base* stat is below `reqValue`,
  // or if the skill is already learned. Uses base stats (build.stats) so
  // equipment / skill bonuses can't trivially bypass the gate.
  | { t: "manualLearnSkill"; skillId: string; reqStat: StatKey; reqValue: number }
  // ตำราวิชา for an inner art. Same prereq + already-learned semantics.
  // `level` is the level the player learns the art at (default 1).
  | { t: "manualLearnArt"; artId: string; reqStat: StatKey; reqValue: number; level?: number };

// Stat threshold per skill / art tier when learning from a manual. T0
// items have no stat gate; higher tiers escalate. Authors set the stat
// per manual to whatever fits the move (STR for fist/blade, POW for
// internal, AGI for evasive, DEX for hidden / venom, VIT for hard arts).
export const MANUAL_TIER_REQ: Record<0 | 1 | 2 | 3 | 4, number> = {
  0: 0,
  1: 10,
  2: 15,
  3: 20,
  4: 30,
};

// ─── Life skills ──────────────────────────────────────────────────────
// Seventeen skills across four families. Each has its own xp pool and
// mastery level (1-5). Mastery grows with use and gates higher-tier
// recipes / resources / activities.
//
//   Gathering (combat-or-find, resource pipeline):
//     mining · woodcutting · hunting · fishing · herbalism · venom
//   Cultural (consume training items):
//     reading · music · drawing · writing
//   Social (mastery-checked location activity):
//     chess · begging
//   Crafting professions (recipes):
//     forge · tailoring · jewelry · alchemy · chef
export const LIFE_SKILL_KEYS = [
  "mining",
  "woodcutting",
  "hunting",
  "fishing",
  "herbalism",
  "venom",
  "reading",
  "music",
  "drawing",
  "writing",
  "chess",
  "begging",
  "forge",
  "tailoring",
  "jewelry",
  "alchemy",
  "chef",
  // ↓ accessory crafting (charms, talismans, beaded jewellery). Distinct
  // from `jewelry` (rings / amulets) so cities can host both kinds of
  // artisan independently.
  "accessory",
] as const;
export type LifeSkill = (typeof LIFE_SKILL_KEYS)[number];

export type ResourceLevel = 1 | 2 | 3 | 4 | 5;

export interface ResourceYield {
  itemId: string;
  weight: number;
  // [min, max] inclusive count — defaults to [1, 1] when omitted.
  count?: [number, number];
}

export interface ResourceDef {
  id: string;
  name: string;
  skill: LifeSkill;
  level: ResourceLevel;
  staminaCost: number;
  // Probability-weighted item drops. The dispatcher rolls 1-3 picks per
  // gather (more at higher mastery) and merges duplicate item ids.
  yields: ResourceYield[];
  // Hunting-only: the gather first triggers a battle from this pool. The
  // win-handler then rolls `yields` for the spoils. Lose → no spoils.
  opponentIds?: readonly string[];
  // Begging-style activities: gold range awarded on drop-check pass instead
  // of (or in addition to) item drops.
  goldYield?: [number, number];
  // Extra stamina deducted only on a failed drop check — used by begging so
  // a botched approach actually costs the player. Default 0.
  failureExtraStamina?: number;
  // Free-form description shown on the activity button.
  hint?: string;
}

export interface ResourceNodeRef {
  resourceId: string;
  // Optional override for the on-location label / hint, useful when a
  // category-default resource sits at a flavour-named place.
  label?: string;
  hint?: string;
  // Hide the activity until the condition is satisfied. Used to gate
  // begging behind first meeting a beggar-trainer.
  visibleIf?: Condition;
}

// Crafting recipe. Inputs are consumed, output is added to inventory.
// Crafting always grants xp toward `skill` (5 × requiredMastery).
//
// `requiredMastery` blocks the attempt entirely if the player isn't there yet.
// `usesDropCheck` makes the craft itself a mastery-vs-difficulty test —
// failure consumes ingredients but produces no output (used for art/writing
// recipes where execution is finicky).
//
// `basic` (default false): basic recipes appear at every artisan of the
// matching profession (so the player can buy bread-and-butter recipes
// from any chef, any forge, etc.). Non-basic ("specialty") recipes are
// hand-assigned to specific artisans in lib/world/data/artisans.ts so
// each city/village shop has its own signature offerings.
export interface RecipeDef {
  id: string;
  name: string;
  inputs: { itemId: string; count: number }[];
  output: { itemId: string; count: number };
  skill?: LifeSkill;
  requiredMastery?: 1 | 2 | 3 | 4 | 5;
  usesDropCheck?: boolean;
  description?: string;
  basic?: boolean;
}

// ─── Artisans (craft NPCs) ───────────────────────────────────────────
//
// Mirrors the SectHallDef pattern. Each ArtisanDef anchors a craftsman
// to one location and exposes three player-facing affordances:
//   1. ซื้อสูตร  — buy recipes (recipe id → price). The bought recipe
//                   id is added to WorldStateData.learnedRecipeIds.
//   2. ประดิษฐ์  — craft using ANY learned recipe whose `skill` matches
//                   this artisan's profession (the artisan is the gate;
//                   the popup is where the craftRecipe action fires).
//   3. ซื้อ-ขาย  — sale inventory + the player can sell items in the
//                   listed categories at `sellMultiplier`.
//
// Recipe assembly is data-driven: the artisan's `recipes` array lists
// the *specialty* recipes for sale here. Basic recipes (RecipeDef.basic
// === true) of the same profession are folded in automatically by the
// helper `recipesOfferedBy(artisan)` so authors don't repeat the staple
// list at every shop.

export interface ArtisanRecipeOffer {
  recipeId: string;
  price: number;
}

// Equipment-for-sale offer at an artisan. Each entry pins a price per
// (artisan × equipment) so the same item can cost differently in
// different cities. Equipment ids reference `EQUIPMENT` in
// lib/game/data/equipment.ts.
export interface ArtisanEquipOffer {
  equipId: string;
  price: number;
}

export interface ArtisanDef {
  // Stable id for popup state.
  id: string;
  // Location this artisan lives at — anywhere matching renders the panel.
  locationId: string;
  // Profession — drives which life-skill xp ticks on craft and which of
  // the player's learned recipes can be used at this NPC.
  profession: LifeSkill;
  // Display label shown on the LocationView card and the popup header.
  label: string;
  // The NPC's display name (used inside the popup header).
  npcName: string;
  // Flavor description shown on the LocationView card.
  description: string;
  // Specialty recipes this artisan teaches (in addition to basic recipes
  // for the profession, which are folded in automatically).
  recipes: readonly ArtisanRecipeOffer[];
  // Specialty equipment this artisan stocks (in addition to the basic
  // equipment roster for the profession, which is folded in by
  // `equipmentOfferedBy()`). Each row pins a per-artisan price, so
  // city specialties can be priced higher than basics.
  equipment: readonly ArtisanEquipOffer[];
  // Items the artisan sells over the counter (item ids). Prices come
  // from each ItemDef.price; the artisan does not override them.
  inventory: readonly string[];
  // Categories the artisan will buy back from the player. Empty /
  // undefined means everything.
  acceptsCategories?: readonly ItemCategory[];
  // Multiplier on item.price for sell-back. Typical 0.4 (artisan) vs
  // 0.5 (city general store) — artisans pay a touch less because they
  // specialise.
  sellMultiplier: number;
}

// Pending hunt result — the gather flow stashes this when it kicks off
// a battle so `acknowledgeBattleResult` can drop the spoils on win.
export interface PendingHuntYield {
  resourceId: string;
  returnSceneId: string;
}

// ─── Opponents (for triggerBattle) ─────────────────────────────────────

// Enemy biome category — drives which random-event pool a given location
// pulls from. Cities / villages won't see beasts, wilderness sees more.
export type EnemyCategory = "human" | "beast" | "supernatural";

export const ENEMY_CATEGORY_LABEL: Record<EnemyCategory, string> = {
  human: "ฝ่ายมนุษย์",
  beast: "สัตว์ป่า",
  supernatural: "ผู้พิเศษ",
};

// Opponents are wrapped in a build factory so future encounters can scale
// off flags / story state without mutating a shared object.
export interface OpponentDef {
  id: string;
  name: string;
  // Power tier 0..4. Drives spawn rarity in random-events.ts (higher
  // tier = lower weight) and is shown to the player in the encounter
  // screen so they can decide whether to fight or flee. New opponents
  // default to tier 0 when omitted.
  ti?: 0 | 1 | 2 | 3 | 4;
  // What kind of foe — humans show up in cities, beasts in the wild,
  // supernaturals only in deeper / sect / temple zones.
  category?: EnemyCategory;
  // Drop table — weighted item rolls when the player wins. Two picks for
  // tier 0/1, three for tier 2/3, four for tier 4 (handled in store).
  drops?: readonly ResourceYield[];
  build: () => CharacterBuild;
}

// ─── Live world state (persisted) ──────────────────────────────────────

export interface PendingBattle {
  opponentId: string;
  onWin: string;
  onLose: string;
  // When true, defeat does NOT trigger gameOver — the player is routed to
  // `onLose` and the world resumes. Used for sparring / friendly fights.
  nonFatal?: boolean;
}

// A random-event fight that the player has been offered but not accepted
// yet. The encounter screen renders fight / flee buttons; only on "fight"
// does this become a `pendingBattle`. Cleared on flee or game reset.
export interface PendingEncounter {
  opponentId: string;
  // Where the player was when the encounter rolled — flee returns here,
  // and so do onWin / onLose if they choose to fight.
  returnSceneId: string;
}

// Snapshot data only — actions are added by the store.
export interface WorldStateData {
  hasGame: boolean;

  // World player. Initialized at startNewGame() with STARTER_BUILD; this is
  // the world's *own* character, completely independent of the /debug
  // setup-tab character A. The world can mutate this (level up, equip, etc.)
  // without touching the dev sandbox.
  playerBuild: CharacterBuild | null;

  // Story state.
  currentSceneId: string;
  // The most recently visited LOCATION scene. Updated whenever gotoScene
  // (or auto-advance) lands on a scene with kind === "location". Powers:
  //   - the "ปิด" button on terminal dialogs (returns here)
  //   - the back button on route scenes (default fallback)
  // null only before the player has visited any location.
  lastLocationId: string | null;
  flags: Record<string, boolean | number | string>;
  quests: Record<string, QuestState>;
  inventory: Record<string, number>;
  gold: number;

  // Activity / professions state.
  stamina: number;
  staminaMax: number;

  // Combat persistence — HP / MP carry over between battles. Snapshotted
  // from BattleState.hA / mpA on `acknowledgeBattleResult` and pushed back
  // into the next battle's initial state via the bridge. Max values are
  // computed live from `deriveAll(playerBuild)` and are not stored.
  currentHp: number;
  currentMp: number;
  // xp per life skill — mastery level is derived in lib/world/data/life-skills.
  lifeSkillXp: Record<LifeSkill, number>;

  // Move-skill progression. Every action (gather / craft / fight / etc.)
  // grants a bit of `wExp`, a global pool the player can spend to level up
  // any move skill. Each skill also has its own xp pool that fills only when
  // that skill is used in battle. Per-skill xp auto-levels the skill when
  // it crosses the threshold; w-exp is a shortcut to skip ahead.
  wExp: number;
  // skillId → current level (defaults to 1 when missing).
  skillLevel: Record<string, number>;
  // skillId → accumulated xp toward the next level.
  skillExp: Record<string, number>;
  // Inner-art progression. Parallel to skillExp but per-art. The cost
  // curve is 2× the move-skill cost at the same tier. Levels themselves
  // are stored on `playerBuild.artLevels` (unified with the engine's
  // `artLevels` field on CharacterBuild). Auto-levels on overflow.
  artExp: Record<string, number>;

  // Recipes the player has learned (by id). Crafting requires the
  // recipe to be in this list AND the player to be at an artisan whose
  // profession matches the recipe's `skill`. Recipes are bought at
  // artisans via `buyRecipe`.
  learnedRecipeIds: string[];

  // Equipment the player owns but hasn't equipped yet. Keyed by the
  // Equipment.id (e.g., "eq_t0_w_sword"); count tracks duplicates. The
  // player buys from artisans into this bag, then equips into
  // `playerBuild.equipment` via `equipFromBag` (which moves the id out
  // of this map and into the matching slot, swapping out any
  // currently-equipped id back into the bag).
  inventoryEquipment: Record<string, number>;

  // Passive stat progression. Each base stat has its own xp pool that
  // accrues from a specific activity (STR from physical skills in battle,
  // VIT from gathering, INT from cultural actions, etc.). When the pool
  // crosses 50 × current_base_stat, the stat auto-levels by 1 and the xp
  // overflow rolls into the next tier. See lib/world/stat-progression.ts.
  statExp: Record<StatKey, number>;

  // Character traits / reputation. Adjusted by quest scenes (`addTrait`
  // effect) and sparring results. Does not affect combat, only future
  // quest gating and dialog branches.
  traits: Record<TraitKey, number>;

  // Per-NPC runtime state, keyed by NpcDef.id. Entries are created lazily
  // — missing keys mean the player has never interacted with that NPC.
  npcStates: Record<string, NpcStateEntry>;

  // ─── Quest auto-advance bookkeeping ──────────────────────────────────
  // Counter of opponents the player has defeated. Read by
  // `Condition.defeatedOpponent` and incremented on every win in
  // acknowledgeBattleResult. Pure number per id — no per-day decay.
  defeatedCounts: Record<string, number>;
  // Set of location ids the player has ever entered (any visit counts).
  // Read by `Condition.visitedLocation` and pushed when a location scene
  // is reached. Stored as an array (vs a Set) because Zustand persistence
  // needs JSON-serialisable shapes.
  visitedLocationIds: string[];

  // Game time. Twelve ชั่วยาม per day; `time` is a fractional within-day
  // counter (0 ≤ time < 12) that advances per action and rolls `day` over
  // when it crosses 12.
  day: number;
  time: number;

  // Set when the player loses a fight. The world UI swaps to a game-over
  // screen and the only action available is "เริ่มใหม่" (resetGame).
  gameOver: boolean;

  // Battle seam.
  pendingBattle: PendingBattle | null;
  // Pending fight-or-flee offer (random encounters route through here so
  // the player gets a chance to back out).
  pendingEncounter: PendingEncounter | null;
  // When a hunting gather kicks off a battle, the resource id is stashed
  // here so acknowledgeBattleResult can drop the spoils on win and clear it
  // on lose.
  pendingHuntYield: PendingHuntYield | null;
  // When a sparring match kicks off, the NPC id and the configured fame
  // reward are stashed here. acknowledgeBattleResult grants the reward on
  // win and clears either way. Cleared on game reset.
  pendingSpar: PendingSpar | null;

  // Rolling action log — last 100 player-driven events (rest, gather,
  // craft, shop, travel, combat results, etc.). Pushed by world-store
  // helpers so every UI feedback message lives in one place.
  actionLog: ActionLogEntry[];
}

export interface ActionLogEntry {
  // Game-time when the action happened (day + within-day fraction).
  day: number;
  time: number;
  // Free-form category — used for filtering / icon. e.g. "rest", "gather",
  // "craft", "buy", "sell", "travel", "combat", "learn".
  kind: string;
  // Human-readable Thai message shown in the action-log popup.
  message: string;
}

export interface PendingSpar {
  npcId: string;
  fameReward: number;
}
