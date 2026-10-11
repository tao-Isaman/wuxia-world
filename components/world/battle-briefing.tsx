"use client";

import { useEffect, useMemo } from "react";
import { getOpponent } from "@/lib/world";
import { battleBriefing, ensureBattleStarted } from "@/lib/world/battle-bridge";
import { rarityColor } from "@/lib/ui/rarity";
import { FoePortrait } from "@/components/game/foe-portrait";
import { npcPresent } from "@/lib/world/npc-presence";
import { useWorldStore } from "@/store/world-store";
import { cloudBattle, useCloudBattle } from "@/store/cloud-battle";
import { PowerReadout } from "./power-readout";

// The warning before every staged fight (quests, sparring, the law, sagas):
// who the foe is and how their power tier compares with the hero's. Random
// encounters show the same reading on their own confrontation screen.
const BATTLE_START_ERROR: Record<string, string> = {
  offline: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
  boss_resting: "สัตว์ร้ายตัวนี้ยังไม่กลับมาที่รัง",
  no_battle: "เซิร์ฟเวอร์ยังไม่เห็นการต่อสู้นี้ — ลองอีกครั้ง",
  too_fast: "เร็วเกินไป — รอสักครู่แล้วลองอีกครั้ง",
};

export function BattleBriefingScreen() {
  const pending = useWorldStore((s) => s.pendingBattle);
  const playerBuild = useWorldStore((s) => s.playerBuild);
  // Recomputed only when the staged fight (or the hero) changes.
  const briefing = useMemo(() => (pending ? battleBriefing(playerBuild) : null), [pending, playerBuild]);
  const opponent = pending ? getOpponent(pending.opponentId) : undefined;
  // On the game server the fight is staged there first (store/cloud-battle.ts).
  const cloudStatus = useCloudBattle((s) => s.status);
  const cloudError = useCloudBattle((s) => s.error);
  const clearPendingBattle = useWorldStore((s) => s.clearPendingBattle);
  const starting = cloudStatus === "starting";

  useEffect(() => {
    // Nothing to brief (an unknown foe): let the bridge clear it.
    if (pending && !briefing) ensureBattleStarted();
  }, [pending, briefing]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "Enter" || e.key.toLowerCase() === "f") { e.preventDefault(); ensureBattleStarted(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!pending || !briefing || !opponent) return null;
  const color = rarityColor(opponent.ti);
  return (
    <section className="encounter-panel pixel-panel" role="alertdialog" aria-labelledby="briefing-name" data-testid="battle-briefing">
      <p className="encounter-kicker">ก่อนเข้าต่อสู้</p>
      <div className="encounter-body">
        <div className="encounter-portrait" style={{ borderColor: color }} aria-hidden="true">
          <FoePortrait opponentId={opponent.id} present={(id) => npcPresent(useWorldStore.getState(), id)} />
        </div>
        <div className="encounter-copy">
          <h2 id="briefing-name" style={{ color }}>{opponent.name}</h2>
          <PowerReadout briefing={briefing} />
        </div>
      </div>
      {cloudStatus === "error" && <p className="encounter-note" role="alert" data-testid="battle-start-error">
        {BATTLE_START_ERROR[cloudError ?? ""] ?? `เซิร์ฟเวอร์ไม่รับการต่อสู้นี้ (${cloudError})`}
      </p>}
      <div className="encounter-actions encounter-actions-single">
        {cloudStatus === "error"
          ? <>
            <button type="button" className="pixel-action encounter-fight" onClick={() => void cloudBattle.again()}>ลองอีกครั้ง</button>
            <button type="button" className="pixel-action" onClick={() => { cloudBattle.stop(); clearPendingBattle(); }}>ถอยออกมา</button>
          </>
          : <button type="button" className="pixel-action encounter-fight" disabled={starting} onClick={() => ensureBattleStarted()}>
            {starting ? "กำลังเตรียมการต่อสู้…" : <>⚔ เข้าต่อสู้ <kbd>F</kbd></>}
          </button>}
      </div>
      <p className="encounter-note">{pending.nonFatal ? "แพ้ไม่ถึงตาย" : "ระวัง: แพ้อาจถึงตาย"} · ถอยหนีได้ระหว่างการต่อสู้</p>
    </section>
  );
}
