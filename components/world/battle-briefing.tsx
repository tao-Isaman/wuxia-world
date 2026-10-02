"use client";

import { useEffect, useMemo } from "react";
import { getOpponent } from "@/lib/world";
import { battleBriefing, ensureBattleStarted } from "@/lib/world/battle-bridge";
import { npcCharacterId } from "@/lib/characters/catalog";
import { rarityColor } from "@/lib/ui/rarity";
import { CharacterPreview } from "@/components/game/character-preview";
import { useWorldStore } from "@/store/world-store";
import { PowerReadout } from "./power-readout";

// The warning before every staged fight (quests, sparring, the law, sagas):
// who the foe is and how their power tier compares with the hero's. Random
// encounters show the same reading on their own confrontation screen.
export function BattleBriefingScreen() {
  const pending = useWorldStore((s) => s.pendingBattle);
  const playerBuild = useWorldStore((s) => s.playerBuild);
  // Recomputed only when the staged fight (or the hero) changes.
  const briefing = useMemo(() => (pending ? battleBriefing(playerBuild) : null), [pending, playerBuild]);
  const opponent = pending ? getOpponent(pending.opponentId) : undefined;

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
          {opponent.category === "beast" ? <span className="encounter-glyph">獸</span> : <CharacterPreview id={npcCharacterId(opponent.id)} animate />}
        </div>
        <div className="encounter-copy">
          <h2 id="briefing-name" style={{ color }}>{opponent.name}</h2>
          <PowerReadout briefing={briefing} />
        </div>
      </div>
      <div className="encounter-actions encounter-actions-single">
        <button type="button" className="pixel-action encounter-fight" onClick={() => ensureBattleStarted()}>
          ⚔ เข้าต่อสู้ <kbd>F</kbd>
        </button>
      </div>
      <p className="encounter-note">{pending.nonFatal ? "แพ้ไม่ถึงตาย" : "ระวัง: แพ้อาจถึงตาย"} · ถอยหนีได้ระหว่างการต่อสู้</p>
    </section>
  );
}
