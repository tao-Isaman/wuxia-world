"use client";

import { derive, deriveAll, type Side } from "@/lib/game";
import { useCharacterStore } from "@/store/character-store";

interface Props {
  side: Side;
}

const ROWS: { label: string; key: keyof ReturnType<typeof deriveAll> }[] = [
  { label: "HP", key: "HP" },
  { label: "MP", key: "MP" },
  { label: "ATK", key: "Atk" },
  { label: "PA", key: "PA" },
  { label: "IA", key: "IA" },
  { label: "PD", key: "PD" },
  { label: "ID", key: "ID" },
  { label: "SPD", key: "Spd" },
  { label: "Eva", key: "Eva" },
  { label: "Acc", key: "Acc" },
  { label: "Cri", key: "Cri" },
  { label: "Res", key: "Res" },
];

export function DerivedStats({ side }: Props) {
  const build = useCharacterStore((s) => s.builds[side]);
  const pure = derive(build.stats);
  const all = deriveAll(build);

  return (
    <div className="grid grid-cols-4 gap-1">
      {ROWS.map(({ label, key }) => {
        const cv = all[key];
        const bv = pure[key as keyof typeof pure];
        const diff = cv - (bv ?? cv);
        return (
          <div key={key} className="rounded bg-muted/40 px-2 py-1">
            <div className="text-[9px] text-muted-foreground">{label}</div>
            <div className="text-xs font-semibold">
              {cv}
              {diff > 0 && <span className="text-[9px] text-emerald-600 ml-1">+{diff}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
