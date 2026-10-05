"use client";

import { useEffect } from "react";
import { playJingle, playMusic, stopMusic, uiSound, unlockAudio } from "@/lib/audio/engine";
import type { TrackId } from "@/lib/audio/songs";
import { exploringTrack } from "@/lib/audio/recordings";
import { getScene } from "@/lib/world";
import { regionOf } from "@/lib/world/data/regions";
import { useWorldStore } from "@/store/world-store";
import { useBattleStore } from "@/store/battle-store";

/**
 * Chooses the music for what is on screen and plays the event jingles
 * (encounter, victory, defeat, quest done, level up, coins). Mount once.
 */
export function SoundDirector() {
  const hasGame = useWorldStore((s) => s.hasGame);
  const gameOver = useWorldStore((s) => s.gameOver);
  const inBattle = useWorldStore((s) => !!s.pendingBattle);
  const winner = useBattleStore((s) => s.state?.winner ?? null);
  // The place the hero is in (or last stood in, in a dialog); roads play the wilds song.
  const exploring: TrackId = useWorldStore((s) => {
    const kind = getScene(s.currentSceneId)?.kind;
    const place = kind === "location" ? s.currentSceneId : s.lastLocationId;
    return exploringTrack(place, kind === "route", regionOf(place));
  });

  // Sound may only start from a user gesture: the first tap or key unlocks it.
  useEffect(() => {
    const unlock = () => { if (unlockAudio()) { window.removeEventListener("pointerdown", unlock, true); window.removeEventListener("keydown", unlock, true); } };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    // Quiet UI feedback: a woodblock tick on buttons, a pluck when a menu opens.
    const click = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const button = target?.closest?.("button");
      if (!button || button.disabled) return;
      if (button.closest(".hud-iconbar")) uiSound.open(); else uiSound.tap();
    };
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      document.removeEventListener("click", click, true);
    };
  }, []);

  useEffect(() => {
    if (!hasGame) playMusic("title");
    else if (gameOver) stopMusic();
    else if (inBattle && !winner) playMusic("battle");
    else if (!inBattle) playMusic(exploring);
  }, [hasGame, gameOver, inBattle, winner, exploring]);

  useEffect(() => {
    if (!winner || !inBattle) return;
    // The result cue, then the exploration music waits for the player to continue.
    playJingle(winner === "A" ? "victory" : "defeat", exploring);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, inBattle]);

  // Event cues from the world store, compared against the previous values.
  useEffect(() => {
    let previous = useWorldStore.getState();
    return useWorldStore.subscribe((state) => {
      const before = previous;
      previous = state;
      if (!state.hasGame || !before.hasGame) return;
      if (state.pendingEncounter && !before.pendingEncounter) playJingle("encounter");
      const done = (q: typeof state.quests) => Object.values(q).filter((quest) => quest.status === "done").length;
      if (done(state.quests) > done(before.quests)) playJingle("quest");
      else if (levels(state) > levels(before)) playJingle("levelup");
      if (state.gold > before.gold) uiSound.coin();
      if (state.stamina - before.stamina >= 20) uiSound.rest();
      if (state.currentSceneId !== before.currentSceneId && getScene(state.currentSceneId)?.kind !== "dialog") uiSound.step();
    });
  }, []);
  return null;
}

function levels(state: ReturnType<typeof useWorldStore.getState>): number {
  const skills = Object.values(state.skillLevel ?? {}).reduce((sum, level) => sum + level, 0);
  const arts = Object.values(state.playerBuild?.artLevels ?? {}).reduce((sum, level) => sum + level, 0);
  return skills + arts;
}
