"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  skillIds: [null, null, null, null, null, null, null, null, null, null],
  equipment: emptyLoadout(),
  learnedSkillIds: [],
  learnedArtIds: [],
  artLevels: {},
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

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
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
            for (let i = 0; i < next.length; i++) {
              if (i !== slot && next[i] === skillId) next[i] = null;
            }
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
    }),
    {
      name: "wusia-character-v1",
      version: 2,
      partialize: (s) => ({ builds: s.builds }),
      // v1 → v2: pad skillIds from 5 → 10 slots; seed learned arrays.
      migrate: (persisted) => {
        const p = (persisted ?? {}) as { builds?: Partial<Record<Side, CharacterBuild>> };
        const builds: Record<Side, CharacterBuild> = {
          A: p.builds?.A ?? defaultBuild("ยุนม่อ"),
          B: p.builds?.B ?? defaultBuild("ผู้พิทักษ์"),
        };
        for (const side of ["A", "B"] as const) {
          const b = builds[side];
          const slots = Array.isArray(b.skillIds) ? [...b.skillIds] : [];
          while (slots.length < 10) slots.push(null);
          builds[side] = {
            ...b,
            skillIds: slots,
            learnedSkillIds: b.learnedSkillIds ?? slots.filter((s): s is string => !!s),
            learnedArtIds: b.learnedArtIds ?? (b.artId && b.artId !== "none" ? [b.artId] : []),
            artLevels: b.artLevels ?? (b.artId && b.artId !== "none" ? { [b.artId]: b.artLevel } : {}),
          };
        }
        return { builds };
      },
    },
  ),
);
