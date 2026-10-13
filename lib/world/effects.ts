import type {
  Condition,
  QuestDef,
  QuestReward,
  SceneEffect,
  SectId,
  SectMembership,
  WorldStateData,
} from "./types";
import { wExpWithGear } from "./gear";
import { recordWorldEvent } from "./shared/events";
import { TRAIT_LABEL } from "./types";
import { getItem, getNpc, getOpponent, scrollItemId } from "./data";
import { getQuest, getQuestsForSect } from "./data/quests";
import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import { SAGA_PROLOGUES } from "./data/story";
import { evaluateCondition, gearlessStat } from "./conditions";
import { HOURS_PER_DAY } from "./clock";
import { absoluteHours, arrestPenalty, bribeCost, describeSentence, jailCityFor, sentenceLeft } from "./law";
import { deathLosableItems } from "./death";
import { JAIL_SCENE_ID } from "./data/activities";
import { STAT_LABEL, deriveAll, getArt, getSkill } from "../game";
import { generatePlayerEcho, noteLeadHeard, playerEchoContext } from "./rumor-engine";
import { sendPlayerEcho, worldRunsOnServer } from "./shared/world";
import { questHolder } from "./npc-life";
import { appendActionLog } from "./action-log";
import {
  REJOIN_COOLDOWN_DAYS, bestSectRank, isRedemptionQuest, isSkillFrozen, membershipStatus, redemptionQuestId, sectJoinCheck,
} from "./sects";
// Walk-tick encounters live in ./encounters; re-exported for existing importers.
export { collectActiveHuntTargets, encounterFoeAvailable, rollFoeSpawn, rollWalkEvent } from "./encounters";

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

    case "leaveSect":
      // Legacy effect (the Gumu defection from Quanzhen): a resignation.
    case "resignSect":
      // Formal resignation (or, on a betrayed membership, forgiveness: the
      // redemption quest). The entry stays "resigned": the sect's moves stop
      // growing, no hunters come, and the sect takes the hero back
      // REJOIN_COOLDOWN_DAYS later (lib/world/sects.ts). Every path — the
      // sect window, a quest reward, a scene — logs it and tells the jianghu.
      resignFromSect(state, eff.sectId);
      return;

    case "betraySect":
      // Defection without leave: the moves keep growing, but the sect's
      // hunters ambush the hero (lib/world/encounters.ts) until the
      // redemption quest is done. A moral wound: evil +5.
      betrayTheSect(state, eff.sectId);
      return;

    case "joinSect": {
      // A first join or the return to a resigned sect (from its first rank;
      // the moves thaw). No-op for an active or betrayed membership. Callers
      // check sectJoinCheck (lib/world/sects.ts) first: the store action
      // and the intro quests' reward do.
      const def = SECT_MEMBERSHIPS[eff.sectId];
      if (!def) return;
      const prev = state.sectMembership[eff.sectId];
      if (prev && membershipStatus(prev) !== "resigned") return;
      const m: SectMembership = prev
        ? {
          ...prev,
          rank: def.startRank,
          points: 0,
          joinedDay: state.day,
          status: "active",
          bestRank: bestSectRank(prev),
        }
        : {
          rank: def.startRank,
          points: 0,
          lastQuestDay: {} as Record<string, number>,
          artQuestsDone: [] as string[],
          rewardPicks: {} as Record<string, string>,
          joinedDay: state.day,
          status: "active",
        };
      delete m.leftDay;
      state.sectMembership[eff.sectId] = m;
      // No martial arts on joining: the sect's lineage quests teach them.
      // The jianghu hears of it (every join, the intro quests' reward included).
      echoDeed(state, "sect_join", eff.sectId);
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
      const rumorId = generatePlayerEcho({
        state,
        actionId: eff.actionId,
        targetNpcId: eff.targetNpcId,
        sectId: eff.sectId,
      });
      // On the game server the world is the server's: it writes the rumor
      // everyone hears from the deed (this one only shows until the next sync).
      if (worldRunsOnServer()) {
        sendPlayerEcho({ actionId: eff.actionId, targetNpcId: eff.targetNpcId, context: playerEchoContext(state, eff.actionId) });
      }
      // The news of what the hero did is part of the shared world: log it as an event.
      const rumor = rumorId ? state.rumorPool.find((r) => r.id === rumorId) : undefined;
      if (rumor) recordWorldEvent(state, { t: "rumor", rumor });
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
      noteLeadHeard(state, eff.rumorId);
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
      // The marks become the sentence — and, for a heavy record, a fine, the
      // seizure of property and the crippling of one's arts (lib/world/law.ts).
      const penalty = arrestPenalty(state.wanted, eff.surrender);
      const report = applyArrestPenalty(state, penalty, eff.surrender);
      state.flags = { ...state.flags, _arrestReport: report.join("\n") };
      state.jailCityId = state.jailCityId ?? jailCityFor(state.lastLocationId);
      state.jailUntil = absoluteHours(state) + penalty.hours;
      state.wanted = 0;
      state.lawEvasions = 0;
      state.wantedDay = state.day;
      state.lastLocationId = JAIL_SCENE_ID;
      state.currentHp = Math.max(1, state.currentHp ?? 1);
      return;
    }

    case "serveJail": {
      // The sentence runs on the world clock (lib/world/clock.ts): this only
      // opens the cell once the time is served; nothing can skip it.
      if (state.jailUntil != null && sentenceLeft(state) > 0) return;
      state.wanted = 0;
      releaseFromJail(state);
      return;
    }

    case "bribeJail": {
      const cost = bribeCost(state.wanted);
      if (state.gold < cost) return;
      state.gold -= cost;
      state.wanted = Math.max(0, state.wanted - 2);
      // Bought off, not caught: the law remembers.
      state.lawEvasions = (state.lawEvasions ?? 0) + 1;
      releaseFromJail(state);
      return;
    }

    default: {
      // Every SceneEffect kind needs a case above: a new variant without one
      // is a type error here instead of an effect that silently does nothing.
      const unhandled: never = eff;
      void unhandled;
    }
  }
}

// ─── Leaving a sect ────────────────────────────────────────────────────
// One place for what leaving costs and how the jianghu hears of it, so the
// sect window (store actions), quest rewards and scenes all agree.

/** Tell the jianghu what the hero did (a player-echo rumor, logged as a world event). */
function echoDeed(state: WorldStateData, actionId: string, sectId?: string): void {
  const rumorId = generatePlayerEcho({ state, actionId, sectId });
  const rumor = rumorId ? state.rumorPool.find((r) => r.id === rumorId) : undefined;
  if (rumor) recordWorldEvent(state, { t: "rumor", rumor });
  // On the game server the world is the server's: it writes the rumor everyone hears.
  if (worldRunsOnServer()) sendPlayerEcho({ actionId, context: playerEchoContext(state, actionId, sectId) });
}

function resignFromSect(state: WorldStateData, sectId: SectId): void {
  const cur = state.sectMembership[sectId];
  if (!cur) return;
  // A fresh entry: a draft shares nested memberships with the state before it.
  const m = { ...cur };
  state.sectMembership[sectId] = m;
  const def = SECT_MEMBERSHIPS[sectId];
  const status = membershipStatus(m);
  if (status === "resigned") return;
  m.status = "resigned";
  m.leftDay = state.day;
  if (status === "betrayed") {
    // The redemption quest: forgiven, the hunters are called off.
    appendActionLog(state, "sect", `${def.name}ให้อภัยแล้ว — นักล่าเลิกตามล่า · นับเป็นผู้ลาออก (กลับเข้าสำนักได้อีกเมื่อพ้น ${REJOIN_COOLDOWN_DAYS} วัน)`);
    return;
  }
  appendActionLog(state, "sect", `ลาออกอย่างเป็นทางการจากสำนัก${def.name} — วิชาที่ได้จากสำนักจะหยุดเลื่อนขั้น · กลับเข้าสำนักได้อีกเมื่อพ้น ${REJOIN_COOLDOWN_DAYS} วัน`);
  // From the public's view a resign and a betray both look like "the hero
  // left" — one actionId, one template pool.
  echoDeed(state, "sect_leave_or_betray", sectId);
}

function betrayTheSect(state: WorldStateData, sectId: SectId): void {
  const cur = state.sectMembership[sectId];
  if (!cur || membershipStatus(cur) !== "active") return;
  const m = { ...cur };
  state.sectMembership[sectId] = m;
  const def = SECT_MEMBERSHIPS[sectId];
  m.status = "betrayed";
  m.leftDay = state.day;
  state.traits.evil = Math.max(0, (state.traits.evil ?? 0) + 5);
  // A redemption done for an earlier betrayal is offered again.
  const redemption = redemptionQuestId(sectId);
  if (state.quests[redemption] && state.quests[redemption].status !== "active") {
    const quests = { ...state.quests };
    delete quests[redemption];
    state.quests = quests;
  }
  appendActionLog(state, "sect", `ทรยศสำนัก${def.name} — ระวังนักล่าจากสำนักจะตามล่าเจ้าในที่ต่าง ๆ`);
  echoDeed(state, "sect_leave_or_betray", sectId);
}

/**
 * Take an arrest's price from the hero: the fine (what they have), seized
 * property (a third of the gold left and half of one or two carried goods),
 * and crippled arts (the best moves lose two levels each). Returns the Thai
 * lines for the arrest report.
 */
export function applyArrestPenalty(state: WorldStateData, penalty: ReturnType<typeof arrestPenalty>, surrendered = false): string[] {
  const lines: string[] = [surrendered ? `มอบตัว · โทษจำคุก ${describeSentence(penalty.hours)} (ลดกึ่งหนึ่ง)` : `โทษจำคุก ${describeSentence(penalty.hours)}`];
  const fine = Math.min(state.gold, penalty.fine);
  if (fine > 0) { state.gold -= fine; lines.push(`ค่าปรับ ${fine.toLocaleString()} ตำลึง`); }
  if (penalty.confiscate) {
    const seized = Math.floor(state.gold / 3);
    state.gold -= seized;
    if (seized > 0) lines.push(`ริบทรัพย์ ${seized.toLocaleString()} ตำลึง`);
    const pool = deathLosableItems(state.inventory);
    const inventory = { ...state.inventory };
    for (let i = 0; i < Math.min(2, pool.length); i++) {
      const [id] = pool.splice(Math.floor(Math.random() * pool.length), 1);
      const count = Math.ceil((inventory[id] ?? 0) / 2);
      if (count <= 0) continue;
      inventory[id] = inventory[id] - count;
      if (inventory[id] <= 0) delete inventory[id];
      lines.push(`ริบ${getItem(id)?.name ?? id} ×${count}`);
    }
    state.inventory = inventory;
  }
  if (penalty.cripple > 0 && state.playerBuild) {
    // The best-trained moves first: skills by level, inner arts by level.
    const moves = [
      ...Object.entries(state.skillLevel).map(([id, lv]) => ({ kind: "skill" as const, id, lv })),
      ...Object.entries(state.playerBuild.artLevels ?? {}).map(([id, lv]) => ({ kind: "art" as const, id, lv: lv ?? 1 })),
    ].filter((m) => m.lv > 1).sort((a, b) => b.lv - a.lv).slice(0, penalty.cripple);
    if (moves.length) {
      const skillLevel = { ...state.skillLevel };
      const artLevels = { ...(state.playerBuild.artLevels ?? {}) };
      for (const m of moves) {
        const to = Math.max(1, m.lv - 2);
        if (m.kind === "skill") { skillLevel[m.id] = to; state.skillExp = { ...state.skillExp, [m.id]: 0 }; }
        else { artLevels[m.id] = to; state.artExp = { ...state.artExp, [m.id]: 0 }; }
        const name = m.kind === "skill" ? getSkill(m.id)?.n : getArt(m.id)?.n;
        lines.push(`ถูกทำลายวรยุทธ: ${name ?? m.id} ลดจากระดับ ${m.lv} เหลือ ${to}`);
      }
      state.skillLevel = skillLevel;
      state.playerBuild = { ...state.playerBuild, artLevels, skillLevels: { ...skillLevel } };
    }
  }
  return lines;
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

// Convenience: apply an array in order. After the batch runs, we tick the
// quest progress so any auto-advance stages whose Condition is now true
// resolve in the same beat (a giveItem effect can immediately complete a
// "gather X" stage, for example).
export function applyEffects(state: WorldStateData, effects: readonly SceneEffect[]): void {
  // A quest dropped and taken again does not pay its start (or mid-quest)
  // gifts twice: see repeatsQuestGifts.
  const repeat = repeatsQuestGifts(state, effects);
  for (const e of effects) {
    if (repeat && applyRepeatGift(state, e)) continue;
    applyEffect(state, e);
  }
  tickQuestProgress(state);
}

// ─── Dropped quests ────────────────────────────────────────────────────
// Abandoning a quest forgets it (the store's abandonQuest): it is offered
// again. What its giver handed over when it began — a letter, a potion, an
// advance in gold — must not be farmed by dropping and retaking it, so the
// flag `qdropped:<questId>` keeps how many of its stages the hero had
// entered (the furthest attempt), and a batch of effects that starts the
// quest again, or advances it past a stage already entered, is a repeat:
//   - items that cannot be sold (letters, keys…) are only topped up to the
//     authored count, so the quest can still be done;
//   - sellable items, gold, positive trait / relationship / sect-point
//     gains are not paid again.
// Costs (negative amounts, takeItem) and everything else apply as usual.

/** The flag that remembers a dropped quest: stages entered (1 = it was begun). */
export function droppedQuestFlag(questId: string): string {
  return `qdropped:${questId}`;
}

function droppedStages(state: WorldStateData, questId: string): number {
  const v = state.flags[droppedQuestFlag(questId)];
  return typeof v === "number" ? v : 0;
}

/** True when this batch pays gifts the hero already had from a dropped attempt. */
export function repeatsQuestGifts(state: WorldStateData, effects: readonly SceneEffect[]): boolean {
  for (const e of effects) {
    if (e.t === "startQuest" && !state.quests[e.questId] && droppedStages(state, e.questId) >= 1) return true;
    if (e.t === "advanceQuest") {
      const q = state.quests[e.questId];
      const def = getQuest(e.questId);
      // Advancing from stage s enters stage s + 1; the final advance (the
      // reward) never happened, since the quest was dropped before it.
      if (q && def && q.status === "active" && q.stage + 1 < def.stages.length && droppedStages(state, e.questId) >= q.stage + 2) return true;
    }
  }
  // A briefing-only offer (`qs_<id>_offer`, shown after the NPC card accepts).
  const offer = /^qs_(.+)_offer$/.exec(state.currentSceneId ?? "");
  return !!offer && droppedStages(state, offer[1]!) >= 1;
}

/** Apply a gift effect the repeat way; false when `e` is not a gift (apply it as usual). */
function applyRepeatGift(state: WorldStateData, e: SceneEffect): boolean {
  switch (e.t) {
    case "giveItem": {
      const want = e.count ?? 1;
      if (want <= 0) return false;
      if ((getItem(e.itemId)?.price ?? 0) > 0) return true;
      if ((state.inventory[e.itemId] ?? 0) < want) state.inventory[e.itemId] = want;
      return true;
    }
    case "addGold":
    case "addTrait":
    case "addNpcRelationship":
    case "addSectPoints":
      return e.amount > 0;
    default:
      return false;
  }
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
        // The worn pieces' ประสบการณ์ยุทธ option raises it (lib/world/gear.ts).
        if (r.amount > 0) state.wExp = Math.max(0, state.wExp + wExpWithGear(state.playerBuild, r.amount));
        break;
      }
      case "skillExp": {
        // A resigned sect's move gains nothing, from any source.
        if (r.amount > 0 && !isSkillFrozen(state, r.skillId)) {
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
      case "joinSect": {
        // The intro quest's reward honours the sect's own rules too
        // (joinRequirements, one sect at a time, no betrayer): a hero who no
        // longer meets them is not admitted, and may ask the sect's master
        // later (the store's joinSect, on their card).
        const def = SECT_MEMBERSHIPS[r.sectId];
        if (!def) break;
        const check = sectJoinCheck(state, r.sectId, { viaQuest: true });
        if (!check.ok) {
          appendActionLog(state, "sect", `${def.name}ยังรับเจ้าเป็นศิษย์ไม่ได้: ${check.reason} — กลับไปขอเข้าสำนักได้เมื่อพร้อม`);
          break;
        }
        applyEffect(state, { t: "joinSect", sectId: r.sectId });
        appendActionLog(state, "sect", `${check.rejoin ? "กลับเข้า" : "เข้าร่วม"}สำนัก${def.name} · ขั้นที่ ${def.startRank}`);
        break;
      }
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

      default: {
        // Every kind needs a case above: a new variant without one is a type error.
        const unhandled: never = r;
        void unhandled;
      }
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
// record `lastQuestDay` (when each was last done) and add to
// `artQuestsDone` if the quest is one-shot art-tagged.
function recordSectQuestCompletion(state: WorldStateData, def: QuestDef): void {
  // Done at last: a dropped attempt no longer matters (a repeatable sect
  // quest's next round pays its gifts in full).
  if (droppedQuestFlag(def.id) in state.flags) {
    const flags = { ...state.flags };
    delete flags[droppedQuestFlag(def.id)];
    state.flags = flags;
  }
  if (!def.sectId) return;
  const m = state.sectMembership[def.sectId];
  if (!m) return;
  // A repeatable quest's turn was stamped when it was taken (acceptSectQuest).
  if (def.isArtQuest) {
    m.lastQuestDay = { ...m.lastQuestDay, [def.id]: state.day };
    if (!m.artQuestsDone.includes(def.id)) m.artQuestsDone = [...m.artQuestsDone, def.id];
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
    const m = state.sectMembership[def.sectId];
    if (isRedemptionQuest(def)) {
      // A betrayer asks the sect's master for forgiveness in person.
      if (!m || membershipStatus(m) !== "betrayed") return false;
    } else {
      if (!isSecretSectQuest(def.id)) return false;
      if (!m || membershipStatus(m) !== "active") return false;
      if (def.minSectRank != null && m.rank > def.minSectRank) return false;
    }
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

/**
 * World days (= real hours) before a repeatable sect quest can be taken again
 * from the sect window: each quest on its own, two real hours after it was
 * last taken.
 */
export const SECT_QUEST_GAP_DAYS = 2;

/**
 * World days (fractional; one is a real hour) until this repeatable sect quest
 * can be taken again, 0 when it can. Its turn is the stamp `acceptSectQuest`
 * leaves in `lastQuestDay` (day + ชั่วยาม / 12).
 */
export function sectQuestWait(state: Pick<WorldStateData, "sectMembership" | "day" | "time">, def: QuestDef): number {
  if (!def.sectId || def.isArtQuest) return 0;
  const last = state.sectMembership[def.sectId]?.lastQuestDay?.[def.id];
  if (typeof last !== "number") return 0;
  return Math.max(0, last + SECT_QUEST_GAP_DAYS - (state.day + (state.time ?? 0) / HOURS_PER_DAY));
}

// Sect-quest offerable check — used by SectMembershipPopup. Honors:
//   - membership prereq
//   - rank gate (def.minSectRank)
//   - each repeatable quest's two-hour turn (sectQuestWait)
//   - one-shot art quests (skipped if id is in artQuestsDone)
//   - in-progress active quests (player can't double-accept)
export function isSectQuestOfferable(
  state: WorldStateData,
  def: QuestDef,
): { offerable: boolean; cooldownLeft: number; reason?: string } {
  if (!def.sectId) return { offerable: false, cooldownLeft: 0, reason: "ไม่ใช่ภารกิจสำนัก" };
  const m = state.sectMembership[def.sectId];
  if (!m) return { offerable: false, cooldownLeft: 0, reason: "ยังไม่ได้เป็นศิษย์" };
  // Only a disciple in good standing takes the sect's work; a redemption is
  // asked for in person (isQuestOfferable), not taken from the sect window.
  if (membershipStatus(m) !== "active") return { offerable: false, cooldownLeft: 0, reason: "ไม่ได้เป็นศิษย์ของสำนักนี้แล้ว" };
  if (isRedemptionQuest(def)) return { offerable: false, cooldownLeft: 0, reason: "ภารกิจไถ่บาปรับได้กับเจ้าสำนักเท่านั้น" };
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
  // Each repeatable quest is taken again two hours after it was last taken
  // (one-shot art quests are gated by artQuestsDone above).
  const wait = sectQuestWait(state, def);
  if (wait > 0) return { offerable: false, cooldownLeft: wait, reason: "ภารกิจนี้รับซ้ำได้ทุก 2 ชั่วโมง" };
  if (def.prereqs && !evaluateCondition(state, def.prereqs)) {
    return { offerable: false, cooldownLeft: 0, reason: "ยังไม่ผ่านเงื่อนไข" };
  }
  return { offerable: true, cooldownLeft: 0 };
}

/**
 * Things to do in one sect's สำนัก window, by its tab: an affordable rank-up
 * (ขั้นและวิชา), the repeatable quests it offers now (ภารกิจประจำ) and the art
 * trials (ลมปราณ). An inactive membership has none. Secret T4 saga trials and
 * the redemption quest are left out — the window never lists them.
 */
export function sectActionsFor(state: WorldStateData, sectId: string): { rankUp: number; quests: number; art: number } {
  const none = { rankUp: 0, quests: 0, art: 0 };
  const m = state.sectMembership[sectId as keyof typeof state.sectMembership];
  if (!m || (m.status ?? "active") !== "active") return none;
  const def = SECT_MEMBERSHIPS[sectId as keyof typeof SECT_MEMBERSHIPS];
  if (!def) return none;
  const out = { ...none, rankUp: m.rank > def.topRank && m.points >= def.rankUpCost(m.rank - 1) ? 1 : 0 };
  for (const quest of getQuestsForSect(sectId)) {
    if (isSecretSectQuest(quest.id) || isRedemptionQuest(quest)) continue;
    if (!isSectQuestOfferable(state, quest).offerable) continue;
    if (quest.isArtQuest) out.art++;
    else out.quests++;
  }
  return out;
}

/** The สำนัก menu badge: every tab's count (sectActionsFor) over the active memberships. */
export function sectActionCount(state: WorldStateData): number {
  let count = 0;
  for (const sectId of Object.keys(state.sectMembership)) {
    const a = sectActionsFor(state, sectId);
    count += a.rankUp + a.quests + a.art;
  }
  return count;
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
      // A lone line (the other ways have none, e.g. a waived spar) needs no "or".
      return lines.length > 1 ? lines.map((l) => ({ ...l, label: `(หรือ) ${l.label}` })) : lines;
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
