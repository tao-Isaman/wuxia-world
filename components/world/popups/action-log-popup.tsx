"use client";

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { useWorldStore } from "@/store/world-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Player-action log (last 100 entries). Each row shows the in-game day +
// hour, a small kind badge, and the message that the toast emitted at the
// time. Newest entries first.
const KIND_LABEL: Record<string, string> = {
  rest:    "พัก",
  gather:  "เก็บของ",
  craft:   "ประดิษฐ์",
  buy:     "ซื้อ",
  sell:    "ขาย",
  use:     "ใช้",
  travel:  "เดินทาง",
  combat:  "ต่อสู้",
  learn:   "เรียน",
  quest:   "ภารกิจ",
  sect:    "สำนัก",
};

const KIND_COLOR: Record<string, string> = {
  rest:    "border-emerald-500/60 text-emerald-700",
  gather:  "border-amber-500/60 text-amber-700",
  craft:   "border-orange-500/60 text-orange-700",
  buy:     "border-sky-500/60 text-sky-700",
  sell:    "border-violet-500/60 text-violet-700",
  use:     "border-slate-500/60 text-slate-700",
  travel:  "border-blue-500/60 text-blue-700",
  combat:  "border-rose-500/60 text-rose-700",
  learn:   "border-indigo-500/60 text-indigo-700",
  quest:   "border-yellow-600/60 text-yellow-800",
  sect:    "border-vermilion/60 text-vermilion",
};

export function ActionLogPopup({ open, onClose }: Props) {
  const log = useWorldStore((s) => s.actionLog);
  const reversed = [...log].reverse();

  return (
    <Modal open={open} onClose={onClose} title="📜 บันทึกการกระทำ">
      <div className="text-[10px] text-muted-foreground mb-2">
        แสดงรายการล่าสุด (ไม่เกิน 100 รายการ)
      </div>
      {reversed.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-4 text-center">
          ยังไม่มีบันทึกการกระทำ
        </p>
      ) : (
        <ul className="space-y-1">
          {reversed.map((e, i) => {
            const kindLabel = KIND_LABEL[e.kind] ?? e.kind;
            const colorCls = KIND_COLOR[e.kind] ?? "border-muted-foreground/40";
            return (
              <li
                key={`${e.day}-${e.time}-${i}`}
                className="rounded bg-muted/30 px-2 py-1.5 text-xs flex items-start gap-2"
              >
                <span className="font-mono text-[10px] text-muted-foreground shrink-0 w-16 text-right">
                  วันที่ {e.day} · {e.time.toFixed(1)}
                </span>
                <Badge variant="outline" className={`text-[9px] shrink-0 ${colorCls}`}>
                  {kindLabel}
                </Badge>
                <span className="flex-1 leading-snug">{e.message}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
