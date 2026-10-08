// The world store's blank state, the starter hero, the per-action draft copy
// and the player-visible action log.
import { type CharacterBuild, type StatKey, STAT_KEYS } from "@/lib/game";
import { LIFE_SKILL_KEYS, START_SCENE_ID, TRAIT_KEYS, type LifeSkill, type TraitKey, type WorldStateData } from "@/lib/world";

// ─── Starter build ─────────────────────────────────────────────────────
// All stats at 1, single basic_punch skill, no art, no equipment.
// This is the world's standalone player template — completely independent
// of the /debug setup-tab character. Future progression mutates this build
// in the world store, not in character-store.
// Flat max HP the world hero starts with (CharacterBuild.baseHp): stats of 1
// give only 33 HP, two hits from a ขโมยน้อย. Back-filled on load.
export const HERO_BASE_HP = 100;

export const STARTER_BUILD = (): CharacterBuild => ({
  name: "ผู้กล้า",
  baseHp: HERO_BASE_HP,
  stats: { STR: 1, AGI: 1, POW: 1, VIT: 1, DEX: 1, LUK: 1, DEF: 1, INT: 1 },
  artId: "none",
  artLevel: 1,
  skillIds: ["basic_punch", null, null, null, null, null, null, null, null, null],
  equipment: {
    W: null, A: null, H: null, B: null,
    BR: [null, null], R: [null, null], C: [null, null],
  },
  learnedSkillIds: ["basic_punch"],
  learnedArtIds: [],
  artLevels: {},
});

export const STARTER_STAMINA = 100;

export const emptyLifeSkillXp = (): Record<LifeSkill, number> =>
  Object.fromEntries(LIFE_SKILL_KEYS.map((k) => [k, 0])) as Record<LifeSkill, number>;

export const emptyStatExp = (): Record<StatKey, number> =>
  Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Record<StatKey, number>;

export const emptyTraits = (): Record<TraitKey, number> =>
  Object.fromEntries(TRAIT_KEYS.map((k) => [k, 0])) as Record<TraitKey, number>;

export const emptyData = (): WorldStateData => ({
  hasGame: false,
  playerBuild: null,
  currentSceneId: START_SCENE_ID,
  lastLocationId: null,
  flags: {},
  quests: {},
  inventory: {},
  gold: 0,
  stamina: STARTER_STAMINA,
  staminaMax: STARTER_STAMINA,
  currentHp: 0,
  currentMp: 0,
  lifeSkillXp: emptyLifeSkillXp(),
  wExp: 0,
  skillLevel: {},
  skillExp: {},
  artExp: {},
  meridianPoints: 0,
  learnedRecipeIds: [],
  inventoryEquipment: {},
  statExp: emptyStatExp(),
  traits: emptyTraits(),
  npcStates: {},
  defeatedCounts: {},
  visitedLocationIds: [],
  stoleFromCounts: {},
  assassinatedNpcIds: [],
  kidnappedNpcIds: [],
  kidnappedUntil: {},
  giftDays: {},
  letters: [],
  letterDays: {},
  tournament: null,
  tournamentHistory: [],
  activityDays: {},
  bossDefeatedDay: {},
  worldSeed: 0,
  worldEventLog: [],
  day: 1,
  time: 0,
  pendingBattle: null,
  pendingEncounter: null,
  pendingHuntYield: null,
  pendingSpar: null,
  gameOver: false,
  actionLog: [],
  gender: "male",
  playerBodyId: "m1",
  sectMembership: {},
  // Liveness Layer (NPC sim + rumors). v18+. Defaults are empty —
  // npcExt seeds lazily on first tickAllNamedNpcs from authored roster.
  npcExt: {},
  rumorPool: [],
  rumorArchive: [],
  rumorSeenLog: [],
  lastNpcTickDay: 1,
  wanted: 0,
  wantedDay: 1,
  lawEvasions: 0,
  jailCityId: null,
  jailUntil: null,
});

// Append a player-action entry to the rolling log. Keeps the most recent
// 100. Mutates `state` in place so it's safe to call from inside a draft
// before the final `set({ ...draft })`.
export const ACTION_LOG_MAX = 100;
export function appendActionLog(state: WorldStateData, kind: string, message: string): void {
  const entry = { day: state.day, time: state.time, kind, message };
  const next = [...state.actionLog, entry];
  if (next.length > ACTION_LOG_MAX) next.splice(0, next.length - ACTION_LOG_MAX);
  state.actionLog = next;
}

// Every action starts on the world clock: draftFrom brings its copy up to
// the real time (syncClock in ./lifecycle, which registers itself here so
// this module needs no import of it).
let onDraft: ((draft: WorldStateData) => void) | null = null;
export function setDraftClock(fn: (draft: WorldStateData) => void): void {
  onDraft = fn;
}

/** Who did it, for world events and the news (the hero's name; a player id once online). */
export function heroTag(state: WorldStateData): string {
  return state.playerBuild?.name ?? "player";
}

// Shallow-clone the data fields so the persisted slice picks up the change,
// then sync the copy to the world clock.
export function draftFrom(s: WorldStateData): WorldStateData {
  const draft = copyData(s);
  onDraft?.(draft);
  return draft;
}

function copyData(s: WorldStateData): WorldStateData {
  return {
    hasGame: s.hasGame,
    playerBuild: s.playerBuild,
    currentSceneId: s.currentSceneId,
    lastLocationId: s.lastLocationId,
    flags: { ...s.flags },
    quests: { ...s.quests },
    inventory: { ...s.inventory },
    gold: s.gold,
    stamina: s.stamina,
    staminaMax: s.staminaMax,
    currentHp: s.currentHp,
    currentMp: s.currentMp,
    lifeSkillXp: { ...s.lifeSkillXp },
    wExp: s.wExp,
    skillLevel: { ...s.skillLevel },
    skillExp: { ...s.skillExp },
    artExp: { ...s.artExp },
    meridianPoints: s.meridianPoints,
    learnedRecipeIds: [...s.learnedRecipeIds],
    inventoryEquipment: { ...s.inventoryEquipment },
    statExp: { ...s.statExp },
    traits: { ...s.traits },
    npcStates: { ...s.npcStates },
    defeatedCounts: { ...s.defeatedCounts },
    visitedLocationIds: [...s.visitedLocationIds],
    stoleFromCounts: { ...s.stoleFromCounts },
    assassinatedNpcIds: [...s.assassinatedNpcIds],
    kidnappedNpcIds: [...s.kidnappedNpcIds],
    kidnappedUntil: { ...s.kidnappedUntil },
    giftDays: { ...s.giftDays },
    letters: [...s.letters],
    letterDays: { ...s.letterDays },
    tournament: s.tournament,
    tournamentHistory: [...s.tournamentHistory],
    activityDays: { ...s.activityDays },
    bossDefeatedDay: { ...(s.bossDefeatedDay ?? {}) },
    worldSeed: s.worldSeed ?? 0,
    worldEventLog: s.worldEventLog ?? [],
    day: s.day,
    time: s.time,
    pendingBattle: s.pendingBattle,
    pendingEncounter: s.pendingEncounter,
    pendingHuntYield: s.pendingHuntYield,
    pendingSpar: s.pendingSpar,
    gameOver: s.gameOver,
    actionLog: [...s.actionLog],
    gender: s.gender,
    playerBodyId: s.playerBodyId,
    sectMembership: { ...s.sectMembership },
    // v18+: Liveness Layer
    npcExt: { ...s.npcExt },
    rumorPool: [...s.rumorPool],
    rumorArchive: [...s.rumorArchive],
    rumorSeenLog: [...s.rumorSeenLog],
    lastNpcTickDay: s.lastNpcTickDay,
    wanted: s.wanted ?? 0,
    wantedDay: s.wantedDay ?? s.day,
    lawEvasions: s.lawEvasions ?? 0,
    jailCityId: s.jailCityId ?? null,
    jailUntil: s.jailUntil ?? null,
  };
}
