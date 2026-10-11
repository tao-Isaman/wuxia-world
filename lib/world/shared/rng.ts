// Seeded random numbers for the shared world, so the same world seed and the
// same day give the same simulation on any machine (a server, or a client
// checking it). The generator itself lives in lib/game/rng.ts.
export { hashSeed, seededRng } from "../../game/rng";

/** A fresh world seed. */
export function newWorldSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff) + 1;
}
