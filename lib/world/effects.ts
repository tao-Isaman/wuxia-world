import type {
  Condition,
  QuestDef,
  QuestReward,
  SceneEffect,
  SectMembership,
  WorldStateData,
} from "./types";
import { TRAIT_LABEL } from "./types";
import { getItem, getNpc, getOpponent } from "./data";
import { getQuest } from "./data/quests";
import { getScene } from "./data/scenes";
import { SECT_MEMBERSHIPS, autoGrantableRewards } from "./data/sect-memberships";
import {
  EVENT_PROBABILITY,
  MEET_EVENTS,
  TREASURE_EVENTS,
  applyOpponentStatScale,
  fightEventsForLocation,
  playerPowerIndex,
  pickWeighted,
} from "./data/random-events";
import { evaluateCondition } from "./conditions";
import { generatePlayerEcho } from "./rumor-engine";

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
      // Auto-claim single-option rewards at the entry rank (e.g. Shaolin
      // grants t0_lohan automatically since rank 9's art pool is one
      // option). Fires on EVERY joinSect path — store action OR quest
      // reward — so authors don't need to add a separate learnArt reward.
      const grants = autoGrantableRewards(def, def.startRank, m.rewardPicks);
      for (const g of grants) {
        if (g.kind === "skill") {
          applyEffect(state, { t: "learnSkill", skillId: g.id });
        } else {
          applyEffect(state, { t: "learnArt", artId: g.id, level: 1 });
        }
        m.rewardPicks[`${g.rank}-${g.kind}`] = g.id;
      }
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
      // Suppress the immediate re-roll that fires when a meet/treasure dialog
      // auto-returns to the leaf, or when a fight's onWin/onLose routes back.
      // The flag is single-use and is also wiped by validateAndRepair on
      // rehydrate so it can never leak across sessions.
      if (state.flags._skipEventRoll) {
        delete state.flags._skipEventRoll;
        return;
      }
      if (!state.playerBuild) return;

      // Pin the leaf as lastLocationId so the upcoming event dialog's "ปิด"
      // returns here even though we are about to redirect away from it.
      state.lastLocationId = state.currentSceneId;

      // Hunt boost — when the player has an active kill-quest stage AND
      // the target opponent spawns in this zone, the encounter rate jumps
      // to EVENT_PROBABILITY.fightHunting (default 0.80) and the
      // encounter pool is restricted to those targets. Treasure / meet
      // bands are suppressed during the hunt so the player isn't pulled
      // off the trail by flavor events. Falls back to the normal 0.15 +
      // full pool when no target fits the current zone.
      const huntTargets = collectActiveHuntTargets(state);
      // Apply player-power-driven scaling + tier reshape to upcoming
      // random encounters. The scale multiplier is module-level state
      // in opponents.ts — set it BEFORE the bridge constructs the
      // opponent's CharacterBuild so stats are scaled at build time.
      const power = playerPowerIndex(state);
      applyOpponentStatScale(state);
      const zonePool = fightEventsForLocation(state.lastLocationId, power);
      const huntPool =
        huntTargets.size > 0
          ? zonePool.filter((ev) => huntTargets.has(ev.opponentId))
          : [];
      const huntActive = huntPool.length > 0;

      const luk = state.playerBuild.stats.LUK;
      const fightP = huntActive
        ? EVENT_PROBABILITY.fightHunting
        : EVENT_PROBABILITY.fight;
      const treasureP = huntActive
        ? 0
        : Math.min(
            EVENT_PROBABILITY.treasureCap,
            EVENT_PROBABILITY.treasureBase + luk / EVENT_PROBABILITY.treasureLukDivisor,
          );
      const meetP = huntActive
        ? 0
        : Math.min(
            EVENT_PROBABILITY.meetCap,
            EVENT_PROBABILITY.meetBase + luk / EVENT_PROBABILITY.meetLukDivisor,
          );

      // Sect-hunter ambush — 30% chance per random-event roll if the
      // player has any "betrayed" sect membership. Picks one betrayed
      // sect at random and spawns its `hunter_<sectId>` opponent.
      // Overrides the normal fight roll entirely (treasure / meet are
      // also skipped — a hunter doesn't care about flowers and herbs).
      const betrayedSects: string[] = [];
      for (const [sid, m] of Object.entries(state.sectMembership)) {
        if (m && m.status === "betrayed") betrayedSects.push(sid);
      }
      if (betrayedSects.length > 0 && Math.random() < 0.3) {
        const sid = betrayedSects[Math.floor(Math.random() * betrayedSects.length)]!;
        state.flags._skipEventRoll = true;
        state.pendingEncounter = {
          opponentId: `hunter_${sid}`,
          returnSceneId: state.lastLocationId,
        };
        return;
      }

      const r = Math.random();

      if (r < fightP) {
        // During a hunt, restrict the pool to the quest target(s) so the
        // boosted rate actually advances the quest instead of spinning
        // up unrelated tier-1 humans.
        const pool = huntActive ? huntPool : zonePool;
        const ev = pickWeighted(pool, Math.random());
        if (!ev) return;
        state.flags._skipEventRoll = true;
        // Stage as a pending encounter — the encounter screen offers
        // fight / flee. Only "fight" promotes this to pendingBattle.
        state.pendingEncounter = {
          opponentId: ev.opponentId,
          returnSceneId: state.lastLocationId,
        };
        return;
      }
      if (r < fightP + treasureP) {
        const ev = pickWeighted(TREASURE_EVENTS, Math.random());
        if (!ev) return;
        state.flags._skipEventRoll = true;
        state.currentSceneId = ev.dialogSceneId;
        const dest = getScene(ev.dialogSceneId);
        if (dest?.onEnter) applyEffects(state, dest.onEnter);
        return;
      }
      if (r < fightP + treasureP + meetP) {
        const ev = pickWeighted(MEET_EVENTS, Math.random());
        if (!ev) return;
        state.flags._skipEventRoll = true;
        state.currentSceneId = ev.dialogSceneId;
        const dest = getScene(ev.dialogSceneId);
        if (dest?.onEnter) applyEffects(state, dest.onEnter);
        return;
      }
      // r ≥ all bands → nothing happens; player just sees the location.
      return;
    }
  }
}

// Convenience: apply an array in order. After the batch runs, we tick the
// quest progress so any auto-advance stages whose Condition is now true
// resolve in the same beat (a giveItem effect can immediately complete a
// "gather X" stage, for example).
export function applyEffects(state: WorldStateData, effects: readonly SceneEffect[]): void {
  for (const e of effects) applyEffect(state, e);
  tickQuestProgress(state);
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
      case "learnSkill":
        applyEffect(state, { t: "learnSkill", skillId: r.skillId });
        break;
      case "learnArt":
        applyEffect(state, { t: "learnArt", artId: r.artId, level: r.level });
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
      const want = cond.count ?? 1;
      const cur = state.inventory[cond.itemId] ?? 0;
      const snap = q.acceptedHasItemAt?.[cond.itemId] ?? 0;
      return cur - snap >= want;
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
// Each itemId consumes `min(count, current - snapshot)` so the player
// keeps any pre-existing stash from before they accepted the quest.
export function consumeQuestAutoItems(
  state: WorldStateData,
  def: import("./types").QuestDef,
  q: import("./types").QuestState,
): void {
  for (const stage of def.stages) {
    if (!stage.autoAdvance) continue;
    walkConditions(stage.autoAdvance, (c) => {
      if (c.t !== "hasItem") return;
      const want = c.count ?? 1;
      const cur = state.inventory[c.itemId] ?? 0;
      const snap = q.acceptedHasItemAt?.[c.itemId] ?? 0;
      const take = Math.min(want, cur - snap, cur);
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
// record `lastQuestDay` (drives the 30-day cooldown) and add to
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
function recordMajorQuestCompletion(state: WorldStateData, def: QuestDef): void {
  if (!def.isMajor) return;
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
  // Sect quests (repeatable + art) live in the sect popup, not the NPC popup.
  if (def.sectId) return false;
  if (state.quests[def.id]) return false;
  if (def.prereqs && !evaluateCondition(state, def.prereqs)) return false;
  return true;
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
// `rollRandomEvent` above to bias the random-event roll: when at least
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
      const have = state.defeatedCounts[c.opponentId] ?? 0;
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
      return c.all.flatMap((sub) => describeQuestCondition(state, sub, depth + 1));
    case "or": {
      // OR — show every alternative; the stage progresses on any-done.
      const lines = c.any.flatMap((sub) => describeQuestCondition(state, sub, depth + 1));
      return lines.map((l) => ({ ...l, label: `(หรือ) ${l.label}` }));
    }
    case "not": {
      const inner = describeQuestCondition(state, c.of, depth + 1);
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
  if (!target || target !== npcId) return false;
  // Last stage is the "return to NPC" beat by convention.
  return q.stage === def.stages.length - 1;
}
