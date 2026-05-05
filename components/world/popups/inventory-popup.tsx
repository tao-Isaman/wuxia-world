"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SLOT_LABELS, getEquip } from "@/lib/game";
import type { EquipSlotType } from "@/lib/game";
import { LIFE_SKILL_LABEL, getItem } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Equipment slots are listed in a fixed order so the layout stays predictable.
// Multi-slot types (BR, R, C) are split out so each slot row is independent.
type SlotRow = {
  label: string;
  type: EquipSlotType;
  index?: 0 | 1; // for BR/R/C
};

const SLOT_ROWS: readonly SlotRow[] = [
  { label: SLOT_LABELS.W, type: "W" },
  { label: SLOT_LABELS.A, type: "A" },
  { label: SLOT_LABELS.H, type: "H" },
  { label: SLOT_LABELS.B, type: "B" },
  { label: `${SLOT_LABELS.BR} 1`, type: "BR", index: 0 },
  { label: `${SLOT_LABELS.BR} 2`, type: "BR", index: 1 },
  { label: `${SLOT_LABELS.R} 1`, type: "R", index: 0 },
  { label: `${SLOT_LABELS.R} 2`, type: "R", index: 1 },
  { label: `${SLOT_LABELS.C} 1`, type: "C", index: 0 },
  { label: `${SLOT_LABELS.C} 2`, type: "C", index: 1 },
];

// Inventory popup — equipment slots (10 slots) + bag items.
//
// Equipment lookups go through getEquip() so we display the live name and
// stats for whatever id is in the loadout. Bag items use the world's item
// table so descriptions show up next to each line.
export function InventoryPopup({ open, onClose }: Props) {
  const player = useWorldStore((s) => s.playerBuild);
  const inventory = useWorldStore((s) => s.inventory);
  const gold = useWorldStore((s) => s.gold);
  const consumeItem = useWorldStore((s) => s.useItem);
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  if (!player) return null;

  const items = Object.entries(inventory).filter(([, n]) => n > 0);

  const equipped = (row: SlotRow) => {
    const slot = player.equipment[row.type];
    const id = Array.isArray(slot) ? slot[row.index ?? 0] : slot;
    return getEquip(id);
  };

  return (
    <Modal open={open} onClose={onClose} title="🎒 ของในย่ามและเครื่องประดับ">
      <div className="space-y-4">
        <section>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
            อุปกรณ์สวมใส่
          </div>
          <div className="space-y-1">
            {SLOT_ROWS.map((row) => {
              const eq = equipped(row);
              const key = `${row.type}-${row.index ?? "x"}`;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded bg-muted/30 px-2 py-1.5 text-xs"
                >
                  <span className="text-muted-foreground w-20 shrink-0">{row.label}</span>
                  {eq ? (
                    <span className="flex-1 text-right">
                      <strong>{eq.n}</strong>
                      {(eq.atkb || eq.pdb || eq.idb || eq.hpb || eq.mpb) > 0 && (
                        <span className="text-[10px] text-muted-foreground ml-2">
                          {eq.atkb ? `Atk+${eq.atkb} ` : ""}
                          {eq.pdb ? `PD+${eq.pdb} ` : ""}
                          {eq.idb ? `ID+${eq.idb} ` : ""}
                          {eq.hpb ? `HP+${eq.hpb} ` : ""}
                          {eq.mpb ? `MP+${eq.mpb}` : ""}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">— ว่าง —</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
              ทรัพย์สินและของในย่าม
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">ทอง </span>
              <strong className="text-amber-600">{gold}</strong>
            </div>
          </div>
          {lastUsed && (
            <div className="rounded bg-muted/40 px-2 py-1 text-[11px] mb-1.5">{lastUsed}</div>
          )}
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2 text-center">ย่ามว่างเปล่า</p>
          ) : (
            <ul className="space-y-1.5">
              {items.map(([id, n]) => {
                const def = getItem(id);
                const consumable = def?.use?.t === "trainSkill";
                return (
                  <li
                    key={id}
                    className="rounded bg-muted/30 px-2 py-1.5 text-xs flex items-start justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong>{def?.name ?? id}</strong>
                        {consumable && def?.use?.t === "trainSkill" && (
                          <Badge variant="outline" className="text-[9px]">
                            ฝึก {LIFE_SKILL_LABEL[def.use.skill]} +{def.use.xp}
                          </Badge>
                        )}
                      </div>
                      {def?.description && (
                        <div className="text-[10px] text-muted-foreground">{def.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="text-[10px]">×{n}</Badge>
                      {consumable && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => {
                            const r = consumeItem(id);
                            if (!r.ok) {
                              setLastUsed("ใช้ไม่ได้");
                              return;
                            }
                            setLastUsed(`ฝึก ${LIFE_SKILL_LABEL[r.skill]} · +${r.xpGained} xp`);
                          }}
                        >
                          ใช้
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}
