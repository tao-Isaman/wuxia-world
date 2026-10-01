// Battle unit looks + enemy packs (pure — no React, no stores).
//
// Resolves how each grid-battle unit is drawn from world data, and expands
// an opponent's optional `pack` into extra enemy units. Shared by the
// battle bridge (which builds the grid battle's UnitSpecs) and the battle UI.

import { characterId, npcCharacterId } from "@/lib/characters/catalog";
import type { CharacterBuild } from "@/lib/game/types";
import type { UnitLook, UnitSpec } from "@/lib/game/grid/types";
import { NPCS } from "./data/npcs";
import { npcBattleSprite } from "./data/npc-portraits";
import { getOpponent } from "./data/opponents";
import type { NpcDef, OpponentDef, PackMember } from "./types";

/** Grid unit ids used for world battles. */
export const PLAYER_UNIT_ID = "A";
export const PRIMARY_ENEMY_UNIT_ID = "B";
const PACK_PREFIX = "pack";

/** The hero's look: their chosen body sheet (defaults to m1). */
export function playerLook(bodyId: string | null | undefined): UnitLook {
  return { kind: "character", characterId: characterId(bodyId ?? "m1") };
}

/**
 * Creature-atlas frame for a beast opponent id, or null for non-beasts.
 * Frames: 0 generic · 1 tiger · 2 bear · 3 boar · 4 snake / crawler ·
 * 5 fowl · 6 raptor · 7 bat (/art/creature-atlas.png).
 */
export function creatureFrameFor(opponentId: string | null | undefined): number | null {
  const opp = getOpponent(opponentId);
  if (!opp || opp.category !== "beast") return null;
  if (opp.look?.frame !== undefined) return opp.look.frame;
  const id = opponentId ?? "";
  if (/tiger/.test(id)) return 1;
  if (/bear/.test(id)) return 2;
  if (/boar/.test(id)) return 3;
  if (/snake|serpent|python|viper|centipede|spider|scorpion/.test(id)) return 4;
  if (/chicken|rooster/.test(id)) return 5;
  if (/eagle|hawk|condor|bird/.test(id)) return 6;
  if (/bat/.test(id)) return 7;
  return 0;
}

/** The NPC an opponent stands for (sparring partners), matched by spar id or build name. */
export function findOpponentNpc(opponentId: string | null | undefined, buildName?: string): NpcDef | undefined {
  return NPCS.find((n) => (!!opponentId && n.sparOpponentId === opponentId) || (!!buildName && n.name === buildName));
}

/**
 * How an opponent is drawn: beasts use a creature-atlas frame; people use a
 * costume archetype sheet (by NPC id, else opponent id) and, for sparring
 * NPCs, the unique battle sprite the player met in the world.
 */
export function opponentLook(opponentId: string | null | undefined, npc?: NpcDef): UnitLook {
  const opp = getOpponent(opponentId);
  const variant: { tint?: number; size?: number } = {};
  if (opp?.look?.tint !== undefined) variant.tint = opp.look.tint;
  if (opp?.look?.size !== undefined) variant.size = opp.look.size;
  const frame = creatureFrameFor(opponentId);
  if (frame !== null) return { kind: "creature", frame, ...variant };
  const sheet = opp?.look?.sheet;
  const look: UnitLook = { kind: "character", characterId: sheet ? characterId(sheet) : npcCharacterId(npc?.id ?? opponentId ?? "thug"), ...variant };
  const still = npc ? npcBattleSprite(npc.id) : undefined;
  return still ? { ...look, still } : look;
}

/** Unit id for the n-th (1-based) pack member of `opponentId`. */
export const packUnitId = (opponentId: string, n: number): string => `${PACK_PREFIX}${n}:${opponentId}`;

/** The opponent id a grid unit stands for (primary enemy excluded — the world knows that one), or null. */
export function packOpponentIdOf(unitId: string): string | null {
  const m = /^pack\d+:(.+)$/.exec(unitId);
  return m ? m[1] : null;
}

/** Most companions an opponent can bring (the board grows to fit them). */
export const MAX_PACK_SIZE = 6;

/** The opponent's pack as a list of member kinds. */
export function packMembers(opp: OpponentDef): PackMember[] {
  const pack = opp.pack;
  if (!pack) return [];
  return (Array.isArray(pack) ? [...pack] : [pack as PackMember]).filter((m) => m.count > 0 && getOpponent(m.opponentId));
}

/**
 * Companions joining the fight: the authored pack, plus reinforcements of the
 * first member kind as the hero grows stronger (+1 at power 0.4, +2 at 0.75),
 * capped at MAX_PACK_SIZE. `power` is `playerPowerIndex` (0–1).
 */
export function packCounts(opp: OpponentDef, power = 0): PackMember[] {
  const members = packMembers(opp);
  if (members.length === 0) return [];
  const extra = power >= 0.75 ? 2 : power >= 0.4 ? 1 : 0;
  const out = members.map((m, i) => ({ opponentId: m.opponentId, count: m.count + (i === 0 ? extra : 0) }));
  let room = MAX_PACK_SIZE;
  for (const m of out) { m.count = Math.min(m.count, room); room -= m.count; }
  return out.filter((m) => m.count > 0);
}

/** Extra enemy units for an opponent's pack (empty when it fights alone). Builds are made now. */
export function enemyPackSpecs(opp: OpponentDef, power = 0): UnitSpec[] {
  const out: UnitSpec[] = [];
  let n = 0;
  for (const m of packCounts(opp, power)) {
    const member = getOpponent(m.opponentId)!;
    for (let i = 0; i < m.count; i++) {
      out.push({ id: packUnitId(member.id, ++n), team: "enemy", build: member.build(), look: opponentLook(member.id) });
    }
  }
  return out;
}

/** Everything the battle store needs to start a world battle against `opponentId`. */
export function worldBattleSetup(opponentId: string, opts: { bodyId?: string | null; withPack?: boolean; power?: number } = {}): {
  opponent: OpponentDef;
  build: CharacterBuild;
  looks: { A: UnitLook; B: UnitLook };
  enemies: UnitSpec[];
} | null {
  const opponent = getOpponent(opponentId);
  if (!opponent) return null;
  const build = opponent.build();
  const npc = findOpponentNpc(opponentId, build.name);
  return {
    opponent,
    build,
    looks: { A: playerLook(opts.bodyId), B: opponentLook(opponentId, npc) },
    enemies: opts.withPack ? enemyPackSpecs(opponent, opts.power ?? 0) : [],
  };
}
