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
import { now, worldTimeAt } from "@/lib/world/clock";
import { appendActionLog, heroTag, setDraftClock } from "./state";
import { emitWorldEvent } from "@/lib/world/shared/events";

/**
 * A fallen hero is carried home: pay the price of death (half the gold, some
 * items), wake at home at once with 30 % HP / MP. Returns the report lines.
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
  const d = draft.playerBuild ? deriveAll(draft.playerBuild) : null;
  draft.currentHp = Math.max(1, Math.floor((d?.HP ?? 1) * DEATH_REVIVE_FRACTION));
  draft.currentMp = Math.max(0, Math.floor((d?.MP ?? 0) * DEATH_REVIVE_FRACTION));
  draft.currentSceneId = DEATH_REVIVE_PLACE;
  draft.lastLocationId = DEATH_REVIVE_PLACE;
  appendActionLog(draft, "battle", `ล้มลงในการต่อสู้ — ฟื้นขึ้นที่บ้าน · ${lines.join(" · ")}`);
  return lines;
}
/** Stamina refills fully over this many ชั่วยาม (30 real minutes). */
export const STAMINA_REFILL_HOURS = 6;
/** HP / MP out of battle refill fully over this many ชั่วยาม (one real hour). */
export const VITALS_REFILL_HOURS = 12;

/**
 * Bring the state up to the world clock (lib/world/clock.ts): set `day` /
 * `time` from the real time and run what the time passing brings — stamina,
 * HP and MP regeneration, wanted marks fading, the NPC simulation, rumor
 * upkeep, and on a new day letters and the tournament calendar. Time never
 * goes back; nothing else moves the clock.
 */
export function syncClock(state: WorldStateData, at: number = now()): void {
  const target = worldTimeAt(at);
  const from = state.day + state.time / HOURS_PER_DAY;
  const to = target.day + target.time / HOURS_PER_DAY;
  if (!(to > from)) return;
  const dayBefore = state.day;
  const hours = (to - from) * HOURS_PER_DAY;
  state.day = target.day;
  state.time = target.time;
  if (!state.hasGame) return;
  // Back after a day or more: the log says how long the world went on without them.
  const away = Math.floor(to - from);
  if (away >= 1) appendActionLog(state, "time", `ระหว่างที่ท่านไม่อยู่ ผ่านไป ${away} วัน`);
  regenerate(state, hours);
  // Wanted marks fade one at a time after WANTED_DECAY_DAYS without a new crime.
  while (state.wanted > 0 && state.day - state.wantedDay >= WANTED_DECAY_DAYS) {
    state.wanted -= 1;
    state.wantedDay += WANTED_DECAY_DAYS;
  }
  // ─── Liveness Layer hook ────────────────────────────────────────────
  // Run the NPC simulation + rumor housekeeping once the clock is set. The
  // tick engine batches by (state.day - state.lastNpcTickDay) and throttles
  // its full weeks per call (a long absence only ages people past that); each
  // week draws from the world seed, so every machine sees the same week.
  // Active quests whose giver died are moved or failed (withChargesOfDead).
  withChargesOfDead(state, () => {
    tickAllNamedNpcs(state, { currentDay: state.day, seed: state.worldSeed });
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

/**
 * Stamina, HP and MP come back as time passes (not mid-battle, not when
 * fallen). The pools stay whole numbers; the fraction not yet earned is
 * carried in flags (`_regenSt` / `_regenHp` / `_regenMp`) to the next sync.
 */
function regenerate(state: WorldStateData, hours: number): void {
  if (hours <= 0 || state.pendingBattle || state.gameOver) return;
  const gain = (pool: "St" | "Hp" | "Mp", perHour: number, cur: number, max: number): number => {
    const key = `_regen${pool}`;
    if (cur >= max) { delete state.flags[key]; return cur; }
    const total = Number(state.flags[key] ?? 0) + perHour * hours;
    const whole = Math.floor(total);
    state.flags[key] = total - whole;
    return Math.min(max, cur + whole);
  };
  state.stamina = gain("St", state.staminaMax / STAMINA_REFILL_HOURS, state.stamina, state.staminaMax);
  if (!state.playerBuild) return;
  const d = deriveAll(state.playerBuild);
  state.currentHp = gain("Hp", d.HP / VITALS_REFILL_HOURS, state.currentHp, d.HP);
  state.currentMp = gain("Mp", d.MP / VITALS_REFILL_HOURS, state.currentMp, d.MP);
}

/** Stamina an action that used to take `hours` ชั่วยาม costs now (5 per ชั่วยาม, at least 2). */
export function staminaForHours(hours: number): number {
  return Math.max(2, Math.round(5 * hours));
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
  // A death in the shared world: a world event (lib/world/shared/events.ts).
  withChargesOfDead(state, () => {
    emitWorldEvent(state, { t: "npc_killed", npcId, byPlayer: heroTag(state), day: state.day, locationId: state.currentSceneId });
  });
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

// Every action draft starts on the world clock.
setDraftClock((draft) => syncClock(draft));
