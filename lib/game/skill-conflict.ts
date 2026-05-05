import type { Art, CharacterBuild, Skill, SkillType } from "./types";

// ─── Skill / art philosophical conflict system ─────────────────────────
// The player learns skills + arts. Once they hold > 4 (excluding pure
// "balance" entries), any single type taking > 60 % of the typed-tag
// pool punishes the opposing type:
//
//   yang ⇄ yin     — half  (×0.5) base status from the loser
//   hard ⇄ soft    — half  (×0.5) base status from the loser
//   internal ⇄ external — zero (×0) base status from the loser
//
// "Base status" means:
//   move skill   — `bp` (in damage formula) and `st` (stat bonus added to
//                  combinedStats), and `mg` (mastery contribution)
//   inner art    — HP gain (`hL × level`), MP gain (`mL × level`), and
//                  the scaled `stats × level`
//
// "Active battle effects" (skill `se`/`ee`, art `act`/`pas`) are NOT
// affected — the conflict only nerfs the passive base-status side.

export const CONFLICT_MIN_LEARNED = 4;
export const CONFLICT_THRESHOLD = 0.6;
export const CONFLICT_HALF_FACTOR = 0.5;
export const CONFLICT_ZERO_FACTOR = 0;

// Pair table: opposite[T] = T_opposite, and severity = whether the loser
// is halved or zeroed.
const PAIR: Record<string, { opposite: SkillType; severity: number }> = {
  yang:     { opposite: "yin",      severity: CONFLICT_HALF_FACTOR },
  yin:      { opposite: "yang",     severity: CONFLICT_HALF_FACTOR },
  hard:     { opposite: "soft",     severity: CONFLICT_HALF_FACTOR },
  soft:     { opposite: "hard",     severity: CONFLICT_HALF_FACTOR },
  internal: { opposite: "external", severity: CONFLICT_ZERO_FACTOR },
  external: { opposite: "internal", severity: CONFLICT_ZERO_FACTOR },
};

// Per-type effective factor. Anything missing means 1.0 (no penalty).
export type ConflictFactors = Partial<Record<SkillType, number>>;

// Default-typing rule for move skills that have no explicit `types`. We
// fall back to the engine's existing `at` annotation: physical skills are
// external, internal-energy skills are internal, pure utility (no `at`)
// has no axis. Arts always carry explicit `types` at this point.
export function effectiveTypes(item: { types?: readonly SkillType[]; at?: unknown }): readonly SkillType[] {
  if (item.types && item.types.length > 0) return item.types;
  const at = (item as { at?: "phy" | "int" | null }).at;
  if (at === "phy") return ["external"];
  if (at === "int") return ["internal"];
  return [];
}

// Compute the conflict-factor map from a build's learned skills+arts.
// Slotted skills + the active art are also "learned" implicitly so the
// caller doesn't have to maintain perfect parallel arrays.
export function computeConflictFactors(
  build: CharacterBuild | null | undefined,
  lookups: {
    getSkill: (id: string | null | undefined) => Skill | null;
    getArt: (id: string | null | undefined) => Art;
  },
): ConflictFactors {
  if (!build) return {};

  // Gather every skill / art id the player counts toward conflict.
  const skillIds = new Set<string>();
  for (const s of build.skillIds) if (s) skillIds.add(s);
  for (const s of build.learnedSkillIds ?? []) skillIds.add(s);

  const artIds = new Set<string>();
  if (build.artId && build.artId !== "none") artIds.add(build.artId);
  for (const a of build.learnedArtIds ?? []) artIds.add(a);

  // Tag tally — each typed entry contributes 1 to each of its tag bins.
  // `balance` tags do NOT contribute to any axis count (they're neutral),
  // but the entry still counts toward the > 4 trigger threshold so a
  // balanced player can still cross into "your loadout matters" territory.
  const counts: Partial<Record<SkillType, number>> = {};
  let totalLearnedEntries = 0;
  const bump = (types: readonly SkillType[]) => {
    for (const t of types) {
      if (t === "balance") continue;
      counts[t] = (counts[t] ?? 0) + 1;
    }
    totalLearnedEntries++;
  };

  for (const id of skillIds) {
    const sk = lookups.getSkill(id);
    if (!sk) continue;
    bump(effectiveTypes(sk));
  }
  for (const id of artIds) {
    const art = lookups.getArt(id);
    if (!art || art.id === "none") continue;
    bump(effectiveTypes(art));
  }

  if (totalLearnedEntries <= CONFLICT_MIN_LEARNED) return {};

  // For each axis pair, compare the two opposing tag counts directly. A
  // type "wins" the axis when it holds > 60 % of that axis's pair sum —
  // balance / untagged entries dilute neither side because they never
  // appear in `counts`.
  const factors: ConflictFactors = {};
  for (const t of Object.keys(PAIR) as SkillType[]) {
    const opp = PAIR[t].opposite;
    const a = counts[t] ?? 0;
    const b = counts[opp] ?? 0;
    const axisSum = a + b;
    if (axisSum === 0) continue;
    if (a / axisSum > CONFLICT_THRESHOLD) {
      const cur = factors[opp] ?? 1;
      factors[opp] = Math.min(cur, PAIR[t].severity);
    }
  }
  return factors;
}

// The effective base-status multiplier for a single skill / art under the
// current conflict map. If any of its tags is being penalised, the worst
// (smallest) factor applies. Untagged → no penalty.
export function getStatusFactor(
  item: { types?: readonly SkillType[]; at?: unknown },
  factors: ConflictFactors,
): number {
  const types = effectiveTypes(item);
  if (types.length === 0) return 1;
  let f = 1;
  for (const t of types) {
    const v = factors[t];
    if (typeof v === "number" && v < f) f = v;
  }
  return f;
}
