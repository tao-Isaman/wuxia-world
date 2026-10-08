"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { getScene } from "@/lib/world/data/scenes";
import { stationTrips } from "@/lib/world/stations";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { flashLoading } from "@/store/loading-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

const placeName = (id: string) => (getScene(id) as { name?: string } | null)?.name ?? id;

// สถานีพักม้า — ride to any other station place the hero has visited. Each
// row shows the fare (gold); the ride is instant on the world clock.
export function StationPopup({ open, onClose }: Props) {
  const sceneId = useWorldStore((s) => s.currentSceneId);
  const visited = useWorldStore((s) => s.visitedLocationIds);
  const gold = useWorldStore((s) => s.gold);
  const stationTravel = useWorldStore((s) => s.stationTravel);
  const trips = stationTrips({ visitedLocationIds: visited }, sceneId);

  const ride = (to: string) => {
    const result = stationTravel(to);
    if (!result.ok) {
      toast("warn", result.reason === "gold" ? "เงินไม่พอจ่ายค่าม้า" : "เดินทางไม่ได้");
      return;
    }
    onClose();
    flashLoading(`ควบม้าไป${placeName(to)}…`, 1200);
    toast("success", `ถึง${placeName(to)}แล้ว`);
  };

  return (
    <Modal open={open} onClose={onClose} title="🐎 สถานีพักม้า">
      <p className="text-xs text-muted-foreground mb-2">
        เช่าม้าเร็วไปยังเมือง หมู่บ้าน หรือสำนักใหญ่ที่ท่านเคยไปมาแล้ว — เร็วกว่าเดินเท้าและไม่พบศัตรูระหว่างทาง
      </p>
      {trips.length === 0 ? (
        <p className="text-sm" data-testid="station-empty">ยังไม่มีสถานีอื่นที่ท่านเคยไป — ออกเดินทางไปเยือนเมืองหรือหมู่บ้านอื่นก่อน</p>
      ) : (
        <ul className="space-y-1.5" data-testid="station-trips">
          {trips.map((trip) => (
            <li key={trip.to} className="flex items-center justify-between gap-2 rounded bg-muted/30 px-2 py-1.5">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{placeName(trip.to)}</div>
                <div className="text-[11px] text-muted-foreground">{trip.gold} ตำลึง · ถึงทันที</div>
              </div>
              <Button size="sm" variant="outline" className="h-8" disabled={gold < trip.gold} onClick={() => ride(trip.to)}
                data-testid={`station-ride-${trip.to}`}>
                ขี่ม้าไป
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
