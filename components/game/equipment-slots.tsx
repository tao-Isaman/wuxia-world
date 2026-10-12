"use client";

import { useMemo } from "react";
import {
  EQUIPMENT,
  SLOT_LABELS,
  equipBonusParts,
  equipStatParts,
  getEquip,
  getEquipBonus,
  getEquipStatBonus,
  type EquipSlotType,
  type Side,
} from "@/lib/game";
import { useCharacterStore } from "@/store/character-store";
import { Combobox, type ComboOption } from "@/components/ui/combobox";

interface Props {
  side: Side;
}

interface SlotDef {
  key: keyof import("@/lib/game").EquipLoadout;
  ty: EquipSlotType;
  label: string;
  count: 1 | 2;
}

const SLOTS: SlotDef[] = [
  { key: "W", ty: "W", label: `🗡 ${SLOT_LABELS.W}`, count: 1 },
  { key: "A", ty: "A", label: `👘 ${SLOT_LABELS.A}`, count: 1 },
  { key: "H", ty: "H", label: `🪖 ${SLOT_LABELS.H}`, count: 1 },
  { key: "B", ty: "B", label: `👟 ${SLOT_LABELS.B}`, count: 1 },
  { key: "BR", ty: "BR", label: `💪 ${SLOT_LABELS.BR}`, count: 2 },
  { key: "R", ty: "R", label: `💍 ${SLOT_LABELS.R}`, count: 2 },
  { key: "C", ty: "C", label: `🎖 ${SLOT_LABELS.C}`, count: 2 },
];

function describeItem(id: string | null): string {
  const e = id ? getEquip(id) : undefined;
  return e ? equipStatParts(e).join(" · ") : "";
}

export function EquipmentSlots({ side }: Props) {
  const build = useCharacterStore((s) => s.builds[side]);
  const setEquip = useCharacterStore((s) => s.setEquipSlot);

  const optionsByType = useMemo(() => {
    const map: Partial<Record<EquipSlotType, ComboOption[]>> = {};
    for (const e of EQUIPMENT) {
      if (!map[e.ty]) map[e.ty] = [];
      map[e.ty]!.push({ value: e.id, label: e.n });
    }
    return map;
  }, []);

  const eb = getEquipBonus(build.equipment);
  const sb = getEquipStatBonus(build.equipment);

  const summary = equipBonusParts(eb, sb);

  return (
    <section className="border-t pt-3 mt-3">
      <h3 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">
        อุปกรณ์ (9 ช่อง)
      </h3>
      <div className="space-y-1.5">
        {SLOTS.map((slot) => {
          const opts = optionsByType[slot.ty] ?? [];
          if (slot.count === 1) {
            const cur = build.equipment[slot.key] as string | null;
            return (
              <div key={slot.key} className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground w-20 shrink-0">{slot.label}</span>
                <div className="flex-1 min-w-0">
                  <Combobox
                    options={opts}
                    value={cur}
                    onChange={(v) => setEquip(side, slot.key, null, v)}
                  />
                </div>
                {cur && (
                  <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                    {describeItem(cur)}
                  </span>
                )}
              </div>
            );
          }
          const arr = build.equipment[slot.key] as [string | null, string | null];
          return (
            <div key={slot.key} className="space-y-1">
              {[0, 1].map((i) => {
                const cur = arr[i];
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground w-20 shrink-0">
                      {i === 0 ? slot.label : ""}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Combobox
                        options={opts}
                        value={cur}
                        onChange={(v) => setEquip(side, slot.key, i, v)}
                      />
                    </div>
                    {cur && (
                      <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                        {describeItem(cur)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-2 rounded-md bg-muted/40 p-2 border-l-2 border-orange-500 text-[10px] leading-relaxed">
        รวม: {summary.length > 0 ? summary.join(" · ") : "ไม่มีโบนัส"}
      </div>
    </section>
  );
}
