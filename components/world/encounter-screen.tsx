"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TIERS } from "@/lib/game";
import {
  ENEMY_CATEGORY_LABEL,
  getOpponent,
  type EnemyCategory,
} from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

// Inline screen shown when a random-encounter rolls a fight. Offers
// fight / flee — `acceptEncounter` promotes the offer to a real battle,
// `fleeEncounter` clears it and the player stays at their location.
//
// The opponent's tier badge gives the player a quick read on how scary
// the foe is before committing.
export function EncounterScreen() {
  const enc = useWorldStore((s) => s.pendingEncounter);
  const accept = useWorldStore((s) => s.acceptEncounter);
  const flee = useWorldStore((s) => s.fleeEncounter);

  if (!enc) return null;
  const opp = getOpponent(enc.opponentId);
  if (!opp) {
    // Shouldn't happen post-validate, but bail gracefully.
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <p className="text-sm text-destructive">ไม่พบศัตรูที่ต้องการต่อสู้</p>
          <Button onClick={flee}>กลับ</Button>
        </CardContent>
      </Card>
    );
  }

  const tierName = typeof opp.ti === "number" ? TIERS[opp.ti]?.n ?? "" : "";
  const cat: EnemyCategory = opp.category ?? "human";

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
          พบเจอศัตรู
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl">⚔</span>
          <strong className="text-lg">{opp.name}</strong>
          {tierName && (
            <Badge variant="outline" className="text-[10px]">{tierName}</Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            {ENEMY_CATEGORY_LABEL[cat]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground italic leading-relaxed">
          {cat === "beast"
            ? "สัตว์ป่าตัวหนึ่งกระโจนใส่เจ้าจากในป่า — จะสู้หรือหนี?"
            : cat === "supernatural"
              ? "ผู้พิเศษปรากฏกายขัดทางเดินของเจ้า — จะสู้หรือหนี?"
              : "คนแปลกหน้าขวางทางเจ้าด้วยท่าทีคุกคาม — จะสู้หรือหนี?"}
        </p>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={accept}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
          >
            ⚔ ต่อสู้
          </Button>
          <Button
            onClick={flee}
            variant="outline"
            className="flex-1"
          >
            🏃 หนี
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground italic text-center">
          ชนะ → ได้ของและประสบการณ์ · หนี → ปลอดภัย ไม่ได้รางวัล
        </p>
      </CardContent>
    </Card>
  );
}
