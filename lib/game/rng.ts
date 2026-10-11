// Seeded random numbers: the same seed gives the same numbers on any machine
// (the browser, or the game server checking a battle or running the shared
// world). lib/world/shared/rng.ts re-exports these for the world.

/** A 32-bit hash of a seed and a number (FNV-1a over both). */
export function hashSeed(seed: number, salt: number): number {
  let h = 0x811c9dc5;
  for (const n of [seed | 0, Math.floor(salt) | 0]) {
    for (let i = 0; i < 4; i++) {
      h ^= (n >>> (i * 8)) & 0xff;
      h = Math.imul(h, 0x01000193);
    }
  }
  return h >>> 0;
}

/** mulberry32: a small, fast PRNG; returns numbers in [0, 1). */
export function seededRng(seed: number, salt = 0): () => number {
  let a = hashSeed(seed, salt);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Run `fn` with `Math.random` drawing from `rng`, then put it back. The combat
 * code rolls with `Math.random`; a battle the server checks runs every engine
 * call through this, so both sides roll the same numbers. Synchronous only.
 */
export function withRandom<T>(rng: (() => number) | null | undefined, fn: () => T): T {
  if (!rng) return fn();
  const original = Math.random;
  Math.random = rng;
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}
