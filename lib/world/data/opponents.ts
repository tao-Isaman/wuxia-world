import type { CharacterBuild } from "@/lib/game";
import type { OpponentDef } from "../types";

// Opponents table. The `build` factory returns a fresh CharacterBuild each
// time so future encounters can scale off flags or quest progression.
//
// Keep starter opponents calibrated against the world's STARTER_BUILD
// (all stats 1, single basic_punch skill). At those stats the player can
// just barely win — that's the whole point of starting weak.
// Shared starter chassis — all stats at 1, basic_punch only.
// Spawned by random-event fights so farming early is roughly 50/50.
const starter = (name: string): CharacterBuild => ({
  name,
  stats: { STR: 1, AGI: 1, POW: 1, VIT: 1, DEX: 1, LUK: 1, DEF: 1, INT: 1 },
  artId: "none",
  artLevel: 1,
  skillIds: ["basic_punch", null, null, null, null],
  equipment: {
    W: null, A: null, H: null, B: null,
    BR: [null, null], R: [null, null], C: [null, null],
  },
});

export const OPPONENTS: readonly OpponentDef[] = [
  {
    id: "thug",
    name: "โจรเร่ร่อน",
    build: () => starter("โจรเร่ร่อน"),
  },
  {
    id: "bandit",
    name: "โจรป่า",
    build: () => starter("โจรป่า"),
  },
  {
    id: "wild_beast",
    name: "สัตว์ป่าดุร้าย",
    build: () => starter("สัตว์ป่าดุร้าย"),
  },
  {
    id: "ruffian",
    name: "คนร้าย",
    build: () => starter("คนร้าย"),
  },

  // ─── Wild beasts (hunting resources) ─────────────────────────────────
  // Slightly differentiated stats so different prey feel different in combat
  // without requiring full balance work. All still calibrated near the
  // STARTER_BUILD baseline so early hunting is roughly 50/50.
  {
    id: "wild_boar",
    name: "หมูป่า",
    build: () => ({
      ...starter("หมูป่า"),
      stats: { STR: 2, AGI: 1, POW: 1, VIT: 2, DEX: 1, LUK: 1, DEF: 1, INT: 1 },
    }),
  },
  {
    id: "wild_wolf",
    name: "หมาป่า",
    build: () => ({
      ...starter("หมาป่า"),
      stats: { STR: 1, AGI: 2, POW: 1, VIT: 1, DEX: 2, LUK: 1, DEF: 1, INT: 1 },
    }),
  },
  {
    id: "mountain_tiger",
    name: "เสือภูเขา",
    build: () => ({
      ...starter("เสือภูเขา"),
      stats: { STR: 3, AGI: 2, POW: 1, VIT: 2, DEX: 2, LUK: 1, DEF: 1, INT: 1 },
    }),
  },
  {
    id: "brown_bear",
    name: "หมีสีน้ำตาล",
    build: () => ({
      ...starter("หมีสีน้ำตาล"),
      stats: { STR: 3, AGI: 1, POW: 1, VIT: 3, DEX: 1, LUK: 1, DEF: 2, INT: 1 },
    }),
  },
  {
    id: "viper_snake",
    name: "งูเห่ายักษ์",
    build: () => ({
      ...starter("งูเห่ายักษ์"),
      stats: { STR: 1, AGI: 2, POW: 1, VIT: 1, DEX: 3, LUK: 2, DEF: 1, INT: 1 },
    }),
  },
  {
    id: "giant_centipede",
    name: "ตะขาบยักษ์",
    build: () => ({
      ...starter("ตะขาบยักษ์"),
      stats: { STR: 2, AGI: 2, POW: 1, VIT: 2, DEX: 2, LUK: 1, DEF: 1, INT: 1 },
    }),
  },
];

export const OPPONENTS_BY_ID = new Map<string, OpponentDef>(
  OPPONENTS.map((o) => [o.id, o]),
);

export function getOpponent(id: string | null | undefined): OpponentDef | null {
  if (!id) return null;
  return OPPONENTS_BY_ID.get(id) ?? null;
}
