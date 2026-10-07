// Battle unit looks + enemy packs (pure — no React, no stores).
//
// Resolves how each grid-battle unit is drawn from world data, and expands
// an opponent's optional `pack` into extra enemy units. Shared by the
// battle bridge (which builds the grid battle's UnitSpecs) and the battle UI.

import { characterId, FOE_CHARACTER_IDS, npcCharacterId, type FoeCharacterId } from "@/lib/characters/catalog";
import { hasAnimatedSheet } from "@/lib/characters/npc-sheets";
import { getAnimSheet } from "@/lib/characters/anim-sheets";
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
 * Frames: 0 wolf / dog · 1 tiger · 2 bear · 3 boar · 4 snake · 5 fowl ·
 * 6 raptor · 7 bat · 8 hare · 9 squirrel · 10 wild cat · 11 centipede /
 * crawler (CREATURE_ATLAS, /art/creature-atlas.png).
 */
export function creatureFrameFor(opponentId: string | null | undefined): number | null {
  const opp = getOpponent(opponentId);
  if (!opp || opp.category !== "beast") return null;
  if (opp.look?.frame !== undefined) return opp.look.frame;
  const id = opponentId ?? "";
  if (/tiger/.test(id)) return 1;
  if (/bear/.test(id)) return 2;
  if (/boar/.test(id)) return 3;
  if (/centipede|spider|scorpion/.test(id)) return 11;
  if (/snake|serpent|python|viper/.test(id)) return 4;
  if (/chicken|rooster|pheasant/.test(id)) return 5;
  if (/eagle|hawk|condor|bird/.test(id)) return 6;
  if (/bat/.test(id)) return 7;
  if (/rabbit|hare/.test(id)) return 8;
  if (/squirrel/.test(id)) return 9;
  if (/cat|lynx|leopard/.test(id)) return 10;
  return 0;
}

/** The old costume sheet an opponent was authored with, mapped onto its enemy type. */
const SHEET_FOE: Record<string, FoeCharacterId> = {
  bandit: "foe_bandit", merchant: "foe_brawler", elder: "foe_master", monk: "foe_monk",
  m1: "foe_swordsman", m2: "foe_brawler", m3: "foe_strategist", m4: "foe_enforcer",
  f1: "foe_swordswoman", f2: "foe_swordswoman", f3: "foe_assassin_f", f4: "foe_assassin_f",
  wang: "foe_brute", feng: "foe_swordsman", qing: "foe_strategist",
};
const FEMALE_SHEETS = new Set(["f1", "f2", "f3", "f4"]);

/**
 * The painted enemy type an opponent without its own NPC art is drawn as:
 * read from its id first (a thief, a river pirate, a cult master…), then from
 * the costume sheet it was authored with, then from its category.
 */
export function foeCharacterFor(opponentId: string | null | undefined, opp?: OpponentDef | null): FoeCharacterId {
  const id = opponentId ?? "";
  const sheet = opp?.look?.sheet ?? "";
  if ((FOE_CHARACTER_IDS as readonly string[]).includes(sheet)) return sheet as FoeCharacterId;
  const female = FEMALE_SHEETS.has(sheet) || /empress|_nun|lady|veil|huiniang|lanying|bone_claw|white_bone|hunter_(emei|gumu|hengshan_north)/.test(id);
  if (female) {
    if (/empress/.test(id)) return "foe_empress";
    if (/assassin|night|veil|claw|bone|gumu/.test(id)) return "foe_assassin_f";
    return "foe_swordswoman";
  }
  const rules: [RegExp, FoeCharacterId][] = [
    [/constable/, "foe_constable"],
    [/imperial_guard|royal|palace/, "foe_guard"],
    [/thief|pickpocket/, "foe_thief"],
    [/iron_palm/, "foe_brawler"],
    [/bandit_(chief|king|lieutenant)|toll_chief|false_chief/, "foe_bandit_chief"],
    [/archer/, "foe_archer"],
    [/pirate/, "foe_pirate"],
    [/marauder|desert/, "foe_marauder"],
    [/poison|dushi/, "foe_poisoner"],
    [/ghost|snow_demon|immortal/, "foe_ghost"],
    [/demon|cult|rakshasa|heretic|xuanming|zealot/, "foe_cultist"],
    [/lama|shaolin/, "foe_monk"],
    [/iron_mountain|black_iron|iron_staff|black_pot|lion/, "foe_brute"],
    [/assassin|shadow|flying_swallow|snow_bat|masked/, "foe_assassin"],
    [/bandit|thug|robber/, "foe_bandit"],
    [/brawler|ruffian|iron_palm|fists|white_ape|vajra|apprentice|firefist/, "foe_brawler"],
    [/fan|diviner|silver_tongue|scholar|guest|envoy|traitor|patron|redplum/, "foe_strategist"],
    [/grandmaster|master|elder|eunuch|lord|heartless/, "foe_master"],
    [/bounty|hunter_|helian|leng_suo|steward|two_faced/, "foe_enforcer"],
    [/sword|disciple|blade|needle/, "foe_swordsman"],
  ];
  for (const [pattern, foe] of rules) if (pattern.test(id)) return foe;
  if (SHEET_FOE[sheet]) return SHEET_FOE[sheet];
  return opp?.category === "supernatural" ? "foe_ghost" : "foe_bandit";
}

/** The NPC an opponent stands for: `look.npc`, else a sparring partner matched by spar id or build name. */
export function findOpponentNpc(opponentId: string | null | undefined, buildName?: string): NpcDef | undefined {
  const linked = getOpponent(opponentId)?.look?.npc;
  if (linked) return NPCS.find((n) => n.id === linked);
  return NPCS.find((n) => (!!opponentId && n.sparOpponentId === opponentId) || (!!buildName && n.name === buildName));
}

/**
 * How an opponent is drawn: a legendary beast or T5 master with an animated
 * sheet (`look.anim`, lib/characters/anim-sheets.ts) plays it; other beasts use a creature-atlas frame; an NPC with
 * its own rigged sheet plays it; a sparring NPC shows the unique battle sprite
 * the player met in the world (over its costume archetype); everyone else is
 * the painted enemy type for their kind (`foeCharacterFor`).
 */
export function opponentLook(opponentId: string | null | undefined, npc?: NpcDef): UnitLook {
  const opp = getOpponent(opponentId);
  const variant: { tint?: number; size?: number } = {};
  if (opp?.look?.tint !== undefined) variant.tint = opp.look.tint;
  if (opp?.look?.size !== undefined) variant.size = opp.look.size;
  // An animated sheet wins over everything else (an unknown sheet id falls through).
  if (opp?.look?.anim && getAnimSheet(opp.look.anim)) return { kind: "anim", sheet: opp.look.anim, ...variant };
  const frame = creatureFrameFor(opponentId);
  if (frame !== null) return { kind: "creature", frame, ...variant };
  // A rigged NPC (its own sheet) plays full clips; other named NPCs keep their still.
  const npcId = npc?.id ?? opp?.look?.npc;
  if (npcId && hasAnimatedSheet(npcId)) return { kind: "character", characterId: npcId, ...variant };
  const still = npcId ? npcBattleSprite(npcId) : undefined;
  if (still) return { kind: "character", characterId: npcCharacterId(npcId!), still, ...variant };
  // Anyone fought as themselves (npc@…, lib/world/data/opponents.ts) without
  // art of their own: the enemy type of their costume (a woman stays a woman).
  if (npcId && opp && opponentId?.startsWith("npc@")) {
    return { kind: "character", characterId: foeCharacterFor(opponentId, { ...opp, look: { ...opp.look, sheet: npcCharacterId(npcId) } }), ...variant };
  }
  return { kind: "character", characterId: foeCharacterFor(opponentId, opp), ...variant };
}

/**
 * How a foe looks wherever it is shown — on the map, on the encounter and
 * briefing screens and in battle — so every picture is the one you fight:
 * `opponentLook` with the NPC the battle finds for it (by `look.npc`, spar id
 * or build name, as `worldBattleSetup` does).
 */
export function foeLook(opponentId: string | null | undefined): UnitLook {
  const opponent = getOpponent(opponentId);
  return opponentLook(opponentId, findOpponentNpc(opponentId, opponent?.build().name));
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
  return {
    opponent,
    build,
    looks: { A: playerLook(opts.bodyId), B: foeLook(opponentId) },
    enemies: opts.withPack ? enemyPackSpecs(opponent, opts.power ?? 0) : [],
  };
}
