"use client";

// World ↔ Battle bridge.
//
// When a world choice's `triggerBattle` effect sets `pendingBattle`, this
// module prepares the fight and describes it (`battleBriefing`: the foe and
// both sides' power tiers); the world screen shows that warning and starts the
// battle in the (unpersisted) battle store when the player goes in
// (`ensureBattleStarted`). The reverse direction (battle → world after a winner is set) is
// driven by user action (`acknowledgeBattleResult` in the world store) so
// players see the result before the world resumes.
//
// Battles are grid (tactics) battles: see docs/grid-combat.md. Unit looks and
// enemy packs come from ./battle-looks.
//
// This wiring lives outside the React tree so it survives unmounts.
//
// `initBattleBridge()` (app/page.tsx) is kept as the module's entry point; it
// has nothing to subscribe to any more.

import { useBattleStore } from "@/store/battle-store";
import { useWorldStore } from "@/store/world-store";
import { getOpponent } from "./data/opponents";
import { applyOpponentStatScale, playerPowerIndex } from "./data/random-events";
import { worldBattleSetup } from "./battle-looks";
import { powerOutlook, powerScore, powerTierOf, type CharacterBuild, type PowerOutlook, type PowerTier } from "../game";

type BattleSetup = NonNullable<ReturnType<typeof worldBattleSetup>>;
// The setup prepared for the current pendingBattle: the briefing shows it and
// the battle starts with it, so the warning describes the exact fight.
let prepared: { pending: object; setup: BattleSetup } | null = null;

/** The scaled foe (and pack) for a fight against `opponentId` as things stand now. */
function setupFor(opponentId: string, withPack?: boolean): BattleSetup | null {
  if (!getOpponent(opponentId)) return null;
  const ws = useWorldStore.getState();
  // Apply progression-based stat scaling RIGHT before the builds are made so
  // the factories pick up the current OPPONENT_STAT_SCALE module value
  // (pack members included). Random encounters set this in rollRandomEvent
  // already; this re-applies for triggerBattle paths (quest fights,
  // sparring, etc.) too.
  applyOpponentStatScale(ws);
  return worldBattleSetup(opponentId, { bodyId: ws.playerBodyId, withPack, power: playerPowerIndex(ws) });
}

/** The setup for the pending battle, built once per pendingBattle. */
function prepareBattle(): BattleSetup | null {
  const pending = useWorldStore.getState().pendingBattle;
  if (!pending) return null;
  if (prepared?.pending === pending) return prepared.setup;
  const setup = setupFor(pending.opponentId, pending.withPack);
  if (setup) prepared = { pending, setup };
  return setup;
}

export interface BriefedFighter { name: string; score: number; tier: PowerTier }
export interface BattleBriefing {
  hero: BriefedFighter;
  foe: BriefedFighter;
  /** Pack members, strongest first. */
  pack: BriefedFighter[];
  /** The strongest enemy's tier against the hero's. */
  outlook: PowerOutlook;
}
const brief = (build: CharacterBuild): BriefedFighter => {
  const score = powerScore(build);
  return { name: build.name, score, tier: powerTierOf(score) };
};
function briefingOf(heroBuild: CharacterBuild | null, setup: BattleSetup | null): BattleBriefing | null {
  if (!heroBuild || !setup) return null;
  const hero = brief(heroBuild);
  const foe = brief(setup.build);
  const pack = setup.enemies.map((unit) => brief(unit.build)).sort((a, b) => b.score - a.score);
  const strongest = Math.max(foe.tier.tier, ...pack.map((member) => member.tier.tier));
  return { hero, foe, pack, outlook: powerOutlook(hero.tier.tier, strongest) };
}

/** Who the pending battle is against and how strong they are next to `hero` (null when nothing is pending). */
export const battleBriefing = (hero: CharacterBuild | null): BattleBriefing | null => briefingOf(hero, prepareBattle());

/** The same reading for a fight not yet staged (a random encounter, which brings its pack). */
export const previewBriefing = (hero: CharacterBuild | null, opponentId: string, withPack = true): BattleBriefing | null =>
  briefingOf(hero, setupFor(opponentId, withPack));

// Single chokepoint for "world says fight, battle hasn't started". The world
// screen shows the briefing first and calls this when the player goes in
// (random encounters, already confronted on the encounter screen, call it on
// accepting). Calling it when the battle already exists is a no-op.
export function ensureBattleStarted(): void {
  const ws = useWorldStore.getState();
  if (!ws.pendingBattle) return;

  const bs = useBattleStore.getState();
  if (bs.state) return; // already running

  if (!ws.playerBuild) {
    console.warn("[bridge] pendingBattle without playerBuild — clearing");
    ws.clearPendingBattle();
    return;
  }
  const setup = prepareBattle();
  if (!setup) {
    console.warn(`[bridge] unknown opponentId "${ws.pendingBattle.opponentId}" — clearing`);
    ws.clearPendingBattle();
    return;
  }
  prepared = null;
  // Grid battle: the hero (leader) vs the opponent, plus its pack on random
  // encounters (quest / spar fights stay 1v1).
  bs.start(ws.playerBuild, setup.build, {
    hpA: ws.currentHp,
    mpA: ws.currentMp,
    looks: setup.looks,
    enemies: setup.enemies,
  });
}

let initialized = false;

export function initBattleBridge(): void {
  if (initialized) return;
  if (typeof window === "undefined") return; // SSR guard
  initialized = true;

  // Battles no longer start by themselves: the world screen shows the
  // briefing (foe and power tiers) and the player goes in from there. The
  // reverse direction (battle → world) is the winner banner's "ดำเนินเรื่อง",
  // which calls `worldStore.acknowledgeBattleResult()`.
}
