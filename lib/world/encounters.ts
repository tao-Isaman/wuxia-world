// Walk-tick encounters (called by the world store's walkTick for every
// WALK_TICK_UNITS the hero walks on a map): the law, an upright ambusher or a
// sect hunter catching up, and the foes that turn up on the map.
import type { WorldStateData } from "./types";
import { getOpponent } from "./data";
import { getQuest } from "./data/quests";
import {
  FOE_SPAWN,
  applyOpponentStatScale,
  fightEventsForLocation,
  isSettledPlace,
  playerPowerIndex,
  pickWeighted,
} from "./data/random-events";
import { LAW_NPC_PREFIX, ambushChance, jailCityFor, lawChance, pickLawPursuer } from "./law";
import { regionOf } from "./data/regions";
import { npcFoeFor, sectChief } from "./npc-life";

// ─── Walk ticks ────────────────────────────────────────────────────────
// Called by the world store for every stretch the player walks on a map
// (see WALK_TICK_UNITS). The law (if wanted) and a sect hunter (if betrayed)
// may catch up at once; otherwise `rollFoeSpawn` may put a foe on the map,
// which waits there until the hero touches it (lib/world/roaming-foes in the
// store, drawn by the map runtime).
/** A named villain (`look.npc`) the hero has killed or carried off, or who died, never ambushes again. */
export function encounterFoeAvailable(state: Pick<WorldStateData, "npcExt" | "assassinatedNpcIds" | "kidnappedNpcIds">, opponentId: string): boolean {
  const npcId = getOpponent(opponentId)?.look?.npc;
  if (!npcId) return true;
  return ((state.npcExt ?? {})[npcId]?.status ?? "alive") === "alive" &&
    !(state.assassinatedNpcIds ?? []).includes(npcId) && !(state.kidnappedNpcIds ?? []).includes(npcId);
}

/** The law or a sect hunter catching up: sets `pendingEncounter` when one does. */
export function rollWalkEvent(state: WorldStateData, chanceScale: number): void {
  void chanceScale; // the law and hunters roll at full odds per tick
  if (!state.playerBuild) return;

  // The encounter returns to this map through its returnSceneId. Don't pin
  // lastLocationId here: on a road it must stay the place the hero came
  // from (the road's ย้อนกลับ exit and the quest guide route from it).

  // Wanted players: the law may catch up first (lib/world/law.ts).
  const evasions = state.lawEvasions ?? 0;
  if (state.wanted > 0 && Math.random() < lawChance(state.wanted, evasions)) {
    applyOpponentStatScale(state);
    state.jailCityId = jailCityFor(state.currentSceneId);
    const pursuer = pickLawPursuer(state.wanted, Math.random(), evasions);
    // The Brocade Guard's commander — whoever holds that seat now — comes in person.
    const chief = pursuer === "chief" ? sectChief(state, "jinyiwei") : null;
    state.pendingEncounter = {
      opponentId: pursuer !== "chief" ? pursuer : chief ? LAW_NPC_PREFIX + npcFoeFor(state, chief) : "law_jinyiwei_captain",
      returnSceneId: state.currentSceneId,
    };
    return;
  }

  // An upright person of the jianghu near here waylays the wanted hero to
  // hand them over: a fight at once (no chance to slip away); losing is arrest.
  if (Math.random() < ambushChance(state.wanted)) {
    const here = regionOf(state.lastLocationId ?? state.currentSceneId);
    const hunters = Object.entries(state.npcExt ?? {}).filter(([, e]) => e.status === "alive" && (e.temper?.righteous ?? 0) >= 0.5
      && e.power >= 30 && (e.woundedUntil ?? 0) <= state.day && regionOf(e.currentLocation) === here);
    if (hunters.length) {
      const [npcId] = hunters[Math.floor(Math.random() * hunters.length)]!;
      applyOpponentStatScale(state);
      state.jailCityId = jailCityFor(state.currentSceneId);
      state.pendingBattle = {
        opponentId: LAW_NPC_PREFIX + npcFoeFor(state, npcId),
        onWin: state.currentSceneId,
        onLose: "jail_cell",
        nonFatal: true,
        ambushNpcId: npcId,
      };
      return;
    }
  }

  // Sect-hunter ambush — 30% chance per tick if the player has any
  // "betrayed" sect membership. Picks one betrayed sect at random and
  // spawns its `hunter_<sectId>` opponent.
  const betrayedSects: string[] = [];
  for (const [sid, m] of Object.entries(state.sectMembership)) {
    if (m && m.status === "betrayed") betrayedSects.push(sid);
  }
  if (betrayedSects.length > 0 && Math.random() < 0.3) {
    const sid = betrayedSects[Math.floor(Math.random() * betrayedSects.length)]!;
    applyOpponentStatScale(state);
    state.pendingEncounter = {
      opponentId: `hunter_${sid}`,
      returnSceneId: state.currentSceneId,
    };
  }
}

/**
 * Which foe (if any) turns up on the map this walk tick. Foes come from the
 * zone's pool (cities: people; the wilds: mostly beasts; sects and temples:
 * spirits too), shaped by the hero's power. While the hero hunts a kill-quest
 * target that lives here, spawns are likelier and only those targets appear.
 */
export function rollFoeSpawn(state: WorldStateData, present: number): string | null {
  if (!state.playerBuild || present >= FOE_SPAWN.maxPerMap) return null;
  const power = playerPowerIndex(state);
  const pool = fightEventsForLocation(state.currentSceneId, power).filter((ev) => encounterFoeAvailable(state, ev.opponentId));
  const hunt = collectActiveHuntTargets(state);
  const huntPool = hunt.size ? pool.filter((ev) => hunt.has(ev.opponentId)) : [];
  const hunting = huntPool.length > 0;
  // Towns, villages, sects and homes: only a quest's quarry, never a stray foe.
  if (!hunting && isSettledPlace(state.currentSceneId)) return null;
  if (Math.random() >= (hunting ? FOE_SPAWN.huntChance : FOE_SPAWN.chance)) return null;
  return pickWeighted(hunting ? huntPool : pool, Math.random())?.opponentId ?? null;
}

// Find every opponent the player is actively hunting via a quest's
// current-stage `defeatedOpponent` autoAdvance condition. Used by
// `rollFoeSpawn` above to bias the random-event roll: when at least
// one target spawns in the current zone, the fight rate jumps to
// EVENT_PROBABILITY.fightHunting and the encounter pool is restricted
// to those targets.
//
// Exported so any future UI (e.g., a "🎯 ตามล่า" badge in the quest
// log) can mirror the rule without re-implementing the scan.
export function collectActiveHuntTargets(state: WorldStateData): Set<string> {
  const out = new Set<string>();
  for (const [questId, qs] of Object.entries(state.quests)) {
    if (qs.status !== "active") continue;
    const def = getQuest(questId);
    if (!def) continue;
    const stage = def.stages[qs.stage];
    if (!stage?.autoAdvance) continue;
    if (stage.autoAdvance.t === "defeatedOpponent") {
      out.add(stage.autoAdvance.opponentId);
    }
  }
  return out;
}
