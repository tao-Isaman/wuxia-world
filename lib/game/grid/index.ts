// Public surface of the grid (tactics) combat layer. See docs/grid-combat.md.
export * from "./types";
export * from "./geometry";
export * from "./skill-grid";
export * from "./engine";
export { pairContext, makeDuelView, commitDuelView, resolveDuel, tickUnit, type DuelCast } from "./duel";
export * from "./ai";
