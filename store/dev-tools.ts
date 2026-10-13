"use client";

// Owner tools for testing a live character: off unless the browser has
// localStorage["wuxia-dev"] = "on". Then the console has `wuxiaDev` —
// `wuxiaDev.setTrait("evil", 0)` sets a trait (ความดี good, ความเลว evil,
// หยิ่งยโส arrogance, ถ่อมตน humility, ชื่อเสียง fame); the change saves as usual.
import { TRAIT_KEYS, type TraitKey } from "@/lib/world/types";
import { useWorldStore } from "./world-store";

export const DEV_TOOLS_FLAG = "wuxia-dev";

export function installDevTools(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(DEV_TOOLS_FLAG) !== "on") return;
  } catch {
    return;
  }
  const tools = {
    traits: () => ({ ...useWorldStore.getState().traits }),
    setTrait(trait: TraitKey, value: number) {
      if (!TRAIT_KEYS.includes(trait) || !Number.isFinite(value)) return "ไม่รู้จักค่านี้";
      useWorldStore.setState((s) => ({ traits: { ...s.traits, [trait]: Math.max(0, Math.round(value)) } }));
      return { ...useWorldStore.getState().traits };
    },
  };
  (window as unknown as { wuxiaDev?: typeof tools }).wuxiaDev = tools;
}
