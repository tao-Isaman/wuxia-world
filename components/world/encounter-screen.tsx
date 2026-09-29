"use client";

import { useEffect } from "react";
import { TIERS } from "@/lib/game";
import { ENEMY_CATEGORY_LABEL, getOpponent, type EnemyCategory } from "@/lib/world";
import { npcCharacterId } from "@/lib/characters/catalog";
import { rarityColor } from "@/lib/ui/rarity";
import { CharacterPreview } from "@/components/game/character-preview";
import { useWorldStore } from "@/store/world-store";

// Random-encounter confrontation. `acceptEncounter` promotes the offer to a
// real battle; `fleeEncounter` clears it (hunters may still force the fight).
// Hero's Adventure-style staging: the foe's figure and tier-coloured name
// read before any text, with F / Enter to fight and Esc to flee.
export function EncounterScreen() {
  const enc = useWorldStore((s) => s.pendingEncounter);
  const accept = useWorldStore((s) => s.acceptEncounter);
  const flee = useWorldStore((s) => s.fleeEncounter);
  const opp = enc ? getOpponent(enc.opponentId) : null;

  useEffect(() => {
    if (!enc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "Escape") { e.preventDefault(); flee(); }
      else if (opp && (e.key === "Enter" || e.key.toLowerCase() === "f")) { e.preventDefault(); accept(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enc, opp, accept, flee]);

  if (!enc) return null;
  if (!opp) {
    // Shouldn't happen post-validate, but bail gracefully.
    return (
      <section className="encounter-panel pixel-panel" role="alertdialog" aria-label="ไม่พบศัตรู">
        <p className="encounter-flavor">ไม่พบศัตรูที่ต้องการต่อสู้</p>
        <div className="encounter-actions"><button type="button" className="encounter-flee" onClick={flee}>กลับ</button></div>
      </section>
    );
  }

  const tierName = typeof opp.ti === "number" ? TIERS[opp.ti]?.n ?? "" : "";
  const cat: EnemyCategory = opp.category ?? "human";
  const color = rarityColor(opp.ti);
  const flavor = cat === "beast"
    ? "สัตว์ป่าตัวหนึ่งกระโจนใส่เจ้าจากในป่า — จะสู้หรือหนี?"
    : cat === "supernatural"
      ? "ผู้พิเศษปรากฏกายขัดทางเดินของเจ้า — จะสู้หรือหนี?"
      : "คนแปลกหน้าขวางทางเจ้าด้วยท่าทีคุกคาม — จะสู้หรือหนี?";

  return (
    <section className="encounter-panel pixel-panel" role="alertdialog" aria-labelledby="encounter-name" data-testid="encounter-screen">
      <p className="encounter-kicker">พบเจอศัตรู · {ENEMY_CATEGORY_LABEL[cat]}</p>
      <div className="encounter-body">
        <div className="encounter-portrait" style={{ borderColor: color }} aria-hidden="true">
          {cat === "beast" ? <span className="encounter-glyph">獸</span> : <CharacterPreview id={npcCharacterId(opp.id)} animate />}
        </div>
        <div className="encounter-copy">
          <h2 id="encounter-name" style={{ color }}>{opp.name}</h2>
          {tierName && <span className="encounter-tier" style={{ color, borderColor: color }}>ขั้น{tierName}</span>}
          <p className="encounter-flavor">{flavor}</p>
        </div>
      </div>
      <div className="encounter-actions">
        <button type="button" className="pixel-action encounter-fight" onClick={accept}>
          ⚔ ต่อสู้ <kbd>F</kbd>
        </button>
        <button type="button" className="encounter-flee" onClick={flee}>
          🏃 หนี <kbd>Esc</kbd>
        </button>
      </div>
      <p className="encounter-note">ชนะ → ได้ของและประสบการณ์ · หนี → ปลอดภัย ไม่ได้รางวัล</p>
    </section>
  );
}
