// How the world store meets localStorage: what is saved (partializeSave), how
// an old save is brought up to date (migrateSave) and the load-time merge.
// See docs/save-format.md.
import { type CharacterBuild, type StatKey, deriveAll, encodeArtSlot, placeInFirstEmpty } from "@/lib/game";
import type { LifeSkill, TraitKey, WorldStateData } from "@/lib/world";
import { seedLiveness } from "@/lib/world/npc-life";
import { seedLoreRumors } from "@/lib/world/rumor-engine";
import { reviveFromDeath } from "./lifecycle";
import { ACTION_LOG_MAX, HERO_BASE_HP, STARTER_STAMINA, emptyData, emptyLifeSkillXp, emptyStatExp, emptyTraits } from "./state";
import type { WorldStore } from "./types";
import { SHARED_WORLD_KEYS, type SharedWorldKey } from "@/lib/world/shared/world";
import { rebaseDays } from "@/lib/world/shared/rebase";
import { worldNow } from "@/lib/world/clock";

// Content backfill also runs for current-version saves (migrate does not).
// Keep the standard shallow merge. A v27 save carries no shared world, so the
// one in memory stays (at boot an empty one, replaced by the stored world in
// attachSharedWorld, store/world/shared-local.ts); add only missing lore and
// people.
export function mergeSave(persisted: unknown, current: WorldStore): WorldStore {
  const merged = { ...current, ...(persisted as Partial<WorldStateData>) };
  // A save that still carries world fields (an older save, migrated, or one
  // edited by hand) hands them to the world when it joins.
  carriedWorldKeys = persisted && typeof persisted === "object"
    ? SHARED_WORLD_KEYS.filter((key) => key in persisted)
    : [];
  if (merged.hasGame) {
    // An empty world starts on the save's day, not at day 1.
    if (Object.keys(merged.npcExt ?? {}).length === 0) merged.lastNpcTickDay = merged.day;
    seedLoreRumors(merged);
    // Liveness 2.0: complete older saves' people and register generated ones.
    seedLiveness(merged);
  }
  // Saves from when death ended the game: the hero wakes at home instead.
  if (merged.hasGame && merged.gameOver) merged.lastDeath = { lines: reviveFromDeath(merged) };
  if (merged.playerBuild && merged.playerBuild.baseHp === undefined) {
    merged.playerBuild = { ...merged.playerBuild, baseHp: HERO_BASE_HP };
    if (typeof merged.currentHp === "number") merged.currentHp += HERO_BASE_HP;
  }
  return merged;
}

let carriedWorldKeys: SharedWorldKey[] = [];
/** The shared fields the last loaded save carried itself (read once, by attachSharedWorld). */
export function takeCarriedWorldKeys(): SharedWorldKey[] {
  const keys = carriedWorldKeys;
  carriedWorldKeys = [];
  return keys;
}

/** What the player's save holds: everything but the shared world. */
export type PlayerSave = Omit<WorldStateData, SharedWorldKey>;

// Only persist the player's data fields, not the action functions and not the
// shared world (lib/world/shared/world.ts, saved by its WorldService). Typed
// as PlayerSave, so a field added to WorldStateData and forgotten here (or a
// stray one) is a type error.
export const partializeSave = (s: WorldStore): PlayerSave => ({
  hasGame: s.hasGame,
  playerBuild: s.playerBuild,
  gender: s.gender,
  playerBodyId: s.playerBodyId,
  sectMembership: s.sectMembership,
  currentSceneId: s.currentSceneId,
  lastLocationId: s.lastLocationId,
  flags: s.flags,
  quests: s.quests,
  inventory: s.inventory,
  gold: s.gold,
  stamina: s.stamina,
  staminaMax: s.staminaMax,
  currentHp: s.currentHp,
  currentMp: s.currentMp,
  lifeSkillXp: s.lifeSkillXp,
  wExp: s.wExp,
  skillLevel: s.skillLevel,
  skillExp: s.skillExp,
  artExp: s.artExp,
  meridianPoints: s.meridianPoints,
  learnedRecipeIds: s.learnedRecipeIds,
  inventoryEquipment: s.inventoryEquipment,
  statExp: s.statExp,
  traits: s.traits,
  npcStates: s.npcStates,
  defeatedCounts: s.defeatedCounts,
  visitedLocationIds: s.visitedLocationIds,
  stoleFromCounts: s.stoleFromCounts,
  giftDays: s.giftDays,
  letters: s.letters,
  letterDays: s.letterDays,
  activityDays: s.activityDays,
  day: s.day,
  time: s.time,
  pendingBattle: s.pendingBattle,
  pendingEncounter: s.pendingEncounter,
  pendingHuntYield: s.pendingHuntYield,
  pendingSpar: s.pendingSpar,
  gameOver: s.gameOver,
  actionLog: s.actionLog,
  // v18+: what the hero heard (the rumors themselves are the world's).
  rumorSeenLog: s.rumorSeenLog,
  wanted: s.wanted,
  wantedDay: s.wantedDay,
  lawEvasions: s.lawEvasions,
  jailCityId: s.jailCityId,
  jailUntil: s.jailUntil,
});

// Migrations:
//   v1 → v2 added stamina/staminaMax/lifeSkillXp(6)/pendingHuntYield.
//   v2 → v3 grew lifeSkillXp from 6 → 17 keys.
//   v3 → v4 added day/time. Both default to 1/0 — players returning
//           after this update find themselves on day 1 morning.
//   v4 → v5 added wExp / skillLevel / skillExp. Existing skills default
//           to level 1 (the new nerfed baseline) with empty xp pools.
//   v5 → v6 added statExp pools (one per StatKey). Existing players
//           start with empty pools and grow stats from there.
//   v6 → v7 added traits + npcStates + pendingSpar. Existing players
//           start with all-zero traits and no NPC interactions.
//   v7 → v8 added currentHp / currentMp. Existing players are seeded
//           at full HP/MP from deriveAll(playerBuild).
//   v8 → v9 expanded skillIds 5 → 10 slots; added learnedSkillIds /
//           learnedArtIds / artLevels. Existing slotted skills + the
//           active art are seeded into the learned arrays.
//   v9 → v10 added pendingEncounter. Existing saves default null.
//   v10 → v11 added actionLog. Existing saves start with empty log.
//   v11 → v12 added defeatedCounts + visitedLocationIds (quest auto-
//            advance bookkeeping). Existing saves start empty — quest
//            progress that depended on past kills/visits won't auto-
//            backfill, which is fine for net-new content.
//   v12 → v13 added artExp (per-art xp pool, parallel to skillExp).
//            Existing saves start with empty pools — arts the player
//            already learned keep their existing artLevels and grow
//            from there.
//   v13 → v14 added learnedRecipeIds + accessory life-skill key.
//            Crafting now requires the recipe to be in
//            learnedRecipeIds AND the player to be at an artisan
//            of the matching profession (forge / alchemy /
//            tailoring / chef / jewelry / accessory). Existing
//            saves start with no recipes learned — players have to
//            buy them at city / village / sect artisans.
//   v14 → v15 added inventoryEquipment (bag for purchased gear).
//            Equipment items can now be bought at artisans into
//            this bag and equipped via `equipFromBag` /
//            `unequipFromSlot`. Existing saves start with an
//            empty bag.
//   v15 → v16 added stoleFromCounts / assassinatedNpcIds /
//            kidnappedNpcIds (bad-action ledgers) plus the "steal"
//            life-skill key. Existing saves start empty.
//   v16 → v17 added gender + sectMembership (the membership `status`
//            field came later without a bump; missing = "active").
//   v17 → v18 added Liveness Layer fields: npcExt (per-named-NPC
//            sim state), rumorPool / rumorArchive / rumorSeenLog,
//            lastNpcTickDay. Existing saves start with all fields
//            empty — npcExt seeds lazily on first tick from the
//            authored roster in lib/world/data/named-npcs.ts.
//   v18 → v19 added playerBodyId (defaults by gender).
//   v19 → v20 added wanted / wantedDay / jailCityId (law).
//   v20 → v21 added jailUntil (the jail map sentence).
//   v23 → v24 added meridianPoints (ชีพจร) and playerBuild.meridians.
//   v24 → v25 added lawEvasions.
//   v25 → v26 added bossDefeatedDay (legendary beasts, data/bosses.ts).
//   v26 → v27 put the save on the world clock (lib/world/clock.ts): every day
//            stamp is shifted so `day` is the world's day now (rebaseDays),
//            and the shared world (npcExt, rumors, bosses, tournament…)
//            moved out of the save into its own key (WorldService).
// Despite the list, `migrate` is one idempotent normalizer: it ignores
// fromVersion and fills every missing field. See docs/save-format.md.
export function migrateSave(persisted: unknown, fromVersion: number): WorldStateData {
  const p = (persisted ?? {}) as Partial<WorldStateData>;
  // v27: a save that counted its own days joins the world clock. Only this
  // step reads fromVersion; it must run once, as it shifts every stamp.
  if (fromVersion < 27 && p.hasGame && typeof p.day === "number") {
    rebaseDays(p, worldNow().day - p.day);
  }
  // Pad the build's skillIds to 10 and back-fill learned arrays.
  if (p.playerBuild) {
    const b = p.playerBuild as CharacterBuild;
    const slots = Array.isArray(b.skillIds) ? [...b.skillIds] : [];
    while (slots.length < 10) slots.push(null);
    // learnedSkillIds: only count entries that are bare skill ids
    // (skip "art:" prefixed entries, which would be art slots).
    const learnedSkillIds =
      b.learnedSkillIds ??
      (slots.filter(
        (s): s is string => typeof s === "string" && !s.startsWith("art:"),
      ) as readonly string[]);
    const learnedArtIds =
      b.learnedArtIds ??
      (b.artId && b.artId !== "none"
        ? ([b.artId] as readonly string[])
        : []);
    const artLevels =
      b.artLevels ??
      (b.artId && b.artId !== "none"
        ? { [b.artId]: b.artLevel }
        : {});
    // Auto-slot the legacy artId into a free slot so the player can
    // actually use it under the new unified-slot system.
    if (
      b.artId &&
      b.artId !== "none" &&
      !slots.some((s) => s === encodeArtSlot(b.artId))
    ) {
      placeInFirstEmpty(slots, encodeArtSlot(b.artId));
    }
    p.playerBuild = {
      ...b,
      skillIds: slots,
      learnedSkillIds,
      learnedArtIds,
      artLevels,
    };
  }
  const seedHpMp =
    p.playerBuild ? deriveAll(p.playerBuild as CharacterBuild) : null;
  const out: WorldStateData = {
    ...emptyData(),
    ...p,
    stamina: typeof p.stamina === "number" ? p.stamina : STARTER_STAMINA,
    staminaMax: typeof p.staminaMax === "number" ? p.staminaMax : STARTER_STAMINA,
    currentHp:
      typeof p.currentHp === "number" && p.currentHp >= 0
        ? p.currentHp
        : seedHpMp?.HP ?? 0,
    currentMp:
      typeof p.currentMp === "number" && p.currentMp >= 0
        ? p.currentMp
        : seedHpMp?.MP ?? 0,
    lifeSkillXp: { ...emptyLifeSkillXp(), ...(p.lifeSkillXp ?? {}) } as Record<LifeSkill, number>,
    wExp: typeof p.wExp === "number" && p.wExp >= 0 ? p.wExp : 0,
    skillLevel: p.skillLevel && typeof p.skillLevel === "object" ? { ...p.skillLevel } : {},
    skillExp: p.skillExp && typeof p.skillExp === "object" ? { ...p.skillExp } : {},
    artExp: p.artExp && typeof p.artExp === "object" ? { ...p.artExp } : {},
    // v24: meridian points (charts live on playerBuild.meridians).
    meridianPoints:
      typeof p.meridianPoints === "number" && Number.isFinite(p.meridianPoints) && p.meridianPoints >= 0
        ? Math.floor(p.meridianPoints)
        : 0,
    learnedRecipeIds: Array.isArray(p.learnedRecipeIds)
      ? [...p.learnedRecipeIds]
      : [],
    inventoryEquipment:
      p.inventoryEquipment && typeof p.inventoryEquipment === "object"
        ? { ...p.inventoryEquipment }
        : {},
    statExp: { ...emptyStatExp(), ...(p.statExp ?? {}) } as Record<StatKey, number>,
    traits: { ...emptyTraits(), ...(p.traits ?? {}) } as Record<TraitKey, number>,
    npcStates: p.npcStates && typeof p.npcStates === "object" ? { ...p.npcStates } : {},
    defeatedCounts:
      p.defeatedCounts && typeof p.defeatedCounts === "object"
        ? { ...p.defeatedCounts }
        : {},
    visitedLocationIds: Array.isArray(p.visitedLocationIds)
      ? [...p.visitedLocationIds]
      : [],
    stoleFromCounts:
      p.stoleFromCounts && typeof p.stoleFromCounts === "object"
        ? { ...p.stoleFromCounts }
        : {},
    assassinatedNpcIds: Array.isArray(p.assassinatedNpcIds)
      ? [...p.assassinatedNpcIds]
      : [],
    kidnappedNpcIds: Array.isArray(p.kidnappedNpcIds)
      ? [...p.kidnappedNpcIds]
      : [],
    kidnappedUntil: p.kidnappedUntil && typeof p.kidnappedUntil === "object" ? { ...p.kidnappedUntil } : {},
    giftDays: p.giftDays && typeof p.giftDays === "object" ? { ...p.giftDays } : {},
    // v23: letters from friends and the yearly sword tournament.
    letters: Array.isArray(p.letters) ? [...p.letters] : [],
    letterDays: p.letterDays && typeof p.letterDays === "object" ? { ...p.letterDays } : {},
    tournament: p.tournament && typeof p.tournament === "object" ? p.tournament : null,
    tournamentHistory: Array.isArray(p.tournamentHistory) ? [...p.tournamentHistory] : [],
    activityDays: p.activityDays && typeof p.activityDays === "object" ? { ...p.activityDays } : {},
    // v26: when each legendary beast last fell.
    bossDefeatedDay: p.bossDefeatedDay && typeof p.bossDefeatedDay === "object" ? { ...p.bossDefeatedDay } : {},
    day: typeof p.day === "number" && p.day >= 1 ? p.day : 1,
    time: typeof p.time === "number" && p.time >= 0 ? p.time : 0,
    pendingHuntYield: p.pendingHuntYield ?? null,
    pendingSpar: p.pendingSpar ?? null,
    pendingEncounter: p.pendingEncounter ?? null,
    gameOver: p.gameOver === true,
    actionLog: Array.isArray(p.actionLog) ? p.actionLog.slice(-ACTION_LOG_MAX) : [],
    gender: p.gender === "female" ? "female" : "male",
    // v19+: selected body sprite; default by gender for old saves.
    playerBodyId:
      typeof p.playerBodyId === "string" && p.playerBodyId
        ? p.playerBodyId
        : p.gender === "female"
          ? "f1"
          : "m1",
    sectMembership:
      p.sectMembership && typeof p.sectMembership === "object"
        ? { ...p.sectMembership }
        : {},
    // v18+: Liveness Layer
    npcExt: p.npcExt && typeof p.npcExt === "object" ? { ...p.npcExt } : {},
    rumorPool: Array.isArray(p.rumorPool) ? [...p.rumorPool] : [],
    rumorArchive: Array.isArray(p.rumorArchive) ? [...p.rumorArchive] : [],
    rumorSeenLog: Array.isArray(p.rumorSeenLog) ? [...p.rumorSeenLog] : [],
    lastNpcTickDay:
      typeof p.lastNpcTickDay === "number" && p.lastNpcTickDay >= 1
        ? p.lastNpcTickDay
        : (typeof p.day === "number" && p.day >= 1 ? p.day : 1),
    // v20+: wanted marks / jail
    wanted: typeof p.wanted === "number" ? Math.max(0, Math.floor(p.wanted)) : 0,
    // v25+: escapes from the law since the last sentence
    lawEvasions: typeof p.lawEvasions === "number" ? Math.max(0, Math.floor(p.lawEvasions)) : 0,
    wantedDay: typeof p.wantedDay === "number" ? p.wantedDay : (typeof p.day === "number" ? p.day : 1),
    jailCityId: typeof p.jailCityId === "string" ? p.jailCityId : null,
    // v21+: imprisonment lock
    jailUntil: typeof p.jailUntil === "number" ? p.jailUntil : null,
  };
  return out;
}
