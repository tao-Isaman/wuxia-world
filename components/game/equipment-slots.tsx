"use client";

import { useMemo } from "react";
import {
  EQUIPMENT,
  SLOT_LABELS,
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
  if (!id) return "";
  const e = getEquip(id);
  if (!e) return "";
  const parts: string[] = [];
  if (e.atkb) parts.push(`Atk+${e.atkb}`);
  if (e.pdb) parts.push(`PD+${e.pdb}`);
  if (e.idb) parts.push(`ID+${e.idb}`);
  if (e.hpb) parts.push(`HP+${e.hpb}`);
  if (e.mpb) parts.push(`MP+${e.mpb}`);
  const sb = Object.entries(e.st)
    .map(([k, v]) => `${k}+${v}`)
    .join(" ");
  if (sb) parts.push(sb);
  if (e.eff) {
    if (e.eff.t === "pct_atk") parts.push(`+${e.eff.v}%ATK`);
    else if (e.eff.t === "flat_cri") parts.push(`Cri+${e.eff.v}`);
    else if (e.eff.t === "flat_eva") parts.push(`Eva+${e.eff.v}`);
    else if (e.eff.t === "pct_reduce") parts.push(`ลดDmg${e.eff.v}%`);
    else if (e.eff.t === "hp_regen") parts.push(`ฟื้น${e.eff.v}%/ตา`);
    else if (e.eff.t === "on_hit") parts.push(`OnHit:${e.eff.db.t.replace("debuff_", "")}${e.eff.db.v}`);
  }
  return parts.join(" ");
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

  const summary: string[] = [];
  if (eb.atk) summary.push(`Atk+${eb.atk}`);
  if (eb.pd) summary.push(`PD+${eb.pd}`);
  if (eb.id_) summary.push(`ID+${eb.id_}`);
  if (eb.hp) summary.push(`HP+${eb.hp}`);
  if (eb.mp) summary.push(`MP+${eb.mp}`);
  if (eb.cri) summary.push(`Cri+${eb.cri}`);
  if (eb.eva) summary.push(`Eva+${eb.eva}`);
  if (eb.pct_atk) summary.push(`ATK+${eb.pct_atk}%`);
  if (eb.pct_red) summary.push(`ลดDmg${eb.pct_red}%`);
  if (eb.hp_regen) summary.push(`ฟื้น${eb.hp_regen}%/ตา`);
  for (const [k, v] of Object.entries(sb)) summary.push(`${k}+${v}`);

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
