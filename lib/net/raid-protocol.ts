// A world boss fought by a party (docs/online.md "World bosses"): the messages
// between the browser (store/cloud-raid.ts) and the boss's RaidObject
// (server/worker/ts/raid-object.ts · raid-doc.ts).
//
//   GET  /raid/<bossId>[?from=N&raid=<id>]        → RaidView
//   POST /raid/<bossId>/open  { characterId }      → RaidView   (the party's leader, at the lair)
//   POST /raid/<bossId>/join  { raid, characterId } → RaidView  (a party member, at the lair)
//   POST /raid/<bossId>/start { raid }             → RaidView   (the leader: begin with who has joined)
//   POST /raid/<bossId>/act   { raid, intent }     → RaidView   (the player whose unit holds the turn)
import type { BattleCommand, BattleStartOpts } from "@/lib/game/grid/session";
import type { CharacterBuild } from "@/lib/game/types";
import type { PartyIntent } from "@/store/battle-store";
import type { BattleVerdict } from "./play-protocol";

/** The rules of a party fight. */
export const RAID_RULES = {
  /** People a party fight needs, and takes. */
  minParty: 2,
  maxParty: 4,
  /** How long the party has to join after the leader opens the fight, ms. */
  gatherMs: 90_000,
  /** How long a person has for their turn before the AI plays it, ms. */
  turnMs: 30_000,
  /** A person the server has not heard from this long is played by the AI, ms. */
  idleMs: 20_000,
  /** A fight running longer than this is called off (the beast is free again), ms. */
  fightMs: 30 * 60_000,
  /** A fallen beast is back this long after it fell (three real hours), ms. */
  respawnMs: 3 * 3_600_000,
} as const;

/** The world boss's state, as every player sees it (the world reply's `bosses`). */
export interface BossStatus {
  /** When it last fell (ms), null: never. */
  fellAt: number | null;
  /** The party that felled it (hero names). */
  fellBy: string[] | null;
  /** A party fighting it now: its leader's hero name. */
  fighting: string | null;
}

export interface RaidMemberView {
  player: string;
  name: string;
  unit: string;
  joined: boolean;
}

/** What a player sees of a boss and its fight. */
export interface RaidView {
  bossId: string;
  boss: BossStatus;
  /** The fight this player belongs to (null: none). */
  fight: null | {
    id: string;
    phase: "gather" | "battle" | "over";
    leader: string;
    members: RaidMemberView[];
    /** The asking player's unit. */
    me: string | null;
    /** When the gathering ends (gather) or the turn's person runs out of time (battle), ms. */
    deadline: number | null;
    /** The staged fight (from the battle phase on; only when asked from 0). */
    start?: { a: CharacterBuild; b: CharacterBuild; opts: BattleStartOpts; seed: number };
    /** Commands from `from` on, and how many there are in all. */
    from: number;
    commands: BattleCommand[];
    total: number;
    /** This player's verdict, once it is over. */
    verdict?: BattleVerdict;
  };
}

export type RaidIntent = PartyIntent;
