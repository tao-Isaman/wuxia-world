"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CharacterPreview } from "@/components/game/character-preview";
import { getScene } from "@/lib/world/data/scenes";
import { npcCharacterId } from "@/lib/characters/catalog";
import { FERRYMAN, ferryTrips } from "@/lib/world/ferries";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { flashLoading } from "@/store/loading-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

const placeName = (id: string) => (getScene(id) as { name?: string } | null)?.name ?? id;

// ลุงจาง คนแจวเรือ — the islands are reached by boat only. He sails from the
// ports and every island to any other pier, for a fare by the distance; the
// crossing is instant on the world clock, like a horse station ride.
export function FerryPopup({ open, onClose }: Props) {
  const sceneId = useWorldStore((s) => s.currentSceneId);
  const gold = useWorldStore((s) => s.gold);
  const visited = useWorldStore((s) => s.visitedLocationIds);
  const ferryTravel = useWorldStore((s) => s.ferryTravel);
  const trips = ferryTrips(sceneId);

  const sail = (to: string) => {
    const result = ferryTravel(to);
    if (!result.ok) {
      toast("warn", result.reason === "gold" ? "เงินไม่พอจ่ายค่าเรือ" : "ไปทางเรือไม่ได้");
      return;
    }
    onClose();
    flashLoading(`แจวเรือข้ามทะเลไป${placeName(to)}…`, 1400);
    toast("success", `ขึ้นฝั่งที่${placeName(to)}แล้ว`);
  };

  return (
    <Modal open={open} onClose={onClose} title={`⛵ ${FERRYMAN.name}`}>
      <div className="ferry-head">
        <span className="ferry-portrait"><CharacterPreview id={npcCharacterId(FERRYMAN.id)} framing="bust" /></span>
        <p className="text-sm leading-relaxed">
          “ทะเลตะวันออกไม่มีทางเดินหรอก พ่อหนุ่มแม่นาง จะข้ามไปเกาะไหนก็ต้องลงเรือข้า
          ค่าเรือว่ากันตามระยะทาง ขึ้นเรือแล้วถึงฝั่งเลย”
        </p>
      </div>
      <ul className="space-y-1.5 mt-2" data-testid="ferry-trips">
        {trips.map((trip) => (
          <li key={trip.to} className="flex items-center justify-between gap-2 rounded bg-muted/30 px-2 py-1.5">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{placeName(trip.to)}{!visited.includes(trip.to) && <span className="text-[10px] text-muted-foreground"> · ยังไม่เคยไป</span>}</div>
              <div className="text-[11px] text-muted-foreground">ค่าเรือ {trip.gold} ตำลึง · ถึงทันที</div>
            </div>
            <Button size="sm" variant="outline" className="h-8" disabled={gold < trip.gold} onClick={() => sail(trip.to)}
              data-testid={`ferry-sail-${trip.to}`}>
              ลงเรือ
            </Button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
