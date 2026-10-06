import type {
  Condition,
  QuestDef,
  QuestReward,
  SceneEffect,
  SectMembership,
  WorldStateData,
} from "./types";
import { TRAIT_LABEL } from "./types";
import { getItem, getNpc, getOpponent, scrollItemId } from "./data";
import { getQuest } from "./data/quests";
import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import { SAGA_PROLOGUES } from "./data/story";
import {
  FOE_SPAWN,
  applyOpponentStatScale,
  fightEventsForLocation,
  isSettledPlace,
  playerPowerIndex,
  pickWeighted,
} from "./data/random-events";
import { evaluateCondition, gearlessStat } from "./conditions";
import { JAIL_BRIBE_GOLD, JAIL_HOURS_PER_DAY, absoluteHours, jailCityFor, jailDays, lawChance, pickLawPursuer, sentenceLeft } from "./law";
import { JAIL_SCENE_ID } from "./data/activities";
import { STAT_LABEL, deriveAll, getArt, getSkill } from "../game";
import { generatePlayerEcho } from "./rumor-engine";
import { questHolder } from "./npc-life";

// Pure mutation: applies a single effect to the world state in place.
// `triggerBattle` only sets `pendingBattle` — the battle-bridge module
// reacts to that change and starts the actual battle.
//
// `goto` is rarely needed in `effects` arrays (the choice's own `next` field
// usually suffices), but it's here for scripted scenes that mutate then jump.
export function applyEffect(state: WorldStateData, eff: SceneEffect): void {
  switch (eff.t) {
    case "setFlag":
      state.flags[eff.flag] = eff.value;
      return;

    case "giveItem": {
      const n = eff.count ?? 1;
      state.inventory[eff.itemId] = (state.inventory[eff.itemId] ?? 0) + n;
      return;
    }

    case "takeItem": {
      const n = eff.count ?? 1;
      const cur = state.inventory[eff.itemId] ?? 0;
      const next = Math.max(0, cur - n);
      if (next === 0) delete state.inventory[eff.itemId];
      else state.inventory[eff.itemId] = next;
      return;
    }

    case "addGold":
      state.gold = Math.max(0, state.gold + eff.amount);
      return;

    case "startQuest": {
      const def = getQuest(eff.questId);
      if (!def) return;
      // Idempotent: don't reset an already-active or completed quest.
      if (state.quests[eff.questId]) return;
      // Snapshot cumulative counters so repeatable sect quests don't
      // auto-complete on prior kills / inventory. Walk all stages'
      // autoAdvance conditions to find the opponentIds + itemIds the
      // quest cares about and pin their current values.
      const defeatedSnap: Record<string, number> = {};
      const hasItemSnap: Record<string, number> = {};
      for (const stage of def.stages) {
        if (!stage.autoAdvance) continue;
        walkConditions(stage.autoAdvance, (c) => {
          if (c.t === "defeatedOpponent") {
            defeatedSnap[c.opponentId] = state.defeatedCounts[c.opponentId] ?? 0;
          } else if (c.t === "hasItem") {
            hasItemSnap[c.itemId] = state.inventory[c.itemId] ?? 0;
          }
        });
      }
      state.quests[eff.questId] = {
        id: eff.questId,
        status: "active",
        stage: 0,
        acceptedDefeatedAt: defeatedSnap,
        acceptedHasItemAt: hasItemSnap,
      };
      return;
    }

    case "advanceQuest": {
      const def = getQuest(eff.questId);
      const q = state.quests[eff.questId];
      if (!def || !q || q.status !== "active") return;
      const nextStage = q.stage + 1;
      // If stages are exhausted, mark done AND grant rewards. Without the
      // reward grant, content authors who use `advanceQuest` on the final
      // stage and `finishQuest` on a follow-up scene end up with quests
      // that never pay out (finishQuest's idempotent guard skips them
      // because status is already "done").
      if (nextStage >= def.stages.length) {
        q.status = "done";
        q.stage = def.stages.length - 1;
        if (def.rewards) applyQuestRewards(state, def.rewards);
        recordSectQuestCompletion(state, def);
        recordMajorQuestCompletion(state, def);
      } else {
        q.stage = nextStage;
      }
      return;
    }

    case "finishQuest": {
      const q = state.quests[eff.questId];
      if (!q) return;
      // Idempotent — once a quest is settled, finishQuest is a no-op even
      // if the dialog flow lands on a duplicate effect. Without this guard,
      // re-running would re-grant rewards.
      if (q.status === "done" || q.status === "failed") return;
      q.status = eff.success ? "done" : "failed";
      if (eff.success) {
        const def = getQuest(eff.questId);
        if (def) {
          if (def.rewards) applyQuestRewards(state, def.rewards);
          recordSectQuestCompletion(state, def);
          recordMajorQuestCompletion(state, def);
        }
      }
      return;
    }

    case "triggerBattle":
      // Set the intent. The bridge listens for this and drives the side-effect.
      state.pendingBattle = {
        opponentId: eff.opponentId,
        onWin: eff.onWin,
        onLose: eff.onLose,
        nonFatal: eff.nonFatal,
      };
      return;

    case "goto":
      state.currentSceneId = eff.sceneId;
      return;

    case "gotoRandom": {
      if (eff.sceneIds.length === 0) return;
      const i = Math.floor(Math.random() * eff.sceneIds.length);
      state.currentSceneId = eff.sceneIds[i]!;
      return;
    }

    case "addTrait": {
      const cur = state.traits[eff.trait] ?? 0;
      state.traits[eff.trait] = Math.max(0, cur + eff.amount);
      return;
    }

    case "addNpcRelationship": {
      const entry = state.npcStates[eff.npcId] ?? {};
      const cur = entry.relationship ?? 0;
      state.npcStates[eff.npcId] = { ...entry, relationship: cur + eff.amount };
      return;
    }

    case "learnSkill": {
      if (!state.playerBuild) return;
      const cur = state.playerBuild.learnedSkillIds ?? [];
      const slots = [...state.playerBuild.skillIds];
      let learnedNext = cur;
      if (!cur.includes(eff.skillId)) {
        learnedNext = [...cur, eff.skillId];
      }
      // Auto-equip into the first empty slot for convenience. Authors who
      // want to teach without slotting can clear the slot via a follow-up.
      if (!slots.includes(eff.skillId)) {
        for (let i = 0; i < slots.length; i++) {
          if (slots[i] === null) {
            slots[i] = eff.skillId;
            break;
          }
        }
      }
      state.playerBuild = {
        ...state.playerBuild,
        learnedSkillIds: learnedNext,
        skillIds: slots,
      };
      return;
    }

    case "learnArt": {
      if (!state.playerBuild) return;
      const cur = state.playerBuild.learnedArtIds ?? [];
      const lv = eff.level && eff.level >= 1 ? eff.level : 1;
      const levels = { ...(state.playerBuild.artLevels ?? {}) };
      const slots = [...state.playerBuild.skillIds];
      const slotEntry = `art:${eff.artId}`;
      let learnedArts = cur;
      if (!cur.includes(eff.artId)) {
        learnedArts = [...cur, eff.artId];
      }
      // Same auto-slot policy as learnSkill — drop into the first empty slot
      // so the player can use the art straight away.
      if (!slots.includes(slotEntry)) {
        for (let i = 0; i < slots.length; i++) {
          if (slots[i] === null) {
            slots[i] = slotEntry;
            break;
          }
        }
      }
      state.playerBuild = {
        ...state.playerBuild,
        learnedArtIds: learnedArts,
        artLevels:
          (levels[eff.artId] ?? 0) < lv ? { ...levels, [eff.artId]: lv } : levels,
        skillIds: slots,
      };
      return;
    }

    case "leaveSect": {
      // Legacy effect (originally used by the Gumu defection from
      // Quanzhen). Maps to a clean "resigned" status — keeps the
      // membership entry around for skill-freeze tracking but stops
      // counting as an active disciple. New content should prefer
      // `resignSect` / `betraySect` for the explicit semantic.
      const m = state.sectMembership[eff.sectId];
      if (!m) return;
      m.status = "resigned";
      return;
    }

    case "resignSect": {
      // Formal resignation. Marks the membership "resigned" — keeps the
      // entry so we can track which skills were granted via sect rewards
      // (those skills are XP-frozen for resigned sects). Player can join
      // a new sect.
      const m = state.sectMembership[eff.sectId];
      if (!m) return;
      m.status = "resigned";
      return;
    }

    case "betraySect": {
      // Defection without leave. Marks "betrayed" — skills can still
      // level up, BUT a sect-hunter NPC may ambush in random events.
      // Cleared by completing the sect's redemption quest.
      const m = state.sectMembership[eff.sectId];
      if (!m) return;
      m.status = "betrayed";
      return;
    }

    case "joinSect": {
      // Idempotent — if the player is already a member, do nothing.
      // (Includes resigned / betrayed memberships — those slots stay
      // permanently allocated to track skill-freeze + hunter state.)
      if (state.sectMembership[eff.sectId]) return;
      const def = SECT_MEMBERSHIPS[eff.sectId];
      const m: SectMembership = {
        rank: def.startRank,
        points: 0,
        lastQuestDay: {} as Record<string, number>,
        artQuestsDone: [] as string[],
        rewardPicks: {} as Record<string, string>,
        joinedDay: state.day,
        status: "active",
      };
      state.sectMembership[eff.sectId] = m;
      // No martial arts on joining: the sect's lineage quests teach them.
      // The jianghu hears of it (every join, the intro quests' reward included).
      generatePlayerEcho({ state, actionId: "sect_join" });
      return;
    }

    case "addSectPoints": {
      const m = state.sectMembership[eff.sectId];
      if (!m) return;
      m.points = Math.max(0, m.points + eff.amount);
      return;
    }

    // ─── Liveness Layer dispatchers ──────────────────────────────────
    // firePlayerEcho generates a rumor from the matching template pool
    // (lib/world/data/rumor-templates.ts) keyed by `actionId`. Player-
    // action callers (joinSect / resignSect / betraySect / rank-up /
    // duel-win-named / major-quest-complete) emit one of these so the
    // rumor pool reflects the player's deeds. markRumorHeard logs the
    // current player's exposure for the selection de-prioritiser.
    // revealNpcStatus is a no-op on the simulation — it's a refresh
    // hint for cached UI views.
    case "firePlayerEcho": {
      // Drive the rumor engine: pick a matching template from the action's
      // pool, render with the player's archetype label + scene location,
      // push onto rumorPool. Any caps/eviction work is folded into the
      // engine itself.
      generatePlayerEcho({
        state,
        actionId: eff.actionId,
        targetNpcId: eff.targetNpcId,
      });
      return;
    }
    case "markRumorHeard": {
      const log = state.rumorSeenLog ?? [];
      const exists = log.some((entry) => entry.rumorId === eff.rumorId);
      if (exists) return;
      log.push({
        rumorId: eff.rumorId,
        dayHeard: state.day,
        location: state.lastLocationId ?? state.currentSceneId,
      });
      // Cap 50 — drop oldest first (simple shift since the array is
      // append-only above).
      while (log.length > 50) log.shift();
      state.rumorSeenLog = log;
      return;
    }
    case "revealNpcStatus": {
      // No-op on the simulation. UI cache invalidation happens via the
      // store's notify cycle when this scene effect fires.
      void eff;
      return;
    }

    case "rollRandomEvent": {
      // Random events now roll while the player walks (see rollWalkEvent,
      // called per stretch walked), not on entering a map. Kept as a no-op
      // so older content referencing it stays valid.
      return;
    }

    case "imprison": {
      const hours = jailDays(state.wanted) * JAIL_HOURS_PER_DAY;
      state.jailCityId = state.jailCityId ?? jailCityFor(state.lastLocationId);
      state.jailUntil = absoluteHours(state) + hours;
      // The marks become the sentence.
      state.wanted = 0;
      state.wantedDay = state.day;
      state.lastLocationId = JAIL_SCENE_ID;
      state.currentHp = Math.max(1, state.currentHp ?? 1);
      return;
    }

    case "serveJail": {
      // Sit out whatever remains (or a fresh sentence if never locked up).
      const hours = state.jailUntil != null ? sentenceLeft(state) : jailDays(state.wanted) * JAIL_HOURS_PER_DAY;
      const total = state.time + hours;
      state.day += Math.floor(total / JAIL_HOURS_PER_DAY);
      state.time = total % JAIL_HOURS_PER_DAY;
      state.wanted = 0;
      releaseFromJail(state);
      return;
    }

    case "bribeJail": {
      if (state.gold < JAIL_BRIBE_GOLD) return;
      state.gold -= JAIL_BRIBE_GOLD;
      state.wanted = Math.max(0, state.wanted - 2);
      releaseFromJail(state);
      return;
    }
  }
}

/**
 * Walk free: the lock lifts and the player's "home" location becomes the
 * jail's city (the next exit / close lands there). Prison food and rest mean
 * they leave tired but on their feet.
 */
export function releaseFromJail(state: WorldStateData): void {
  const city = state.jailCityId ?? jailCityFor(state.lastLocationId);
  state.jailUntil = null;
  state.jailCityId = null;
  state.wantedDay = state.day;
  state.lastLocationId = city;
  if (state.playerBuild) {
    const max = deriveAll(state.playerBuild);
    state.currentHp = Math.max(state.currentHp ?? 0, Math.round(max.HP * 0.6));
    state.currentMp = Math.max(state.currentMp ?? 0, Math.round(max.MP * 0.6));
  }
}

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
  if (state.wanted > 0 && Math.random() < lawChance(state.wanted)) {
    applyOpponentStatScale(state);
    state.jailCityId = jailCityFor(state.currentSceneId);
    state.pendingEncounter = {
      opponentId: pickLawPursuer(state.wanted, Math.random()),
      returnSceneId: state.currentSceneId,
    };
    return;
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

// Convenience: apply an array in order. After the batch runs, we tick the
// quest progress so any auto-advance stages whose Condition is now true
// resolve in the same beat (a giveItem effect can immediately complete a
// "gather X" stage, for example).
export function applyEffects(state: WorldStateData, effects: readonly SceneEffect[]): void {
  for (const e of effects) applyEffect(state, e);
  tickQuestProgress(state);
}

function grantScroll(state: WorldStateData, kind: "skill" | "art", id: string, known: boolean): void {
  const itemId = scrollItemId(kind, id);
  if (known || !getItem(itemId) || (state.inventory[itemId] ?? 0) > 0) return;
  state.inventory[itemId] = 1;
}

// ─── Quest reward dispatcher ───────────────────────────────────────────
// Negative numbers are clamped to 0 — a reward never punishes. Unknown ids
// are silently dropped so a quest reward referencing a renamed/removed
// item/skill/art doesn't blow up the dialog flow; validateAndRepair logs
// the broader registry drift.
function applyQuestRewards(state: WorldStateData, rewards: readonly QuestReward[]): void {
  for (const r of rewards) {
    switch (r.t) {
      case "gold": {
        if (r.amount > 0) state.gold = Math.max(0, state.gold + r.amount);
        break;
      }
      case "item": {
        const n = Math.max(1, r.count ?? 1);
        state.inventory[r.itemId] = (state.inventory[r.itemId] ?? 0) + n;
        break;
      }
      case "wExp": {
        if (r.amount > 0) state.wExp = Math.max(0, state.wExp + r.amount);
        break;
      }
      case "skillExp": {
        if (r.amount > 0) {
          state.skillExp[r.skillId] = (state.skillExp[r.skillId] ?? 0) + r.amount;
        }
        break;
      }
      case "trait": {
        const cur = state.traits[r.trait] ?? 0;
        state.traits[r.trait] = Math.max(0, cur + r.amount);
        break;
      }
      case "npcRelationship": {
        const entry = state.npcStates[r.npcId] ?? {};
        const cur = entry.relationship ?? 0;
        state.npcStates[r.npcId] = { ...entry, relationship: cur + r.amount };
        break;
      }
      // A quest never teaches outright: it hands over the move's คัมภีร์,
      // which the hero reads from the bag (nothing if already known or held).
      case "learnSkill":
        grantScroll(state, "skill", r.skillId, (state.playerBuild?.learnedSkillIds ?? []).includes(r.skillId));
        break;
      case "learnArt":
        grantScroll(state, "art", r.artId, (state.playerBuild?.learnedArtIds ?? []).includes(r.artId));
        break;
      case "joinSect":
        applyEffect(state, { t: "joinSect", sectId: r.sectId });
        break;
      case "sectPoints":
        applyEffect(state, { t: "addSectPoints", sectId: r.sectId, amount: r.amount });
        break;
      case "leaveSect":
        applyEffect(state, { t: "leaveSect", sectId: r.sectId });
        break;
      case "resignSect":
        applyEffect(state, { t: "resignSect", sectId: r.sectId });
        break;
      case "betraySect":
        applyEffect(state, { t: "betraySect", sectId: r.sectId });
        break;
    }
  }
}

// ─── Auto-advance ticker ───────────────────────────────────────────────
// Walks every active quest. While the current stage's `autoAdvance`
// condition evaluates true, advances stage. On exhausting all stages,
// finishes the quest with success=true (which grants its rewards).
//
// Bounded loop — at most stages.length iterations per quest per call, so
// no risk of runaway even if the player triggers many state changes
// inside a single applyEffects batch.
// Walk every leaf condition in a Condition tree, calling `cb` on each.
// Used by quest snapshot collection + auto-consume — we need the
// concrete defeatedOpponent / hasItem leaves nested inside and/or/not.
function walkConditions(c: Condition, cb: (leaf: Condition) => void): void {
  if (c.t === "and") {
    for (const sub of c.all) walkConditions(sub, cb);
  } else if (c.t === "or") {
    for (const sub of c.any) walkConditions(sub, cb);
  } else if (c.t === "not") {
    walkConditions(c.of, cb);
  } else {
    cb(c);
  }
}

// Delta-aware autoAdvance evaluator. For `defeatedOpponent` and
// `hasItem` conditions, checks (current - snapshot) >= count instead
// of cumulative count. This makes repeatable sect quests (e.g. "ปราบ
// thug 2 คน") count only kills SINCE the player accepted the quest,
// rather than auto-completing on prior kills the player already had.
// All other conditions defer to the normal evaluateCondition.
function evaluateAutoAdvance(
  state: WorldStateData,
  cond: Condition,
  q: import("./types").QuestState,
): boolean {
  switch (cond.t) {
    case "defeatedOpponent": {
      const want = cond.count ?? 1;
      const cur = state.defeatedCounts[cond.opponentId] ?? 0;
      const snap = q.acceptedDefeatedAt?.[cond.opponentId] ?? 0;
      return cur - snap >= want;
    }
    case "hasItem": {
      // Items count by what the player holds now, snapshot or not: a fetch
      // quest is "bring me 10 ore", and ore already in the bag is still ore.
      // (Counting only post-accept gains left players holding 10/10 in the
      // quest log with a quest that never advanced.)
      const want = cond.count ?? 1;
      return (state.inventory[cond.itemId] ?? 0) >= want;
    }
    case "and":
      return cond.all.every((sub) => evaluateAutoAdvance(state, sub, q));
    case "or":
      return cond.any.some((sub) => evaluateAutoAdvance(state, sub, q));
    case "not":
      return !evaluateAutoAdvance(state, cond.of, q);
    default:
      return evaluateCondition(state, cond);
  }
}

// Consume items the quest's autoAdvance hasItem conditions require.
// Called from the auto-finish paths (tickQuestProgress done branch +
// store's finishQuestNow) so popup turn-ins clean up gathered items.
// Scene-driven completes still use explicit `takeItem` effects — this
// helper only fires for engine-completed quests, so no double-consume.
// Each itemId consumes `min(count, current)` — the delivery itself.
export function consumeQuestAutoItems(
  state: WorldStateData,
  def: import("./types").QuestDef,
  q: import("./types").QuestState,
): void {
  for (const stage of def.stages) {
    if (!stage.autoAdvance) continue;
    walkConditions(stage.autoAdvance, (c) => {
      if (c.t !== "hasItem") return;
      void q;
      const want = c.count ?? 1;
      const cur = state.inventory[c.itemId] ?? 0;
      const take = Math.min(want, cur);
      if (take <= 0) return;
      state.inventory[c.itemId] = cur - take;
      if (state.inventory[c.itemId] === 0) delete state.inventory[c.itemId];
    });
  }
}

export function tickQuestProgress(state: WorldStateData): void {
  for (const q of Object.values(state.quests)) {
    if (q.status !== "active") continue;
    const def = getQuest(q.id);
    if (!def) continue;
    let safety = def.stages.length + 1;
    while (safety-- > 0) {
      if (q.stage >= def.stages.length) break;
      const stage = def.stages[q.stage]!;
      if (!stage.autoAdvance) break;
      if (!evaluateAutoAdvance(state, stage.autoAdvance, q)) break;
      const next = q.stage + 1;
      if (next >= def.stages.length) {
        q.stage = def.stages.length - 1;
        q.status = "done";
        // Auto-consume gathered items (popup turn-in style — no scene
        // explicitly handles this finish, so the engine cleans up).
        consumeQuestAutoItems(state, def, q);
        if (def.rewards) applyQuestRewards(state, def.rewards);
        recordSectQuestCompletion(state, def);
        recordMajorQuestCompletion(state, def);
        break;
      }
      q.stage = next;
    }
  }
}

// Helper called by every "quest just turned done" path. For sect quests,
// record `lastQuestDay` (drives the sect's questCooldownDays, 30 for every
// sect today) and add to
// `artQuestsDone` if the quest is one-shot art-tagged.
function recordSectQuestCompletion(state: WorldStateData, def: QuestDef): void {
  if (!def.sectId) return;
  const m = state.sectMembership[def.sectId];
  if (!m) return;
  m.lastQuestDay = { ...m.lastQuestDay, [def.id]: state.day };
  if (def.isArtQuest && !m.artQuestsDone.includes(def.id)) {
    m.artQuestsDone = [...m.artQuestsDone, def.id];
  }
}

// Liveness Layer §3.2.2 — fire a player-echo rumor when a major quest
// finishes successfully. Major quests are flagged via `QuestDef.isMajor`
// so the engine doesn't spam the rumor pool on routine fetch quests.
// Called from every "quest just turned done with success" path
// (case "finishQuest" + case "advanceQuest" final-stage overflow +
// tickQuestProgress auto-advance).
/**
 * Milestones the jianghu talks about: a quest flagged `isMajor`, every
 * chapter of the main story, and the last chapter of a saga (the one that
 * hands over its secret move).
 */
export function isMajorQuest(def: QuestDef): boolean {
  if (def.isMajor) return true;
  if (def.id.startsWith("st_main_")) return true;
  return !!def.story && (def.rewards ?? []).some((r) => r.t === "learnSkill" || r.t === "learnArt");
}

function recordMajorQuestCompletion(state: WorldStateData, def: QuestDef): void {
  if (!isMajorQuest(def)) return;
  applyEffect(state, {
    t: "firePlayerEcho",
    actionId: "quest_major_complete",
    targetNpcId: def.giverNpcId,
  });
}

// ─── Quest availability helper (used by NPC popup) ─────────────────────
// Returns true when the player can be offered this quest right now:
//   - never started (no entry in state.quests)
//   - prereqs (if any) evaluate true
//   - quest is NOT a sect quest (those route through the sect popup)
// Side quests that finished with success or failure stay in state.quests
// with their terminal status — so the absence-check below blocks re-offers
// without any extra side-quest plumbing.
export function isQuestOfferable(state: WorldStateData, def: QuestDef): boolean {
  // Sect quests (repeatable + art) live in the sect popup, not the NPC popup —
  // except the T4 saga trials, which the sect window keeps secret: only their
  // giver offers them, to an active member of high enough rank.
  if (def.sectId) {
    if (!isSecretSectQuest(def.id)) return false;
    const m = state.sectMembership[def.sectId];
    if (!m || m.status !== "active") return false;
    if (def.minSectRank != null && m.rank > def.minSectRank) return false;
  }
  if (state.quests[def.id]) return false;
  if (def.prereqs && !evaluateCondition(state, def.prereqs)) return false;
  return true;
}

// The T4 saga trials (SAGA_PROLOGUES): hidden from the sect window, offered by
// their giver in person.
const SECRET_SECT_QUESTS: ReadonlySet<string> = new Set(Object.values(SAGA_PROLOGUES));
export function isSecretSectQuest(questId: string): boolean {
  return SECRET_SECT_QUESTS.has(questId);
}

// Sect-quest offerable check — used by SectMembershipPopup. Honors:
//   - membership prereq
//   - rank gate (def.minSectRank)
//   - cooldown (lastQuestDay + sect.questCooldownDays)
//   - one-shot art quests (skipped if id is in artQuestsDone)
//   - in-progress active quests (player can't double-accept)
export function isSectQuestOfferable(
  state: WorldStateData,
  def: QuestDef,
  cooldownDays: number,
): { offerable: boolean; cooldownLeft: number; reason?: string } {
  if (!def.sectId) return { offerable: false, cooldownLeft: 0, reason: "ไม่ใช่ภารกิจสำนัก" };
  const m = state.sectMembership[def.sectId];
  if (!m) return { offerable: false, cooldownLeft: 0, reason: "ยังไม่ได้เป็นศิษย์" };
  if (def.minSectRank != null && m.rank > def.minSectRank) {
    return {
      offerable: false,
      cooldownLeft: 0,
      reason: `ต้องการขั้น ${def.minSectRank} ขึ้นไป`,
    };
  }
  if (def.isArtQuest && m.artQuestsDone.includes(def.id)) {
    return { offerable: false, cooldownLeft: 0, reason: "รับวิชาแล้ว" };
  }
  const existing = state.quests[def.id];
  if (existing && existing.status === "active") {
    return { offerable: false, cooldownLeft: 0, reason: "กำลังทำอยู่" };
  }
  // Cooldown only matters for repeatable sect quests, not one-shot art
  // quests. Art quests are gated by artQuestsDone above, so once done they
  // won't re-offer; before that, no cooldown.
  if (!def.isArtQuest) {
    const last = m.lastQuestDay[def.id];
    if (typeof last === "number") {
      const since = state.day - last;
      if (since < cooldownDays) {
        return {
          offerable: false,
          cooldownLeft: Math.max(0, cooldownDays - since),
          reason: "อยู่ระหว่างคูลดาวน์",
        };
      }
    }
  }
  if (def.prereqs && !evaluateCondition(state, def.prereqs)) {
    return { offerable: false, cooldownLeft: 0, reason: "ยังไม่ผ่านเงื่อนไข" };
  }
  return { offerable: true, cooldownLeft: 0 };
}

// Find every opponent the player is actively hunting via a quest's
// current-stage `defeatedOpponent` autoAdvance condition. Used by
// `rollWalkEvent` above to bias the random-event roll: when at least
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

// ─── Stage progress tracker ───────────────────────────────────────────
// Walks an autoAdvance Condition tree and produces a flat list of
// trackable sub-conditions with their current vs. required counts.
// Returned to the quest log UI so the player sees "12/20 herbs" instead
// of guessing how close they are. `and` / `or` flatten into a single
// list (with intent annotations), `not` is rendered as "ไม่ต้อง...".
//
// Tracking-friendly conditions:
//   - hasItem            → inventory count vs required
//   - defeatedOpponent   → kill counter vs required
//   - stoleFromNpc       → steal counter vs required
//   - trait              → trait value vs min/max
//   - npcRelationship    → relationship value vs min/max
// Non-numeric conditions (visitedLocation, flag, questStatus, etc.) are
// returned as boolean "done/not done" rows — current/required are 1/1.

export interface QuestProgressLine {
  label: string;
  current: number;
  required: number;
  done: boolean;
  // Optional negation marker so `not` clauses render as "ไม่ต้อง <X>".
  negated?: boolean;
}

export function describeQuestCondition(
  state: WorldStateData,
  c: Condition,
  depth = 0,
  /** The quest being described: kill counts then read "since accepted", like the evaluator. */
  quest?: import("./types").QuestState,
): QuestProgressLine[] {
  if (depth > 4) return []; // Safety: avoid runaway recursion on weird trees.
  switch (c.t) {
    case "hasItem": {
      const have = state.inventory[c.itemId] ?? 0;
      const need = c.count ?? 1;
      const def = getItem(c.itemId);
      return [{
        label: def?.name ?? c.itemId,
        current: have,
        required: need,
        done: have >= need,
      }];
    }
    case "defeatedOpponent": {
      const since = quest?.acceptedDefeatedAt?.[c.opponentId] ?? 0;
      const have = Math.max(0, (state.defeatedCounts[c.opponentId] ?? 0) - since);
      const need = c.count ?? 1;
      const def = getOpponent(c.opponentId);
      return [{
        label: `ปราบ ${def?.name ?? c.opponentId}`,
        current: have,
        required: need,
        done: have >= need,
      }];
    }
    case "stoleFromNpc": {
      const have = state.stoleFromCounts[c.npcId] ?? 0;
      const need = c.count ?? 1;
      const def = getNpc(c.npcId);
      return [{
        label: `ขโมยจาก ${def?.name ?? c.npcId}`,
        current: have,
        required: need,
        done: have >= need,
      }];
    }
    case "trait": {
      const v = state.traits[c.trait] ?? 0;
      // For trait, prefer the active bound. min = "must reach"; max = "must
      // stay below". Default to 1/1 if neither is set (trait-exists check).
      if (c.min !== undefined) {
        return [{
          label: `${TRAIT_LABEL[c.trait]} ≥ ${c.min}`,
          current: v,
          required: c.min,
          done: v >= c.min,
        }];
      }
      if (c.max !== undefined) {
        return [{
          label: `${TRAIT_LABEL[c.trait]} ≤ ${c.max}`,
          current: v,
          required: c.max,
          done: v <= c.max,
        }];
      }
      return [];
    }
    case "npcRelationship": {
      const v = state.npcStates[c.npcId]?.relationship ?? 0;
      const def = getNpc(c.npcId);
      const name = def?.name ?? c.npcId;
      if (c.min !== undefined) {
        return [{
          label: `สัมพันธ์ ${name} ≥ ${c.min}`,
          current: v,
          required: c.min,
          done: v >= c.min,
        }];
      }
      if (c.max !== undefined) {
        return [{
          label: `สัมพันธ์ ${name} ≤ ${c.max}`,
          current: v,
          required: c.max,
          done: v <= c.max,
        }];
      }
      return [];
    }
    case "visitedLocation":
      return [{
        label: `ไปยัง ${c.locationId}`,
        current: state.visitedLocationIds.includes(c.locationId) ? 1 : 0,
        required: 1,
        done: state.visitedLocationIds.includes(c.locationId),
      }];
    case "questStatus": {
      const cur = state.quests[c.questId]?.status ?? "none";
      return [{
        label: `${c.questId} = ${c.status}`,
        current: cur === c.status ? 1 : 0,
        required: 1,
        done: cur === c.status,
      }];
    }
    case "flag": {
      const v = state.flags[c.flag];
      const target = c.equals;
      const ok = target === undefined ? Boolean(v) : v === target;
      return [{
        label: `flag ${c.flag}${target !== undefined ? ` = ${target}` : ""}`,
        current: ok ? 1 : 0,
        required: 1,
        done: ok,
      }];
    }
    case "statAtLeast": {
      const v = gearlessStat(state, c.stat);
      return [{ label: `${STAT_LABEL[c.stat] ?? c.stat} ≥ ${c.min}`, current: v, required: c.min, done: v >= c.min }];
    }
    case "learnedSkill":
    case "learnedArt": {
      const done = evaluateCondition(state, c);
      const name = c.t === "learnedSkill" ? getSkill(c.skillId)?.n ?? c.skillId : getArt(c.artId).n;
      return [{ label: `เรียน ${name}`, current: done ? 1 : 0, required: 1, done }];
    }
    case "assassinatedNpc":
    case "kidnappedNpc": {
      const list = c.t === "assassinatedNpc" ? state.assassinatedNpcIds : state.kidnappedNpcIds;
      const def = getNpc(c.npcId);
      const verb = c.t === "assassinatedNpc" ? "ลอบสังหาร" : "ลักพาตัว";
      return [{
        label: `${verb} ${def?.name ?? c.npcId}`,
        current: list.includes(c.npcId) ? 1 : 0,
        required: 1,
        done: list.includes(c.npcId),
      }];
    }
    case "and":
      return c.all.flatMap((sub) => describeQuestCondition(state, sub, depth + 1, quest));
    case "or": {
      // OR — show every alternative; the stage progresses on any-done.
      const lines = c.any.flatMap((sub) => describeQuestCondition(state, sub, depth + 1, quest));
      return lines.map((l) => ({ ...l, label: `(หรือ) ${l.label}` }));
    }
    case "not": {
      const inner = describeQuestCondition(state, c.of, depth + 1, quest);
      // Flip done: NOT is satisfied when inner is NOT done.
      return inner.map((l) => ({ ...l, done: !l.done, negated: true }));
    }
    default:
      return [];
  }
}

// True when an active quest's current stage is a dialog-driven "talk to NPC"
// step keyed by `turnInNpcId` (or `giverNpcId` if no turn-in is set). The
// NPC popup uses this to render a "Turn in" button; the actual finish is
// driven by the quest's dialog scene's effects.
export function isQuestTurnInForNpc(
  state: WorldStateData,
  def: QuestDef,
  npcId: string,
): boolean {
  const q = state.quests[def.id];
  if (!q || q.status !== "active") return false;
  const target = def.turnInNpcId ?? def.giverNpcId;
  // A dead giver's charges pass to their heir (lib/world/npc-life.ts).
  if (!target || (target !== npcId && questHolder(state, target) !== npcId)) return false;
  // Last stage is the "return to NPC" beat by convention.
  return q.stage === def.stages.length - 1;
}
