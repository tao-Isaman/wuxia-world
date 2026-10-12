// The fight a world state stands before, as plain data: the scaled foe (and
// pack), the hero's build, HP / MP and battle bag. Pure, so the game server
// builds the same fight from a save that the browser builds from its store
// (docs/online.md "Battles on the server"); lib/world/battle-bridge.ts uses it
// for the briefing and the start.
import type { CharacterBuild } from "../game/types";
import { currentOutfit } from "./appearance";
import type { BattleStartOpts } from "../game/grid/session";
import type { BattleItemEffect } from "../game/grid/types";
import type { WorldStateData } from "./types";
import { getOpponent } from "./data/opponents";
import { getItem } from "./data/items";
import { applyOpponentStatScale, playerPowerIndex } from "./data/random-events";
import { worldBattleSetup } from "./battle-looks";
import { npcPresent } from "./npc-presence";

export type BattleSetup = NonNullable<ReturnType<typeof worldBattleSetup>>;

/** The scaled foe (and pack) for a fight against `opponentId` as `state` stands. */
export function battleSetupFor(state: WorldStateData, opponentId: string, withPack?: boolean): BattleSetup | null {
  if (!getOpponent(opponentId)) return null;
  // Apply progression-based stat scaling right before the builds are made so
  // the factories pick up the current opponent stat scale (pack members
  // included).
  applyOpponentStatScale(state);
  return worldBattleSetup(opponentId, { bodyId: state.playerBodyId, outfit: state.appearance ? currentOutfit(state) : null, withPack, power: playerPowerIndex(state), present: (id) => npcPresent(state, id) });
}

/** The hero's battle items (ItemDef.battle) as they go into a fight: item id → count carried. */
export function battleBag(inventory: Readonly<Record<string, number>>): Record<string, number> {
  const bag: Record<string, number> = {};
  for (const [id, n] of Object.entries(inventory)) if (n > 0 && getItem(id)?.battle) bag[id] = n;
  return bag;
}

/** What `battleStore.start` takes: the hero, the foe and the options. */
export interface WorldBattleStart {
  a: CharacterBuild;
  b: CharacterBuild;
  opts: BattleStartOpts;
}

/** The pending battle's start (null when nothing is pending or it cannot be staged). */
export function worldBattleStart(state: WorldStateData, setup: BattleSetup | null = null): WorldBattleStart | null {
  const pending = state.pendingBattle;
  if (!pending || !state.playerBuild) return null;
  const staged = setup ?? battleSetupFor(state, pending.opponentId, pending.withPack);
  if (!staged) return null;
  return {
    a: state.playerBuild,
    b: staged.build,
    opts: {
      hpA: state.currentHp,
      mpA: state.currentMp,
      looks: staged.looks,
      enemies: staged.enemies,
      bag: battleBag(state.inventory),
    },
  };
}

/** A battle item's name and effect, for replaying `["i", …]` commands. */
export function battleItemOf(itemId: string): { name: string; effect: BattleItemEffect } | null {
  const def = getItem(itemId);
  return def?.battle ? { name: def.name, effect: def.battle } : null;
}
