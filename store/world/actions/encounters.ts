// Walk ticks, foes on the map and the fight-or-flee screen; the last death's report.
import { getNpc, getOpponent, getScene, type WorldStateData } from "@/lib/world";
import { bossAlive, getBoss } from "@/lib/world/data/bosses";
import { rollFoeSpawn, rollWalkEvent } from "@/lib/world/effects";
import { isLawOpponent } from "@/lib/world/law";
import { JAIL_SCENE_ID } from "@/lib/world/data/activities";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

// A random encounter promoted to a battle. Law pursuers are non-fatal:
// losing to them ends in their city's jail (the jail_cell scene), not death.
export function encounterBattle(opponentId: string, returnSceneId: string): NonNullable<WorldStateData["pendingBattle"]> {
  if (isLawOpponent(opponentId)) return { opponentId, onWin: returnSceneId, onLose: "jail_cell", nonFatal: true, withPack: true };
  return { opponentId, onWin: returnSceneId, onLose: returnSceneId, withPack: true };
}

// ─── Walk ticks ────────────────────────────────────────────────────────
// Random events roll while the player walks: every WALK_TICK_UNITS of map
// distance (lib/stage/types.ts) is one tick at WALK_TICK_CHANCE of the old per-trip odds, so a
// map crossing (~2–3 ticks) feels like the old one roll per trip — but it
// can happen anywhere along the way. The player's home is safe ground.
export const WALK_TICK_CHANCE = 0.4;
export const SAFE_SCENES = new Set(["home_player", JAIL_SCENE_ID]);
export let foeSerial = 0;
/** Test/QA switch: localStorage["wuxia-random-events"] = "off" disables walk events. */
export function walkEventsDisabled(): boolean {
  try { return typeof localStorage !== "undefined" && localStorage.getItem("wuxia-random-events") === "off"; } catch { return false; }
}

export const encountersActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "acceptEncounter" | "walkTick" | "roamingFoes" | "engageFoe" | "engageBoss" | "fleeEncounter" | "lastDeath" | "dismissDeath"> => ({
  acceptEncounter: () => {
    const s = get();
    if (!s.pendingEncounter || s.pendingBattle) return;
    const enc = s.pendingEncounter;
    const opp = getOpponent(enc.opponentId);
    if (!opp) {
      set({ pendingEncounter: null });
      return;
    }
    // Stage as a real battle. The bridge picks this up and starts
    // the fight; on resolution acknowledgeBattleResult routes back
    // to the encounter's returnSceneId.
    set({
      pendingEncounter: null,
      pendingBattle: encounterBattle(enc.opponentId, enc.returnSceneId),
    });
  },

  walkTick: (pickSpot) => {
    const s = get();
    if (!s.hasGame || s.gameOver || s.pendingBattle || s.pendingEncounter || walkEventsDisabled()) return;
    const scene = getScene(s.currentSceneId);
    if (!scene || (scene.kind !== "location" && scene.kind !== "route")) return;
    // Safe ground: no foes, no law.
    if (SAFE_SCENES.has(scene.id)) return;
    // Foes only wait on the map they appeared on.
    const here = s.roamingFoes.filter((foe) => foe.locationId === scene.id);
    const draft = draftFrom(s);
    rollWalkEvent(draft, WALK_TICK_CHANCE);
    if (draft.pendingBattle?.ambushNpcId) {
      appendActionLog(draft, "law", `${getNpc(draft.pendingBattle.ambushNpcId)?.name ?? "ผู้ไม่ประสงค์ออกนาม"}ลอบโจมตีหมายจับตัวส่งทางการ!`);
      set({ ...draft, roamingFoes: here });
      return;
    }
    if (draft.pendingEncounter) {
      if (isLawOpponent(draft.pendingEncounter.opponentId)) {
        appendActionLog(draft, "encounter", `ถูกตามจับ! หมายจับ ${draft.wanted}`);
      }
      set({ ...draft, roamingFoes: here });
      return;
    }
    const opponentId = pickSpot ? rollFoeSpawn(draft, here.length) : null;
    const spot = opponentId ? pickSpot!() : null;
    if (opponentId && spot) {
      set({ roamingFoes: [...here, { id: `foe${++foeSerial}`, opponentId, locationId: scene.id, x: spot.x, y: spot.y }] });
    } else if (here.length !== s.roamingFoes.length) {
      set({ roamingFoes: here });
    }
  },

  roamingFoes: [],

  engageFoe: (foeId) => {
    const s = get();
    const foe = s.roamingFoes.find((f) => f.id === foeId);
    if (!foe) return;
    const roamingFoes = s.roamingFoes.filter((f) => f.id !== foeId);
    if (s.pendingBattle || s.pendingEncounter || foe.locationId !== s.currentSceneId) { set({ roamingFoes }); return; }
    // Face it on the fight-or-flee screen; either way it is gone from the map.
    const draft = draftFrom(s);
    draft.pendingEncounter = { opponentId: foe.opponentId, returnSceneId: s.currentSceneId };
    set({ ...draft, roamingFoes });
  },

  engageBoss: (bossId) => {
    const s = get();
    const boss = getBoss(bossId);
    if (!boss || s.pendingBattle || s.pendingEncounter || boss.lair !== s.currentSceneId || !bossAlive(s, bossId)) return;
    // Its minions always come with it (encounterBattle sets withPack).
    set({ pendingEncounter: { opponentId: boss.id, returnSceneId: s.currentSceneId } });
  },

  fleeEncounter: () => {
    const s = get();
    if (!s.pendingEncounter) return;
    // Hunter encounters (opponentId starts with `hunter_`) require an
    // AGI + LUK check to flee — the hunter is hand-picked to chase
    // YOU, not just a random bandit. Formula: 30% base + (AGI+LUK)/2%.
    // Cap 90% so a maxed-out player still has a small fail chance.
    // Fail → forced into the fight (promote to pendingBattle).
    const oppId = s.pendingEncounter.opponentId;
    if (oppId.startsWith("hunter_") || isLawOpponent(oppId)) {
      const stats = s.playerBuild?.stats;
      const agi = stats?.AGI ?? 0;
      const luk = stats?.LUK ?? 0;
      const chance = Math.min(90, 30 + (agi + luk) / 2);
      const roll = Math.random() * 100;
      if (roll >= chance) {
        // Failed flee — fight is forced. Promote the encounter to
        // a pendingBattle so the bridge spawns the hunter fight.
        // onWin/onLose route back to the location the player rolled
        // the encounter at (matches the normal accept-encounter flow).
        const draft = draftFrom(s);
        appendActionLog(draft, "encounter", `หนีนักล่าไม่สำเร็จ (${chance.toFixed(0)}% สำเร็จ) — ต้องสู้`);
        const back = s.pendingEncounter.returnSceneId;
        draft.pendingBattle = encounterBattle(oppId, back);
        draft.pendingEncounter = null;
        set({ ...draft });
        return;
      }
      // Successful flee — log it and clear. Slipping the law counts.
      const draft = draftFrom(s);
      appendActionLog(draft, "encounter", `หนีนักล่าสำเร็จ (${chance.toFixed(0)}%)`);
      if (isLawOpponent(oppId)) draft.lawEvasions = (draft.lawEvasions ?? 0) + 1;
      draft.pendingEncounter = null;
      set({ ...draft });
      return;
    }
    // Normal encounter — flee is free.
    set({ pendingEncounter: null });
  },

  lastDeath: null,

  dismissDeath: () => set({ lastDeath: null }),
});
