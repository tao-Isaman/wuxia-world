// A new game, a reset, heard rumors and the debug helpers.
import { deriveAll } from "@/lib/game";
import { useBattleStore } from "@/store/battle-store";
import { applyEffects, getScene, START_SCENE_ID, heroBodyFor } from "@/lib/world";
import { seedLiveness } from "@/lib/world/npc-life";
import { fadeHeardRumor, seedLoreRumors, RUMOR_SEEN_CAP } from "@/lib/world/rumor-engine";
import { followAutoAdvance } from "../navigation";
import { syncPlayerSkillLevels } from "../progression";
import { STARTER_BUILD, draftFrom, emptyData } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const gameActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "startNewGame" | "resetGame" | "recordRumorHeard" | "_setFlag" | "_giveGold"> => ({
  startNewGame: (opts) => {
    const fresh = emptyData();
    fresh.hasGame = true;
    const build = STARTER_BUILD();
    if (opts?.name && opts.name.trim()) build.name = opts.name.trim();
    fresh.playerBuild = build;
    fresh.gender = opts?.gender ?? "male";
    fresh.playerBodyId = heroBodyFor(opts?.bodyId, fresh.gender);
    fresh.currentSceneId = START_SCENE_ID;
    // Seed level 1 for the starter skill so the UI has an entry to
    // display from turn one.
    for (const sid of fresh.playerBuild.skillIds) {
      if (sid) fresh.skillLevel[sid] = 1;
    }
    syncPlayerSkillLevels(fresh);
    // Start at full HP / MP — both are derived from the player build's
    // VIT / DEF / POW / INT and snapshotted here so the bar reads right
    // before the player ever enters a fight.
    const d = deriveAll(fresh.playerBuild);
    fresh.currentHp = d.HP;
    fresh.currentMp = d.MP;
    seedLoreRumors(fresh);
    // The thirty simulated people start the game where they live.
    seedLiveness(fresh);
    set({ ...fresh });
    // Run start scene's onEnter + auto-advance through any chained scenes.
    const draft = draftFrom(get());
    const start = getScene(START_SCENE_ID);
    if (start?.onEnter) applyEffects(draft, start.onEnter);
    followAutoAdvance(draft);
    set({ ...draft });
  },

  resetGame: () => {
    // Also tear down any in-flight battle so nothing dangles after wipe.
    useBattleStore.getState().reset();
    set({ ...emptyData() });
  },

  recordRumorHeard: (rumorId) => {
    const s = get();
    const log = [...(s.rumorSeenLog ?? [])];
    // Idempotent — same rumor recorded twice is a no-op so the
    // selection's de-prioritisation logic doesn't get confused by
    // duplicates.
    if (log.some((entry) => entry.rumorId === rumorId)) return;
    log.push({
      rumorId,
      dayHeard: s.day,
      location: s.lastLocationId ?? s.currentSceneId,
    });
    // Cap matches RUMOR_SEEN_CAP — drop oldest first (FIFO).
    while (log.length > RUMOR_SEEN_CAP) log.shift();
    // Heard news fades: it lasts at most RUMOR_HEARD_DAYS more.
    set({ rumorSeenLog: log, rumorPool: fadeHeardRumor(s.rumorPool ?? [], rumorId, s.day) });
  },

  _setFlag: (flag, value) =>
    set((s) => ({ flags: { ...s.flags, [flag]: value } })),

  _giveGold: (amount) => set((s) => ({ gold: Math.max(0, s.gold + amount) })),
});
