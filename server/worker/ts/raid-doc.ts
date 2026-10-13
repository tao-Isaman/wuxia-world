// A world boss and the party fights for it (docs/online.md "World bosses").
// Pure: RaidObject (raid-object.ts) keeps one RaidDoc per boss and calls these.
//
// There is one of each legendary beast for everyone. A party's leader, at the
// beast's lair, opens a fight; party members at the lair join; the fight
// begins when all have joined (or the leader starts it with two or more).
// While it runs nobody else can take the beast on. The server plays the fight
// (lib/game/grid/session.ts): a person sends what they want their unit to do
// when it holds the turn, the AI plays the foes (and anyone whose time ran out,
// or who went quiet), and every screen replays the same commands. Won, the
// beast is gone for three real hours and every member's spoils are rolled for
// them; lost, called off or abandoned, the beast is free again at full strength.
import { deriveAll } from "@/lib/game/derive";
import type { CharacterBuild } from "@/lib/game/types";
import type { UnitSpec } from "@/lib/game/grid/types";
import { activeUnit } from "@/lib/game/grid/engine";
import {
  humanToAct, playerAction, setUnitAuto, startSession, stepSession, stepUntilHuman,
  type BattleCommand, type BattleSession, type BattleStartOpts,
} from "@/lib/game/grid/session";
import { currentOutfit } from "@/lib/world/appearance";
import { playerLook, worldBattleSetup } from "@/lib/world/battle-looks";
import { playerPowerIndex } from "@/lib/world/data/random-events";
import { setOpponentStatScale } from "@/lib/world/data/opponents";
import { getBoss } from "@/lib/world/data/bosses";
import { rollVictorySpoilsFrom } from "@/lib/world/spoils";
import type { PendingBattle, WorldStateData } from "@/lib/world/types";
import type { BattleVerdict } from "@/lib/net/play-protocol";
import { RAID_RULES, type BossStatus, type RaidIntent, type RaidView } from "@/lib/net/raid-protocol";
import { isArtFrozen, isSkillFrozen } from "@/store/world/progression";
import { emptyData } from "@/store/world/state";

/** The units of a party fight, in order: the leader, then the others. */
export const RAID_UNITS = ["A", "P2", "P3", "P4"] as const;

type SpoilsContext = Pick<WorldStateData, "pendingSpar" | "pendingHuntYield" | "lifeSkillXp" | "sectMembership" | "currentSceneId" | "day">;

export interface RaidMember {
  player: string;
  name: string;
  unit: string;
  characterId: string | null;
  joined: boolean;
  /** The last time the server heard from them (ms). */
  seen: number;
  /** What their hero brings (from their save when they joined). */
  hero?: { build: CharacterBuild; hp: number | null; mp: number | null; look: UnitSpec["look"]; context: SpoilsContext; power: number };
}

export interface RaidFight {
  id: string;
  phase: "gather" | "battle" | "over";
  leader: string;
  members: RaidMember[];
  openedAt: number;
  startedAt: number | null;
  endedAt: number | null;
  seed: number;
  /** The fight as staged (battle phase on). */
  start: { a: CharacterBuild; b: CharacterBuild; opts: BattleStartOpts } | null;
  pending: PendingBattle | null;
  commands: BattleCommand[];
  /** When the gathering or the turn runs out (ms). */
  deadline: number | null;
  /** Who held the turn when the deadline was set. */
  turnOf: string | null;
  verdicts: Record<string, BattleVerdict> | null;
}

export interface RaidDoc {
  bossId: string;
  fellAt: number | null;
  fellBy: string[] | null;
  fight: RaidFight | null;
}

export const newRaidDoc = (bossId: string): RaidDoc => ({ bossId, fellAt: null, fellBy: null, fight: null });

/** Whether the beast waits at its lair now (never felled, or back after three hours). */
export const bossUp = (doc: RaidDoc, now: number) => doc.fellAt === null || now - doc.fellAt >= RAID_RULES.respawnMs;

const live = (fight: RaidFight | null): fight is RaidFight => !!fight && fight.phase !== "over";

export function bossStatus(doc: RaidDoc): BossStatus {
  const fight = live(doc.fight) ? doc.fight : null;
  return {
    fellAt: doc.fellAt,
    fellBy: doc.fellBy,
    fighting: fight ? fight.members.find((m) => m.player === fight.leader)?.name ?? fight.leader : null,
  };
}

/** A member's hero from their save, or why it cannot fight here. */
export function heroFromSave(save: WorldStateData | null | undefined, lair: string): RaidMember["hero"] | "no_hero" | "not_here" | "busy" {
  if (!save?.hasGame || !save.playerBuild) return "no_hero";
  if (save.currentSceneId !== lair) return "not_here";
  if (save.jailUntil) return "busy";
  return {
    build: save.playerBuild,
    hp: typeof save.currentHp === "number" ? save.currentHp : null,
    mp: typeof save.currentMp === "number" ? save.currentMp : null,
    look: playerLook(save.playerBodyId, save.appearance ? currentOutfit(save) : null),
    power: playerPowerIndex({ ...emptyData(), ...save } as WorldStateData),
    context: {
      pendingSpar: save.pendingSpar ?? null,
      pendingHuntYield: save.pendingHuntYield ?? null,
      lifeSkillXp: save.lifeSkillXp ?? {},
      sectMembership: save.sectMembership ?? {},
      currentSceneId: save.currentSceneId,
      day: save.day,
    },
  };
}

export type RaidError =
  | "no_boss" | "resting" | "taken" | "party_small" | "party_large" | "not_leader" | "no_hero" | "not_here" | "busy"
  | "no_fight" | "not_member" | "not_gathering" | "not_battle" | "not_your_turn" | "bad_intent";

/**
 * The leader opens a fight: their party (usernames and hero names, the leader
 * first) and the leader's save. The leader has joined; the others are asked.
 */
export function openRaid(
  doc: RaidDoc,
  leader: { player: string; characterId: string; save: WorldStateData },
  party: { player: string; name: string }[],
  ids: { id: string; seed: number },
  now: number,
): RaidError | null {
  const boss = getBoss(doc.bossId);
  if (!boss) return "no_boss";
  if (!bossUp(doc, now)) return "resting";
  sweep(doc, now);
  if (live(doc.fight)) return "taken";
  if (party.length < RAID_RULES.minParty) return "party_small";
  if (party.length > RAID_RULES.maxParty) return "party_large";
  if (party[0]?.player !== leader.player) return "not_leader";
  const hero = heroFromSave(leader.save, boss.lair);
  if (typeof hero === "string") return hero;
  doc.fight = {
    id: ids.id,
    phase: "gather",
    leader: leader.player,
    members: party.map((m, i) => ({
      player: m.player, name: m.name, unit: RAID_UNITS[i]!, characterId: i === 0 ? leader.characterId : null,
      joined: i === 0, seen: now, ...(i === 0 ? { hero } : {}),
    })),
    openedAt: now, startedAt: null, endedAt: null, seed: ids.seed,
    start: null, pending: null, commands: [], deadline: now + RAID_RULES.gatherMs, turnOf: null, verdicts: null,
  };
  if (leader.save.playerBuild?.name) doc.fight.members[0]!.name = leader.save.playerBuild.name;
  return null;
}

/** A party member joins the fight being gathered (they must stand at the lair). */
export function joinRaid(doc: RaidDoc, fightId: string, member: { player: string; characterId: string; save: WorldStateData }, now: number): RaidError | null {
  const fight = doc.fight;
  if (!live(fight) || fight.id !== fightId) return "no_fight";
  if (fight.phase !== "gather") return "not_gathering";
  const m = fight.members.find((x) => x.player === member.player);
  if (!m) return "not_member";
  const hero = heroFromSave(member.save, getBoss(doc.bossId)!.lair);
  if (typeof hero === "string") return hero;
  Object.assign(m, { joined: true, characterId: member.characterId, seen: now, hero, name: member.save.playerBuild?.name || m.name });
  return null;
}

/** HP a foe gets for a party of `size` (each person after the first adds 60 % of its own). */
export function partyScaled(build: CharacterBuild, size: number): CharacterBuild {
  if (size <= 1) return build;
  const hp = deriveAll(build).HP;
  return { ...build, baseHp: (build.baseHp ?? 0) + Math.round(hp * 0.6 * (size - 1)) };
}

/** Begin the fight with the members who joined (the leader asks, or everyone is in). Returns the session. */
export function beginRaid(doc: RaidDoc, now: number): BattleSession | RaidError {
  const fight = doc.fight;
  if (!live(fight)) return "no_fight";
  if (fight.phase !== "gather") return "not_gathering";
  const members = fight.members.filter((m) => m.joined && m.hero);
  if (members.length < RAID_RULES.minParty) return "party_small";
  // The ones who did not come are left out; units are given in order again.
  fight.members = members.map((m, i) => ({ ...m, unit: RAID_UNITS[i]! }));
  const leader = fight.members[0]!;
  // The beast meets the party as strong as its strongest member has made foes.
  const power = Math.max(...fight.members.map((m) => m.hero!.power));
  setOpponentStatScale(1 + power * 0.6);
  const setup = worldBattleSetup(doc.bossId, { withPack: true, power });
  if (!setup) return "no_boss";
  const size = fight.members.length;
  const start = {
    a: leader.hero!.build,
    b: partyScaled(setup.build, size),
    opts: {
      hpA: leader.hero!.hp ?? undefined,
      mpA: leader.hero!.mp ?? undefined,
      looks: { A: leader.hero!.look, B: setup.looks.B },
      enemies: setup.enemies.map((e) => ({ ...e, build: partyScaled(e.build, size) })),
      allies: fight.members.slice(1).map((m) => ({
        id: m.unit, team: "ally" as const, build: m.hero!.build, look: m.hero!.look, hp: m.hero!.hp ?? undefined, mp: m.hero!.mp ?? undefined,
      })),
      humans: fight.members.map((m) => m.unit),
    } satisfies BattleStartOpts,
  };
  fight.start = start;
  fight.pending = { opponentId: doc.bossId, onWin: getBoss(doc.bossId)!.lair, onLose: getBoss(doc.bossId)!.lair, withPack: true };
  fight.phase = "battle";
  fight.startedAt = now;
  const session = sessionOf(fight);
  advance(fight, session, now);
  return session;
}

/** A fresh session of the fight, replaying its commands. */
export function sessionOf(fight: RaidFight): BattleSession {
  const session = startSession(fight.start!.a, fight.start!.b, { ...fight.start!.opts, seed: fight.seed });
  for (const command of fight.commands) {
    // Replays what this server made; a mismatch would be a bug, so stop there.
    if (!replay(session, command)) break;
  }
  session.commands = [...fight.commands];
  return session;
}

function replay(session: BattleSession, command: BattleCommand): boolean {
  switch (command[0]) {
    case "s": return stepSession(session);
    case "x": return stepSession(session, true);
    case "u": return setUnitAuto(session, command[1], command[2] === 1);
    case "m": return playerAction(session, { t: "move", to: { x: command[1], y: command[2] } });
    case "a": return playerAction(session, { t: "skill", slot: command[1], target: { x: command[2], y: command[3] } });
    case "w": return playerAction(session, { t: "wait" });
    default: return false;
  }
}

/** After a person's command: the AI plays until someone must act; the turn's clock restarts; a finished fight is judged. */
function advance(fight: RaidFight, session: BattleSession, now: number): void {
  stepUntilHuman(session);
  fight.commands = [...(session.commands ?? [])];
  const who = humanToAct(session);
  if (who !== fight.turnOf) {
    fight.turnOf = who;
    fight.deadline = who ? now + RAID_RULES.turnMs : null;
  }
  if (session.state.phase === "over") fight.deadline = null;
}

/** A person's move, for their own unit when it holds the turn. */
export function actRaid(doc: RaidDoc, session: BattleSession, player: string, intent: RaidIntent, now: number): RaidError | null {
  const fight = doc.fight;
  if (!live(fight)) return "no_fight";
  if (fight.phase !== "battle") return "not_battle";
  const m = fight.members.find((x) => x.player === player);
  if (!m) return "not_member";
  m.seen = now;
  if (intent.t === "auto") {
    if (!setUnitAuto(session, m.unit, !!intent.on)) return null;
    advance(fight, session, now);
    return null;
  }
  if (humanToAct(session) !== m.unit) return "not_your_turn";
  const ok = intent.t === "move" ? valid(intent.to) && playerAction(session, { t: "move", to: { x: intent.to.x, y: intent.to.y } })
    : intent.t === "skill" ? Number.isInteger(intent.slot) && valid(intent.target) && playerAction(session, { t: "skill", slot: intent.slot, target: { x: intent.target.x, y: intent.target.y } })
    : intent.t === "wait" ? playerAction(session, { t: "wait" })
    : false;
  if (!ok) return "bad_intent";
  // A move keeps the turn (the action comes next): its clock does not restart.
  const keep = intent.t === "move" && humanToAct(session) === m.unit;
  const deadline = fight.deadline;
  advance(fight, session, now);
  if (keep) fight.deadline = deadline;
  return null;
}

const valid = (c: { x?: unknown; y?: unknown } | undefined): c is { x: number; y: number } =>
  !!c && Number.isInteger(c.x) && Number.isInteger(c.y) && (c.x as number) >= 0 && (c.y as number) >= 0 && (c.x as number) < 64 && (c.y as number) < 64;

/**
 * Time passing: a gathering that ran out begins (or ends, too few came); a
 * turn that ran out is played by the AI; the quiet are played by the AI; a
 * fight that went on too long is called off. Returns the session (made when
 * the fight began here).
 */
export function tickRaid(doc: RaidDoc, session: BattleSession | null, now: number): BattleSession | null {
  const fight = doc.fight;
  if (!live(fight)) return session;
  if (fight.phase === "gather") {
    if (fight.deadline !== null && now >= fight.deadline) {
      const begun = beginRaid(doc, now);
      if (typeof begun === "string") { fight.phase = "over"; fight.endedAt = now; fight.verdicts = {}; return null; }
      return begun;
    }
    return session;
  }
  session ??= sessionOf(fight);
  if (fight.startedAt !== null && now - fight.startedAt > RAID_RULES.fightMs) {
    callOff(doc, now);
    return session;
  }
  for (const m of fight.members) {
    if (now - m.seen > RAID_RULES.idleMs && !session.autoUnits.includes(m.unit)) setUnitAuto(session, m.unit, true);
  }
  if (fight.deadline !== null && now >= fight.deadline && fight.turnOf) {
    const unit = fight.turnOf;
    // The AI plays the rest of that turn (a move and then an action at most).
    for (let i = 0; i < 3 && humanToAct(session) === unit && activeUnit(session.state)?.id === unit; i++) {
      if (!stepSession(session, true)) break;
    }
    fight.turnOf = null;
  }
  advance(fight, session, now);
  return session;
}

/** The fight took too long: nobody wins, the beast is free again. */
function callOff(doc: RaidDoc, now: number): void {
  const fight = doc.fight!;
  fight.phase = "over";
  fight.endedAt = now;
  fight.deadline = null;
  fight.verdicts = Object.fromEntries(fight.members.map((m) => [m.player, {
    battleId: fight.id, winner: null, escaped: true, hA: m.hero?.hp ?? 1, mpA: m.hero?.mp ?? 0, itemsUsed: {}, spoils: null,
  } satisfies BattleVerdict]));
}

/** A fight that just ended: every member's verdict (and spoils on a win); a win fells the beast. Returns whether it was won. */
export function judgeRaid(doc: RaidDoc, session: BattleSession, now: number): boolean | null {
  const fight = doc.fight;
  if (!live(fight) || fight.phase !== "battle" || session.state.phase !== "over") return null;
  const state = session.state;
  const won = state.winnerTeam === "ally" && !state.escaped;
  const verdicts: Record<string, BattleVerdict> = {};
  for (const m of fight.members) {
    const unit = state.units.find((u) => u.id === m.unit);
    // The spoils read the hero's own moves: a view of the fight with this member as its leader.
    const view = unit ? { ...state, skillUses: { ...state.skillUses, A: { ...unit.skillUses } }, artUses: { ...state.artUses, A: { ...unit.artUses } } } : state;
    const context = { ...emptyData(), ...m.hero!.context, pendingBattle: fight.pending } as WorldStateData;
    const spoils = won
      ? rollVictorySpoilsFrom(context, fight.pending!, view, (kind, id) => (kind === "skill" ? isSkillFrozen(context, id) : isArtFrozen(context, id)))
      : null;
    verdicts[m.player] = {
      battleId: fight.id,
      winner: won ? "A" : "B",
      escaped: false,
      // A member who fell in a won fight still walks away (with a little life left).
      hA: unit ? (won ? Math.max(1, unit.hp) : unit.hp) : 0,
      mpA: unit?.mp ?? 0,
      itemsUsed: {},
      spoils,
    };
  }
  fight.verdicts = verdicts;
  fight.phase = "over";
  fight.endedAt = now;
  fight.deadline = null;
  if (won) {
    doc.fellAt = now;
    doc.fellBy = fight.members.map((m) => m.name);
  }
  return won;
}

/** A fight long over is forgotten (its verdicts kept a while for the slow to fetch). */
function sweep(doc: RaidDoc, now: number): void {
  const fight = doc.fight;
  if (fight && fight.phase === "over" && fight.endedAt !== null && now - fight.endedAt > 10 * 60_000) doc.fight = null;
}

/** What `player` sees: the beast, and the fight they belong to (commands from `from`). */
export function raidView(doc: RaidDoc, player: string, from: number, now: number): RaidView {
  const fight = doc.fight;
  const m = fight?.members.find((x) => x.player === player);
  if (!fight || !m) return { bossId: doc.bossId, boss: bossStatus(doc), fight: null };
  m.seen = now;
  const at = Math.max(0, Math.min(Number.isInteger(from) ? from : 0, fight.commands.length));
  return {
    bossId: doc.bossId,
    boss: bossStatus(doc),
    fight: {
      id: fight.id,
      phase: fight.phase,
      leader: fight.leader,
      members: fight.members.map((x) => ({ player: x.player, name: x.name, unit: x.unit, joined: x.joined })),
      me: m.unit,
      deadline: fight.deadline,
      ...(fight.start && at === 0 ? { start: { ...fight.start, seed: fight.seed } } : {}),
      from: at,
      commands: fight.commands.slice(at),
      total: fight.commands.length,
      ...(fight.verdicts?.[player] ? { verdict: fight.verdicts[player] } : {}),
    },
  };
}
