import type { SceneEffect, WorldStateData } from "./types";
import { getQuest } from "./data/quests";
import { getScene } from "./data/scenes";
import {
  EVENT_PROBABILITY,
  FIGHT_EVENTS,
  MEET_EVENTS,
  TREASURE_EVENTS,
  pickWeighted,
} from "./data/random-events";

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
      state.quests[eff.questId] = { id: eff.questId, status: "active", stage: 0 };
      return;
    }

    case "advanceQuest": {
      const def = getQuest(eff.questId);
      const q = state.quests[eff.questId];
      if (!def || !q || q.status !== "active") return;
      const nextStage = q.stage + 1;
      // If stages are exhausted, mark done; otherwise just advance.
      if (nextStage >= def.stages.length) {
        q.status = "done";
        q.stage = def.stages.length - 1;
      } else {
        q.stage = nextStage;
      }
      return;
    }

    case "finishQuest": {
      const q = state.quests[eff.questId];
      if (!q) return;
      q.status = eff.success ? "done" : "failed";
      return;
    }

    case "triggerBattle":
      // Set the intent. The bridge listens for this and drives the side-effect.
      state.pendingBattle = {
        opponentId: eff.opponentId,
        onWin: eff.onWin,
        onLose: eff.onLose,
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

      const luk = state.playerBuild.stats.LUK;
      const fightP = EVENT_PROBABILITY.fight;
      const treasureP = Math.min(
        EVENT_PROBABILITY.treasureCap,
        EVENT_PROBABILITY.treasureBase + luk / EVENT_PROBABILITY.treasureLukDivisor,
      );
      const meetP = Math.min(
        EVENT_PROBABILITY.meetCap,
        EVENT_PROBABILITY.meetBase + luk / EVENT_PROBABILITY.meetLukDivisor,
      );

      const r = Math.random();

      if (r < fightP) {
        const ev = pickWeighted(FIGHT_EVENTS, Math.random());
        if (!ev) return;
        state.flags._skipEventRoll = true;
        state.pendingBattle = {
          opponentId: ev.opponentId,
          onWin: state.lastLocationId,
          onLose: state.lastLocationId,
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

// Convenience: apply an array in order.
export function applyEffects(state: WorldStateData, effects: readonly SceneEffect[]): void {
  for (const e of effects) applyEffect(state, e);
}
