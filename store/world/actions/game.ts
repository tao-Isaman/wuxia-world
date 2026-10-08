// A new game, a reset, heard rumors and the debug helpers.
import { deriveAll } from "@/lib/game";
import { useBattleStore } from "@/store/battle-store";
import { applyEffects, getScene, START_SCENE_ID, heroBodyFor } from "@/lib/world";
import { fadeHeardRumor, RUMOR_SEEN_CAP } from "@/lib/world/rumor-engine";
import { sharedSlice } from "@/lib/world/shared/world";
import type { WorldStateData } from "@/lib/world";
import { joinSharedWorld } from "../shared-local";
import { followAutoAdvance } from "../navigation";
import { syncPlayerSkillLevels } from "../progression";
import { STARTER_BUILD, draftFrom, emptyData } from "../state";
import { HOURS_PER_DAY, worldNow } from "@/lib/world/clock";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const gameActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "syncClock" | "startNewGame" | "resetGame" | "recordRumorHeard" | "_setFlag" | "_giveGold"> => ({
  syncClock: () => {
    const s = get();
    // draftFrom brings the copy up to the world clock; skip the write when
    // less than a tenth of a ชั่วยาม (30 s) has passed.
    const draft = draftFrom(s);
    if (draft.day === s.day && draft.time - s.time < 0.1) return 0;
    set({ ...draft });
    return s.hasGame ? Math.floor(draft.day + draft.time / HOURS_PER_DAY - (s.day + s.time / HOURS_PER_DAY)) : 0;
  },

  startNewGame: (opts) => {
    // A new hero enters the world as it is now (lib/world/clock.ts): the same
    // shared world, its people, deaths and rumors (lib/world/shared/world.ts).
    const fresh: WorldStateData = opts?.newWorld ? emptyData() : { ...emptyData(), ...sharedSlice(get()) };
    const start = worldNow();
    fresh.day = start.day;
    fresh.time = start.time;
    fresh.wantedDay = start.day;
    joinSharedWorld(fresh, null);
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
    set({ ...fresh });
    // Run start scene's onEnter + auto-advance through any chained scenes.
    const draft = draftFrom(get());
    const startScene = getScene(START_SCENE_ID);
    if (startScene?.onEnter) applyEffects(draft, startScene.onEnter);
    followAutoAdvance(draft);
    set({ ...draft });
  },

  resetGame: () => {
    // Also tear down any in-flight battle so nothing dangles after wipe.
    useBattleStore.getState().reset();
    // The hero is gone; the world they lived in goes on.
    set({ ...emptyData(), ...sharedSlice(get()) });
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
