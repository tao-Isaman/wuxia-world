"use client";
import { useEffect } from "react";
import { useWorldStore } from "@/store/world-store";
import { getLocationMap, getScene } from "@/lib/world";
import { forgetMapPosition } from "@/lib/stage/types";
import { ENGINE_SAVE_BACKUP_KEY, engineGotoTarget, enginePreviewActive, enginePreviewPlacements, engineStorageGet, engineStorageSet } from "@/lib/engine/goto";
import { previewSpotEdits } from "@/lib/world/data/location-maps";
import { toast } from "@/store/toast-store";

/**
 * Dev-only (lib/engine/goto.ts): `/?engineGoto=<locationId>` puts the hero on
 * that map, for the map editor's เล่นทดสอบ. It only moves the hero (current
 * scene and last location; no travel cost, no time), never during a battle,
 * an encounter, a game over or a jail term, and keeps a copy of the save from
 * before the jump under `wusia-world-v1:before-engine-goto`. Renders nothing.
 */
export function EngineGoto() {
  useEffect(() => {
    // A preview tab also shows the editor's unsaved moved markers (ย้ายจุด).
    if (enginePreviewActive()) previewSpotEdits(enginePreviewPlacements()?.spots);
    const target = engineGotoTarget();
    if (!target) return;
    const apply = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("engineGoto");
      window.history.replaceState(null, "", url.pathname + (url.search || "") + url.hash);
      const state = useWorldStore.getState();
      if (getScene(target)?.kind !== "location" || !getLocationMap(target)) { toast("warn", `ไม่พบแผนที่ ${target}`); return; }
      if (!state.hasGame) { toast("info", "เริ่มเกมก่อน แล้วเปิดเล่นทดสอบอีกครั้ง"); return; }
      if (state.gameOver || state.pendingBattle || state.pendingEncounter || state.jailUntil != null) {
        toast("warn", "ย้ายไปแผนที่ไม่ได้ขณะต่อสู้ ติดคุก หรือจบเกม"); return;
      }
      const scene = getScene(target);
      const saved = engineStorageGet(() => localStorage, "wusia-world-v1");
      if (saved) engineStorageSet(() => localStorage, ENGINE_SAVE_BACKUP_KEY, saved);
      forgetMapPosition(target);
      useWorldStore.setState({ currentSceneId: target, lastLocationId: target, roamingFoes: [] });
      toast("info", `เล่นทดสอบ: ${scene?.kind === "location" ? scene.name : target}`);
    };
    if (useWorldStore.persist.hasHydrated()) apply();
    else return useWorldStore.persist.onFinishHydration(apply);
  }, []);
  return null;
}
