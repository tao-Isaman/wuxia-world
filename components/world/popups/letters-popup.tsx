"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNpc } from "@/lib/world/data/npcs";
import { LETTER_RULES, RARITY_LABEL, letterGiftLabel, type GiftRarity } from "@/lib/world/letters";
import { npcPortrait } from "@/lib/world/data/npc-portraits";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RARITY_CLASS: Record<number, string> = {
  1: "border-stone-400 text-stone-700",
  2: "border-emerald-500 text-emerald-700",
  3: "border-sky-500 text-sky-700",
  4: "border-amber-500 text-amber-700",
};

// จดหมาย — letters from friends, newest first. Opening one reads it and
// takes its gift into the bag (or purse).
export function LettersPopup({ open, onClose }: Props) {
  const letters = useWorldStore((s) => s.letters);
  const openLetter = useWorldStore((s) => s.openLetter);
  const [reading, setReading] = useState<string | null>(null);
  const list = [...letters].reverse();
  const current = letters.find((l) => l.id === reading) ?? null;

  const read = (id: string) => {
    const result = openLetter(id);
    if (result.gift) toast("success", `ได้รับ ${result.gift}`);
    setReading(id);
  };

  return (
    <Modal open={open} onClose={() => { setReading(null); onClose(); }} title="✉ จดหมาย">
      {current ? (
        <div className="space-y-3" data-testid="letter-open">
          <div className="flex items-center gap-2">
            {npcPortrait(current.npcId) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={npcPortrait(current.npcId)!} alt="" className="w-12 h-12 rounded object-cover" />
            )}
            <div>
              <div className="font-semibold">จาก {getNpc(current.npcId)?.name ?? "สหาย"}</div>
              <div className="text-[11px] text-muted-foreground">วันที่ {current.day}</div>
            </div>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed rounded bg-muted/30 p-3">{current.text}</p>
          <div className="flex items-center gap-2 text-sm">
            <span>ของที่แนบมา:</span>
            <strong>{letterGiftLabel(current)}</strong>
            <Badge variant="outline" className={`text-[10px] ${RARITY_CLASS[current.rarity] ?? ""}`}>
              {RARITY_LABEL[current.rarity as GiftRarity] ?? ""}
            </Badge>
          </div>
          <Button size="sm" variant="outline" onClick={() => setReading(null)}>กลับไปที่กล่องจดหมาย</Button>
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="letters-empty">
          ยังไม่มีจดหมาย — มิตรสหายที่สนิทกับท่าน (ความสัมพันธ์ {LETTER_RULES.minRelationship} ขึ้นไป) อาจส่งจดหมายพร้อมของขวัญมาให้
          ยิ่งมีชื่อเสียงและโชคดี ยิ่งได้รับบ่อยและของยิ่งล้ำค่า
        </p>
      ) : (
        <ul className="space-y-1.5" data-testid="letters-list">
          {list.map((letter) => (
            <li key={letter.id}>
              <button type="button" onClick={() => read(letter.id)}
                className={`w-full text-left rounded px-2 py-1.5 flex items-center justify-between gap-2 ${letter.read ? "bg-muted/20" : "bg-amber-100/60 font-semibold"}`}>
                <span className="min-w-0 truncate">{letter.read ? "✉" : "📩"} จาก {getNpc(letter.npcId)?.name ?? "สหาย"}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {letter.claimed ? letterGiftLabel(letter) : "มีของแนบ"} · วันที่ {letter.day}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
