"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SLOT_LABELS, getEquip } from "@/lib/game";
import type { EquipSlotType } from "@/lib/game";
import { LIFE_SKILL_LABEL, getItem } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";

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
  const inventoryEquipment = useWorldStore((s) => s.inventoryEquipment);
  const gold = useWorldStore((s) => s.gold);
  const consumeItem = useWorldStore((s) => s.useItem);
  const equipFromBag = useWorldStore((s) => s.equipFromBag);
  const unequipFromSlot = useWorldStore((s) => s.unequipFromSlot);
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  if (!player) return null;

  const items = Object.entries(inventory).filter(([, n]) => n > 0);
  const bagEquipment = Object.entries(inventoryEquipment).filter(
    ([, n]) => n > 0,
  );

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
                  className="flex items-center justify-between gap-2 rounded bg-muted/30 px-2 py-1.5 text-xs"
                >
                  <span className="text-muted-foreground w-20 shrink-0">{row.label}</span>
                  {eq ? (
                    <span className="flex-1 text-right min-w-0">
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
                    <span className="flex-1 text-[10px] text-muted-foreground italic text-right">— ว่าง —</span>
                  )}
                  {eq && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px] shrink-0"
                      onClick={() => {
                        const r = unequipFromSlot(
                          row.type,
                          (row.index ?? 0) as 0 | 1,
                        );
                        if (!r.ok) {
                          toast("error", "ถอดอุปกรณ์ไม่สำเร็จ");
                          return;
                        }
                        toast("info", `ถอด ${eq.n} เก็บลงย่าม`);
                      }}
                    >
                      ถอด
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
            อุปกรณ์ในย่าม ({bagEquipment.length})
          </div>
          {bagEquipment.length === 0 ? (
            <p className="text-[10px] text-muted-foreground italic py-1.5 text-center">
              ไม่มีอุปกรณ์ในย่าม — ซื้อเพิ่มได้ที่ร้านช่างฝีมือ
            </p>
          ) : (
            <ul className="space-y-1.5">
              {bagEquipment.map(([id, n]) => {
                const eq = getEquip(id);
                if (!eq) return null;
                return (
                  <li
                    key={id}
                    className="rounded bg-muted/30 px-2 py-1.5 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong>{eq.n}</strong>
                        <Badge variant="outline" className="text-[9px]">
                          {SLOT_LABELS[eq.ty]}
                        </Badge>
                        <Badge variant="outline" className="text-[9px]">×{n}</Badge>
                        {eq.atkb > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            Atk+{eq.atkb}
                          </span>
                        )}
                        {eq.pdb > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            PD+{eq.pdb}
                          </span>
                        )}
                        {eq.hpb > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            HP+{eq.hpb}
                          </span>
                        )}
                        {eq.mpb > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            MP+{eq.mpb}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px] shrink-0"
                      onClick={() => {
                        const r = equipFromBag(id);
                        if (!r.ok) {
                          toast(
                            "error",
                            r.reason === "missing"
                              ? "ไม่มีอุปกรณ์นี้ในย่าม"
                              : "ติดตั้งไม่สำเร็จ",
                          );
                          return;
                        }
                        const swappedDef = r.swapped ? getEquip(r.swapped) : null;
                        toast(
                          "success",
                          r.swapped
                            ? `ติดตั้ง ${eq.n} (เก็บ ${swappedDef?.n ?? r.swapped} กลับย่าม)`
                            : `ติดตั้ง ${eq.n}`,
                        );
                      }}
                    >
                      ติดตั้ง
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
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
                const useEff = def?.use;
                const consumable = !!useEff;
                return (
                  <li
                    key={id}
                    className="rounded bg-muted/30 px-2 py-1.5 text-xs flex items-start justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong>{def?.name ?? id}</strong>
                        {useEff?.t === "trainSkill" && (
                          <Badge variant="outline" className="text-[9px]">
                            ฝึก {LIFE_SKILL_LABEL[useEff.skill]} +{useEff.xp}
                          </Badge>
                        )}
                        {useEff?.t === "heal" && (useEff.hp ?? 0) > 0 && (
                          <Badge variant="outline" className="text-[9px] border-rose-400 text-rose-600">
                            HP +{useEff.hp}
                          </Badge>
                        )}
                        {useEff?.t === "heal" && (useEff.mp ?? 0) > 0 && (
                          <Badge variant="outline" className="text-[9px] border-sky-400 text-sky-600">
                            MP +{useEff.mp}
                          </Badge>
                        )}
                        {useEff?.t === "manualLearnSkill" && (
                          <Badge variant="outline" className="text-[9px] border-amber-500 text-amber-700">
                            เรียนวิชา · {useEff.reqStat} {useEff.reqValue}
                          </Badge>
                        )}
                        {useEff?.t === "manualLearnArt" && (
                          <Badge variant="outline" className="text-[9px] border-emerald-500 text-emerald-700">
                            เรียนวิชาในกาย · {useEff.reqStat} {useEff.reqValue}
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
                              if (r.reason === "full") setLastUsed("HP / MP เต็มแล้ว ไม่ต้องใช้");
                              else if (r.reason === "stat-too-low")
                                setLastUsed(
                                  `ฝีมือยังไม่ถึงขั้น · ต้องการ ${r.stat} ${r.needed} (ปัจจุบัน ${r.current})`,
                                );
                              else if (r.reason === "already-learned")
                                setLastUsed("เรียนวิชานี้แล้ว ไม่ต้องอ่านอีก");
                              else setLastUsed("ใช้ไม่ได้");
                              return;
                            }
                            if (r.kind === "trainSkill") {
                              setLastUsed(`ฝึก ${LIFE_SKILL_LABEL[r.skill]} · +${r.xpGained} xp`);
                            } else if (r.kind === "heal") {
                              const parts: string[] = [];
                              if (r.hpHealed > 0) parts.push(`HP +${r.hpHealed}`);
                              if (r.mpHealed > 0) parts.push(`MP +${r.mpHealed}`);
                              setLastUsed(parts.length > 0 ? `ฟื้นพลัง: ${parts.join(" · ")}` : "ไม่มีพลังให้ฟื้น");
                            } else if (r.kind === "manualLearnSkill") {
                              setLastUsed(`เรียนวิชาฝีมือสำเร็จ · พร้อมใช้ทันที`);
                            } else if (r.kind === "manualLearnArt") {
                              setLastUsed(`เรียนวิชาในกายสำเร็จ · เริ่มที่ระดับ ${r.level}`);
                            }
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
