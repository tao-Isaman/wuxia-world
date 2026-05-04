"use client";

import { create } from "zustand";
import type { CharacterBuild, EquipLoadout, Side, StatKey } from "@/lib/game";
import { DEFAULT_STATS, STAT_BUDGET, totalStatPoints } from "@/lib/game";
import { clamp } from "@/lib/utils";

const emptyLoadout = (): EquipLoadout => ({
  W: null, A: null, H: null, B: null,
  BR: [null, null], R: [null, null], C: [null, null],
});

const defaultBuild = (name: string): CharacterBuild => ({
  name,
  stats: { ...DEFAULT_STATS },
  artId: "none",
  artLevel: 5,
  skillIds: [null, null, null, null, null],
  equipment: emptyLoadout(),
});

interface CharacterStore {
  builds: Record<Side, CharacterBuild>;
  setName: (side: Side, name: string) => void;
  setStat: (side: Side, key: StatKey, v: number) => void;
  setArt: (side: Side, artId: string) => void;
  setArtLevel: (side: Side, lv: number) => void;
  setSkillSlot: (side: Side, slot: number, skillId: string | null) => void;
  setEquipSlot: (
    side: Side,
    slot: keyof EquipLoadout,
    idx: number | null,
    itemId: string | null,
  ) => void;
  reset: () => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  builds: {
    A: defaultBuild("ยุนม่อ"),
    B: defaultBuild("ผู้พิทักษ์"),
  },

  setName: (side, name) =>
    set((s) => ({ builds: { ...s.builds, [side]: { ...s.builds[side], name } } })),

  setStat: (side, key, v) =>
    set((s) => {
      const cur = s.builds[side];
      const others = totalStatPoints(cur.stats) - cur.stats[key];
      const cv = clamp(v, 1, Math.min(STAT_BUDGET - others, 100));
      return {
        builds: {
          ...s.builds,
          [side]: { ...cur, stats: { ...cur.stats, [key]: cv } },
        },
      };
    }),

  setArt: (side, artId) =>
    set((s) => ({ builds: { ...s.builds, [side]: { ...s.builds[side], artId } } })),

  setArtLevel: (side, lv) =>
    set((s) => ({
      builds: {
        ...s.builds,
        [side]: { ...s.builds[side], artLevel: clamp(lv, 1, 10) },
      },
    })),

  setSkillSlot: (side, slot, skillId) =>
    set((s) => {
      const cur = s.builds[side];
      const next = [...cur.skillIds];
      // Prevent duplicates: if id is already in another slot, clear that slot.
      if (skillId) {
        for (let i = 0; i < next.length; i++) if (i !== slot && next[i] === skillId) next[i] = null;
      }
      next[slot] = skillId;
      return { builds: { ...s.builds, [side]: { ...cur, skillIds: next } } };
    }),

  setEquipSlot: (side, slot, idx, itemId) =>
    set((s) => {
      const cur = s.builds[side];
      const eq = { ...cur.equipment };
      if (slot === "W" || slot === "A" || slot === "H" || slot === "B") {
        eq[slot] = itemId;
      } else {
        const arr: [string | null, string | null] = [...eq[slot]];
        if (idx === 0 || idx === 1) arr[idx] = itemId;
        eq[slot] = arr;
      }
      return { builds: { ...s.builds, [side]: { ...cur, equipment: eq } } };
    }),

  reset: () =>
    set({
      builds: {
        A: defaultBuild("ยุนม่อ"),
        B: defaultBuild("ผู้พิทักษ์"),
      },
    }),
}));
