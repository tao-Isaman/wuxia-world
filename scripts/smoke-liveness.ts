// One-shot smoke test for the Liveness Layer v0.1.
// Runs the tick + rumor engines against a synthetic 90-day advance and
// asserts the spec's acceptance criteria hold.

import { LORE_RUMORS } from "../lib/world/data/lore-rumors";
import { tickAllNamedNpcs } from "../lib/world/npc-tick";
import {
  generatePlayerEcho,
  maintainRumors,
  selectRumorsForScene,
  RUMOR_POOL_HARD_CAP,
} from "../lib/world/rumor-engine";
import type { WorldStateData, Region } from "../lib/world/types";

function freshState(): WorldStateData {
  return {
    hasGame: true,
    playerBuild: null,
    currentSceneId: "city_capital",
    lastLocationId: "city_capital",
    flags: {},
    quests: {},
    inventory: {},
    gold: 0,
    stamina: 100,
    staminaMax: 100,
    currentHp: 100,
    currentMp: 50,
    lifeSkillXp: {} as never,
    wExp: 0,
    skillLevel: {},
    skillExp: {},
    artExp: {},
    learnedRecipeIds: [],
    inventoryEquipment: {},
    statExp: {} as never,
    traits: { good: 80, evil: 10, arrogance: 20, humility: 60, fame: 30 } as never,
    npcStates: {},
    defeatedCounts: {},
    visitedLocationIds: [],
    stoleFromCounts: {},
    assassinatedNpcIds: [],
    kidnappedNpcIds: [],
    day: 1,
    time: 0,
    pendingBattle: null,
    pendingEncounter: null,
    pendingHuntYield: null,
    pendingSpar: null,
    gameOver: false,
    actionLog: [],
    gender: "male",
    sectMembership: {},
    npcExt: {},
    rumorPool: [],
    rumorArchive: [],
    rumorSeenLog: [],
    lastNpcTickDay: 1,
  };
}

function run() {
  const s = freshState();
  // Seed lore.
  for (const lore of LORE_RUMORS) {
    s.rumorPool.push({
      ...lore,
      id: `lore_${lore.idSuffix}`,
      createdDay: 1,
      expiresDay: Infinity,
    });
  }

  // Simulate 90-day advance, tick at days 7, 14, 21... 90.
  for (let day = 8; day <= 91; day += 7) {
    s.day = day;
    tickAllNamedNpcs(s, { currentDay: day });
    maintainRumors(s, day);
  }

  // Player echo: simulate a duel win
  s.day = 50;
  generatePlayerEcho({
    state: s,
    actionId: "duel_win_named",
    targetNpcId: "sect_shaolin_abbot_huiyuan",
  });

  const events = Object.values(s.npcExt).flatMap((n) => n.eventHistory);
  const innRumors = selectRumorsForScene(s, "heartland" as Region, "inn", 10);

  console.log(`[smoke] 90-day advance summary:`);
  console.log(`  npcExt entries seeded:    ${Object.keys(s.npcExt).length}`);
  console.log(`  total NPC events fired:   ${events.length}`);
  console.log(`  rumor pool active:        ${s.rumorPool.length}`);
  console.log(`  rumor archive:            ${s.rumorArchive.length}`);
  console.log(`  inn rumors @ heartland:   ${innRumors.length}`);
  console.log(`  hard cap enforced:        ${s.rumorPool.length <= RUMOR_POOL_HARD_CAP}`);

  // Acceptance criteria
  const ok = {
    "≥3 NPC events fired": events.length >= 3,
    "≥3 inn rumors visible": innRumors.length >= 3,
    "rumor pool ≤ 500 cap": s.rumorPool.length <= RUMOR_POOL_HARD_CAP,
    "tick advanced lastNpcTickDay": s.lastNpcTickDay >= 80,
  };
  let pass = true;
  for (const [name, val] of Object.entries(ok)) {
    console.log(`  ${val ? "✓" : "✗"} ${name}`);
    if (!val) pass = false;
  }
  if (!pass) process.exit(1);
}

run();
