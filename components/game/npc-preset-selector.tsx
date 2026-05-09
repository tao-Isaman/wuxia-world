"use client";

import { useMemo } from "react";
import type { Side } from "@/lib/game";
import { OPPONENTS, getOpponent } from "@/lib/world";
import { useCharacterStore } from "@/store/character-store";

// Dropdown that drops a known NPC loadout into the selected side's
// character build. Useful in /debug for "what does Shaolin abbot vs.
// my Int caster look like?" experiments without rebuilding both sides
// from scratch each time.
//
// The opponent's `build()` factory returns a fresh CharacterBuild — we
// pass it straight to character-store.loadBuild which deep-copies the
// arrays so future per-slot edits don't bleed back into the source.
//
// Skill slots follow the world's combined-slot mechanic (move skills +
// `art:xxx` art slots in the same 10-position array), so loading an
// NPC build with multi-art kits Just Works in the /debug battle screen.

interface Props {
  side: Side;
}

export function NpcPresetSelector({ side }: Props) {
  const loadBuild = useCharacterStore((s) => s.loadBuild);

  // Group opponents by tier for a more navigable dropdown. Within each
  // tier, sort by name for stability. Beasts and elites get their own
  // mini-buckets so the list reads top-down: T0 chaff → T4 elites.
  const grouped = useMemo(() => groupByTier(OPPONENTS), []);

  const onSelect = (opponentId: string) => {
    if (!opponentId) return;
    const opp = getOpponent(opponentId);
    if (!opp) return;
    loadBuild(side, opp.build());
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <label htmlFor={`npc-preset-${side}`} className="text-muted-foreground shrink-0">
        โหลด NPC:
      </label>
      <select
        id={`npc-preset-${side}`}
        defaultValue=""
        onChange={(e) => onSelect(e.target.value)}
        className="flex-1 border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:border-primary"
      >
        <option value="">— เลือก NPC —</option>
        {grouped.map(({ tierLabel, opponents }) => (
          <optgroup key={tierLabel} label={tierLabel}>
            {opponents.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.name} ({opp.id})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

interface OpponentGroup {
  tierLabel: string;
  opponents: typeof OPPONENTS[number][];
}

// Bucket opponents into tier groups for the dropdown's <optgroup>s.
// Order: T0 → T4, beasts and elites flagged so the player can find
// them quickly.
function groupByTier(opponents: typeof OPPONENTS): OpponentGroup[] {
  const buckets = new Map<string, typeof OPPONENTS[number][]>();
  for (const opp of opponents) {
    const label = labelFor(opp);
    const list = buckets.get(label) ?? [];
    list.push(opp);
    buckets.set(label, list);
  }
  // Stable sort within each group + ordered group output.
  const groups: OpponentGroup[] = [];
  for (const [tierLabel, list] of buckets) {
    list.sort((a, b) => a.name.localeCompare(b.name, "th"));
    groups.push({ tierLabel, opponents: list });
  }
  groups.sort((a, b) => GROUP_ORDER.indexOf(a.tierLabel) - GROUP_ORDER.indexOf(b.tierLabel));
  return groups;
}

const GROUP_ORDER = [
  "Tier 0",
  "Tier 1",
  "Tier 2",
  "Tier 3",
  "Tier 4",
  "Beast — Tier 0",
  "Beast — Tier 1",
  "Beast — Tier 2",
  "Sparring",
  "Elite",
];

function labelFor(opp: typeof OPPONENTS[number]): string {
  if (opp.id.startsWith("elite_")) return "Elite";
  if (opp.id.startsWith("spar_")) return "Sparring";
  if (opp.id.startsWith("hunt_")) return `Beast — Tier ${opp.ti ?? 0}`;
  if (opp.category === "beast") return `Beast — Tier ${opp.ti ?? 0}`;
  return `Tier ${opp.ti ?? 0}`;
}
