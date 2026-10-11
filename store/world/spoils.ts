// What a fight or a gathering trip pays: victory spoils (rolled once per
// battle), opponent loot, resource yields and used battle items. The rolls
// themselves are pure (lib/world/spoils.ts); on the game server a checked
// battle's spoils come from the server (lib/net/cloud-battle.ts).
import { useBattleStore } from "@/store/battle-store";
import type { WorldStateData } from "@/lib/world";
import { rollVictorySpoilsFrom } from "@/lib/world/spoils";
import { cloudBattle } from "@/store/cloud-battle";
import { isArtFrozen, isSkillFrozen } from "./progression";
import type { VictorySpoils } from "./types";

export { FOE_GOLD, rollOpponentLoot, rollResourceYield } from "@/lib/world/spoils";

// One roll per pendingBattle (the object the battle was started for).
export const spoilsByBattle = new WeakMap<object, VictorySpoils>();

// Battle items the hero used (potions, poisons, hidden weapons) leave the bag,
// whatever the outcome.
export function consumeBattleItems(draft: WorldStateData, battleState: { itemsUsed?: Record<string, number> } | null | undefined): void {
  const used = Object.entries(battleState?.itemsUsed ?? {}).filter(([, n]) => n > 0);
  if (!used.length) return;
  draft.inventory = { ...draft.inventory };
  for (const [id, n] of used) {
    const left = (draft.inventory[id] ?? 0) - n;
    if (left > 0) draft.inventory[id] = left; else delete draft.inventory[id];
  }
}

// Roll a won fight's spoils from the battle store's final state.
export function rollVictorySpoils(s: WorldStateData, pb: NonNullable<WorldStateData["pendingBattle"]>): VictorySpoils {
  return rollVictorySpoilsFrom(s, pb, useBattleStore.getState().state, (kind, id) => (kind === "skill" ? isSkillFrozen(s, id) : isArtFrozen(s, id)));
}

/**
 * The spoils of the won battle in front of the player, rolled once. A battle
 * the game server checks pays what the server rolled (null until it answers).
 */
export function victorySpoilsFor(s: WorldStateData): VictorySpoils | null {
  const pb = s.pendingBattle;
  if (!pb || useBattleStore.getState().state?.winner !== "A") return null;
  if (cloudBattle.checking()) return cloudBattle.spoils();
  let spoils = spoilsByBattle.get(pb);
  if (!spoils) { spoils = rollVictorySpoils(s, pb); spoilsByBattle.set(pb, spoils); }
  return spoils;
}
