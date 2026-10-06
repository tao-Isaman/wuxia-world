// Time and life-and-death inside an action's draft: the clock (with the
// liveness tick, rumors, letters and the tournament calendar), death and
// waking at home, killings and the quests of the dead.
import { DEATH_REVIVE_FRACTION, DEATH_REVIVE_PLACE, applyDeathPenalty, describeDeathPenalty, rollDeathPenalty } from "@/lib/world/death";
import { deriveAll } from "@/lib/game";
import { rollLetters } from "@/lib/world/letters";
import { currentTournament, entrantName, finishTournament, prizeName, resolveRound, sendTournamentInvitation, settleTournaments, ROUND_LABEL, PLACE_LABEL, TOURNAMENT_NAME } from "@/lib/world/tournament";
import { getNpc, getQuest, type WorldStateData } from "@/lib/world";
import { applyEffect } from "@/lib/world/effects";
import { tickAllNamedNpcs } from "@/lib/world/npc-tick";
import { deadIds, killNpc, settleChargesOfDead, type ChargeChange } from "@/lib/world/npc-life";
import { KILL_MARKS, WANTED_DECAY_DAYS } from "@/lib/world/law";
import { maintainRumors } from "@/lib/world/rumor-engine";
import { toast } from "@/store/toast-store";
import { SECT_MEMBERSHIPS } from "@/lib/world/data/sect-memberships";
import { HOURS_PER_DAY } from "./rules";
import { appendActionLog } from "./state";

/**
 * A fallen hero is carried home: pay the price of death (half the gold, some
 * items), lose a day, wake at home with 30 % HP / MP. Returns the report lines.
 */
export function reviveFromDeath(draft: WorldStateData, rng: () => number = Math.random): string[] {
  const penalty = rollDeathPenalty(draft, rng);
  applyDeathPenalty(draft, penalty);
  const lines = describeDeathPenalty(penalty);
  draft.gameOver = false;
  draft.pendingBattle = null;
  draft.pendingEncounter = null;
  draft.pendingSpar = null;
  draft.pendingHuntYield = null;
  advanceTime(draft, HOURS_PER_DAY);
  const d = draft.playerBuild ? deriveAll(draft.playerBuild) : null;
  draft.currentHp = Math.max(1, Math.floor((d?.HP ?? 1) * DEATH_REVIVE_FRACTION));
  draft.currentMp = Math.max(0, Math.floor((d?.MP ?? 0) * DEATH_REVIVE_FRACTION));
  draft.currentSceneId = DEATH_REVIVE_PLACE;
  draft.lastLocationId = DEATH_REVIVE_PLACE;
  appendActionLog(draft, "battle", `ล้มลงในการต่อสู้ — ฟื้นขึ้นที่บ้านในวันรุ่งขึ้น · ${lines.join(" · ")}`);
  return lines;
}
// In-place time advance. Rolls `time` over each `HOURS_PER_DAY` and
// increments `day`. Negative deltas are not supported (game time is one-way).
export function advanceTime(state: WorldStateData, hours: number): void {
  if (hours <= 0) return;
  const dayBefore = state.day;
  let total = state.time + hours;
  let day = state.day;
  while (total >= HOURS_PER_DAY) {
    total -= HOURS_PER_DAY;
    day++;
  }
  state.time = total;
  state.day = day;
  // Wanted marks fade one at a time after WANTED_DECAY_DAYS without a new crime.
  while (state.wanted > 0 && state.day - state.wantedDay >= WANTED_DECAY_DAYS) {
    state.wanted -= 1;
    state.wantedDay += WANTED_DECAY_DAYS;
  }
  // ─── Liveness Layer hook ────────────────────────────────────────────
  // After the clock has advanced to its final value, run NPC simulation
  // + rumor housekeeping ONCE per advanceTime call. The tick engine
  // batches internally based on (state.day - state.lastNpcTickDay) and
  // throttles to ≤ 4 batches per call, so the cost stays bounded even
  // when the player advances by 90+ days at once. After ticking, scan
  // for any active quest whose `giverNpcId` died this batch and auto-
  // fail it — see decision §3 in docs/specs/liveness-plan.md.
  withChargesOfDead(state, () => {
    tickAllNamedNpcs(state, { currentDay: state.day });
  });
  maintainRumors(state, state.day);
  // A new day: friends may write (lib/world/letters.ts), and a tournament
  // whose days have passed is settled (lib/world/tournament.ts).
  if (state.day > dayBefore) {
    for (const letter of rollLetters(state, dayBefore)) {
      appendActionLog(state, "letter", `ได้รับจดหมายจาก${getNpc(letter.npcId)?.name ?? "สหาย"}`);
    }
    // Registration opens: Huashan's chief invites the hero to the tournament.
    const invite = sendTournamentInvitation(state, dayBefore);
    if (invite) appendActionLog(state, "letter", `ได้รับจดหมายเชิญร่วม${TOURNAMENT_NAME}จาก${getNpc(invite.npcId)?.name ?? "สำนักหัวซาน"}`);
    const before = state.tournamentHistory.length;
    settleTournaments(state);
    const record = state.tournamentHistory[state.tournamentHistory.length - 1];
    if (state.tournamentHistory.length > before && record) {
      appendActionLog(state, "tournament", `ชุมนุมวิจารณ์กระบี่เขาหัวซานปีที่ ${record.year} จบลง · ผู้ชนะเลิศ ${entrantName(record.champion, state.playerBuild?.name)}`);
    }
  }
}

// Settle the hero's tournament bout: advance the bracket, log the result and
// pay out; once the hero is out the rest of the bracket is simulated.
export function settleTournamentBout(state: WorldStateData, won: boolean): void {
  const t = currentTournament(state);
  if (!t) return;
  const round = t.round;
  const outcome = resolveRound(state, won);
  const heroName = state.playerBuild?.name;
  appendActionLog(state, "tournament", won
    ? `ชุมนุมวิจารณ์กระบี่เขาหัวซาน · ชนะ${ROUND_LABEL[round] ?? ""} · +${outcome.gold} ตำลึง · +${outcome.wExp} w-exp`
    : `ชุมนุมวิจารณ์กระบี่เขาหัวซาน · ตกรอบ${ROUND_LABEL[round] ?? ""}`);
  const after = currentTournament(state);
  if (after?.playerOut && after.status === "running") finishTournament(state);
  const done = currentTournament(state);
  if (done?.status === "finished") {
    const place = done.playerPlace;
    appendActionLog(state, "tournament",
      `ชุมนุมวิจารณ์กระบี่เขาหัวซานจบลง · ผู้ชนะเลิศ ${entrantName(done.champion!, heroName)}` +
      (place ? ` · ท่านได้${PLACE_LABEL[place] ?? `อันดับ ${place}`}` : "") +
      (done.champion !== "player" && done.championPick ? ` · เลือกวิชา ${prizeName(done.championPick)}` : ""));
  }
}

/** Marks for an attempt on someone's life that did not end in their death. */
export const ATTEMPTED_MURDER_MARKS = 2;
export function markAttemptedMurder(state: WorldStateData, npcId: string): void {
  state.wanted = (state.wanted ?? 0) + ATTEMPTED_MURDER_MARKS;
  state.wantedDay = state.day;
  appendActionLog(state, "law", `ลงมือหมายเอาชีวิต${getNpc(npcId)?.name ?? "ผู้คน"}แต่ไม่สำเร็จ · หมายจับ ${state.wanted}`);
}

/**
 * The hero has killed someone (an open fight or an assassination): they are
 * dead for good (their seat and quests pass on), the hero is wanted at the
 * top of the list at once, and the jianghu talks. Killing one's own
 * sect-mates is betrayal.
 */
export function heroKills(state: WorldStateData, npcId: string): void {
  const npc = getNpc(npcId);
  const sect = state.npcExt[npcId]?.sect ?? null;
  withChargesOfDead(state, () => {
    killNpc(state, npcId, state.day, { by: "player", kind: "killed_by_player", locationId: state.currentSceneId });
  });
  if (!state.assassinatedNpcIds.includes(npcId)) state.assassinatedNpcIds = [...state.assassinatedNpcIds, npcId];
  state.wanted = (state.wanted ?? 0) + KILL_MARKS;
  state.wantedDay = state.day;
  state.traits.evil = (state.traits.evil ?? 0) + 10;
  state.traits.fame = (state.traits.fame ?? 0) + 3;
  appendActionLog(state, "law", `สังหาร${npc?.name ?? "ผู้คน"} — ทางการออกหมายจับทั่วแผ่นดิน · หมายจับ ${state.wanted}`);
  applyEffect(state, { t: "firePlayerEcho", actionId: "kill_npc", targetNpcId: npcId });
  const own = sect ? state.sectMembership[sect] : undefined;
  if (sect && own && (own.status ?? "active") === "active") {
    applyEffect(state, { t: "betraySect", sectId: sect });
    appendActionLog(state, "sect", `สังหารคนในสำนัก${SECT_MEMBERSHIPS[sect].name} — นับเป็นการทรยศสำนัก`);
  }
}

// Run `change` (the NPC tick, or the hero's own killing) and then settle the
// quests of everyone who died in it: a dead giver's charges pass to their heir
// or their sect's chief (lib/world/npc-life.ts), else the quest fails. The
// player is told either way.
export function withChargesOfDead(state: WorldStateData, change: () => void): ChargeChange[] {
  const before = deadIds(state);
  change();
  const newly = new Set([...deadIds(state)].filter((id) => !before.has(id)));
  const changes = settleChargesOfDead(state, newly, getQuest);
  for (const c of changes) {
    const dead = getNpc(c.deadId)?.name ?? c.deadId;
    const line = c.holderId
      ? `${dead} เสียชีวิต — ภารกิจ '${c.questName}' ตกเป็นหน้าที่ของ${getNpc(c.holderId)?.name ?? "ผู้สืบทอด"}`
      : `${dead} เสียชีวิต — ภารกิจ '${c.questName}' หยุดลง`;
    appendActionLog(state, "quest", line);
    toast(c.holderId ? "info" : "warn", line);
  }
  return changes;
}
