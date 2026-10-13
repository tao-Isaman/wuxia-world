// A battle the game server checks (docs/online.md "Battles on the server").
// Pure: BattleObject (battle-object.ts) keeps the record and calls these.
//
// The server stages the fight from the character's saved state — the same
// pure code the browser uses (lib/world/battle-setup.ts) — and picks the seed.
// The browser plays it and sends its command log; the server replays every
// command on its own session (lib/game/grid/session.ts) and so knows the true
// outcome, whatever the browser claims. A won fight's spoils are rolled here.
import { getOpponent } from "@/lib/world/data/opponents";
import { getBoss } from "@/lib/world/data/bosses";
import { battleItemOf, worldBattleStart, type WorldBattleStart } from "@/lib/world/battle-setup";
import { rollVictorySpoilsFrom, type VictorySpoils } from "@/lib/world/spoils";
import { SOCIAL_LIMITS } from "@/lib/net/social-protocol";
import type { PendingBattle, WorldStateData } from "@/lib/world/types";
import { applyCommand, startSession, type BattleCommand, type BattleSession } from "@/lib/game/grid/session";
import type { BattleVerdict } from "@/lib/net/play-protocol";
import { isArtFrozen, isSkillFrozen } from "@/store/world/progression";
import { emptyData } from "@/store/world/state";

/** Commands one battle may log (a long boss fight is a few hundred). */
export const MAX_COMMANDS = 20_000;
/** Commands one request may carry. */
export const MAX_COMMANDS_PER_CALL = 2_000;

/** What the spoils roll reads from the hero's state. */
type SpoilsContext = Pick<WorldStateData, "pendingSpar" | "pendingHuntYield" | "lifeSkillXp" | "sectMembership" | "currentSceneId" | "day">;

export interface BattleRecord {
  battleId: string;
  seed: number;
  /** The player (account) and the character fighting. */
  player: string;
  characterId: string;
  start: WorldBattleStart;
  pending: PendingBattle;
  context: SpoilsContext;
  commands: BattleCommand[];
  startedAt: number;
  /** The verdict, once the battle is over (asking again gives the same). */
  verdict: BattleVerdict | null;
}

/** Days a felled beast stays away, per boss id (the world day it fell). */
export type BossDays = Record<string, number>;

/** Stage the saved pending battle, or say why not (`no_hero`, `no_battle`, `boss_resting`). */
export function stageBattle(
  save: WorldStateData,
  ids: { battleId: string; seed: number; player: string; characterId: string },
  bosses: BossDays,
  at: number,
): BattleRecord | { error: string } {
  if (!save?.hasGame || !save.playerBuild) return { error: "no_hero" };
  const pending = save.pendingBattle;
  const opponent = pending ? getOpponent(pending.opponentId) : null;
  if (!pending || !opponent) return { error: "no_battle" };
  // A legendary beast is the world's, fought by a party (RaidObject), never alone.
  if (opponent.boss && getBoss(opponent.id)) return { error: "boss_party" };
  void bosses;
  // The state as the browser's would be: every field present (an old save may lack some).
  const state = { ...emptyData(), ...save } as WorldStateData;
  const start = worldBattleStart(state);
  if (!start) return { error: "no_battle" };
  return {
    ...ids,
    start,
    pending,
    context: {
      pendingSpar: state.pendingSpar ?? null,
      pendingHuntYield: state.pendingHuntYield ?? null,
      lifeSkillXp: state.lifeSkillXp ?? {},
      sectMembership: state.sectMembership ?? {},
      currentSceneId: state.currentSceneId,
      day: state.day,
    } as SpoilsContext,
    commands: [],
    startedAt: at,
    verdict: null,
  };
}

/** A fresh session of the record's battle (nothing played yet). */
export function newSession(record: BattleRecord): BattleSession {
  return startSession(record.start.a, record.start.b, { ...record.start.opts, seed: record.seed });
}

/**
 * Play `commands` (which start at index `from` of the battle's log) on the
 * session, keeping the record's log in step. Commands the server already has
 * (a request repeated after a lost answer) are skipped. Returns an error code
 * when the log cannot belong to this battle.
 */
export function playCommands(record: BattleRecord, session: BattleSession, from: number, commands: unknown): string | null {
  if (!Array.isArray(commands) || commands.length > MAX_COMMANDS_PER_CALL) return "bad_log";
  if (!Number.isInteger(from) || from < 0 || from > record.commands.length) return "gap";
  const fresh = commands.slice(record.commands.length - from);
  if (record.commands.length + fresh.length > MAX_COMMANDS) return "bad_log";
  for (const command of fresh) {
    if (session.state.phase === "over") return "bad_log";
    if (!applyCommand(session, command, battleItemOf)) return "bad_log";
    record.commands.push(command as BattleCommand);
  }
  return null;
}

/** The verdict on a finished session: the outcome, and on a win the spoils (rolled now). */
export function judge(record: BattleRecord, session: BattleSession): BattleVerdict | null {
  const state = session.state;
  if (state.phase !== "over") return null;
  const won = state.winner === "A" && !state.escaped;
  const context = { ...emptyData(), ...record.context, pendingBattle: record.pending } as WorldStateData;
  const spoils = won
    ? rollVictorySpoilsFrom(context, record.pending, state, (kind, id) => (kind === "skill" ? isSkillFrozen(context, id) : isArtFrozen(context, id)))
    : null;
  return {
    battleId: record.battleId,
    winner: state.winner ?? null,
    escaped: !!state.escaped,
    hA: state.hA,
    mpA: state.mpA,
    itemsUsed: { ...(state.itemsUsed ?? {}) },
    spoils,
  };
}

/** The spoils with the party bonus (docs/design/social.md): w-exp and move xp ×(1 + SOCIAL_LIMITS.partyBonus). */
export function withPartyBonus(spoils: VictorySpoils): VictorySpoils {
  const raise = (n: number) => Math.round(n * (1 + SOCIAL_LIMITS.partyBonus));
  return { ...spoils, wExp: raise(spoils.wExp), moves: spoils.moves.map((m) => ({ ...m, xp: raise(m.xp) })), partyBonus: true };
}
