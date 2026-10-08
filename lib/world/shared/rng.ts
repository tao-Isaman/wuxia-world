// Seeded random numbers for the shared world, so the same world seed and the
// same day give the same simulation on any machine (a server, or a client
// checking it).

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

/** A fresh world seed. */
export function newWorldSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff) + 1;
}
